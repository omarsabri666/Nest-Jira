import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsInt, IsArray, Min } from 'class-validator';

export class UpdateRolesDto {
  @ApiProperty({
    example: [1, 2],
    type: [Number],
    description: 'Role IDs to assign to the user',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  roleIds!: number[];
}
