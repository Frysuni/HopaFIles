import { CallHandler, ConsoleLogger, ExecutionContext, HttpStatus, Injectable, Logger, NestInterceptor, NestMiddleware } from "@nestjs/common";
import { unsignCookies } from "@system/cookies.decorator";
import { FastifyRequest, FastifyReply } from "fastify";
import { appendFile, createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Observable, tap } from "rxjs";
import { stringify as toYAML } from 'yaml';
import { createGzip } from 'node:zlib';
import envConfig from "@env";

type LogType = 'errors' | 'requests' | 'briefly';

const raw = (envConfig.logger ?? '').toUpperCase().replace(/ /g, '').split('.');
const loggerRaw = {
  briefly: raw.find(value => value.includes('B')),
  errors: raw.find(value => value.includes('E')),
  requests: raw.find(value => value.includes('R')),
  nest: raw.find(value => value.includes('N')),
};

void function validate() {
  function crash(code: number) {
    setImmediate(process.exit);
    throw `Logger settings error ${code}`;
  }

  const anyTypeIsEnabled = !!loggerRaw.briefly || !!loggerRaw.errors || !!loggerRaw.requests;
  const inputNotEmpty = raw[0] !== '';

  if (
    (anyTypeIsEnabled && !inputNotEmpty) ||
    (!anyTypeIsEnabled && inputNotEmpty)
  ) crash(0);

  if (raw.length > 4) crash(1);

  if (raw.find(value => value.length > 5)) crash(2);
  if (raw.find(value => value.length == 1)) crash(3);
}();

const loggerSettings = {
  enabled: raw[0] !== '',

  briefly: {
    enabled: loggerRaw.briefly?.includes('D') ? !!loggerRaw.briefly && envConfig.debug : !!loggerRaw.briefly,
    args: {
      console: loggerRaw.briefly?.includes('C') ?? false,
      file: loggerRaw.briefly?.includes('F') ?? false,
      archive: loggerRaw.briefly?.includes('A') ?? false,
    },
  },
  errors: {
    enabled: loggerRaw.errors?.includes('D') ? !!loggerRaw.errors && envConfig.debug : !!loggerRaw.errors,
    args: {
      console: loggerRaw.errors?.includes('C') ?? false,
      file: loggerRaw.errors?.includes('F') ?? false,
      archive: loggerRaw.errors?.includes('A') ?? false,
    },
  },
  requests: {
    enabled: loggerRaw.requests?.includes('D') ? !!loggerRaw.requests && envConfig.debug : !!loggerRaw.requests,
    args: {
      file: loggerRaw.requests?.includes('F') ?? false,
      archive: loggerRaw.requests?.includes('A') ?? false,
    },
  },
  nest: {
    enabled: loggerRaw.nest?.includes('D') ? !!loggerRaw.nest && envConfig.debug : !!loggerRaw.nest,
    args: {
      console: loggerRaw.errors?.includes('C') ?? false,
    },
  },
};


@Injectable()
export class LoggerService {
  private readonly apiConsoleLogger: Logger = new Logger('BRIEFLY');
  private readonly logsDir: string[] = [__dirname, '../', '../', 'logs'];
  private startDay: number = new Date().getDate();

  constructor() {
    const logsDir = this.logsDir;
    function checkDir(type: LogType | '') {
      const dir = resolve(...logsDir, type);
      if (!existsSync(dir)) {
        mkdirSync(dir);
      }
    }

    if (loggerSettings.enabled) checkDir('');
    if (loggerSettings.briefly.enabled) checkDir('briefly');
    if (loggerSettings.errors.enabled) checkDir('errors');
    if (loggerSettings.requests.enabled) checkDir('requests');

    this.packLogs();
  }

  private packLogs(type?: LogType) {
    if (!type) {
      if (loggerSettings.briefly.args.archive)  this.packLogs('briefly');
      if (loggerSettings.errors.args.archive)   this.packLogs('errors');
      if (loggerSettings.requests.args.archive) this.packLogs('requests');
      return;
    }

    const dir = resolve(...this.logsDir, type);
    const files = readdirSync(dir);
    const date = new Date().toLocaleDateString();
    const extension = type === 'requests' ? '.yaml' : '.log';

    files.forEach(fileName => {
      if (fileName.includes(date)) return;
      if (fileName.includes('.gz')) return;
      if (!fileName.includes(extension)) return;

      const filePath = resolve(...this.logsDir, type, fileName);

      createReadStream(filePath)
        .pipe(createGzip({ level: 5 }))
        .pipe(createWriteStream(filePath + '.gz'))
        .once('close', () => rmSync(filePath));
    });
  }

  private getLogFile(type: LogType) {
    const extension = type === 'requests' ? '.yaml' : '.log';
    return resolve(
      ...this.logsDir,
      type,
      new Date().toLocaleDateString() + extension,
    );
  }

  private writeLogToFile(type: LogType, data: string) {
    const file = this.getLogFile(type);
    if (!existsSync(file)) {
      if (this.startDay !== new Date().getDate()) {
        this.startDay = new Date().getDate();
        this.packLogs();
      }
      writeFileSync(file, `#===# ${new Date().toLocaleDateString()} #===#\n`);
    }

    const date = new Date().toLocaleTimeString();
    const delimeter = type !== 'briefly' ? `\n#--# ${date} #--#\n` : date + '  ';

    appendFile(file, delimeter + data + '\n', () => { });
  }

  public logBriefly(data: string) {
    if (loggerSettings.briefly.args.console) this.apiConsoleLogger.log(data);
    if (loggerSettings.briefly.args.file)    this.writeLogToFile('briefly', data);
  }

  public logRequest(data: string) {
    if (loggerSettings.requests.args.file) this.writeLogToFile('requests', data);
  }

}

export class NestCoreLogger extends ConsoleLogger {
  log(message: any, context?: string): void;
  log(message: any, ...optionalParams: [...any, string?]): void;
  log(message: unknown, context?: unknown, ...rest: unknown[]): void {
    if (!this.isLogEnabled(context)) return;
    super.log(message, context, ...rest);
  }

  error(message: any, stack?: string, context?: string): void;
  error(message: any, ...optionalParams: [...any, string?, string?]): void;
  error(message: unknown, stack?: unknown, context?: unknown, ...rest: unknown[]): void {
    if (!this.isLogEnabled(context)) return;
    super.error(message, stack, context, ...rest);
  }

  debug(message: any, context?: string): void;
  debug(message: any, ...optionalParams: [...any, string?]): void;
  debug(message: unknown, context?: unknown, ...rest: unknown[]): void {
    if (!this.isLogEnabled(context)) return;
    super.debug(message, context, ...rest);
  }

  verbose(message: any, context?: string): void;
  verbose(message: any, ...optionalParams: [...any, string?]): void;
  verbose(message: unknown, context?: unknown, ...rest: unknown[]): void {
    if (!this.isLogEnabled(context)) return;
    super.verbose(message, context, ...rest);
  }

  warn(message: any, context?: string): void;
  warn(message: any, ...optionalParams: [...any, string?]): void;
  warn(message: unknown, context?: unknown, ...rest: unknown[]): void {
    if (!this.isLogEnabled(context)) return;
    super.warn(message, context, ...rest);
  }

  isLogEnabled(context?: unknown) {
    if (context == 'BRIEFLY') return true;
    if (!loggerSettings.nest.enabled) return false;
    if (!loggerSettings.nest.args.console) return false;
    return true;
  }
}

@Injectable()
export class AppLoggerMiddleware implements NestMiddleware {
  constructor(
    private readonly loggerService: LoggerService,
  ) {}

  private blacklistEndpoints: string[] = ['/ping', '/assets'];

  use(request: FastifyRequest['raw'], response: FastifyReply['raw'], next: () => void): void {
    if (!loggerSettings.briefly.enabled) return next();

    const startTime = process.hrtime.bigint();

    next();

    if (request.method == 'OPTIONS') return;
    if (this.blacklistEndpoints.includes(request.url)) return;
    if (request.url.startsWith('/assets/')) return;

    response.on('close', () => {
      const { method, url, socket: { remoteAddress } } = request;
      this.loggerService.logBriefly(`${method} ${url} ${response.statusCode} - ${remoteAddress} - ${calcDiff(startTime)}ms`);
    });
  }
}

function calcDiff(start: bigint): string {
  const time = process.hrtime.bigint() - start;
  const milliseconds = Number(time) / 1_000_000;
  return milliseconds.toFixed(2);
}

@Injectable()
export class LoggingInterceptor<T> implements NestInterceptor<T, T> {
  constructor(
    private readonly loggerService: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<T> {
    if (!loggerSettings.requests.enabled) return next.handle();

    const startTime = process.hrtime.bigint();

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<FastifyRequest>();
    const response = httpContext.getResponse<FastifyReply>();

    let value: any;

    response.raw.on('close', async () => {
      const logString = parseToString(request, response, value, startTime);
      this.loggerService.logRequest(logString);
    });

    return next.handle().pipe(tap((v) => value = v));
  }
}

function parseToString(req: FastifyRequest, res: FastifyReply, value: any, startTime: bigint) {

  const logObject = {
    ID: req.id,
    TIME: {
      UTC: new Date().toISOString(),
      RESPONSE_TIME: (Number(process.hrtime.bigint() - startTime) / 1_000_000).toFixed(2) + 'ms',
    },
    REQUEST: {
      IP: req.ip,
      METHOD: req.method,
      PROTOCOL: req.protocol,
      HOSTNAME: req.hostname,
      PATH: req.url.split('?')[0],
      QUERY: req.query,
      URL: `${req.protocol}://${req.hostname}${req.url}`,
      PARAMS: req.params,
      BODY: req.body,
      COOKIES: req.cookies,
      UNSIGNED_COOKIES: unsignCookies(req),
      HEADERS: req.headers,
    },
    RESPONSE: {
      STATUS: res.statusCode.toString(),
      STATUS_TEXT: HttpStatus[res.statusCode],
      DATA: value,
      DATA_TYPE: typeof value,
      COOKIES: res.cookies,
      UNSIGNED_COOKIES: unsignCookies(res),
      HEADERS: res.getHeaders(),
    },
  };

  return toYAML(logObject);
}
