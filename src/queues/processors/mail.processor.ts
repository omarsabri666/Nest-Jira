import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { MAIL_SERVICE, type MailService } from '../../mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MAIL_JOB_NAMES,
  MAIL_QUEUE,
  type IssueAssignedMailJobData,
  type IssueDueMailJobData,
  type MailJobData,
  type WelcomeMailJobData,
} from '../mail.queue';

@Processor(MAIL_QUEUE)
@Injectable()
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    @Inject(MAIL_SERVICE) private readonly mailService: MailService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case MAIL_JOB_NAMES.WELCOME:
        await this.sendWelcome(job as Job<WelcomeMailJobData>);
        break;
      case MAIL_JOB_NAMES.ISSUE_ASSIGNED:
        await this.sendIssueAssigned(job as Job<IssueAssignedMailJobData>);
        break;
      case MAIL_JOB_NAMES.ISSUE_DUE:
        await this.sendIssueDue(job as Job<IssueDueMailJobData>);
        break;
      default:
        this.logger.warn(`Unknown mail job name: ${job.name}`);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<MailJobData>, error: Error): void {
    this.logger.error(
      `Job ${job.id} (${job.name}) failed after ${job.attemptsMade} attempt(s): ${error.message}`,
      { jobData: job.data },
    );
  }

  private async sendWelcome(job: Job<WelcomeMailJobData>): Promise<void> {
    const { email, name } = job.data;

    this.logger.log(`Sending welcome email to ${email} (job ${job.id})`);

    await this.mailService.send({
      to: email,
      subject: 'Welcome to TaskFlow',
      text: `Hi ${name}, welcome to TaskFlow! Your account has been created successfully.`,
    });
  }

  private async sendIssueAssigned(job: Job<IssueAssignedMailJobData>): Promise<void> {
    const { email, name, projectKey, title, issueId } = job.data;

    this.logger.log(`Sending issue-assigned email to ${email} (job ${job.id})`);

    await this.mailService.send({
      to: email,
      subject: `You were assigned ${projectKey}-${issueId}`,
      text: `Hi ${name}, you have been assigned ${projectKey}-${issueId}: "${title}".`,
    });
  }

  private async sendIssueDue(job: Job<IssueDueMailJobData>): Promise<void> {
    const { email, name, projectKey, title, issueId, dueDate } = job.data;

    this.logger.log(`Sending due-date reminder to ${email} (job ${job.id})`);

    await this.mailService.send({
      to: email,
      subject: `${projectKey}-${issueId} is due soon`,
      text: `Hi ${name}, the issue ${projectKey}-${issueId}: "${title}" is due on ${new Date(
        dueDate,
      ).toDateString()}.`,
    });

    await this.prisma.issue.update({
      where: { id: issueId },
      data: { dueReminderSentAt: new Date() },
    });
  }
}
