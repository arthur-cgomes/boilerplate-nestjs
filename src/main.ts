import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { version } from '../package.json';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const isProduction = configService.get('NODE_ENV') === 'production';

  if (isProduction) {
    app.use(helmet());
  } else {
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
      }),
    );
  }
  app.use(compression());

  const corsOrigins = configService.get<string>('CORS_ORIGINS') || '*';
  app.enableCors({
    origin: corsOrigins === '*' ? '*' : corsOrigins.split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: corsOrigins !== '*',
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const options = new DocumentBuilder()
    .setTitle(`Projeto Boilerplate - ${configService.get('NODE_ENV')}`)
    .setDescription('Back-end do Projeto Boilerplate')
    .setVersion(version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Endpoints de autenticacao')
    .addTag('User', 'Endpoints de usuario')
    .addTag('Health Check', 'Endpoints de health check')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const PORT = configService.get<number>('PORT') || 3000;
  const HOST = configService.get<string>('HOST') || '0.0.0.0';

  app.enableShutdownHooks();

  await app.listen(PORT, HOST);

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  logger.log(
    `Application is running in ${configService.get('NODE_ENV')} mode on: http://${HOST}:${PORT}`,
    'Bootstrap',
  );
  logger.log(
    `Swagger documentation available at: http://${HOST}:${PORT}/api`,
    'Bootstrap',
  );
}

bootstrap();
