import { All, Controller, HttpStatus, HttpCode } from '@nestjs/common';
import { TypedRoute  } from '@nestia/core';

@Controller()
export class AppController {
  @All()
  @HttpCode(HttpStatus.I_AM_A_TEAPOT)
  goAhead() {
    return 'Не, через интерфейс будет проще, это я тебе как инженер говорю.';
  }

  /**
   * hunay
   */
  @TypedRoute.Get('ping')
  ping() {
    return { status: true };
  }

}
