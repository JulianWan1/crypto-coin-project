import { Injectable, Logger } from "@nestjs/common";
import { BuySellCoinEvent } from "database/models/buy-sell-coin-event";
import { Portfolio } from "database/models/portfolio";
import { CreateNewEventDto } from "src/dto/create-new-event.dto";
import { BuySellCoinEventEntity } from "src/entities/buy-sell-coin-event-entity";
import { EventType } from "src/enum/event-type.enum";
import { AbsentException, BeforeFirstBoughtException, NoneOrNegativeBuySellAmount } from "src/exceptions/api-exceptions";
import GeneralBuyEvent from "src/general-api-functions/general-buy-event";

@Injectable()
export class CoinsBuyService {
  private logger = new Logger('CoinsBuyService');
  constructor(private readonly generalBuyEvent: GeneralBuyEvent){}

  async createNewBuy(coinName:string, coin:CreateNewEventDto){

    const {
      buySellQuantity,
      marketPrice,
      networkFee,
      exchangePremium,
      buySellDate
    } = coin

    // check if the coin bought amount is more than 0
    if(buySellQuantity <= 0){
      throw new NoneOrNegativeBuySellAmount
    };

    // Check if the coinName is found in the portfolio table (convert coinName to have uppercase for initial letter)
    // if found, get its respective id from portfolio table
    coinName = coinName[0].toUpperCase() + coinName.slice(1);
    this.logger.log(`Transformed toUpperCase coinName: ${coinName}`);

    const coinPresent: Portfolio[] = 
      await Portfolio.query()
        .where('coinName', '=', coinName)
    this.logger.log(`coinPresent: ${JSON.stringify(coinPresent)}`)
    
    if(coinPresent.length !== 1){
      throw new AbsentException;
    };

    const {
      id
    } = coinPresent[0]

    // Get first buy event to get its event date
    const firstBuyEventList:BuySellCoinEvent[] = 
    await BuySellCoinEvent.query()
    .where('coinId', '=', id)
    .orderBy('eventDate','asc')

    const firstBuyEvent: BuySellCoinEvent = firstBuyEventList[0];
    this.logger.log(`buySellDate >= firstBuyEvent.eventDate: ${ new Date(buySellDate).getTime() >= new Date(firstBuyEvent.eventDate).getTime() }`)

    // check if the new buy event's date is AFTER OR ON the first buy date
    // otherwise throw BeforeFirstBoughtException
    if(new Date(buySellDate).getTime() < new Date(firstBuyEvent.eventDate).getTime()){
      throw new BeforeFirstBoughtException;
    };
    
    const buyEvent: Partial<BuySellCoinEventEntity> = {
      coinId: id,
      eventType: EventType.BuyEventType,
      buyQuantity:buySellQuantity,
      aggregatePrice: null,
      marketPrice,
      networkFee,
      exchangePremium,
      eventDate: buySellDate
    }
    // create the buy event through the general-buy-event function
    const latestBuyEvent: BuySellCoinEvent = 
      await this.generalBuyEvent.generalCreateBuyEvent(buyEvent);
    return {
      status: true,
      latestBuySellEvent: latestBuyEvent,
      coinId: id,
      latestBuySellDate: buySellDate
    }
  }
}