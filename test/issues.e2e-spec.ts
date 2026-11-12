/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';

import { bearer, closeE2eApp, createE2eApp, login, register, resetDatabase } from './utils';

describe('Issues (e2e)', () => {
  let app: Awaited<ReturnType<typeof createE2eApp>>;
  beforeAll(async () => {
    app = await createE2eApp();
  });
  beforeEach(async () => resetDatabase(app));
  afterAll(async () => closeE2eApp(app));

  it('supports issue creation, cached listing, transition, comment, and delete', async () => {
    await register(app, 'reporter@example.com');
    const reporter = await login(app, 'reporter@example.com');
    const project = await request(app.getHttpServer())
      .post('/projects')
      .set(bearer(reporter.accessToken))
      .send({ name: 'Issues', key: 'ISS' })
      .expect(201);
    const projectId = project.body.data.id;
    const issue = await request(app.getHttpServer())
      .post(`/projects/${projectId}/issues`)
      .set(bearer(reporter.accessToken))
      .send({ title: 'First issue', labels: ['test'] })
      .expect(201);
    const issueId = issue.body.data.id;
    await request(app.getHttpServer())
      .get(`/projects/${projectId}/issues`)
      .set(bearer(reporter.accessToken))
      .expect(200);
    await request(app.getHttpServer())
      .get(`/projects/${projectId}/issues`)
      .set(bearer(reporter.accessToken))
      .expect(200);
    await request(app.getHttpServer())
      .post(`/projects/${projectId}/issues/${issueId}/status`)
      .set(bearer(reporter.accessToken))
      .send({ status: 'IN_PROGRESS' })
      .expect(201);
    const comment = await request(app.getHttpServer())
      .post(`/projects/${projectId}/issues/${issueId}/comments`)
      .set(bearer(reporter.accessToken))
      .send({ body: 'Investigating' })
      .expect(201);
    await request(app.getHttpServer())
      .delete(`/projects/${projectId}/issues/${issueId}/comments/${comment.body.data.id}`)
      .set(bearer(reporter.accessToken))
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/projects/${projectId}/issues/${issueId}`)
      .set(bearer(reporter.accessToken))
      .expect(200);
  });
});
