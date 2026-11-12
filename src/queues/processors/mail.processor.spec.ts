import { Test } from '@nestjs/testing';
import { Job } from 'bullmq';

import { MailProcessor } from './mail.processor';
import { MAIL_SERVICE } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('MailProcessor', () => {
  let processor: MailProcessor;

  const mailService = { send: jest.fn().mockResolvedValue(undefined) };
  const prisma = { issue: { update: jest.fn().mockResolvedValue({}) } };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MailProcessor,
        { provide: MAIL_SERVICE, useValue: mailService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    processor = moduleRef.get(MailProcessor);
    jest.clearAllMocks();
  });

  it('sends a welcome email to the user', async () => {
    const job = {
      id: 'job-1',
      name: 'welcome',
      data: { userId: 1, email: 'alice@example.com', name: 'Alice' },
    } as unknown as Job;

    await processor.process(job);

    expect(mailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'alice@example.com' }),
    );
  });

  it('sends an issue-assigned email to the assignee', async () => {
    const job = {
      id: 'job-2',
      name: 'issue-assigned',
      data: {
        issueId: 10,
        assigneeId: 2,
        email: 'bob@example.com',
        name: 'Bob',
        projectKey: 'PROJ',
        title: 'Fix login',
      },
    } as unknown as Job;

    await processor.process(job);

    expect(mailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'bob@example.com', subject: 'You were assigned PROJ-10' }),
    );
  });

  it('sends a due-date reminder and marks the issue as reminded', async () => {
    const job = {
      id: 'job-3',
      name: 'issue-due',
      data: {
        issueId: 7,
        email: 'carol@example.com',
        name: 'Carol',
        projectKey: 'PROJ',
        title: 'Ship release',
        dueDate: new Date().toISOString(),
      },
    } as unknown as Job;

    await processor.process(job);

    expect(mailService.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'carol@example.com' }),
    );
    expect(prisma.issue.update).toHaveBeenCalledTimes(1);
    const updateCalls = prisma.issue.update.mock.calls as Array<
      [{ where: { id: number }; data: { dueReminderSentAt: Date } }]
    >;
    const updateArgs = updateCalls[0][0];
    expect(updateArgs.where).toEqual({ id: 7 });
    expect(updateArgs.data.dueReminderSentAt).toBeInstanceOf(Date);
  });
});
