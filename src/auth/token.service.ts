import { randomUUID } from 'crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { HashingService } from './hashing.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly hashingService: HashingService,
    private readonly prisma: PrismaService,
  ) {}

  async signAccessToken(user: { id: number; email: string; roles: string[] }): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.accessSecret')!,
      expiresIn: this.configService.get<string>(
        'jwt.accessExpiresIn',
      )! as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });
  }

  async signRefreshToken(userId: number): Promise<string> {
    const tokenId = randomUUID();
    const payload = {
      sub: userId,
      jti: tokenId,
      type: 'refresh',
    };

    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret')!,
      expiresIn: this.configService.get<string>(
        'jwt.refreshExpiresIn',
      )! as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    // Store hashed refresh token in Redis
    const hashedToken = await this.hashingService.hash(token);
    const refreshExpiresIn = this.parseExpiresIn(
      this.configService.get<string>('jwt.refreshExpiresIn') ?? '7d',
    );

    const key = `refresh:${userId}:${tokenId}`;
    await this.redisService.set(key, hashedToken, refreshExpiresIn);

    return token;
  }

  async rotateRefreshToken(oldRefreshToken: string): Promise<TokenPair> {
    let payload: { sub: number; jti: string; type: string };

    try {
      payload = await this.jwtService.verifyAsync(oldRefreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret')!,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const key = `refresh:${payload.sub}:${payload.jti}`;
    const storedHash = await this.redisService.get(key);

    if (!storedHash) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    const isValid = await this.hashingService.compare(oldRefreshToken, storedHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Delete old refresh token (rotation)
    await this.redisService.del(key);

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        isActive: true,
        roles: { select: { role: { select: { name: true } } } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Issue new tokens
    const accessToken = await this.signAccessToken({
      id: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.role.name),
    });
    const refreshToken = await this.signRefreshToken(payload.sub);

    return { accessToken, refreshToken };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    let payload: { sub: number; jti: string; type: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret')!,
      });
    } catch {
      // If token is invalid, nothing to revoke
      return;
    }

    if (payload.type !== 'refresh') {
      return;
    }

    const key = `refresh:${payload.sub}:${payload.jti}`;
    await this.redisService.del(key);
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 604800; // Default 7 days in seconds
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    ``;

    return value * (multipliers[unit] ?? 86400);
  }
}
