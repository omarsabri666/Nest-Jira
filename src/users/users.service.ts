import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoleName } from '@prisma/client';

import { HashingService } from '../auth/hashing.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import type { PublicUser, UserWithRoles } from './users.types';

const userInclude = { roles: { include: { role: true } } } satisfies Prisma.UserInclude;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashingService: HashingService,
  ) {}

  async findAll(query: UserQueryDto): Promise<{
    items: PublicUser[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.UserWhereInput = {};
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: userInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users.map((user) => this.toPublicUser(user)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: userInclude,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicUser(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: number, dto: UpdateUserDto): Promise<PublicUser> {
    const existing = await this.prisma.user.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const data: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.email !== undefined) {
      if (dto.email !== existing.email) {
        const emailTaken = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (emailTaken) {
          throw new ConflictException('Email already in use');
        }
      }
      data.email = dto.email;
    }

    if (dto.password !== undefined) {
      data.password = await this.hashingService.hash(dto.password);
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: userInclude,
    });

    return this.toPublicUser(user);
  }

  async updateRoles(userId: number, roleIds: number[]): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: userInclude,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roles = await this.prisma.role.findMany({ where: { id: { in: roleIds } } });

    if (roles.length !== new Set(roleIds).size) {
      throw new NotFoundException('One or more roles not found');
    }

    const wasAdmin = user.roles.some(({ role }) => role.name === RoleName.ADMIN);
    const staysAdmin = roles.some((role) => role.name === RoleName.ADMIN);
    if (wasAdmin && !staysAdmin) {
      await this.assertNotLastAdmin();
    }

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      this.prisma.userRole.createMany({
        data: [...new Set(roleIds)].map((roleId) => ({ userId, roleId })),
      }),
    ]);

    const updated = await this.prisma.user.findUnique({
      where: { id: userId },
      include: userInclude,
    });

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return this.toPublicUser(updated);
  }

  async remove(id: number, currentUserId: number): Promise<{ id: number }> {
    if (id === currentUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: userInclude,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = user.roles.some(({ role }) => role.name === RoleName.ADMIN);
    if (isAdmin) {
      await this.assertNotLastAdmin();
    }

    await this.prisma.user.delete({ where: { id } });

    return { id };
  }

  private async assertNotLastAdmin(): Promise<void> {
    const adminCount = await this.prisma.userRole.count({
      where: { role: { name: RoleName.ADMIN } },
    });

    if (adminCount <= 1) {
      throw new BadRequestException('Cannot delete or demote the last admin');
    }
  }

  private toPublicUser(user: UserWithRoles): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      roles: user.roles.map(({ role }) => role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
