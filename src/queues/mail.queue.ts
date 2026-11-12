export const MAIL_QUEUE = 'mail';

export const MAIL_JOB_NAMES = {
  WELCOME: 'welcome',
  ISSUE_ASSIGNED: 'issue-assigned',
  ISSUE_DUE: 'issue-due',
} as const;

export type MailJobName = (typeof MAIL_JOB_NAMES)[keyof typeof MAIL_JOB_NAMES];

export interface WelcomeMailJobData {
  userId: number;
  email: string;
  name: string;
}

export interface IssueAssignedMailJobData {
  issueId: number;
  assigneeId: number;
  email: string;
  name: string;
  projectKey: string;
  title: string;
}

export interface IssueDueMailJobData {
  issueId: number;
  email: string;
  name: string;
  projectKey: string;
  title: string;
  dueDate: string;
}

export type MailJobData = WelcomeMailJobData | IssueAssignedMailJobData | IssueDueMailJobData;
