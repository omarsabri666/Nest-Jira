import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectMemberRole } from '@prisma/client';
import { IsEmail, IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class AddMemberDto {
  @ApiPropertyOptional({ example: 'john@example.com', description: 'Email of the user to add' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 3, minimum: 1, description: 'ID of the user to add' })
  @IsOptional()
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({
    enum: ProjectMemberRole,
    example: ProjectMemberRole.MEMBER,
    description: 'Project role to assign',
  })
  @IsOptional()
  @IsEnum(ProjectMemberRole)
  role?: ProjectMemberRole;
}
