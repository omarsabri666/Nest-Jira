import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Queue } from 'bullmq';

import { ISSUE_ASSIGNED_EVENT, type IssueAssignedEvent } from './issues.events';
import { PrismaService } from '../prisma/prisma.service';
import { MAIL_JOB_NAMES, MAIL_QUEUE } from '../queues/mail.queue';

@Injectable()
export class IssueListener {
  private readonly logger = new Logger(IssueListener.name);

  constructor(
    @InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent(ISSUE_ASSIGNED_EVENT)
  async handleIssueAssigned(event: IssueAssignedEvent): Promise<void> {
    const [assignee, issue] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: event.assigneeId },
        select: { id: true, email: true, name: true },
      }),
      this.prisma.issue.findUnique({
        where: { id: event.issueId },
        select: { title: true, project: { select: { key: true } } },
      }),
    ]);

    if (!assignee || !issue) {
      return;
    }

    await this.mailQueue.add(
      MAIL_JOB_NAMES.ISSUE_ASSIGNED,
      {
        issueId: event.issueId,
        assigneeId: assignee.id,
        email: assignee.email,
        name: assignee.name,
        projectKey: issue.project.key,
        title: issue.title,
      },
      { jobId: `issue-assigned-${event.issueId}-${assignee.id}` },
    );

    this.logger.log(
      `Enqueued issue-assigned email for assignee ${assignee.id} on issue ${event.issueId}`,
    );
  }
}
