import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProjectMemberRole, RoleName } from '@prisma/client';

import type { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { PROJECT_ROLE_KEY } from '../decorators/project-role.decorator';

interface RequestWithProject {
  user?: CurrentUserPayload;
  params: { projectId?: string };
}

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.getAllAndOverride<ProjectMemberRole[]>(PROJECT_ROLE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const request = context.switchToHttp().getRequest<RequestWithProject>();
    const user = request.user;
    const projectId = Number(request.params.projectId);

    if (!user || !Number.isInteger(projectId)) {
      throw new NotFoundException('Project not found');
    }

    if (user.roles.includes(RoleName.ADMIN)) {
      return true;
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.userId, projectId } },
    });

    if (!membership) {
      throw new NotFoundException('Project not found');
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(membership.role)) {
      throw new ForbiddenException('Insufficient project permissions');
    }

    return true;
  }
}
