import envConfig from "@env";
import { fastifyCookie, CookieSerializeOptions } from "@fastify/cookie";
import fastifyCsrfProtection from "@fastify/csrf-protection";
import fastifyHelmet from "@fastify/helmet";
import { NestFastifyApplication } from "@nestjs/platform-fastify/interfaces/nest-fastify-application.interface";
import secrets from "./secrets";

export default function(app: NestFastifyApplication): Promise<any> {
  const parseOptions: CookieSerializeOptions = {
      secure: envConfig.apiUrl.protocol === 'https:',
      domain: envConfig.apiUrl.hostname,
      httpOnly: true,
      sameSite: true,
      path: '/auth',
      signed: true,
  };
  return Promise.all([
    app.register(fastifyCookie, {
      hook: 'onRequest',
      secret: secrets.cookiesSignature,
      prefix: envConfig.apiUrl.protocol === 'https:' ? '__Secure-' : undefined,
      parseOptions,
    }),

    app.register(fastifyCsrfProtection, {
      cookieOpts: parseOptions,
      cookieKey: '_csrf',
      // Ждем фикс
      sessionPlugin: '@fastify/cookie' as '@fastify/secure-session',
    }),

    app.register(fastifyHelmet, {
      global: true,
      hidePoweredBy: true,
    }),

  ]);
}