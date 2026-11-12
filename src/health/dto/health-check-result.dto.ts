import { ApiProperty } from '@nestjs/swagger';

export class HealthCheckResultDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'error'], description: 'Overall health status' })
  status!: 'ok' | 'error';

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'object' },
    description: 'Detailed status of each health indicator',
  })
  info!: Record<string, unknown>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'object' },
    description: 'Errors from failing health indicators',
  })
  error!: Record<string, unknown>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'object' },
    description: 'Raw details of each health indicator',
  })
  details!: Record<string, unknown>;
}
