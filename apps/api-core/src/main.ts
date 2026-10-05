import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppConfig } from '@core/config/app-config';
import { configureHttpApp } from '@core/http/configure-http-app';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureHttpApp(app);
  app.enableShutdownHooks();

  const { httpPort } = app.get(AppConfig);
  await app.listen(httpPort);
  Logger.log(`API listening on port ${httpPort}`, 'Bootstrap');
}

void bootstrap();
