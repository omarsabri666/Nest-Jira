import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  id!: number;

  @ApiProperty({ example: 'john@example.com', description: 'User email' })
  email!: string;

  @ApiProperty({ example: 'John Doe', description: 'User display name' })
  name!: string;
}
