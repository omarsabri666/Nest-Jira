import { ApiProperty } from '@nestjs/swagger';
import { IssueStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class IssueStatusDto {
  @ApiProperty({
    enum: IssueStatus,
    example: IssueStatus.IN_PROGRESS,
    description: 'New issue status',
  })
  @IsEnum(IssueStatus)
  status!: IssueStatus;
}
