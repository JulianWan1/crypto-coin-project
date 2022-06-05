import { Injectable, Logger } from "@nestjs/common";
import { BuySellCoinEvent } from "database/models/buy-sell-coin-event";
import { Portfolio } from "database/models/portfolio";
import { stringify } from "querystring";
import { UpdateEventDto } from "src/dto/update-event.dto";
import { EventType } from "src/enum/event-type.enum";
import { AbsentException, AfterFirstBoughtException, BeforeFirstBoughtException, EventLogNotFoundException, ExceedingOwnedFromSpilloverException, MissingUpdatesException, NoneOrNegativeBuySellAmount, SellEventDateNotUniqueException, UpdateDCAEventException } from "src/exceptions/api-exceptions";
import GeneralPortfolioUpdate from "src/general-api-functions/general-portfolio-update";

@Injectable()
export class CoinsEventUpdateService{
  private logger = new Logger('CoinsEventUpdateService');
  constructor(private readonly generalPortfolioUpdate:GeneralPortfolioUpdate){}
  async updateEventLog(eventId: number, buySellEvent:Partial<UpdateEventDto>){
  // 1. Check if the coin and the event id of the coin exists
    const{
      id,
      coinName,
      eventType, 
      buySellQuantity, 
      marketPrice, 
      networkFee, 
      exchangePremium, 
      eventDate
    } = buySellEvent
    // Get the coin from the portfolio table
    const coinPresentList: Portfolio[] = 
    await Portfolio.query()
      .where('coinName', '=', coinName)
    this.logger.log(`Coin of event which is to be updated: ${JSON.stringify(coinPresentList)}`)
    // Check if coin exists in portfolio
    if(coinPresentList.length !== 1){
      throw new AbsentException;
    }
    // Retrieve all events of specific coin from the coinEventLog
    const coinId: number = coinPresentList[0].id;
    const coinEventLog:BuySellCoinEvent[] = await BuySellCoinEvent.query()
      .where('coinId', '=', coinId)
      .orderBy('eventDate', 'asc')
    this.logger.log(`coinEventLog: ${JSON.stringify(coinEventLog)}`)
    // Check if the event id is found from the coinEventLog
    // Make eventLog a copy of the event that is to be updated
    let eventLog: BuySellCoinEvent;
    for(let i = 0; i < coinEventLog.length; i++){
      if(Number(coinEventLog[i].id) === Number(eventId)){
        eventLog = Object.assign({}, coinEventLog[i]);
      }
    }
    this.logger.log(`Event log selected for update: ${JSON.stringify(eventLog)}`)
    if(!eventLog){
      throw new EventLogNotFoundException;
    }
  
    // 2. Check if the event type is not DCA event type
    if(eventType === EventType.RecentDCADefiningEventType){
      throw new UpdateDCAEventException;
    }

    // 3. Check if buySellQuantity = 0, throw Exception
    if(buySellQuantity && buySellQuantity <= 0){
      throw new NoneOrNegativeBuySellAmount;
    }

    // 4. Check if eventDate is:
    // 4.1 Before the first coin buy event date & time (first buy Event being updated is an exception)
    // - have to get all buyEvents
    // 4.2 If it's a sell event being updated, ensure the date is unique to the existing log
    let allBuyEvents: BuySellCoinEvent[] = [];  
    for(let i = 0; i < coinEventLog.length; i++){
      if(coinEventLog[i].eventType === EventType.BuyEventType){
        allBuyEvents.push(coinEventLog[i]);
      };
    };
    this.logger.log(`allBuyEvents List: ${JSON.stringify(allBuyEvents)}`);
    if(eventDate){
      if(
        new Date(eventDate).getTime() < 
        new Date(coinEventLog[0].eventDate).getTime() &&
        Number(eventId) !== Number(allBuyEvents[0].id)
      ){
        throw new BeforeFirstBoughtException;
      }
      if(eventType === EventType.SellEventType){
        for(let i = 0; i < coinEventLog.length; i++){
          if(
            eventDate &&
            new Date(eventDate).getTime() === 
            new Date(coinEventLog[i].eventDate).getTime() &&
            new Date(eventDate).getTime() !== 
            new Date(eventLog.eventDate).getTime()
          ){
            this.logger.log(`Conflict: Event date & time being updated shares same date & time with event ID ${coinEventLog[i].id}`)
            throw new SellEventDateNotUniqueException;
          }
        }
      }
    }

    //5. Check if the update is feasible through implementing it on the coinEventLog
    // Check for special cases for both buy & sell:
    // - If Event to update is the first buy event, ensure all buy events and the dca event which shares the same time initially gets updated with new time in coinEventLog
    // - If Event to update is a sell event, ensure that the dca event proceeding it is updated with the new date as well in coinEventLog
    
    // Special case 1: 
    // Check if event to update is buy event, the first buy event & eventDate is before the 3rd event (if exists)
    // If so, if buySellQuantity exists, then update the buyQuantity for the first buy event
    // Update the date for DCA event sharing the same first buy date with the new date 
    // If no 3rd event (updating the only event which is the 1st buy event in the log), then allow the update
    if(
      eventType === EventType.BuyEventType &&
      Number(id) === Number(allBuyEvents[0].id) &&
      eventDate &&
      (coinEventLog[2] ? new Date(eventDate).getTime() < new Date(coinEventLog[2].eventDate).getTime() : true)
    ){
      if(buySellQuantity){
        this.logger.log(`current buyQuantity of the first buy event: ${coinEventLog[1].buyQuantity}`)
        coinEventLog[1].buyQuantity = buySellQuantity;
        this.logger.log(`New buyQuantity of the first buy event: ${coinEventLog[1].buyQuantity}`)
      }
      // Update the date for the first DCA Event (DCA event prior to the first buy event)
      for(let i = 0; i < coinEventLog.length; i++){
        if(
          new Date(coinEventLog[i].eventDate).getTime() === new Date(eventLog.eventDate).getTime() &&
          coinEventLog[i].eventType === EventType.RecentDCADefiningEventType
        ){
          this.logger.log(`For first buy event update, id of the event to be updated: ${coinEventLog[i].id}`)
          this.logger.log(`eventDate of the event to be updated: ${coinEventLog[i].eventDate}`)
          coinEventLog[i].eventDate = eventDate
          this.logger.log(`eventDate for event id ${coinEventLog[i].id} updated to ${coinEventLog[i].eventDate} `)
        }
      }
    }else if(
      eventType === EventType.BuyEventType &&
      Number(id) === Number(allBuyEvents[0].id) &&
      eventDate &&
      new Date(eventDate).getTime() >= new Date(coinEventLog[2].eventDate).getTime()
    ){
      throw new AfterFirstBoughtException;
    }

    // Special case 2: 
    // Check if event to update is sell event
    // If so, update the sell event & DCA event proceeding it & sharing the same time initially with the new eventDate 
    if(
      eventType === EventType.SellEventType &&
      eventDate
    ){
      for(let i = 0; i < coinEventLog.length; i++){
        if(
          new Date(coinEventLog[i].eventDate).getTime() === new Date(eventLog.eventDate).getTime() &&
          coinEventLog[i].eventType !== EventType.BuyEventType
        ){
          coinEventLog[i].eventDate = eventDate;
        }
      }
    }

    // Once done checking for the cases above, update the specific event to be updated in general
    // This will also be doing the same update for the specific event that was considered above
    // This includes the marketPrice, networkFee & exchangePremium fields that doesn't affect positioning of logs
    let newAggregatePrice: number = 0;
    if(
      eventDate || 
      buySellQuantity || 
      marketPrice || 
      networkFee ||
      exchangePremium 
    ){
      for(let i = 0; i < coinEventLog.length; i++){
        if(Number(coinEventLog[i].id) === Number(eventId)){
  
          coinEventLog[i].eventDate = eventDate ? eventDate : eventLog.eventDate
          coinEventLog[i].marketPrice = marketPrice ? marketPrice : eventLog.marketPrice
          coinEventLog[i].networkFee = networkFee ? networkFee : eventLog.networkFee
          coinEventLog[i].exchangePremium = exchangePremium ? exchangePremium : eventLog.exchangePremium

          if(coinEventLog[i].eventType === EventType.BuyEventType){
            coinEventLog[i].buyQuantity = buySellQuantity ? buySellQuantity : eventLog.buyQuantity
            newAggregatePrice = 
              Number(coinEventLog[i].marketPrice) + 
              (Number(coinEventLog[i].exchangePremium) + Number(coinEventLog[i].networkFee))/(Number(coinEventLog[i].buyQuantity)) 
            coinEventLog[i].aggregatePrice = newAggregatePrice
          }else if(coinEventLog[i].eventType === EventType.SellEventType){
            coinEventLog[i].sellQuantity = buySellQuantity ? buySellQuantity : eventLog.sellQuantity
            newAggregatePrice = 
            Number(coinEventLog[i].marketPrice) -
            (Number(coinEventLog[i].exchangePremium) + Number(coinEventLog[i].networkFee))/(Number(coinEventLog[i].sellQuantity)) 
            coinEventLog[i].aggregatePrice = newAggregatePrice;
          }
          this.logger.log(`coinEventLog event updated: ${JSON.stringify(coinEventLog[i])}`)
        }
      }
    }else{
      throw new MissingUpdatesException;
    }
    // Get the DCA event for current event's date range 
    // Get the DCA event for updated event's date range
    // If the event is a buy Event that is to be updated to an earlier time and so happens it is on a DCA event,
    // this will cause a calculation for a range before it (which will return a correct result)
    let allDCAEventsList: BuySellCoinEvent[] = [];
    let allSellEventsList: BuySellCoinEvent[] = [];
    let testingDCAEventsList: BuySellCoinEvent[] = [];
    let testingSellEventsList: BuySellCoinEvent[] = [];
    let currentStartingDCAEvent: BuySellCoinEvent;
    let updatedStartingDCAEvent: BuySellCoinEvent;
    for(let i = 0; i < coinEventLog.length ; i++){
      if(
        coinEventLog[i].eventType === EventType.RecentDCADefiningEventType
      ){
        allDCAEventsList.push(coinEventLog[i]);
      }
      if(
        coinEventLog[i].eventType === EventType.SellEventType
      ){
        allSellEventsList.push(coinEventLog[i]);
      }
      if(
        coinEventLog[i].eventType === EventType.RecentDCADefiningEventType &&
        new Date(coinEventLog[i].eventDate).getTime() < new Date(eventLog.eventDate).getTime() 
        ){
          currentStartingDCAEvent = coinEventLog[i];
      }
      if(
        coinEventLog[i].eventType === EventType.RecentDCADefiningEventType && 
        eventDate &&
        new Date(coinEventLog[i].eventDate).getTime() < new Date(eventDate).getTime() 
        ){
          updatedStartingDCAEvent = coinEventLog[i];
      }
    }
    this.logger.log(`currentStartingDCAEvent: ${JSON.stringify(currentStartingDCAEvent)}`);
    this.logger.log(`updatedStartingDCAEvent: ${JSON.stringify(updatedStartingDCAEvent)}`);
    // Check if the eventDate is equals to or ahead of the current event's date or if there is no eventDate from the req body
    // If so, get all the DCA events since the initial event date & the sell events proceeding it 

    // eventDate might return error if eventDate not being passed in req body
    // may need to check for all fields in req body
    if(
      !eventDate ||
      (
        eventDate && 
        new Date(eventDate).getTime() >= new Date(eventLog.eventDate).getTime()
      )
      ){
      // implement the last DCA Event before the current event in testingDCAEventList
      
      // currentStartingDCAEvent will not push if the event is the first buy event
      // there are no DCA events with dates before the first buy event
      if(currentStartingDCAEvent){
        testingDCAEventsList.push(currentStartingDCAEvent);
      }
      for(let i = 0; i < allDCAEventsList.length; i++){
        if(
          allDCAEventsList[i].eventType === EventType.RecentDCADefiningEventType &&
          new Date(allDCAEventsList[i].eventDate).getTime() >= new Date(eventLog.eventDate).getTime() 
        ){
          testingDCAEventsList.push(allDCAEventsList[i]);
        }
      }
      for(let i = 0; i < allSellEventsList.length; i++){
        if(
          allSellEventsList[i].eventType === EventType.SellEventType &&
          new Date(allSellEventsList[i].eventDate).getTime() >= new Date(eventLog.eventDate).getTime() 
        ){
          testingSellEventsList.push(allSellEventsList[i]);
        }
      }
      // sort the arrays so that events are from earliest to latest (ascending order)
      testingDCAEventsList.sort((a,b)=>{return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()})
      testingSellEventsList.sort((a,b)=>{return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()})
      this.logger.log(`testingDCAEventsList for events updated AFTER intital event: ${JSON.stringify(testingDCAEventsList)}`)
      this.logger.log(`testingSellEventsList for events updated AFTER intital event: ${JSON.stringify(testingSellEventsList)}`)
    }
    // If the eventDate is to be before the current event's date
    // Get all DCA events since the eventDate (the date to be updated to) and the sell events proceeding it
    else if(
      eventDate &&
      new Date(eventDate).getTime() < new Date(eventLog.eventDate).getTime()
    ){
      // implement the last DCA Event before the updated event in testingDCAEventList
      
      // updatedStartingDCAEvent will not push if the event being updated is updated to the first buy event's date
      // as the updatedStartingDCAEvent doesn't exists (no DCA events prior to the first DCA event)
      if(updatedStartingDCAEvent){
        testingDCAEventsList.push(updatedStartingDCAEvent);
      }
      for(let i = 0; i < allDCAEventsList.length; i++){
        if(
          allDCAEventsList[i].eventType === EventType.RecentDCADefiningEventType &&
          new Date(allDCAEventsList[i].eventDate).getTime() >= new Date(eventDate).getTime() 
        ){
          testingDCAEventsList.push(allDCAEventsList[i]);
        }
      }
      for(let i = 0; i < allSellEventsList.length; i++){
        if(
          allSellEventsList[i].eventType === EventType.SellEventType &&
          new Date(allSellEventsList[i].eventDate).getTime() >= new Date(eventDate).getTime() 
        ){
          testingSellEventsList.push(allSellEventsList[i]);
        }
      }
      testingDCAEventsList.sort((a,b)=>{return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()})
      testingSellEventsList.sort((a,b)=>{return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()})
      this.logger.log(`testingDCAEventsList for events updated BEFORE intital event: ${JSON.stringify(testingDCAEventsList)}`)
      this.logger.log(`testingSellEventsList for events updated BEFORE intital event: ${JSON.stringify(testingSellEventsList)}`)
    }
    // Looping through the newly made testingDCAEventsList
    for(let i = 0; i < testingDCAEventsList.length; i++){
      // When reached the final DCA (since no Sell event after it), break the loop)
      if(testingDCAEventsList.indexOf(testingDCAEventsList[i]) === (testingDCAEventsList.length - 1)){
        break;
      }
      // starting point of the current range
      let currentDCAEvent: BuySellCoinEvent = testingDCAEventsList[i];
      // ending point of the current range
      let currentSellEvent: BuySellCoinEvent = testingSellEventsList[i];
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
      if(testingDCAEventsList[i+1]){
        testingDCAEventsList[i+1].buyQuantity = remainingAfterSellEvent;
        testingDCAEventsList[i+1].aggregatePrice = totalWeightedBoughtInCurrentRange / totalBoughtInCurrentRange;
        this.logger.log(`the testingDCAEventsList list changed at index ${testingDCAEventsList.indexOf(testingDCAEventsList[i+1])}, where the list is updated as follows: ${JSON.stringify(testingDCAEventsList)}`)
      }
    }
    this.logger.log(`Potential update is possible!`);

    // Update the event log in the DB by:
    //  - updating the targeted Event based on id of event
    //  - updating all DCA events with the testingDCAEventsList
    const newlyUpdatedEvent: BuySellCoinEvent = 
    await BuySellCoinEvent.query()
      .patchAndFetchById(
        buySellEvent.id,
        {
          buyQuantity: 
            buySellEvent.eventType === EventType.BuyEventType && buySellQuantity ?
            buySellQuantity : eventLog.buyQuantity,
          sellQuantity: 
            buySellEvent.eventType === EventType.SellEventType && buySellQuantity ?
            buySellQuantity : eventLog.sellQuantity,
          eventDate: eventDate ? eventDate : eventLog.eventDate,
          marketPrice: marketPrice ? marketPrice : eventLog.marketPrice,
          networkFee: networkFee ? networkFee : eventLog.networkFee,
          exchangePremium: exchangePremium ? exchangePremium : eventLog.exchangePremium,
          aggregatePrice: newAggregatePrice
      })
    for(let i = 0; i < testingDCAEventsList.length; i++){
      await BuySellCoinEvent.query()
        .findById(testingDCAEventsList[i].id)
        .patch(
        {
          buyQuantity: testingDCAEventsList[i].buyQuantity,
          aggregatePrice: testingDCAEventsList[i].aggregatePrice,
          eventDate: testingDCAEventsList[i].eventDate
        }
      )
    }
    // Use generalPortfolioUpdateFunction to update all of the coin in portfolio
    const updatedBuySellCoinEvent: Partial<BuySellCoinEvent> = {
      coinId: coinId
    }
    await this.generalPortfolioUpdate.generalPortfolioUpdateFunction(updatedBuySellCoinEvent)

    return {
      status: true,
      coinName: coinName,
      eventId: id,
      buySellEventBeforeUpdate: eventLog,
      buySellEventAfterUpdate: newlyUpdatedEvent
    };

  };
}