import { IssuePriority, IssueStatus, IssueType, Prisma } from '@prisma/client';

export const issueListInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  reporter: { select: { id: true, name: true, email: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.IssueInclude;

export const issueDetailInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  reporter: { select: { id: true, name: true, email: true } },
  comments: {
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
  _count: { select: { comments: true } },
} satisfies Prisma.IssueInclude;

export const commentInclude = {
  author: { select: { id: true, name: true, email: true } },
} satisfies Prisma.CommentInclude;

export type IssueWithListCounts = Prisma.IssueGetPayload<{
  include: typeof issueListInclude;
}>;

export type IssueWithDetail = Prisma.IssueGetPayload<{
  include: typeof issueDetailInclude;
}>;

export type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: typeof commentInclude;
}>;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
}

export interface IssueListItem {
  id: number;
  title: string;
  description: string | null;
  type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  projectId: number;
  reporterId: number;
  assigneeId: number | null;
  dueDate: Date | null;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
  commentCount: number;
  assignee: UserSummary | null;
  reporter: UserSummary;
}

export interface CommentDetail {
  id: number;
  body: string;
  authorId: number;
  issueId: number;
  createdAt: Date;
  updatedAt: Date;
  author: UserSummary;
}

export interface IssueDetail extends IssueListItem {
  comments: CommentDetail[];
}
