import { Module } from '@nestjs/common';

import { IssueListener } from './issue.listener';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';

@Module({
  controllers: [IssuesController],
  providers: [IssuesService, IssueListener],
  exports: [IssuesService],
})
export class IssuesModule {}
