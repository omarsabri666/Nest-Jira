import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';

import { AppModule } from './app.module';
import * as pkg from '../package.json';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

function setupSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('nodeEnv');
  const swaggerEnabled = configService.get<boolean>('swagger.enabled');
  const swaggerPath = configService.get<string>('swagger.path') ?? 'api/docs';

  // Only serve Swagger when explicitly enabled or outside production
  if (!swaggerEnabled && nodeEnv === 'production') {
    return;
  }

  const documentConfig = new DocumentBuilder()
    .setTitle('NestJS Production API')
    .setDescription(
      'Production-ready NestJS API featuring JWT authentication, role-based access control, projects and issue tracking.',
    )
    .setVersion(pkg.version)
    .setContact('NestJS Production API', '', '')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth()
    .addTag('Health', 'Health checks')
    .addTag('Auth', 'Authentication and token management')
    .addTag('Users', 'User management')
    .addTag('Projects', 'Project management')
    .addTag('Issues', 'Issue tracking')
    .build();

  const document = SwaggerModule.createDocument(app, documentConfig, {
    operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      operationsSorter: 'alpha',
    },
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use Pino logger
  const logger = app.get(Logger);
  app.useLogger(logger);

  // Enable automatic error logging
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  // Use transform interceptor for consistent response envelope
  app.useGlobalInterceptors(new TransformInterceptor());

  // Use global exception filter
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));

  // Use global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      transform: true, // Transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Set up Swagger / OpenAPI documentation
  setupSwagger(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);
}
void bootstrap();
