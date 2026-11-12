import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectListItemDto {
  @ApiProperty({ example: 1, description: 'Project ID' })
  id!: number;

  @ApiProperty({ example: 'Website Redesign', description: 'Project name' })
  name!: string;

  @ApiProperty({ example: 'WEB', description: 'Unique project key' })
  key!: string;

  @ApiPropertyOptional({
    example: 'Redesign the company website',
    nullable: true,
    description: 'Project description',
  })
  description!: string | null;

  @ApiProperty({ example: 1, description: 'ID of the project owner' })
  ownerId!: number;

  @ApiProperty({ example: '2026-08-18T10:00:00.000Z', description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-18T10:00:00.000Z', description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiProperty({ example: 3, description: 'Number of members' })
  memberCount!: number;

  @ApiProperty({ example: 5, description: 'Number of issues' })
  issueCount!: number;
}
