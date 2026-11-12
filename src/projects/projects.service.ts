import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectMemberRole } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  projectDetailInclude,
  projectListInclude,
  type ProjectDetail,
  type ProjectListItem,
  type ProjectWithDetail,
  type ProjectWithListCounts,
} from './projects.types';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateProjectDto): Promise<ProjectDetail> {
    const key = dto.key.toUpperCase();
    await this.assertKeyAvailable(key);

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        key,
        description: dto.description,
        ownerId: userId,
        members: {
          create: { userId, role: ProjectMemberRole.OWNER },
        },
      },
      include: projectDetailInclude,
    });

    return this.toProjectDetail(project);
  }

  async findAll(
    userId: number,
    query: ProjectQueryDto,
    isAdmin: boolean,
  ): Promise<{
    items: ProjectListItem[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.ProjectWhereInput = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { key: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (!isAdmin) {
      where.members = { some: { userId } };
    }

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        include: projectListInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items: projects.map((project) => this.toProjectListItem(project)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number): Promise<ProjectDetail> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: projectDetailInclude,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.toProjectDetail(project);
  }

  async update(id: number, dto: UpdateProjectDto): Promise<ProjectDetail> {
    const existing = await this.prisma.project.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Project not found');
    }

    const data: Prisma.ProjectUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.key !== undefined) {
      const key = dto.key.toUpperCase();
      if (key !== existing.key) {
        await this.assertKeyAvailable(key);
      }
      data.key = key;
    }

    const project = await this.prisma.project.update({
      where: { id },
      data,
      include: projectDetailInclude,
    });

    return this.toProjectDetail(project);
  }

  async remove(id: number): Promise<{ id: number }> {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.project.delete({ where: { id } });

    return { id };
  }

  async addMember(projectId: number, dto: AddMemberDto) {
    await this.assertProjectExists(projectId);

    if (!dto.userId && !dto.email) {
      throw new BadRequestException('Either userId or email is required');
    }

    if (dto.userId && dto.email) {
      throw new BadRequestException('Provide either userId or email, not both');
    }

    let userId = dto.userId;
    if (!userId) {
      const user = await this.prisma.user.findUnique({ where: { email: dto.email! } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      userId = user.id;
    } else {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    const existing = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: userId, projectId } },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this project');
    }

    return this.prisma.projectMember.create({
      data: { userId: userId, projectId, role: dto.role ?? ProjectMemberRole.MEMBER },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async updateMemberRole(projectId: number, userId: number, role: ProjectMemberRole) {
    const membership = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this project');
    }

    if (membership.role === ProjectMemberRole.OWNER && role !== ProjectMemberRole.OWNER) {
      await this.assertNotLastOwner(projectId, userId);
    }

    return this.prisma.projectMember.update({
      where: { userId_projectId: { userId, projectId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async removeMember(projectId: number, userId: number, currentUserId: number) {
    const membership = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this project');
    }

    if (userId === currentUserId && membership.role === ProjectMemberRole.OWNER) {
      throw new BadRequestException('Cannot remove yourself from a project you own');
    }

    if (membership.role === ProjectMemberRole.OWNER) {
      await this.assertNotLastOwner(projectId, userId);
    }

    await this.prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId } },
    });

    return { projectId, userId };
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

  private async assertKeyAvailable(key: string): Promise<void> {
    const existing = await this.prisma.project.findUnique({
      where: { key },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Project key already in use');
    }
  }

  private async assertNotLastOwner(projectId: number, excludedUserId: number): Promise<void> {
    const ownerCount = await this.prisma.projectMember.count({
      where: {
        projectId,
        role: ProjectMemberRole.OWNER,
        userId: { not: excludedUserId },
      },
    });

    if (ownerCount === 0) {
      throw new BadRequestException('Cannot remove or demote the last owner of the project');
    }
  }

  private toProjectListItem(project: ProjectWithListCounts): ProjectListItem {
    return {
      id: project.id,
      name: project.name,
      key: project.key,
      description: project.description,
      ownerId: project.ownerId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      memberCount: project._count.members,
      issueCount: project._count.issues,
    };
  }

  private toProjectDetail(project: ProjectWithDetail): ProjectDetail {
    return {
      ...this.toProjectListItem(project),
      members: project.members.map((member) => ({
        userId: member.userId,
        role: member.role,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt,
        user: member.user,
      })),
    };
  }
}
