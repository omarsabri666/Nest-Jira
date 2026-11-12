import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectMemberRole, RoleName } from '@prisma/client';

import type { CurrentUserPayload } from '../../auth/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

interface RequestWithIssue {
  user?: CurrentUserPayload;
  params: { projectId?: string; id?: string };
}

@Injectable()
export class IssueDeleteGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithIssue>();
    const user = request.user;
    const projectId = Number(request.params.projectId);
    const issueId = Number(request.params.id);

    if (!user || !Number.isInteger(projectId) || !Number.isInteger(issueId)) {
      throw new NotFoundException('Issue not found');
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

    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      select: { reporterId: true, projectId: true },
    });

    if (!issue || issue.projectId !== projectId) {
      throw new NotFoundException('Issue not found');
    }

    if (issue.reporterId === user.userId || membership.role === ProjectMemberRole.OWNER) {
      return true;
    }

    throw new ForbiddenException(
      'Only the reporter, project owner, or an admin can delete this issue',
    );
  }
}
