import { ApiProperty } from '@nestjs/swagger';
import { IssuePriority, IssueStatus, IssueType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class DashboardQueryDto {
  @ApiProperty({
    required: false,
    example: 1,
    minimum: 1,
    description: 'Scope metrics to a single project',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  projectId?: number;

  @ApiProperty({
    required: false,
    example: 30,
    minimum: 1,
    maximum: 90,
    description: 'Number of days for trend and recent activity windows',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  days?: number;

  @ApiProperty({
    required: false,
    example: '2026-08-01',
    description: 'Start of the trend window (ISO date)',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiProperty({
    required: false,
    example: '2026-08-22',
    description: 'End of the trend window (ISO date)',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class DashboardTrendDto {
  @ApiProperty({ example: IssueStatus.IN_PROGRESS, description: 'Issue status' })
  status!: IssueStatus;
}

export class DashboardPriorityDto {
  @ApiProperty({ example: IssuePriority.HIGH, description: 'Issue priority' })
  priority!: IssuePriority;
}

export class DashboardTypeDto {
  @ApiProperty({ example: IssueType.BUG, description: 'Issue type' })
  type!: IssueType;
}
