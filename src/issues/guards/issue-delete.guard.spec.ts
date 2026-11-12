import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ProjectMemberRole } from '@prisma/client';

import { IssueDeleteGuard } from './issue-delete.guard';

describe('IssueDeleteGuard', () => {
  const prisma = { projectMember: { findUnique: jest.fn() }, issue: { findUnique: jest.fn() } };
  const guard = new IssueDeleteGuard(prisma as never);
  const context = (user: { userId: number; roles: string[] }) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user, params: { projectId: '2', id: '4' } }) }),
    }) as unknown as ExecutionContext;

  beforeEach(() => jest.clearAllMocks());

  it('rejects a non-owner who is not the reporter', async () => {
    prisma.projectMember.findUnique.mockResolvedValue({ role: ProjectMemberRole.MEMBER });
    prisma.issue.findUnique.mockResolvedValue({ reporterId: 9, projectId: 2 });
    await expect(guard.canActivate(context({ userId: 1, roles: ['USER'] }))).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
