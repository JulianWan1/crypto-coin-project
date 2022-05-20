import { HttpException, HttpStatus } from "@nestjs/common";

export class DuplicateException extends HttpException {
  constructor(){
    super(
      'Entry already exists! Duplicates are prohibited',
      HttpStatus.FORBIDDEN
    );
  }
}

export class AbsentException extends HttpException {
  constructor(){
    super(
      'Coin entry is absent from portfolio! Buy / Sell event requested is prohibited',
      HttpStatus.FORBIDDEN
    );
  }
}

export class NoneOrNegativeBuySellAmount extends HttpException {
  constructor(){
    super(
      'Coin amount to buy / sell is 0 or negative, ensure buy / sell amount is a postive number / decimal',
      HttpStatus.FORBIDDEN
    );
  }
}

export class BeforeFirstBoughtException extends HttpException {
  constructor(){
    super(
      'Buy / Sell event requested is before first buy date, request prohibited',
      HttpStatus.FORBIDDEN
    );
  }
}

export class SellEventDateNotUniqueException extends HttpException {
  constructor(){
    super(
      'Sell event date and time is not unique to existing events, sell event is prohibited',
      HttpStatus.FORBIDDEN
    );
  }
}

export class ExceedingBuyQuantityException extends HttpException {
  constructor(){
    super(
      'Sell event quantity exceeds the total bought quantity prior to it, sell event is prohibited',
      HttpStatus.FORBIDDEN
    );
  }
}

export class ExceedingTotalBoughtException extends HttpException {
  constructor(){
    super(
      'Sell event quantity causes total coins sold to exceed the total coins bought, sell event is prohibited',
      HttpStatus.FORBIDDEN
    );
  }
}