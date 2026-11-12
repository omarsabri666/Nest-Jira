/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';

import { bearer, closeE2eApp, createE2eApp, login, register, resetDatabase } from './utils';

describe('Auth (e2e)', () => {
  let app: Awaited<ReturnType<typeof createE2eApp>>;
  beforeAll(async () => {
    app = await createE2eApp();
  });
  beforeEach(async () => resetDatabase(app));
  afterAll(async () => closeE2eApp(app));

  it('registers, rejects duplicates, authenticates me, rotates, and revokes refresh tokens', async () => {
    expect((await register(app, 'auth@example.com')).status).toBe(201);
    expect((await register(app, 'auth@example.com')).status).toBe(409);
    const tokens = await login(app, 'auth@example.com');
    await request(app.getHttpServer()).get('/auth/me').set(bearer(tokens.accessToken)).expect(200);
    await request(app.getHttpServer()).get('/auth/me').expect(401);
    const rotated = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: tokens.refreshToken })
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: tokens.refreshToken })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: rotated.body.data.refreshToken })
      .expect(200);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: rotated.body.data.refreshToken })
      .expect(401);
  });
});
