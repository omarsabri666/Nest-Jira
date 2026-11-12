import { ApiProperty } from '@nestjs/swagger';

export class AppInfoDto {
  @ApiProperty({ example: 'nestjs-production-api', description: 'Application name' })
  name!: string;

  @ApiProperty({ example: '0.0.1', description: 'Application version' })
  version!: string;

  @ApiProperty({ example: 'ok', description: 'Application status' })
  status!: string;
}
