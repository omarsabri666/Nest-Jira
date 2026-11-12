/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException } from '@nestjs/common';
import { ProjectMemberRole } from '@prisma/client';

import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  const prisma = {
    project: { findUnique: jest.fn(), create: jest.fn() },
    projectMember: { findUnique: jest.fn(), count: jest.fn() },
  };
  const service = new ProjectsService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates the project creator as OWNER', async () => {
    prisma.project.findUnique.mockResolvedValue(null);
    prisma.project.create.mockResolvedValue({
      id: 2,
      name: 'Website',
      key: 'WEB',
      description: null,
      ownerId: 7,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [],
      _count: { members: 1, issues: 0 },
    });

    await service.create(7, { name: 'Website', key: 'web' });
    expect(prisma.project.create.mock.calls[0][0].data.members.create).toEqual({
      userId: 7,
      role: ProjectMemberRole.OWNER,
    });
  });

  it('blocks removing the last owner', async () => {
    prisma.projectMember.findUnique.mockResolvedValue({ role: ProjectMemberRole.OWNER });
    prisma.projectMember.count.mockResolvedValue(0);
    await expect(service.updateMemberRole(2, 7, ProjectMemberRole.MEMBER)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
