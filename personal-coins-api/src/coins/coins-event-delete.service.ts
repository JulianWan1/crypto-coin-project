import { Injectable, Logger } from "@nestjs/common";
import { BuySellCoinEvent } from "database/models/buy-sell-coin-event";
import { Portfolio } from "database/models/portfolio";
import { EventType } from "src/enum/event-type.enum";
import { AbsentException, EventLogNotFoundException, ExceedingOwnedFromSpilloverException, FirstBuyOrDCAEventDeletionException } from "src/exceptions/api-exceptions";
import GeneralPortfolioUpdate from "src/general-api-functions/general-portfolio-update";

@Injectable()
export class CoinsEventDeleteService{
  private logger = new Logger('coinsEventDeleteService');
  constructor(private readonly generalPortfolioUpdate:GeneralPortfolioUpdate){}
  async deleteEventLog(coinName: string, eventId: number){
    coinName = coinName[0].toUpperCase() + coinName.slice(1);

    // Get the coin from the portfolio table
    const coinPresentList: Portfolio[] = 
    await Portfolio.query()
      .where('coinName', '=', coinName)
    this.logger.log(`Coin of event which is to be deleted: ${JSON.stringify(coinPresentList)}`)
    // Check if coin exists in portfolio
    if(coinPresentList.length !== 1){
      throw new AbsentException;
    }
    // Retrieve all events of specific coin from the coinEventLog
    const coinId: number = coinPresentList[0].id;
    const coinEventLog:BuySellCoinEvent[] = await BuySellCoinEvent.query()
      .where('coinId', '=', coinId)
      .orderBy([
        {column:'eventDate', order:'asc'},
        {column:'eventType', order:'asc'}
      ])
    // Check if the event id is found from the coinEventLog
    // Make eventLog a copy of the event that is to be updated
    let eventLog: BuySellCoinEvent;
    let allBuyEvents: BuySellCoinEvent[] = [];
    for(let i = 0; i < coinEventLog.length; i++){
      if(Number(coinEventLog[i].id) === Number(eventId)){
        eventLog = Object.assign({}, coinEventLog[i]);
      }
      if(coinEventLog[i].eventType === EventType.BuyEventType){
        allBuyEvents.push(coinEventLog[i])
      }
    }
    this.logger.log(`Event log selected for removal: ${JSON.stringify(eventLog)}`)
    if(!eventLog){
      throw new EventLogNotFoundException;
    }

    // Check special case:
    // First buy & DCA events disallowed to be deleted
    // Sadly, cannot compare objects (deeply) using Lodash _.isEqual as will return undefined error T_T
    if(
      eventLog.eventType === EventType.RecentDCADefiningEventType || 
      eventLog.id === allBuyEvents[0].id
    ){
      throw new FirstBuyOrDCAEventDeletionException;
    }

    if(eventLog.eventType === EventType.BuyEventType){
      // find the eventLog in coinEventLog and remove it from the array
      // could use indexOf instead but used for loop
      // check if the coinEventLog[i].id is equals to eventLog.id and if so, remove from the coinEventLog
      for(let i = 0; i < coinEventLog.length; i++){
        if(coinEventLog[i].id === eventLog.id){
          const removedEvent:BuySellCoinEvent[] = coinEventLog.splice(i,1);
          this.logger.log(`Removed buy event from coinEventLog: ${JSON.stringify(removedEvent)}`)
        }
      }
    }
    // If sell event, remove the sell event and the following DCA event after it
    else if(eventLog.eventType === EventType.SellEventType){
      for(let i = 0; i < coinEventLog.length; i++){
        if(coinEventLog[i].id === eventLog.id){
          const removedEvents:BuySellCoinEvent[] = coinEventLog.splice(i,2);
          this.logger.log(`Removed events from coinEventLog for sell: ${JSON.stringify(removedEvents)}`)
        }
      }
    }

    // Get all DCA & Sell Events from the newly updated coinEventLog 
    // (after removing the event from the coinEventLog)
    // Get the DCA event that is before the eventLog that is being removed
    let allNewDCAEventsList:BuySellCoinEvent[] = [];
    let allNewSellEventsList:BuySellCoinEvent[] = [];
    let lastPreceedingDCAEvent:BuySellCoinEvent;
    for(let i = 0; i < coinEventLog.length; i++){
      if(coinEventLog[i].eventType === EventType.RecentDCADefiningEventType){
        allNewDCAEventsList.push(coinEventLog[i]);
      }
      if(coinEventLog[i].eventType === EventType.SellEventType){
        allNewSellEventsList.push(coinEventLog[i]);
      }
      if(
        coinEventLog[i].eventType === EventType.RecentDCADefiningEventType &&
        new Date(coinEventLog[i].eventDate).getTime() <= new Date(eventLog.eventDate).getTime()
      ){
        lastPreceedingDCAEvent = coinEventLog[i];
      }
    } 

    // Get the proceeding DCA Events (including the prior DCA event from deleted event)
    // Get the proceeding Sell Events
    let proceedingDCAEvents:BuySellCoinEvent[] = [lastPreceedingDCAEvent];
    let proceedingSellEvents:BuySellCoinEvent[] = []; 
    for(let i = 0; i < allNewDCAEventsList.length; i++){
      if(new Date(allNewDCAEventsList[i].eventDate).getTime() > new Date(eventLog.eventDate).getTime()){
        proceedingDCAEvents.push(allNewDCAEventsList[i]);
      }
    }
    for(let i = 0; i < allNewSellEventsList.length; i++){
      if(new Date(allNewSellEventsList[i].eventDate).getTime() > new Date(eventLog.eventDate).getTime()){
        proceedingSellEvents.push(allNewSellEventsList[i]);
      }
    }

    // Recalculate the DCA events in the coinEventLog and update them
    for(let i = 0; i < proceedingDCAEvents.length; i++){
      // When reached the final DCA (since no Sell event after it), break the loop)
      if(proceedingDCAEvents.indexOf(proceedingDCAEvents[i]) === (proceedingDCAEvents.length - 1)){
        break;
      }
      // starting point of the current range
      let currentDCAEvent: BuySellCoinEvent = proceedingDCAEvents[i];
      this.logger.log(`currentDCAEvent: ${JSON.stringify(currentDCAEvent)}`)
      // ending point of the current range
      let currentSellEvent: BuySellCoinEvent = proceedingSellEvents[i];
      this.logger.log(`currentSellEvent: ${JSON.stringify(currentSellEvent)}`)
      // set the totalBoughtInCurrentRange, remainingAfterSellEvent & totalWeightedBoughtInCurrentRange to 0 each
      let totalBoughtInCurrentRange: number = 0;
      let remainingAfterSellEvent: number = 0;
      let totalWeightedBoughtInCurrentRange: number = 0;
      // Start getting the totalBoughtInCurrentRange through looping the coinEventLog (from the currentDCAEvent & currentSellEvent) 
      // and getting the sum of buyQuantity of each event (the DCA event and buy events)
      for(let i = 0; i < coinEventLog.length; i++){
        if(
          new Date(coinEventLog[i].eventDate).getTime() >= new Date(currentDCAEvent.eventDate).getTime() && 
          new Date(coinEventLog[i].eventDate).getTime() < new Date(currentSellEvent.eventDate).getTime() && 
          coinEventLog[i].eventType !== EventType.SellEventType
        ){
          // if event is a DCA event, ensure that its value gets updated with the new DCA buyQuantity 
          // (where the update was made on dcaEventRelatedToPotential on the iteration beforehand)
          if(coinEventLog[i].eventType === EventType.RecentDCADefiningEventType){
            coinEventLog[i].buyQuantity = currentDCAEvent.buyQuantity;
            coinEventLog[i].aggregatePrice = currentDCAEvent.aggregatePrice;
          }
          this.logger.log(`Initial totalBoughtInCurrentRange: ${totalBoughtInCurrentRange}`)
          this.logger.log(`buyQuantity: ${coinEventLog[i].buyQuantity}`)
          totalBoughtInCurrentRange += Number(coinEventLog[i].buyQuantity);
          totalWeightedBoughtInCurrentRange += Number(coinEventLog[i].buyQuantity * coinEventLog[i].aggregatePrice)
        }
      }
      remainingAfterSellEvent = totalBoughtInCurrentRange - Number(currentSellEvent.sellQuantity)
      this.logger.log(`totalBoughtInCurrentRange: ${totalBoughtInCurrentRange}`);
      this.logger.log(`totalWeightedBoughtInCurrentRange: ${totalWeightedBoughtInCurrentRange}`);
      this.logger.log(`remainingAfterSellEvent: ${remainingAfterSellEvent}`);
      this.logger.log(`aggregatePrice: ${totalWeightedBoughtInCurrentRange / totalBoughtInCurrentRange}`);
      // if the totalBoughtInCurrentRange is less than the currentSellEvent's sell quantity
      if(totalBoughtInCurrentRange < Number(currentSellEvent.sellQuantity)){
        this.logger.log(`sell quantity more than buy quantity (spillover issue) arises bewteen ${new Date(currentDCAEvent.eventDate)} & ${new Date(currentSellEvent.eventDate)}`);
        throw new ExceedingOwnedFromSpilloverException(new Date(currentDCAEvent.eventDate), new Date(currentSellEvent.eventDate));
      }
      // If there is another DCA event ahead of the current DCA, then set the next DCA's buyQuantity in the DCA events list to be equal to the remaining coins
      // also set the aggregate price of the DCA event ahead to be the total weighted buys divided by the total bought in the range
      if(proceedingDCAEvents[i+1]){
        proceedingDCAEvents[i+1].buyQuantity = remainingAfterSellEvent;
        proceedingDCAEvents[i+1].aggregatePrice = totalWeightedBoughtInCurrentRange / totalBoughtInCurrentRange;
        this.logger.log(`the proceedingDCAEvents list changed at index ${proceedingDCAEvents.indexOf(proceedingDCAEvents[i+1])}, where the list is updated as follows: ${JSON.stringify(proceedingDCAEvents)}`)
      }
    }
    this.logger.log(`Deletion of event is possible`);
    
    // Drop coin event from DB
    // if buy event, drop the event
    // if sell event, drop it and DCA event proceeding it
    let deletedEventsFromDB:BuySellCoinEvent[]=[];
    if(eventLog.eventType === EventType.BuyEventType){
      deletedEventsFromDB = 
        await BuySellCoinEvent.query()
          .deleteById(eventLog.id)
          .returning('*')
    };
    if(eventLog.eventType === EventType.SellEventType){
      deletedEventsFromDB = 
        await BuySellCoinEvent.query()
          .delete()
          .whereIn('id', [eventLog.id, Number(eventLog.id + 1)])
          .returning('*')
    };

    // Update the DCA events in DB through looping updated coinEventLog
    for(let i = 0; i < proceedingDCAEvents.length; i++){
      await BuySellCoinEvent.query()
        .findById(proceedingDCAEvents[i].id)
        .patch(
        {
          buyQuantity: proceedingDCAEvents[i].buyQuantity,
          aggregatePrice: proceedingDCAEvents[i].aggregatePrice,
        }
      )
    };

    // Run generalPortfolioUpdateFunction
    const deletedBuySellCoinEvent: Partial<BuySellCoinEvent> = {
      coinId: coinId
    };
    await this.generalPortfolioUpdate.generalPortfolioUpdateFunction(deletedBuySellCoinEvent);

    // Return deleted coin
    return {
      status: true,
      coinName,
      deletedEventsFromDB 
    };

    // If not special case: 
    // - If buy event, remove the buy event from the coinEventLog
    // (Buy events after last dca event will not require full cycle recalculation)
    // - If sell event, remove the sell and dca event that shares the same date from coinEventLog
    // - Get all the DCA and Sell events from the newly updated coinEventLog
    // - Get the previous DCA event before the removed event
    // - Get all the DCA events (including) the previous DCA event
    // - Get all Sell events after previous DCA event
    // - Cycle through the coinEventLog using the DCA events and sell events to update coinEventLog DCA events
    // - Update the DCA events in DB through looping updated coinEventLog (Or during the cycle beforehand)
    // - Run generalPortfolioUpdateFunction
    // - Return deleted coin

  }

}