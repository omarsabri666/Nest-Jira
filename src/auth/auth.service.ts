import { InjectQueue } from '@nestjs/bullmq';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Queue } from 'bullmq';

import { HashingService } from './hashing.service';
import { TokenService } from './token.service';
import { PrismaService } from '../prisma/prisma.service';
import { MAIL_JOB_NAMES, MAIL_QUEUE } from '../queues/mail.queue';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
    @InjectQueue(MAIL_QUEUE) private readonly mailQueue: Queue,
  ) {}

  async register(email: string, password: string, name: string): Promise<AuthResult> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await this.hashingService.hash(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        roles: {
          create: {
            role: {
              connect: { name: 'USER' },
            },
          },
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const roles = user.roles.map((r) => r.role.name);

    const accessToken = await this.tokenService.signAccessToken({
      id: user.id,
      email: user.email,
      roles,
    });
    const refreshToken = await this.tokenService.signRefreshToken(user.id);

    await this.mailQueue.add(
      MAIL_JOB_NAMES.WELCOME,
      {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
      { jobId: `welcome-${user.id}` },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.hashingService.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = user.roles.map((r) => r.role.name);

    const accessToken = await this.tokenService.signAccessToken({
      id: user.id,
      email: user.email,
      roles,
    });
    const refreshToken = await this.tokenService.signRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return this.tokenService.rotateRefreshToken(refreshToken);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      roles: user.roles.map((r) => r.role.name),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
