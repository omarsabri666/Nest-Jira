import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiResponse, getSchemaPath } from '@nestjs/swagger';

import { ApiResponseDto } from '../dto/api-response.dto';

export const envelopeSchema = <T extends Type<unknown>>(type: T, isArray = false) => {
  const dataSchema = isArray
    ? { type: 'array' as const, items: { $ref: getSchemaPath(type) } }
    : { $ref: getSchemaPath(type) };

  return {
    allOf: [
      { $ref: getSchemaPath(ApiResponseDto) },
      {
        properties: {
          data: dataSchema,
        },
      },
    ],
  };
};

interface EnvelopeResponseOptions {
  /** When true, `data` is documented as an array of `type`. */
  isArray?: boolean;
  /** HTTP status code; defaults to 200 (OK). */
  status?: number;
  /** Short description of the response. */
  description?: string;
}

export const ApiEnvelopeResponse = <T extends Type<unknown>>(
  type: T,
  options: EnvelopeResponseOptions = {},
) => {
  const { isArray = false, status, ...rest } = options;

  const decorators = [
    ApiExtraModels(ApiResponseDto, type),
    status !== undefined
      ? ApiResponse({ ...rest, status, schema: envelopeSchema(type, isArray) })
      : ApiOkResponse({ ...rest, schema: envelopeSchema(type, isArray) }),
  ];

  return applyDecorators(...decorators);
};
