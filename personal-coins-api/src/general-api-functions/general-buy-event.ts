import { Injectable } from "@nestjs/common";
import { BuySellCoinEvent } from "database/models/buy-sell-coin-event";
import { BuySellCoinEventEntity } from "src/entities/buy-sell-coin-event-entity";
import { NoneOrNegativeBuySellAmount } from "src/exceptions/api-exceptions";
import GeneralEventLogUpdate from "./general-event-log-update";
import GeneralPortfolioUpdate from "./general-portfolio-update";

@Injectable()
export default class GeneralBuyEvent {
  constructor(
    private readonly generalPortfolioUpdate:GeneralPortfolioUpdate,
    private readonly generalEventLogUpdate: GeneralEventLogUpdate
    ){}
  // Set 3 things:
  // 1. parameters for the generalCreateBuyEvent (what params to receive)
  // 2. calculate the aggregate price
  // - then only insert the event in
  // 3. Call the portfolio update function
  async generalCreateBuyEvent(buyEvent: Partial<BuySellCoinEventEntity>){
    // First get the marketPrice, networkFee and the exchnagePremium
    // networkFee and exchangePremium have to be converted to per coin bought basis
    // set the sum to be the new aggregatePrice
    // post the newly updated buyEvent to the BuySellCoinEvent table
    const {
      coinId,
      marketPrice,
      networkFee,
      exchangePremium,
      buyQuantity
    } = buyEvent

    // check if the coin bought amount is more than 0
    if(buyQuantity <= 0){
      throw new NoneOrNegativeBuySellAmount
    };
    
    // insert the new buyEvent in the log table
    const newPrice = marketPrice + ((networkFee + exchangePremium)/buyQuantity);
    buyEvent.aggregatePrice = newPrice;
    await BuySellCoinEvent.query().insert(
      buyEvent
    )

    // retrieve the log table after buy event insertion
    const coinEventLog: BuySellCoinEvent[] = 
    await BuySellCoinEvent.query()
    .where('coinId', '=', coinId)
    .orderBy([
      {column:'eventDate', order:'asc'},
      {column:'eventType', order:'asc'}
    ])

    // Update the event log table
    await this.generalEventLogUpdate.updateProceedingDCALogs(buyEvent, coinEventLog)

    // Updates the current portfolio table after a purchase was made
    // (for newly bought coin or pre-existing coin in Portfolio table)
    await this.generalPortfolioUpdate.generalPortfolioUpdateFunction(buyEvent);
    
    const newBuyEventlist: BuySellCoinEvent[] = await BuySellCoinEvent.query()
      .select('*')
      .orderBy('id', 'desc')
      .limit(1)

    return newBuyEventlist[0]
  }

}