import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ApiErrors } from '@hopafiles/common';

export class ApiException {
  public statusCode: number;
  public message: { code: number, description: string, errors?: string[] };
  constructor(
    statusCode: keyof typeof HttpStatus,
    errorCode: keyof typeof ApiErrors,
    validationErrors?: string[],
  ) {
    this.statusCode = HttpStatus[statusCode];
    this.message = { code: ApiErrors[errorCode], description: errorCode };
    if (validationErrors) this.message.errors = validationErrors;
  }
}

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  private readonly errorLogger = new Logger('ExceptionsFilter');

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
    ) {
      const error = (exception as TypeError | Error);
      this.errorLogger.error(`${error.name}\n${error.message}`, error.stack);
    }
  }
}