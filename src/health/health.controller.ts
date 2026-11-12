import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import Redis from 'ioredis';

import { Public } from '../auth/decorators/public.decorator';
import { ApiEnvelopeResponse } from '../common/swagger/api-response.swagger';
import { PrismaService } from '../prisma/prisma.service';
import { HealthCheckResultDto } from './dto/health-check-result.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private redis: Redis | null = null;

  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const redisHost = this.configService.get<string>('redis.host');
    const redisPort = this.configService.get<number>('redis.port');

    if (redisHost && redisPort) {
      this.redis = new Redis({
        host: redisHost,
        port: redisPort,
        lazyConnect: true,
        connectTimeout: 5000,
        maxRetriesPerRequest: 1,
      });
    }
  }

  @Get()
  @Public()
  @HealthCheck()
  @ApiOperation({ summary: 'Check the health of the application' })
  @ApiEnvelopeResponse(HealthCheckResultDto)
  async check(): Promise<HealthCheckResult> {
    return this.health.check([() => this.checkDatabase(), () => this.checkRedis()]);
  }

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      // Simple query to check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        database: {
          status: 'up',
        },
      };
    } catch (error) {
      return {
        database: {
          status: 'down',
          message: error instanceof Error ? error.message : 'Database connection failed',
        },
      };
    }
  }

  private async checkRedis(): Promise<HealthIndicatorResult> {
    if (!this.redis) {
      return {
        redis: {
          status: 'up',
          message: 'Redis not configured',
        },
      };
    }

    try {
      await this.redis.ping();
      return {
        redis: {
          status: 'up',
        },
      };
    } catch (error) {
      return {
        redis: {
          status: 'down',
          message: error instanceof Error ? error.message : 'Redis connection failed',
        },
      };
    }
  }
}
