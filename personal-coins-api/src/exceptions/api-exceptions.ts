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
      'Coin entry is absent from portfolio! Buy / Sell / Update event requested is prohibited',
      HttpStatus.FORBIDDEN
    );
  }
}
export class EventLogNotFoundException extends HttpException {
  constructor(){
    super(
      'Event log is not found in buy sell coin event logs! Update event requested is prohibited',
      HttpStatus.FORBIDDEN
    );
  }
}

export class UpdateDCAEventException extends HttpException {
  constructor(){
    super(
      'Event of DCA Event type is not updatable, update prohibited',
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

export class AfterFirstBoughtException extends HttpException {
  constructor(){
    super(
      'First buy event cannot be set ahead or equal to the eventDate of event ahead of it, request prohibited',
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

export class ExceedingOwnedFromSpilloverException extends HttpException {
  constructor(currentDCAEventDate:Date,currentSellEventDate:Date){
    super(
      `Potential sell event quantity causes total coins owned in a range to be lesser than the coins to be sold subsequently, range where issue starts is from ${currentDCAEventDate} to ${currentSellEventDate}. Sell event is prohibited, advise is to revise the logs correctly and try again`,
      HttpStatus.FORBIDDEN
    );
  }
}

export class MissingUpdatesException extends HttpException {
  constructor(){
    super(
      'Updates are missing/not passed, update is prohibited',
      HttpStatus.FORBIDDEN
    );
  }
}