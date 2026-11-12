import { Injectable } from '@nestjs/common';
import { IssueStatus, Prisma } from '@prisma/client';

import {
  DashboardSummary,
  PriorityCount,
  RecentActivityItem,
  StatusCount,
  TrendCount,
} from './dashboard.types';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(
    userId: number,
    isAdmin: boolean,
    query: DashboardQueryDto,
  ): Promise<DashboardSummary> {
    const projectIds = isAdmin ? undefined : await this.memberProjectIds(userId);
    const projectWhere: Prisma.ProjectWhereInput = projectIds ? { id: { in: projectIds } } : {};
    const issueWhere: Prisma.IssueWhereInput = projectIds ? { projectId: { in: projectIds } } : {};

    const days = query.days ?? 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const now = new Date();

    const totalProjects = await this.prisma.project.count({
      where: projectWhere,
    });
    const totalIssues = await this.prisma.issue.count({ where: issueWhere });
    const openIssues = await this.prisma.issue.count({
      where: { ...issueWhere, status: { not: IssueStatus.DONE } },
    });
    const overdueIssues = await this.prisma.issue.count({
      where: {
        ...issueWhere,
        status: { not: IssueStatus.DONE },
        dueDate: { lt: now },
      },
    });
    const recentIssues = await this.prisma.issue.count({
      where: { ...issueWhere, createdAt: { gte: since } },
    });

    const recent = await this.prisma.issue.findMany({
      where: issueWhere,
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        project: { select: { id: true, key: true, name: true } },
      },
    });

    return {
      totalProjects,
      totalIssues,
      openIssues,
      overdueIssues,
      recentIssues,
      recentActivity: recent.map<RecentActivityItem>((issue) => ({
        id: issue.id,
        title: issue.title,
        status: issue.status,
        projectId: issue.project.id,
        projectKey: issue.project.key,
        projectName: issue.project.name,
        updatedAt: issue.updatedAt,
      })),
    };
  }

  async statusDistribution(
    userId: number,
    isAdmin: boolean,
    query: DashboardQueryDto,
  ): Promise<{ items: StatusCount[] }> {
    const issueWhere = await this.scopedIssueWhere(userId, isAdmin, query);
    const grouped = await this.prisma.issue.groupBy({
      by: ['status'],
      where: issueWhere,
      _count: { _all: true },
    });

    return {
      items: grouped.map((entry) => ({
        status: entry.status,
        count: entry._count._all,
      })),
    };
  }

  async priorityDistribution(
    userId: number,
    isAdmin: boolean,
    query: DashboardQueryDto,
  ): Promise<{ items: PriorityCount[] }> {
    const issueWhere = await this.scopedIssueWhere(userId, isAdmin, query);
    const grouped = await this.prisma.issue.groupBy({
      by: ['priority'],
      where: issueWhere,
      _count: { _all: true },
    });

    return {
      items: grouped.map((entry) => ({
        priority: entry.priority,
        count: entry._count._all,
      })),
    };
  }

  async issueTrends(
    userId: number,
    isAdmin: boolean,
    query: DashboardQueryDto,
  ): Promise<{ items: TrendCount[] }> {
    const issueWhere = await this.scopedIssueWhere(userId, isAdmin, query);

    const to = query.to ? new Date(`${query.to}T23:59:59.999Z`) : new Date();
    const from = query.from
      ? new Date(`${query.from}T00:00:00.000Z`)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    const issues = await this.prisma.issue.findMany({
      where: { ...issueWhere, createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
    });

    const byDay = new Map<string, number>();
    for (const issue of issues) {
      const key = issue.createdAt.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }

    const items: TrendCount[] = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      const key = cursor.toISOString().slice(0, 10);
      items.push({ date: key, count: byDay.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    return { items };
  }

  private async memberProjectIds(userId: number): Promise<number[]> {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    return memberships.map((membership) => membership.projectId);
  }

  private async scopedIssueWhere(
    userId: number,
    isAdmin: boolean,
    query: DashboardQueryDto,
  ): Promise<Prisma.IssueWhereInput> {
    const where: Prisma.IssueWhereInput = {};
    if (query.projectId !== undefined) {
      where.projectId = query.projectId;
    } else if (!isAdmin) {
      const projectIds = await this.memberProjectIds(userId);
      where.projectId = { in: projectIds };
    }
    return where;
  }
}
