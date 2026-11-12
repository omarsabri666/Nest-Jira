import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';

export class UserDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  id!: number;

  @ApiProperty({ example: 'john@example.com', description: 'User email' })
  email!: string;

  @ApiProperty({ example: 'John Doe', description: 'User display name' })
  name!: string;

  @ApiProperty({ example: true, description: 'Whether the user is active' })
  isActive!: boolean;

  @ApiProperty({
    example: [RoleName.USER],
    enum: RoleName,
    isArray: true,
    description: 'Assigned roles',
  })
  roles!: string[];

  @ApiProperty({ example: '2026-08-18T10:00:00.000Z', description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-18T10:00:00.000Z', description: 'Last update timestamp' })
  updatedAt!: Date;
}
