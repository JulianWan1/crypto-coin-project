import { Injectable, Logger } from "@nestjs/common";
import { BuySellCoinEvent } from "database/models/buy-sell-coin-event";
import { BuySellCoinEventEntity } from "src/entities/buy-sell-coin-event-entity";
import { EventType } from "src/enum/event-type.enum";

@Injectable()
export default class GeneralEventLogUpdate {
  private logger = new Logger('GeneralEventLogUpdate');
  // Goal: to update the proceeding DCA events after the newly created Buy event / Sell event & DCA event (change variable from sellEvent to buySellEvent)
  // 1. Get the full logs of the specific coin from the coins-sell.service.ts DONE
  // - in ascending order (starting from the earliest log)
  // - get the list of all DCA events AFTER the date of newly added DCA event (represented by the sellEvent's eventDate since they are the same) DONE
  // *** - same for buyEvents as well DONE
  // *** - (ensure that the list of DCA events to update for buy events should include the DCA prior the buy (if the buy is not the same date as a DCA event))
  // - get the list of all corresponding sell events AFTER the date of newly added DCA event, this is necessary to help to calculate the aggregate price for DCA event
  // 2. In a loop of the list of DCA events, for each DCA event:
  //    get the DCA event date to:
  //    - get all the events starting from the previous DCA eventdate and ending at (and also not including) current DCA eventdate in a list
  //      (sell event date will be the initial value)
  //    - calculate the new DCA 
  //    - update the corresponding DCA event

  async updateProceedingDCALogs(
    buySellEvent:Partial<BuySellCoinEventEntity>,
    coinEventLog:BuySellCoinEvent[]
  ){

    // 1. Get list of all DCA events to update
    // include the initial DCA to be the first in the list 
    // (initial DCA will not be updated as it acts just as an initial value for the reduce function later)  
    let toUpdateDCAEvents: BuySellCoinEvent[] = [];
    for(let i = 0; i < coinEventLog.length; i++){
      if(
        coinEventLog[i].eventType === EventType.RecentDCADefiningEventType &&
        new Date(coinEventLog[i].eventDate).getTime() >= new Date(buySellEvent.eventDate).getTime()
        ){
        toUpdateDCAEvents.push(coinEventLog[i]);
      }
    };
    this.logger.log(`toUpdateDCAEvents: ${JSON.stringify(toUpdateDCAEvents)}`);

    // Check if the initial DCA exists (should exist for all sell events & buy events that are of the same date of a DCA event)
    // If buy event is not made on a DCA event, there will not be an initial DCA in the toUpdateDCAEvents list
    // hence, get the immediate DCA before the buy event and set it as the first element in the toUpdateDCAEvents list
    // array.some() checks if the array has at least one element that fulfills the condition
    if(
      !toUpdateDCAEvents.some((event)=>{return new Date(event.eventDate).getTime() === new Date(buySellEvent.eventDate).getTime()})
      ){
      let initialDCAEventToSet: BuySellCoinEvent; 
      for(let i = 0; i < coinEventLog.length; i++){
        if(
          coinEventLog[i].eventType === EventType.RecentDCADefiningEventType &&
          new Date(coinEventLog[i].eventDate).getTime() < new Date(buySellEvent.eventDate).getTime()
        ){
          initialDCAEventToSet = coinEventLog[i];
        }
      }
      this.logger.log(`Most recent DCA event before the buy event (initialDCAEventToSet): ${JSON.stringify(initialDCAEventToSet)}`)
      toUpdateDCAEvents = [initialDCAEventToSet, ...toUpdateDCAEvents];
      this.logger.log(`After adding most recent DCA event to toUpdateDCAEvents: ${JSON.stringify(toUpdateDCAEvents)}`)
    }

    // Check if the toUpdateDCAEvents list only contains the latest DCA event 
    // (which means does not have any DCA events after it)
    // Return nothing if so
    if(toUpdateDCAEvents.length === 1 && new Date(toUpdateDCAEvents[0].eventDate).getTime() === new Date(buySellEvent.eventDate).getTime()){
      this.logger.log(`There are no proceeding DCA events to update`)
      return;
    }

    // 2. Get list of all Sell Events after buySellEvent 
    // (the corresponding sell events to each of the DCA events from toUpdateDCAEvents list, excluding the first DCA event)
    let sellEventsList: BuySellCoinEvent[] =[];
    for(let i = 0; i < coinEventLog.length; i++){
      if(
        coinEventLog[i].eventType === EventType.SellEventType &&
        new Date(coinEventLog[i].eventDate).getTime() > new Date(buySellEvent.eventDate).getTime()
        ){
        sellEventsList.push(coinEventLog[i]);
      }
    }
    this.logger.log(`sellEventsList: ${JSON.stringify(sellEventsList)}`);

    // 3. Run the update for each DCA event
    for(let i = 1; i < toUpdateDCAEvents.length; i++){
      const previousDCAEvent = toUpdateDCAEvents[i-1];
      const currentDCAEvent = toUpdateDCAEvents[i];
      this.logger.log(`previousDCAEvent ID: ${previousDCAEvent.id}`);
      this.logger.log(`currentDCAEvent ID: ${currentDCAEvent.id}`)
      // list to gather all events that are starting from a DCA event till the next DCA/sell event
      // will consist of 1 DCA event and (if any), buy events
      let specificDCAandBuyEventsList: BuySellCoinEvent[] =[];
      for(let i = 0; i < coinEventLog.length; i++){
        if(
          new Date(coinEventLog[i].eventDate).getTime() >= new Date(previousDCAEvent.eventDate).getTime() && 
          new Date(coinEventLog[i].eventDate).getTime() < new Date(currentDCAEvent.eventDate).getTime() &&
          coinEventLog[i].eventType !== EventType.SellEventType
        ){
          specificDCAandBuyEventsList.push(coinEventLog[i]);
        }
      }
      this.logger.log(`specificDCAandBuyEventsList of DCA Event ID ${currentDCAEvent.id}: ${JSON.stringify(specificDCAandBuyEventsList)}`)
      // calculate the new DCA to update current DCADefiningEvent
      let totalPurchased:number = 0; 
      let totalWeightedPurchases: number = 0;
      let newSellDCA: number = 0; 
      for(let i = 0; i < specificDCAandBuyEventsList.length; i++){
        totalPurchased += Number(specificDCAandBuyEventsList[i].buyQuantity);
        totalWeightedPurchases += Number(specificDCAandBuyEventsList[i].buyQuantity * specificDCAandBuyEventsList[i].aggregatePrice)
      }
      // Get the corresponding sell event for the current DCA event
      const correspondingSellEvent: BuySellCoinEvent = 
        sellEventsList.find((sellEvent) => {return new Date(sellEvent.eventDate).getTime() === new Date(currentDCAEvent.eventDate).getTime()})
      this.logger.log(`correspondingSellEvent of DCA Event ID ${currentDCAEvent.id}: ${JSON.stringify(correspondingSellEvent)}`)
      const {
        sellQuantity
      } = correspondingSellEvent;
      const newDCAbuyQuantity: number = totalPurchased - sellQuantity;
      newSellDCA = totalWeightedPurchases / totalPurchased;
      this.logger.log(`newSellDCA of DCA Event ID ${currentDCAEvent.id}: ${newSellDCA}`)
      // update the DCA Event & retrieve updated row (objection .patchAndFetchById())
      const newlyUpdatedDCAEvent: BuySellCoinEvent = 
        await BuySellCoinEvent.query()
          .patchAndFetchById(currentDCAEvent.id,
            {
            buyQuantity:newDCAbuyQuantity,
            aggregatePrice: newSellDCA
          })
      // update the DCA Event in coinEventLog list with newlyUpdatedDCAEvent of similar id 
      // to ensure that the DCA event prior to the current DCA event (previousDCAEvent) for the next iteration of this loop is updated
      // so that the DCA event used with the buy events for calculations are correct
      // otherwise we may just only update the DCA in the DB but the current coinEventLog list will be backdated
      for(let i = 0; i < coinEventLog.length; i++){
        if(coinEventLog[i].id === newlyUpdatedDCAEvent.id){
          coinEventLog[i] = newlyUpdatedDCAEvent;
        }
      } 
      this.logger.log(`newlyUpdatedDCAEvent of DCA Event ID ${currentDCAEvent.id}: ${JSON.stringify(newlyUpdatedDCAEvent)}`);
    }
    
  }

}