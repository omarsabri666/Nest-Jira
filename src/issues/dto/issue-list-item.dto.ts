import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IssuePriority, IssueStatus, IssueType } from '@prisma/client';

import { UserSummaryDto } from '../../common/dto/user-summary.dto';

export class IssueListItemDto {
  @ApiProperty({ example: 1, description: 'Issue ID' })
  id!: number;

  @ApiProperty({ example: 'Fix login bug', description: 'Issue title' })
  title!: string;

  @ApiPropertyOptional({
    example: 'Users cannot log in with valid credentials',
    nullable: true,
    description: 'Issue description',
  })
  description!: string | null;

  @ApiProperty({ enum: IssueType, example: IssueType.BUG, description: 'Issue type' })
  type!: IssueType;

  @ApiProperty({ enum: IssueStatus, example: IssueStatus.TODO, description: 'Issue status' })
  status!: IssueStatus;

  @ApiProperty({ enum: IssuePriority, example: IssuePriority.HIGH, description: 'Issue priority' })
  priority!: IssuePriority;

  @ApiProperty({ example: 1, description: 'Project ID' })
  projectId!: number;

  @ApiProperty({ example: 3, description: 'Reporter user ID' })
  reporterId!: number;

  @ApiPropertyOptional({ example: 4, nullable: true, description: 'Assignee user ID' })
  assigneeId!: number | null;

  @ApiPropertyOptional({
    example: '2026-09-01T00:00:00.000Z',
    nullable: true,
    description: 'Due date',
  })
  dueDate!: Date | null;

  @ApiProperty({ example: ['auth', 'bug'], type: [String], description: 'Issue labels' })
  labels!: string[];

  @ApiProperty({ example: '2026-08-18T10:00:00.000Z', description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-08-18T10:00:00.000Z', description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiProperty({ example: 2, description: 'Number of comments' })
  commentCount!: number;

  @ApiPropertyOptional({ type: UserSummaryDto, nullable: true, description: 'Assignee details' })
  assignee!: UserSummaryDto | null;

  @ApiProperty({ type: UserSummaryDto, description: 'Reporter details' })
  reporter!: UserSummaryDto;
}
