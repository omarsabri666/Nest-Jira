import { ApiProperty } from '@nestjs/swagger';
import { IssuePriority, IssueStatus } from '@prisma/client';

export class RecentActivityItemDto {
  @ApiProperty({ example: 1, description: 'Issue ID' })
  id!: number;

  @ApiProperty({ example: 'Fix login flow', description: 'Issue title' })
  title!: string;

  @ApiProperty({ example: IssueStatus.IN_PROGRESS, description: 'Issue status' })
  status!: IssueStatus;

  @ApiProperty({ example: 2, description: 'Project ID' })
  projectId!: number;

  @ApiProperty({ example: 'OPS', description: 'Project key' })
  projectKey!: string;

  @ApiProperty({ example: 'Platform', description: 'Project name' })
  projectName!: string;

  @ApiProperty({ example: '2026-08-22T10:00:00.000Z', description: 'Last updated' })
  updatedAt!: Date;
}

export class DashboardSummaryDto {
  @ApiProperty({ example: 5, description: 'Projects the user can see' })
  totalProjects!: number;

  @ApiProperty({ example: 42, description: 'Total issues' })
  totalIssues!: number;

  @ApiProperty({ example: 27, description: 'Issues not in a done state' })
  openIssues!: number;

  @ApiProperty({ example: 6, description: 'Open issues past their due date' })
  overdueIssues!: number;

  @ApiProperty({
    example: 12,
    description: 'Issues created in the recent window',
  })
  recentIssues!: number;

  @ApiProperty({
    type: [RecentActivityItemDto],
    description: 'Most recently updated issues',
  })
  recentActivity!: RecentActivityItemDto[];
}

export class StatusCountDto {
  @ApiProperty({ example: IssueStatus.TODO, description: 'Issue status' })
  status!: IssueStatus;

  @ApiProperty({ example: 10, description: 'Number of issues' })
  count!: number;
}

export class StatusDistributionDto {
  @ApiProperty({ type: [StatusCountDto], description: 'Issues grouped by status' })
  items!: StatusCountDto[];
}

export class PriorityCountDto {
  @ApiProperty({ example: IssuePriority.HIGH, description: 'Issue priority' })
  priority!: IssuePriority;

  @ApiProperty({ example: 8, description: 'Number of issues' })
  count!: number;
}

export class PriorityDistributionDto {
  @ApiProperty({
    type: [PriorityCountDto],
    description: 'Issues grouped by priority',
  })
  items!: PriorityCountDto[];
}

export class TrendCountDto {
  @ApiProperty({ example: '2026-08-01', description: 'Calendar day' })
  date!: string;

  @ApiProperty({ example: 4, description: 'Issues created that day' })
  count!: number;
}

export class IssueTrendsDto {
  @ApiProperty({ type: [TrendCountDto], description: 'Issues created per day' })
  items!: TrendCountDto[];
}
