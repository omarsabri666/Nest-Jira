import { SetMetadata } from '@nestjs/common';
import { ProjectMemberRole } from '@prisma/client';

export const PROJECT_ROLE_KEY = 'projectRoles';

export const ProjectRole = (...roles: ProjectMemberRole[]) => SetMetadata(PROJECT_ROLE_KEY, roles);
