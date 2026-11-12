import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ example: 'Logged out successfully', description: 'Status message' })
  message!: string;
}
