import { Injectable, Logger } from '@nestjs/common';

import { MailService, type MailMessage } from './mail.service';

@Injectable()
export class MockMailService implements MailService {
  private readonly logger = new Logger(MockMailService.name);

  send(message: MailMessage): Promise<void> {
    this.logger.log(
      `[MOCK EMAIL] to=${message.to} subject="${message.subject}" body="${message.text}"`,
    );
    return Promise.resolve();
  }
}
