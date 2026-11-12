import { ApiProperty } from '@nestjs/swagger';

export class UserSummaryDto {
  @ApiProperty({ example: 3, description: 'User ID' })
  id!: number;

  @ApiProperty({ example: 'John Doe', description: 'User name' })
  name!: string;

  @ApiProperty({ example: 'john@example.com', description: 'User email' })
  email!: string;
}
