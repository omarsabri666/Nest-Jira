/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';

import { bearer, closeE2eApp, createE2eApp, login, register, resetDatabase } from './utils';

describe('RBAC (e2e)', () => {
  let app: Awaited<ReturnType<typeof createE2eApp>>;
  beforeAll(async () => {
    app = await createE2eApp();
  });
  beforeEach(async () => resetDatabase(app));
  afterAll(async () => closeE2eApp(app));

  it('denies USER and allows ADMIN to list users', async () => {
    await register(app, 'rbac@example.com');
    const user = await login(app, 'rbac@example.com');
    await request(app.getHttpServer()).get('/users').set(bearer(user.accessToken)).expect(403);
    const admin = await login(app, 'omar@example', 'Admin123!');
    await request(app.getHttpServer()).get('/users').set(bearer(admin.accessToken)).expect(200);
  });
});
