import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CommentCreateDto {
  @ApiProperty({ example: 'I found the root cause', description: 'Comment body' })
  @IsString()
  @IsNotEmpty()
  body!: string;
}
