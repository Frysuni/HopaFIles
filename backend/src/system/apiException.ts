import { HttpException, HttpStatus } from '@nestjs/common';
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { FastifyReply } from 'fastify';

enum ApiErrorKeeper {
  'Unresolved Error',
  'ValidationPipe: Wrong DTO recived',
  'AuthGuard: Need authorization',
  'AuthGuard: Invalid JWT',
  'AuthGuard: Member not found',
  'AuthAvailable: Username or email is not specified',
  'AuthRegister: Invalid email activation code. (Or email not the same)',
  'AuthRegister: Invalid discord authorization token',
  'AuthLogin: Invalid usernameOrEmail or password',
  'AuthRefresh: Invalid refresh token',
  'AuthSetTotp: Invalid 2fa key',
  'AuthSetTotp: Invalid 2fa code',
  'DiscordAuthCallbackHandler: Invalid state token',
  'UsersCreate: Email/username/memberId conflict',
  'AssetsService: Wrong skin/cape input',
  'AssetsService: Unallowed HD skin/cape',
}

export class ApiException {
  public statusCode: number;
  public message: { code: number, description: string, errors?: string[] };
  constructor(
    statusCode: keyof typeof HttpStatus,
    errorCode: keyof typeof ApiErrorKeeper,
    validationErrors?: string[],
  ) {
    this.statusCode = HttpStatus[statusCode];
    this.message = { code: ApiErrorKeeper[errorCode], description: errorCode };
    if (validationErrors) this.message.errors = validationErrors;
  }
}

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  catch(exception: HttpException | ApiException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : exception instanceof ApiException
          ? exception.statusCode
          : HttpStatus.INTERNAL_SERVER_ERROR;

    function parseHttpExceptionResponse() {
      const httpExceptionResponse = (exception as HttpException).getResponse() as { statusCode: number, message: string };
      return new ApiException(HttpStatus[httpExceptionResponse.statusCode] as keyof typeof HttpStatus, 'Unresolved Error', [httpExceptionResponse.message]);
    }

    const message =
      exception instanceof HttpException
        ? parseHttpExceptionResponse().message
        : exception instanceof ApiException
          ? exception.message
          : new ApiException('INTERNAL_SERVER_ERROR', 'Unresolved Error').message;
    response
      .status(statusCode)
      .send(message);

    if (
      !(exception instanceof  ApiException) &&
      !(exception instanceof HttpException)
    ) console.log((exception as TypeError | Error).name);
  }
}