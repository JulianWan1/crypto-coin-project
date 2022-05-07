import { Injectable } from "@nestjs/common";
import { BuySellCoinEvent } from "database/models/buy-sell-coin-event";
import { BuySellCoinEventEntity } from "src/entities/buy-sell-coin-event-entity";
import GeneralPortfolioUpdate from "./general-portfolio-update";

@Injectable()
export default class GeneralBuyEvent {
  constructor(private readonly generalPortfolioUpdate:GeneralPortfolioUpdate){}
  // Set 3 things:
  // 1. parameters for the generalCreateBuyEvent (what params to receive)
  // 2. calculate the aggregate price
  // - then only insert the event in
  // 3. Call the portfolio update function
  async generalCreateBuyEvent(buyEvent: Partial<BuySellCoinEventEntity>){
    // First get the marketPrice, networkFee and the exchnagePremium
    // set the sum to be the new aggregatePrice
    // post the newly updated buyEvent to the BuySellCoinEvent table
    const {
      marketPrice,
      networkFee,
      exchangePremium
    } = buyEvent
    const newPrice = marketPrice + networkFee + exchangePremium;
    buyEvent.aggregatePrice = newPrice;
    await BuySellCoinEvent.query().insert(
      buyEvent
    )

    // Updates the current portfolio table after a purchase was made
    // (for newly bought coin or pre-existing coin in Portfolio table)
    this.generalPortfolioUpdate.generalPortfolioUpdateFunction(buyEvent);

  }

}