import { NestFactory } from '@nestjs/core';
import { AppModule } from './api/app.module';
import envConfig from '@env';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { ExceptionsFilter } from '@system/apiException';
import appRegistrations from '@system/appRegistrations';
import validationPipe from '@system/validationPipe';
import { resolve } from 'path';
import { NestCoreLogger } from './api/logger.service';

void async function bootstrap() {

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: new NestCoreLogger,
      bufferLogs: true,
    },
  );

  await appRegistrations(app);

  if (envConfig.apiUrl.origin !== envConfig.baseUrl.origin) {
    app.enableCors({ credentials: true, origin: true });
  }
  if (envConfig.assetsAutoRouting) {
    app.useStaticAssets({
      root: resolve(__dirname, '../', 'assets'),
      prefix: '/assets',
    });
  }

  app.enableShutdownHooks();

  app.useGlobalFilters(new ExceptionsFilter);
  app.useGlobalPipes(validationPipe);
  app.setGlobalPrefix(envConfig.apiUrl.pathname);

  return app.listen(envConfig.port, envConfig.apiUrl.hostname);
}();