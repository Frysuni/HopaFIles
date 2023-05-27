import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { FastifyReply } from 'fastify/types/reply';

export type CookieType = string | undefined;
export type CookiesType = { [cookieName: string]: string | false; } | undefined
export const Cookies = createParamDecorator(
  (key: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest() as FastifyRequest;

    if (key) return unsignCookies(request, key);

    return unsignCookies(request);
  },
);

export function unsignCookies(request: FastifyRequest | FastifyReply): CookiesType
export function unsignCookies(request: FastifyRequest | FastifyReply, key: string): CookieType
export function unsignCookies(request: FastifyRequest | FastifyReply, key?: string) {
  if (!request.cookies) return undefined;

  if (key) {
    if (!request.cookies[key]) return undefined;
    const cookie = request.unsignCookie(request.cookies[key]);
    if (!cookie.valid) return undefined;
    return cookie.value;
  } else {
    const cookies: CookiesType = {};
    for (const cookieKey in request.cookies) cookies[cookieKey] = unsignCookies(request, cookieKey);
    return cookies;
  }
}