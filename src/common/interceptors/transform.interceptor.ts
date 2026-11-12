import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is null or undefined, return empty object
        if (data === null || data === undefined) {
          return {
            success: true as const,
            data: {} as T,
            timestamp: new Date().toISOString(),
          };
        }

        // Check if data has a meta property (pagination or additional metadata)
        const hasMeta =
          typeof data === 'object' &&
          data !== null &&
          'meta' in data &&
          typeof (data as Record<string, unknown>).meta === 'object';

        if (hasMeta) {
          const { meta, ...restData } = data as {
            meta: ResponseEnvelope<T>['meta'];
            [key: string]: unknown;
          };
          return {
            success: true as const,
            data: restData as T,
            meta,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true as const,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
