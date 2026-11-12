import { IssueStatus } from '@prisma/client';

export const ISSUE_STATUS_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  TODO: [IssueStatus.IN_PROGRESS],
  IN_PROGRESS: [IssueStatus.IN_REVIEW, IssueStatus.TODO],
  IN_REVIEW: [IssueStatus.DONE, IssueStatus.IN_PROGRESS, IssueStatus.TODO],
  DONE: [],
};

export function isAllowedTransition(from: IssueStatus, to: IssueStatus): boolean {
  return (ISSUE_STATUS_TRANSITIONS[from] ?? []).includes(to);
}
