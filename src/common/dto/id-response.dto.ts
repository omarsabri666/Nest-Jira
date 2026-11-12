import { ApiProperty } from '@nestjs/swagger';

export class IdResponseDto {
  @ApiProperty({ example: 1, description: 'Identifier of the deleted resource' })
  id!: number;
}
