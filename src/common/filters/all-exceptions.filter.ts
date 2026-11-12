import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | string;
  };
  timestamp: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details: Record<string, unknown> | string | undefined;

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const body = responseBody as Record<string, unknown>;
        message = (body.message as string) || message;
        errorCode = (body.error as string) || exception.name;
        details = body.details as Record<string, unknown>;
      }
    }
    // Handle Prisma errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002': {
          // Unique constraint violation
          statusCode = HttpStatus.CONFLICT;
          errorCode = 'UNIQUE_CONSTRAINT_VIOLATION';
          const fields = exception.meta?.target as string[];
          message = fields
            ? `Unique constraint failed on the fields: ${fields.join(', ')}`
            : 'A record with this information already exists';
          details = { fields };
          break;
        }
        case 'P2025': {
          // Record not found
          statusCode = HttpStatus.NOT_FOUND;
          errorCode = 'RECORD_NOT_FOUND';
          message = (exception.meta?.cause as string) || 'The requested record was not found';
          break;
        }
        case 'P2003': {
          // Foreign key constraint failed
          statusCode = HttpStatus.BAD_REQUEST;
          errorCode = 'FOREIGN_KEY_CONSTRAINT_VIOLATION';
          message = 'Foreign key constraint violation';
          details = { field: exception.meta?.field_name };
          break;
        }
        case 'P2014': {
          // Invalid ID
          statusCode = HttpStatus.BAD_REQUEST;
          errorCode = 'INVALID_ID';
          message = 'The provided ID is invalid';
          break;
        }
        default:
          statusCode = HttpStatus.BAD_REQUEST;
          errorCode = `PRISMA_${exception.code}`;
          message = exception.message;
          break;
      }
    }
    // Handle Prisma validation errors
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      statusCode = HttpStatus.BAD_REQUEST;
      errorCode = 'VALIDATION_ERROR';
      message = 'Invalid data provided';
    }
    // Handle generic errors
    else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log the error
    const isProduction = process.env.NODE_ENV === 'production';
    if (statusCode >= 500) {
      this.logger.error(
        {
          statusCode,
          errorCode,
          message,
          path: request.url,
          method: request.method,
          ...(isProduction ? {} : { stack: (exception as Error).stack }),
        },
        'Exception caught',
      );
    } else {
      this.logger.warn({
        statusCode,
        errorCode,
        message,
        path: request.url,
        method: request.method,
      });
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
      },
      timestamp: new Date().toISOString(),
    };

    // Never leak stack traces in production
    if (!isProduction && (exception as Error).stack) {
      // In development, we could include stack trace but we'll keep it consistent
      // and only log it server-side
    }

    httpAdapter.reply(response, errorResponse, statusCode);
  }
}
