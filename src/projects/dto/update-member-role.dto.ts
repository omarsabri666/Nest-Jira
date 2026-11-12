import { ApiProperty } from '@nestjs/swagger';
import { ProjectMemberRole } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateMemberRoleDto {
  @ApiProperty({
    enum: ProjectMemberRole,
    example: ProjectMemberRole.MEMBER,
    description: 'New project role',
  })
  @IsEnum(ProjectMemberRole)
  role!: ProjectMemberRole;
}
