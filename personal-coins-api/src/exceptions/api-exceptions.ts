import { HttpException, HttpStatus } from "@nestjs/common";

export class DuplicateException extends HttpException {
  constructor(){
    super(
      'Entry already exists! Duplicates are prohibited',
      HttpStatus.FORBIDDEN
    );
  }
}