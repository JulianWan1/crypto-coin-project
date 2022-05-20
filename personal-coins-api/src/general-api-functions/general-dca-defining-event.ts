import { Injectable, Logger } from "@nestjs/common";
import { BuySellCoinEvent } from "database/models/buy-sell-coin-event";
import { BuySellCoinEventEntity } from "src/entities/buy-sell-coin-event-entity";
import { EventType } from "src/enum/event-type.enum";
import GeneralEventLogUpdate from "./general-event-log-update";

@Injectable()
export default class GeneralDCADefiningEvent {
  private logger = new Logger('GeneralDCADefiningEvent');
  constructor(private readonly generalEventLogUpdate:GeneralEventLogUpdate){}

  async generalCreateFirstDCADefiningEvent(
    definedDCAEvent:Partial<BuySellCoinEventEntity>
  ){
    await BuySellCoinEvent.query()
      .insert(definedDCAEvent)
  }
  // 1. Create a new DCADefiningEvent for a coin (insert to event table)
  //  - Calculate the new DCA after this sell event & insert to event table
  //  - Do so by getting latestDCAAndBuyEventsList which was done from coins-sell.service.ts
  // 2. Have to set a way to recalculate (if any) proceeding DCA Defining events,
  //    when a new sell was made for specific coin
  // - should be made in a separate generalEventLogUpdate.ts file 
  // (file should also contain functions for other updates (with regards to sell and buy events eventually))
  // Updates the event log table
  async generalCreateDCADefiningEvent(
    sellEvent:Partial<BuySellCoinEventEntity>, 
    latestDCAAndBuyEventsList:BuySellCoinEvent[], 
    coinEventLog:BuySellCoinEvent[]
  ){
    // Find the immediate DCA event before the sell event date
    const{ 
      coinId,
      sellQuantity,
      eventDate 
    } = sellEvent;
    let totalPurchased:number = 0; 
    let totalWeightedPurchases: number = 0;
    // the DCA before accounting for the price of doing a sell (just accounting for the dca event and following buy events)
    let newSellDCA: number = 0; 

    for(let i = 0; i < latestDCAAndBuyEventsList.length; i++){
      totalPurchased += Number(latestDCAAndBuyEventsList[i].buyQuantity);
      totalWeightedPurchases += Number(latestDCAAndBuyEventsList[i].buyQuantity * latestDCAAndBuyEventsList[i].aggregatePrice);
    };
    newSellDCA = totalWeightedPurchases / totalPurchased;

    // the remaining amount of coins hold since the sell
    const quantityRemainingDCA: number = totalPurchased - sellQuantity;

    // create the newDCADefiningEvent (market price, networkFee & exhangePremium not required)
    // insert DCA event into the BuySellCoinEvent table
    const newDCADefiningEvent: Partial<BuySellCoinEventEntity> ={
      coinId,
      eventType: EventType.RecentDCADefiningEventType,
      buyQuantity: quantityRemainingDCA,
      aggregatePrice: newSellDCA, 
      eventDate
    }
    this.logger.log(`newDCADefiningEvent: ${JSON.stringify(newDCADefiningEvent)}`);

    const latestDCAEventInserted: BuySellCoinEvent = await BuySellCoinEvent.query()
      .insert(newDCADefiningEvent)
      .returning(`*`)
    this.logger.log(`latestDCAEventInserted: ${JSON.stringify(latestDCAEventInserted)}`)

    // Update the coinEventLog by splicing it with the latestDCAEventInserted here
    // position it at the index right after a sellEvent which shares the same date as this DCA event 
    let eventIndex: number = 0;
    for(let i = 0; i < coinEventLog.length; i++){
      if(
        new Date(coinEventLog[i].eventDate).getTime() === new Date(latestDCAEventInserted.eventDate).getTime() &&
        coinEventLog[i].eventType === EventType.SellEventType
        ){
        eventIndex = coinEventLog.indexOf(coinEventLog[i]) + 1;
      }
    }
    coinEventLog.splice(eventIndex, 0, latestDCAEventInserted)
    this.logger.log(`coinEventLog after setting DCA event: ${JSON.stringify(coinEventLog)}`);

    await this.generalEventLogUpdate.updateProceedingDCALogs(sellEvent, coinEventLog)

  }
}