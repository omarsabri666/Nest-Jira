import { ApiPropertyOptional } from '@nestjs/swagger';
import { IssuePriority, IssueStatus, IssueType } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateIssueDto {
  @ApiPropertyOptional({ example: 'Fix login bug', description: 'Issue title' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({
    example: 'Users cannot log in with valid credentials',
    description: 'Issue description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: IssueType, example: IssueType.BUG, description: 'Issue type' })
  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @ApiPropertyOptional({
    enum: IssueStatus,
    example: IssueStatus.IN_PROGRESS,
    description: 'Issue status',
  })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional({
    enum: IssuePriority,
    example: IssuePriority.HIGH,
    description: 'Issue priority',
  })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional({ example: 4, minimum: 1, description: 'Assignee user ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  assigneeId?: number;

  @ApiPropertyOptional({ example: '2026-09-01', description: 'Due date (ISO-8601)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: ['auth', 'bug'], isArray: true, description: 'Issue labels' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
}
