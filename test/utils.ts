/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { getQueueToken } from '@nestjs/bullmq';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import type { Queue } from 'bullmq';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import { MAIL_QUEUE } from '../src/queues/mail.queue';
import { RedisService } from '../src/redis/redis.service';

export async function createE2eApp(): Promise<INestApplication<App>> {
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = module.createNestApplication<INestApplication<App>>();
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  await app.init();
  return app;
}

export async function resetDatabase(app: INestApplication): Promise<void> {
  const prisma = app.get(PrismaService);
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE notifications, comments, issues, project_members, projects, user_roles, role_permissions, permissions, roles, users RESTART IDENTITY CASCADE',
  );
  await prisma.role.createMany({ data: [{ name: 'ADMIN' }, { name: 'USER' }] });
  await prisma.permission.createMany({
    data: ['user:read', 'user:create', 'user:update', 'user:delete', 'project:create'].map(
      (name) => ({ name }),
    ),
  });
  const admin = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
  const permissions = await prisma.permission.findMany();
  await prisma.rolePermission.createMany({
    data: permissions.map((permission) => ({ roleId: admin.id, permissionId: permission.id })),
  });
  const adminUser = await prisma.user.create({
    data: {
      email: 'omar@example',
      password: await bcrypt.hash('Admin123!', 10),
      name: 'Admin User',
    },
  });
  await prisma.userRole.create({ data: { userId: adminUser.id, roleId: admin.id } });
}

export async function closeE2eApp(app: INestApplication): Promise<void> {
  const queue = app.get<Queue>(getQueueToken(MAIL_QUEUE));
  const redis = app.get(RedisService);

  await app.close();
  void queue.disconnect();
  redis.getClient().disconnect();
}

export async function register(app: INestApplication, email: string, name = 'Test User') {
  const response = await request(app.getHttpServer()).post('/auth/register').send({
    email,
    password: 'Password123!',
    name,
  });
  return response;
}

export async function login(app: INestApplication, email: string, password = 'Password123!') {
  const response = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
  return response.body.data;
}

export function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}
