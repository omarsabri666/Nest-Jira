export const ISSUE_ASSIGNED_EVENT = 'issue.assigned';

export interface IssueAssignedEvent {
  issueId: number;
  projectId: number;
  assigneeId: number;
  previousAssigneeId: number | null;
  assignedById: number;
}
