import { createHash } from 'crypto';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IssueStatus, Prisma, ProjectMemberRole, RoleName } from '@prisma/client';

import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CommentCreateDto } from './dto/comment-create.dto';
import { CommentUpdateDto } from './dto/comment-update.dto';
import { CreateIssueDto } from './dto/create-issue.dto';
import { IssueQueryDto } from './dto/issue-query.dto';
import { IssueStatusDto } from './dto/issue-status.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { ISSUE_ASSIGNED_EVENT, type IssueAssignedEvent } from './issues.events';
import { isAllowedTransition } from './issues.state-machine';
import {
  commentInclude,
  issueDetailInclude,
  issueListInclude,
  type CommentDetail,
  type CommentWithAuthor,
  type IssueDetail,
  type IssueListItem,
  type IssueWithDetail,
  type IssueWithListCounts,
  type PaginationMeta,
} from './issues.types';

@Injectable()
export class IssuesService {
  private readonly logger = new Logger(IssuesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly eventEmitter: EventEmitter2,
    private readonly config: ConfigService,
  ) {}

  async create(projectId: number, reporterId: number, dto: CreateIssueDto): Promise<IssueDetail> {
    await this.assertProjectExists(projectId);

    if (dto.assigneeId !== undefined) {
      await this.assertProjectMember(projectId, dto.assigneeId);
    }

    const issue = await this.prisma.issue.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        priority: dto.priority,
        assigneeId: dto.assigneeId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        labels: dto.labels ?? [],
        projectId,
        reporterId,
      },
      include: issueDetailInclude,
    });

    if (issue.assigneeId !== null) {
      this.emitAssigned(issue.id, projectId, issue.assigneeId, null, reporterId);
    }

    await this.invalidateIssueCache();

    return this.toIssueDetail(issue);
  }

  async findAll(
    projectId: number,
    query: IssueQueryDto,
  ): Promise<{ items: IssueListItem[]; meta: PaginationMeta }> {
    const cacheKey = `issues:list:${projectId}:${this.hashQuery(query)}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT ${cacheKey}`);
      return JSON.parse(cached) as { items: IssueListItem[]; meta: PaginationMeta };
    }
    this.logger.log(`Cache MISS ${cacheKey}`);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.IssueWhereInput = { projectId };
    if (query.status) {
      where.status = query.status;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.assigneeId !== undefined) {
      where.assigneeId = query.assigneeId;
    }
    if (query.label) {
      where.labels = { has: query.label };
    }
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [sortField, sortOrder] = query.sort?.split(':') ?? ['createdAt', 'desc'];
    const orderBy = { [sortField]: sortOrder } as Prisma.IssueOrderByWithRelationInput;

    const [issues, total] = await this.prisma.$transaction([
      this.prisma.issue.findMany({
        where,
        include: issueListInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      this.prisma.issue.count({ where }),
    ]);

    const result = {
      items: issues.map((issue) => this.toIssueListItem(issue)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.redis.set(cacheKey, JSON.stringify(result), this.cacheTtl);

    return result;
  }

  async findById(projectId: number, id: number): Promise<IssueDetail> {
    const cacheKey = `issues:item:${id}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      this.logger.log(`Cache HIT ${cacheKey}`);
      return JSON.parse(cached) as IssueDetail;
    }
    this.logger.log(`Cache MISS ${cacheKey}`);

    const issue = await this.findIssueOrThrow(id);
    this.assertIssueInProject(issue, projectId);

    const result = this.toIssueDetail(issue);

    await this.redis.set(cacheKey, JSON.stringify(result), this.cacheTtl);

    return result;
  }

  async update(
    projectId: number,
    id: number,
    dto: UpdateIssueDto,
    user: CurrentUserPayload,
  ): Promise<IssueDetail> {
    const existing = await this.findIssueOrThrow(id);
    this.assertIssueInProject(existing, projectId);

    if (dto.assigneeId !== undefined && dto.assigneeId !== existing.assigneeId) {
      await this.assertProjectMember(projectId, dto.assigneeId);
    }

    if (dto.status !== undefined) {
      await this.applyTransitionCheck(existing, dto.status, user);
    }

    const data: Prisma.IssueUncheckedUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.type !== undefined) {
      data.type = dto.type;
    }
    if (dto.status !== undefined) {
      data.status = dto.status;
    }
    if (dto.priority !== undefined) {
      data.priority = dto.priority;
    }
    if (dto.assigneeId !== undefined) {
      data.assigneeId = dto.assigneeId;
    }
    if (dto.dueDate !== undefined) {
      data.dueDate = new Date(dto.dueDate);
    }
    if (dto.labels !== undefined) {
      data.labels = dto.labels;
    }

    const issue = await this.prisma.issue.update({
      where: { id },
      data,
      include: issueDetailInclude,
    });

    if (issue.assigneeId !== null && issue.assigneeId !== existing.assigneeId) {
      this.emitAssigned(issue.id, projectId, issue.assigneeId, existing.assigneeId, user.userId);
    }

    await this.invalidateIssueCache();

    return this.toIssueDetail(issue);
  }

  async transition(
    projectId: number,
    id: number,
    dto: IssueStatusDto,
    user: CurrentUserPayload,
  ): Promise<IssueDetail> {
    const existing = await this.findIssueOrThrow(id);
    this.assertIssueInProject(existing, projectId);

    await this.applyTransitionCheck(existing, dto.status, user);

    const issue = await this.prisma.issue.update({
      where: { id },
      data: { status: dto.status },
      include: issueDetailInclude,
    });

    await this.invalidateIssueCache();

    return this.toIssueDetail(issue);
  }

  async remove(projectId: number, id: number): Promise<{ id: number }> {
    const issue = await this.findIssueOrThrow(id);
    this.assertIssueInProject(issue, projectId);

    await this.prisma.issue.delete({ where: { id } });

    await this.invalidateIssueCache();

    return { id };
  }

  async addComment(
    projectId: number,
    issueId: number,
    authorId: number,
    dto: CommentCreateDto,
  ): Promise<CommentDetail> {
    const issue = await this.findIssueOrThrow(issueId);
    this.assertIssueInProject(issue, projectId);

    const comment = await this.prisma.comment.create({
      data: { body: dto.body, authorId, issueId },
      include: commentInclude,
    });

    await this.invalidateIssueCache();

    return this.toCommentDetail(comment);
  }

  async updateComment(
    projectId: number,
    issueId: number,
    commentId: number,
    authorId: number,
    dto: CommentUpdateDto,
    user: CurrentUserPayload,
  ): Promise<CommentDetail> {
    const comment = await this.findCommentOrThrow(commentId);
    this.assertCommentInIssue(comment, issueId);
    await this.assertIssueInProjectById(issueId, projectId);
    await this.assertCanModifyComment(comment, authorId, user);

    const updated = await this.prisma.comment.update({
      where: { id: commentId },
      data: { body: dto.body },
      include: commentInclude,
    });

    await this.invalidateIssueCache();

    return this.toCommentDetail(updated);
  }

  async deleteComment(
    projectId: number,
    issueId: number,
    commentId: number,
    authorId: number,
    user: CurrentUserPayload,
  ): Promise<{ id: number }> {
    const comment = await this.findCommentOrThrow(commentId);
    this.assertCommentInIssue(comment, issueId);
    await this.assertIssueInProjectById(issueId, projectId);
    await this.assertCanModifyComment(comment, authorId, user);

    await this.prisma.comment.delete({ where: { id: commentId } });

    await this.invalidateIssueCache();

    return { id: commentId };
  }

  private get cacheTtl(): number {
    return this.config.getOrThrow<number>('redis.cacheTtl');
  }

  private async invalidateIssueCache(): Promise<void> {
    await this.redis.invalidatePattern('issues:*');
  }

  private hashQuery(query: IssueQueryDto): string {
    return createHash('sha256').update(JSON.stringify(query)).digest('hex').slice(0, 16);
  }

  private async applyTransitionCheck(
    issue: Pick<IssueWithDetail, 'status' | 'projectId'>,
    to: IssueStatus,
    user: CurrentUserPayload,
  ): Promise<void> {
    if (issue.status === IssueStatus.DONE && to === IssueStatus.TODO) {
      const canOverride = await this.canBypassDoneRestriction(issue.projectId, user);
      if (!canOverride) {
        throw new BadRequestException(
          'Transitioning from DONE to TODO requires an admin or project owner',
        );
      }
      return;
    }

    if (!isAllowedTransition(issue.status, to)) {
      throw new BadRequestException(`Invalid status transition from ${issue.status} to ${to}`);
    }
  }

  private async canBypassDoneRestriction(
    projectId: number,
    user: CurrentUserPayload,
  ): Promise<boolean> {
    if (user.roles.includes(RoleName.ADMIN)) {
      return true;
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: user.userId, projectId } },
      select: { role: true },
    });

    return membership?.role === ProjectMemberRole.OWNER;
  }

  private async assertCanModifyComment(
    comment: CommentWithAuthor,
    authorId: number,
    user: CurrentUserPayload,
  ): Promise<void> {
    if (comment.authorId === authorId) {
      return;
    }

    if (user.roles.includes(RoleName.ADMIN)) {
      return;
    }

    const issue = await this.prisma.issue.findUnique({
      where: { id: comment.issueId },
      select: { projectId: true },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: authorId, projectId: issue.projectId } },
      select: { role: true },
    });

    if (membership?.role === ProjectMemberRole.OWNER) {
      return;
    }

    throw new ForbiddenException(
      'Only the author, project owner, or an admin can modify this comment',
    );
  }

  private emitAssigned(
    issueId: number,
    projectId: number,
    assigneeId: number,
    previousAssigneeId: number | null,
    assignedById: number,
  ): void {
    const payload: IssueAssignedEvent = {
      issueId,
      projectId,
      assigneeId,
      previousAssigneeId,
      assignedById,
    };
    this.eventEmitter.emit(ISSUE_ASSIGNED_EVENT, payload);
  }

  private async assertProjectExists(projectId: number): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }
  }

  private async assertProjectMember(projectId: number, userId: number): Promise<void> {
    const membership = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
      select: { userId: true },
    });

    if (!membership) {
      throw new BadRequestException(`User ${userId} is not a member of this project`);
    }
  }

  private async findIssueOrThrow(id: number): Promise<IssueWithDetail> {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      include: issueDetailInclude,
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    return issue;
  }

  private async assertIssueInProjectById(issueId: number, projectId: number): Promise<void> {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
      select: { projectId: true },
    });

    if (!issue || issue.projectId !== projectId) {
      throw new NotFoundException('Issue not found');
    }
  }

  private assertIssueInProject(issue: Pick<IssueWithDetail, 'projectId'>, projectId: number): void {
    if (issue.projectId !== projectId) {
      throw new NotFoundException('Issue not found');
    }
  }

  private async findCommentOrThrow(commentId: number): Promise<CommentWithAuthor> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: commentInclude,
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  private assertCommentInIssue(comment: Pick<CommentWithAuthor, 'issueId'>, issueId: number): void {
    if (comment.issueId !== issueId) {
      throw new NotFoundException('Comment not found');
    }
  }

  private toIssueListItem(issue: IssueWithListCounts): IssueListItem {
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      priority: issue.priority,
      projectId: issue.projectId,
      reporterId: issue.reporterId,
      assigneeId: issue.assigneeId,
      dueDate: issue.dueDate,
      labels: issue.labels,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      commentCount: issue._count.comments,
      assignee: issue.assignee,
      reporter: issue.reporter,
    };
  }

  private toIssueDetail(issue: IssueWithDetail): IssueDetail {
    return {
      ...this.toIssueListItem(issue),
      comments: issue.comments.map((comment) => this.toCommentDetail(comment)),
    };
  }

  private toCommentDetail(comment: CommentWithAuthor): CommentDetail {
    return {
      id: comment.id,
      body: comment.body,
      authorId: comment.authorId,
      issueId: comment.issueId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: comment.author,
    };
  }
}
