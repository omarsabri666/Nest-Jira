/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import request from 'supertest';

import { closeE2eApp, createE2eApp } from './utils';

describe('Health (e2e)', () => {
  let app: Awaited<ReturnType<typeof createE2eApp>>;

  beforeAll(async () => {
    app = await createE2eApp();
  });
  afterAll(async () => closeE2eApp(app));

  it('reports an ok health status', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
  });
});
