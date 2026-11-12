import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { MAIL_QUEUE } from './mail.queue';
import { MailModule } from '../mail/mail.module';
import { MailProcessor } from './processors/mail.processor';
import { DueDateScheduler } from './schedulers/due-date.scheduler';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        forceDisconnectOnShutdown: true,
        connection: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password'),
        },
        defaultJobOptions: {
          attempts: configService.get<number>('bull.attempts'),
          backoff: {
            type: 'exponential',
            delay: configService.get<number>('bull.backoffDelay'),
          },
          removeOnComplete: configService.get<number>('bull.removeOnComplete'),
          removeOnFail: configService.get<number>('bull.removeOnFail'),
        },
      }),
    }),
    BullModule.registerQueue({ name: MAIL_QUEUE }),
    MailModule,
  ],
  providers: [MailProcessor, DueDateScheduler],
  exports: [BullModule],
})
export class QueuesModule {}
