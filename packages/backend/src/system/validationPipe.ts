import { ValidationPipe } from "@nestjs/common";
import { ApiException } from "./apiException";

export default new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  exceptionFactory(validationErrors) {
    const errors: string[] = [];
    validationErrors.forEach(validationError => {
      for (const validationConstraint in validationError.constraints) {
        errors.push(validationError.constraints[validationConstraint]);
      }
    });
    return new ApiException('BAD_REQUEST', 'ValidationPipe: Wrong DTO recived', errors);
  },
});
