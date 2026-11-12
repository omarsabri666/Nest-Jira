import { getQueueToken } from '@nestjs/bullmq';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../prisma/prisma.service';
import { MAIL_QUEUE } from '../mail.queue';
import { DueDateScheduler } from './due-date.scheduler';

describe('DueDateScheduler', () => {
  let scheduler: DueDateScheduler;

  const mailQueue = { add: jest.fn().mockResolvedValue({}) };
  const prisma = { issue: { findMany: jest.fn() } };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DueDateScheduler,
        { provide: getQueueToken(MAIL_QUEUE), useValue: mailQueue },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    scheduler = moduleRef.get(DueDateScheduler);
    jest.clearAllMocks();
  });

  it('enqueues a due-date job for each issue due within 24 hours', async () => {
    prisma.issue.findMany.mockResolvedValue([
      {
        id: 1,
        title: 'Fix bug',
        dueDate: new Date(),
        project: { key: 'PROJ' },
        assignee: { email: 'alice@example.com', name: 'Alice' },
      },
    ]);

    await scheduler.scanDueIssues();

    expect(mailQueue.add).toHaveBeenCalledWith(
      'issue-due',
      expect.objectContaining({ issueId: 1, email: 'alice@example.com' }),
      { jobId: 'issue-due-1' },
    );
  });

  it('skips issues without an assignee', async () => {
    prisma.issue.findMany.mockResolvedValue([
      {
        id: 2,
        title: 'No owner',
        dueDate: new Date(),
        project: { key: 'PROJ' },
        assignee: null,
      },
    ]);

    await scheduler.scanDueIssues();

    expect(mailQueue.add).not.toHaveBeenCalled();
  });
});
