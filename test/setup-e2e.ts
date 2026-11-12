import 'dotenv/config';

import { execFileSync } from 'node:child_process';

if (process.env['NODE_ENV'] !== 'test') {
  process.env['NODE_ENV'] = 'test';
}

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error('E2E tests require DATABASE_URL. Use a dedicated *_test database.');
}

const databaseName = new URL(databaseUrl).pathname.slice(1).split('?')[0];
if (!databaseName.endsWith('_test')) {
  throw new Error(
    `E2E tests refuse to run against database "${databaseName}". Use a *_test database.`,
  );
}

execFileSync('npx', ['prisma', 'migrate', 'deploy'], { stdio: 'inherit' });
