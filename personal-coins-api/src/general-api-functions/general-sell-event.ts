import { Injectable, Logger } from "@nestjs/common";
import { BuySellCoinEvent } from "database/models/buy-sell-coin-event";
import { BuySellCoinEventEntity } from "src/entities/buy-sell-coin-event-entity";
import { EventType } from "src/enum/event-type.enum";
import { NoneOrNegativeBuySellAmount } from "src/exceptions/api-exceptions";
import GeneralDCADefiningEvent from "./general-dca-defining-event";
import GeneralPortfolioUpdate from "./general-portfolio-update";

@Injectable()
export default class GeneralSellEvent {
  private logger = new Logger('GeneralSellEvent')
  constructor(
    private readonly generalPortfolioUpdate:GeneralPortfolioUpdate,
    private readonly generalDCADefiningEvent:GeneralDCADefiningEvent
    ){}
  // set 3 things:
  // 1. Make the sell event
  // - get the necessary info from the sellEvent parameter
  // - get the aggregate price for selling (opposite way for the buy)
  // - insert the data to the event table
  // 2. Set a new DCA event
  // - use the generalCreateDCADefiningEvent function
  // 3. Run the generalPortfolioUpdate function
  async generalCreateSellEvent(
    sellEvent: Partial<BuySellCoinEventEntity>, 
    latestDCAAndBuyEventsList: BuySellCoinEvent[],
    coinEventLog: BuySellCoinEvent[]
    ){

    // Update the aggregate price for sellEvent
    // networkFee and exchangePremium are on a per coin sold basis
    const{
      marketPrice,
      networkFee,
      exchangePremium,
      sellQuantity
    } = sellEvent;

    // check if the coin sold amount is more than 0
    if(sellQuantity <= 0){
      throw new NoneOrNegativeBuySellAmount
    };

    this.logger.log(`Market Price, Network Fee, Exchange Premium: ${[marketPrice, networkFee, exchangePremium]}`);
    this.logger.log(`sellQuantity: ${sellQuantity}`);
    const newPrice = marketPrice - ((networkFee + exchangePremium) / sellQuantity);
    sellEvent.aggregatePrice = newPrice;
    this.logger.log(`newPrice: ${newPrice}`);
    // 1. Make sell event and return it (objection.js .insert().returning)
    const latestSellEventInserted: BuySellCoinEvent = await BuySellCoinEvent.query()
    .insert(sellEvent)
    .returning('*')
    this.logger.log(`latestSellEventInserted: ${JSON.stringify(latestSellEventInserted)}`);
    
    // Update the coinEventLog by splicing it with the latestSellEventInserted here
    // position sellEvent at an index after a DCA or buy event which has the date closest before the sellEvent date
    let eventIndex: number = 0;
    for(let i = 0; i < coinEventLog.length; i++){
      if(
        new Date(coinEventLog[i].eventDate).getTime() < new Date(latestSellEventInserted.eventDate).getTime() &&
        coinEventLog[i].eventType !== EventType.SellEventType
        ){
        eventIndex = coinEventLog.indexOf(coinEventLog[i]) + 1;
      }
    }
    coinEventLog.splice(eventIndex, 0, latestSellEventInserted)
    this.logger.log(`coinEventLog after sell event: ${JSON.stringify(coinEventLog)}`);
    // 2. Set new DCA event by running generalCreateDCADefiningEvent
    await this.generalDCADefiningEvent.generalCreateDCADefiningEvent(sellEvent, latestDCAAndBuyEventsList, coinEventLog)
    
    // 3. Update the portfolio table by running generalPortfolioUpdate 
    await this.generalPortfolioUpdate.generalPortfolioUpdateFunction(sellEvent)

    return latestSellEventInserted;
  }
}