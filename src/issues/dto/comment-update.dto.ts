import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CommentUpdateDto {
  @ApiProperty({ example: 'Updated comment body', description: 'Comment body' })
  @IsString()
  @IsNotEmpty()
  body!: string;
}
