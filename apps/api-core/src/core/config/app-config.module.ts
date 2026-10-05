import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfig } from './app-config';
import { RuntimeEnvironment } from './environment-variables';
import { validateEnvironment } from './validate-environment';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ ignoreEnvFile: process.env.NODE_ENV === RuntimeEnvironment.Test })],
  providers: [
    {
      provide: AppConfig,
      useFactory: (): AppConfig => AppConfig.fromEnvironment(validateEnvironment(process.env)),
    },
  ],
  exports: [AppConfig],
})
export class AppConfigModule {}
