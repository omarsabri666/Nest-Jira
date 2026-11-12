import { Injectable } from '@nestjs/common';

import * as pkg from '../package.json';

@Injectable()
export class AppService {
  getAppInfo() {
    return {
      name: pkg.name,
      version: pkg.version,
      status: 'ok',
    };
  }
}
