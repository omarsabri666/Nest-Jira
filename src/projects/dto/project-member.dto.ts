import { ApiProperty } from '@nestjs/swagger';
import { ProjectMemberRole } from '@prisma/client';

import { UserSummaryDto } from '../../common/dto/user-summary.dto';

export class ProjectMemberDto {
  @ApiProperty({ example: 3, description: 'User ID' })
  userId!: number;

  @ApiProperty({ example: 1, description: 'Project ID' })
  projectId!: number;

  @ApiProperty({
    enum: ProjectMemberRole,
    example: ProjectMemberRole.MEMBER,
    description: 'Project role',
  })
  role!: ProjectMemberRole;

  @ApiProperty({
    example: '2026-08-18T10:00:00.000Z',
    description: 'Membership creation timestamp',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-08-18T10:00:00.000Z',
    description: 'Membership last update timestamp',
  })
  updatedAt!: Date;

  @ApiProperty({ type: UserSummaryDto, description: 'Member user details' })
  user!: UserSummaryDto;
}
