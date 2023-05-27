import { All, Controller, HttpStatus, HttpCode, Get, Res, UnauthorizedException } from '@nestjs/common';
import { ApiException } from '@system/apiException';
import { Cookies, CookiesType, CookieType } from '@system/cookies.decorator';
import { R } from '@system/response.decorator';
import { FastifyReply } from 'fastify';

@Controller()
export class AppController {
  @All()
  @HttpCode(HttpStatus.I_AM_A_TEAPOT)
  goAhead() {
    return 'Не, через интерфейс будет проще, это я тебе как инженер говорю.';
  }

  @Get('closed')
  async closedMethod() {
    return 'Ура победа';
  }

  @Get('ping')
  ping() {
    return { status: true };
  }

}
