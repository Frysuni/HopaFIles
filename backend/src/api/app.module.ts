import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { DiscordModule } from './discord/discord.module';
import { AppLoggerMiddleware, LoggerService, LoggingInterceptor } from './logger.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import envConfig from '@env';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    EmailModule,
    DiscordModule,
    TypeOrmModule.forRoot(envConfig.database),
  ],
  providers: [
    LoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}
