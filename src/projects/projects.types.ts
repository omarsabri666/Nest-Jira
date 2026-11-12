import { Prisma, ProjectMemberRole } from '@prisma/client';

export const projectDetailInclude = {
  members: {
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  },
  _count: { select: { members: true, issues: true } },
} satisfies Prisma.ProjectInclude;

export const projectListInclude = {
  _count: { select: { members: true, issues: true } },
} satisfies Prisma.ProjectInclude;

export type ProjectWithDetail = Prisma.ProjectGetPayload<{
  include: typeof projectDetailInclude;
}>;

export type ProjectWithListCounts = Prisma.ProjectGetPayload<{
  include: typeof projectListInclude;
}>;

export interface ProjectListItem {
  id: number;
  name: string;
  key: string;
  description: string | null;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
  issueCount: number;
}

export interface ProjectMemberSummary {
  userId: number;
  role: ProjectMemberRole;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ProjectDetail extends ProjectListItem {
  members: ProjectMemberSummary[];
}
