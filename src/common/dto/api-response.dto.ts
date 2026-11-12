import { ApiProperty } from '@nestjs/swagger';

import { PaginationMetaDto } from './pagination-meta.dto';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true, description: 'Indicates whether the request succeeded' })
  success!: boolean;

  @ApiProperty({ description: 'Response payload' })
  data!: T;

  @ApiProperty({ type: PaginationMetaDto, required: false, description: 'Pagination metadata' })
  meta?: PaginationMetaDto;

  @ApiProperty({ example: '2026-08-18T10:00:00.000Z', description: 'Response timestamp' })
  timestamp!: string;
}
