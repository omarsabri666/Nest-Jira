import request from 'supertest';

import { closeE2eApp, createE2eApp } from './utils';

describe('AppController (e2e)', () => {
  let app: Awaited<ReturnType<typeof createE2eApp>>;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  it('/ (GET) is protected by the global auth guard', () => {
    return request(app.getHttpServer()).get('/').expect(401);
  });

  afterEach(async () => {
    await closeE2eApp(app);
  });
});
