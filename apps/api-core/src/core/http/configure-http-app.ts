import { RequestMethod, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfig } from '../config/app-config';
import { apiReference } from '@scalar/nestjs-api-reference';

import * as packageInfo from '../../../package.json';

export const API_PREFIX = 'api';
export const API_DEFAULT_VERSION = '1';
export const SWAGGER_PATH = `${API_PREFIX}/documentation`;

export function configureHttpApp(app: NestExpressApplication): NestExpressApplication {
  const config = app.get(AppConfig);
  app.set('trust proxy', config.trustProxy);
  app.setGlobalPrefix(API_PREFIX, { exclude: [{ path: 'health', method: RequestMethod.GET }] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: API_DEFAULT_VERSION });

  if (config.swaggerEnabled || config.scalarEnabled) {
    const swaggerDocument = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Zaku API')
        .setVersion(packageInfo.version)
        .addBearerAuth()
        .build(),
    );

    if (config.swaggerEnabled) {
      SwaggerModule.setup(`${SWAGGER_PATH}/swagger`, app, swaggerDocument);
    }

    if (config.scalarEnabled) {
      app.use(
        `/${SWAGGER_PATH}/scalar`,
        apiReference({
          spec: {
            content: swaggerDocument,
          },
          theme: 'default',
        }),
      );
    }
  }

  return app;
}
