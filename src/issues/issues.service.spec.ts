import { BadRequestException } from '@nestjs/common';
import { IssueStatus, ProjectMemberRole } from '@prisma/client';

import { IssuesService } from './issues.service';

describe('IssuesService', () => {
  const prisma = {
    project: { findUnique: jest.fn() },
    projectMember: { findUnique: jest.fn() },
    issue: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };
  const redis = { get: jest.fn(), set: jest.fn(), invalidatePattern: jest.fn() };
  const events = { emit: jest.fn() };
  const config = { getOrThrow: jest.fn().mockReturnValue(60) };
  const service = new IssuesService(
    prisma as never,
    redis as never,
    events as never,
    config as never,
  );
  const detail = {
    id: 4,
    title: 'Bug',
    description: null,
    type: 'BUG',
    status: IssueStatus.TODO,
    priority: 'HIGH',
    projectId: 2,
    reporterId: 1,
    assigneeId: 3,
    dueDate: null,
    labels: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    assignee: null,
    reporter: { id: 1, name: 'Reporter', email: 'r@example.com' },
    comments: [],
    _count: { comments: 0 },
  };

  beforeEach(() => jest.clearAllMocks());

  it('creates an issue for a project member and invalidates cache', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 2 });
    prisma.projectMember.findUnique.mockResolvedValue({ userId: 3 });
    prisma.issue.create.mockResolvedValue(detail);
    await service.create(2, 1, { title: 'Bug', assigneeId: 3 });
    expect(prisma.issue.create).toHaveBeenCalled();
    expect(redis.invalidatePattern).toHaveBeenCalledWith('issues:*');
  });

  it('rejects a non-member assignee', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 2 });
    prisma.projectMember.findUnique.mockResolvedValue(null);
    await expect(service.create(2, 1, { title: 'Bug', assigneeId: 3 })).rejects.toThrow(
      'not a member',
    );
  });

  it('rejects DONE to TODO for a non-owner', async () => {
    prisma.issue.findUnique.mockResolvedValue({ ...detail, status: IssueStatus.DONE });
    prisma.projectMember.findUnique.mockResolvedValue({ role: ProjectMemberRole.MEMBER });
    await expect(
      service.transition(
        2,
        4,
        { status: IssueStatus.TODO },
        { userId: 1, email: 'u', roles: ['USER'] },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('invalidates issue caches after a mutation', async () => {
    prisma.issue.findUnique.mockResolvedValue(detail);
    prisma.issue.update.mockResolvedValue({ ...detail, status: IssueStatus.IN_PROGRESS });
    await service.transition(
      2,
      4,
      { status: IssueStatus.IN_PROGRESS },
      { userId: 1, email: 'u', roles: ['USER'] },
    );
    expect(redis.invalidatePattern).toHaveBeenCalledWith('issues:*');
  });
});
