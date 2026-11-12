import { ApiPropertyOptional } from '@nestjs/swagger';
import { IssuePriority, IssueStatus, IssueType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

export class IssueQueryDto {
  @ApiPropertyOptional({
    enum: IssueStatus,
    example: IssueStatus.IN_PROGRESS,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional({
    enum: IssuePriority,
    example: IssuePriority.HIGH,
    description: 'Filter by priority',
  })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional({ enum: IssueType, example: IssueType.BUG, description: 'Filter by type' })
  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @ApiPropertyOptional({ example: 4, minimum: 1, description: 'Filter by assignee ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  assigneeId?: number;

  @ApiPropertyOptional({ example: 'bug', description: 'Filter by label' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({
    example: 'login',
    description: 'Full-text search on title and description',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    example: 'createdAt:desc',
    pattern: '^(createdAt|updatedAt|priority|status|dueDate):(asc|desc)$',
    description: 'Sort field and direction, e.g. createdAt:desc',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(createdAt|updatedAt|priority|status|dueDate):(asc|desc)$/, {
    message:
      'sort must be in the form field:asc|desc (field: createdAt|updatedAt|priority|status|dueDate)',
  })
  sort?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
