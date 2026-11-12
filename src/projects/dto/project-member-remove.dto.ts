import { ApiProperty } from '@nestjs/swagger';

export class ProjectMemberRemoveDto {
  @ApiProperty({ example: 1, description: 'Project ID' })
  projectId!: number;

  @ApiProperty({ example: 3, description: 'Removed user ID' })
  userId!: number;
}
