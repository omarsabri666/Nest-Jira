import { IssuePriority, IssueStatus } from '@prisma/client';

export interface RecentActivityItem {
  id: number;
  title: string;
  status: IssueStatus;
  projectId: number;
  projectKey: string;
  projectName: string;
  updatedAt: Date;
}

export interface DashboardSummary {
  totalProjects: number;
  totalIssues: number;
  openIssues: number;
  overdueIssues: number;
  recentIssues: number;
  recentActivity: RecentActivityItem[];
}

export interface StatusCount {
  status: IssueStatus;
  count: number;
}

export interface PriorityCount {
  priority: IssuePriority;
  count: number;
}

export interface TrendCount {
  date: string;
  count: number;
}

export interface DashboardQuery {
  projectId?: number;
  days?: number;
  from?: string;
  to?: string;
}
