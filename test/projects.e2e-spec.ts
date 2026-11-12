/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';

import { bearer, closeE2eApp, createE2eApp, login, register, resetDatabase } from './utils';

describe('Projects (e2e)', () => {
  let app: Awaited<ReturnType<typeof createE2eApp>>;
  beforeAll(async () => {
    app = await createE2eApp();
  });
  beforeEach(async () => resetDatabase(app));
  afterAll(async () => closeE2eApp(app));

  it('makes the creator OWNER and protects member/project access', async () => {
    await register(app, 'owner@example.com');
    const owner = await login(app, 'owner@example.com');
    const created = await request(app.getHttpServer())
      .post('/projects')
      .set(bearer(owner.accessToken))
      .send({ name: 'Project', key: 'PRJ' })
      .expect(201);
    const projectId = created.body.data.id;
    expect(created.body.data.members[0].role).toBe('OWNER');
    await register(app, 'outsider@example.com');
    const outsider = await login(app, 'outsider@example.com');
    await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set(bearer(outsider.accessToken))
      .expect(404);
    await register(app, 'member@example.com');
    const member = await login(app, 'member@example.com');
    const memberUser = await request(app.getHttpServer())
      .get('/users/me/profile')
      .set(bearer(member.accessToken))
      .expect(200);
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/members`)
      .set(bearer(owner.accessToken))
      .send({ userId: memberUser.body.data.id })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set(bearer(member.accessToken))
      .send({ name: 'Nope' })
      .expect(403);
  });
});
