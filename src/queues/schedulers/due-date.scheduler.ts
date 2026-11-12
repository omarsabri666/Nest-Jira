import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';

import { PrismaService } from '../../prisma/prisma.service';
import { MAIL_JOB_NAMES, MAIL_QUEUE } from '../mail.queue';

@Injectable()
export class DueDateScheduler {
  private readonly logger = new Logger(DueDateScheduler.name);

  constructor(
    @InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scanDueIssues(): Promise<void> {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const issues = await this.prisma.issue.findMany({
      where: {
        dueDate: { gte: now, lte: in24h },
        dueReminderSentAt: null,
        assigneeId: { not: null },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        project: { select: { key: true } },
        assignee: { select: { email: true, name: true } },
      },
    });

    for (const issue of issues) {
      if (!issue.assignee || !issue.dueDate) {
        continue;
      }

      await this.mailQueue.add(
        MAIL_JOB_NAMES.ISSUE_DUE,
        {
          issueId: issue.id,
          email: issue.assignee.email,
          name: issue.assignee.name,
          projectKey: issue.project.key,
          title: issue.title,
          dueDate: issue.dueDate.toISOString(),
        },
        { jobId: `issue-due-${issue.id}` },
      );

      this.logger.log(`Enqueued due-date reminder for issue ${issue.id}`);
    }
  }
}
