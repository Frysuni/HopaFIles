import { Injectable, Logger, NestMiddleware, RequestMethod } from "@nestjs/common";
import { FastifyRequest, FastifyReply } from "fastify";

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  private readonly apiConsoleLogger: Logger = new Logger('API');

  private blacklistEndpoints: string[] = ['/ping', '/files'];

  use(request: FastifyRequest['raw'], response: FastifyReply['raw'], next: () => void): void {
    // if (!enabled) return next();

    const startTime = process.hrtime.bigint();

    next();

    if (request.method === RequestMethod[RequestMethod.OPTIONS]) return;
    for (const blacklistEndpoint in this.blacklistEndpoints) {
      if (request.url?.includes(blacklistEndpoint)) return;
    }

    response.on('close', () => {
      const { method, url, socket: { remoteAddress } } = request;
      this.apiConsoleLogger.log(`${method} ${url} ${response.statusCode} - ${remoteAddress} - ${calcDiff(startTime)}ms`);
    });
  }
}

function calcDiff(start: bigint): string {
  const time = process.hrtime.bigint() - start;
  const milliseconds = Number(time) / 1_000_000;
  return milliseconds.toFixed(2);
}
