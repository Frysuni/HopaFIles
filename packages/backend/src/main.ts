import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { envConfig } from '@hopafiles/common';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { ExceptionsFilter } from '@system/apiException';
import appRegistrations from '@system/appRegistrations';
// import validationPipe from '@system/validationPipe';
import { resolve } from 'path';

void async function bootstrap() {

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await appRegistrations(app);

  if (envConfig.apiUrl.origin !== envConfig.baseUrl.origin) {
    app.enableCors({ credentials: true, origin: true });
  }
  if (envConfig.filesAutoRouting) {
    app.useStaticAssets({
      root: resolve(__dirname, '../', 'files'),
      prefix: '/files',
    });
  }

  app.enableShutdownHooks();

  app.useGlobalFilters(new ExceptionsFilter);
  // app.useGlobalPipes(validationPipe);
  app.setGlobalPrefix(envConfig.apiUrl.pathname);

  app.listen(envConfig.apiPort, envConfig.apiUrl.hostname);
}();