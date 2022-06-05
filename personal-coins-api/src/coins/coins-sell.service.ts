import { Injectable, Logger } from "@nestjs/common";
import { BuySellCoinEvent } from "database/models/buy-sell-coin-event";
import { Portfolio } from "database/models/portfolio";
import { CreateNewEventDto } from "src/dto/create-new-event.dto";
import { BuySellCoinEventEntity } from "src/entities/buy-sell-coin-event-entity";
import { EventType } from "src/enum/event-type.enum";
import { AbsentException, BeforeFirstBoughtException, ExceedingBuyQuantityException, ExceedingOwnedFromSpilloverException, ExceedingTotalBoughtException, NoneOrNegativeBuySellAmount, SellEventDateNotUniqueException } from "src/exceptions/api-exceptions";
import GeneralSellEvent from "src/general-api-functions/general-sell-event";

@Injectable()
export class CoinsSellService {
  private logger = new Logger('CoinsSellService');
  constructor(private readonly generalSellEvent: GeneralSellEvent){}
  async createNewSell(coinName:string, coin:CreateNewEventDto){
    coinName = coinName[0].toUpperCase() + coinName.slice(1);
    this.logger.log(`Transformed toUpperCase coinName: ${coinName}`);

    // 1. Check if coin to sell exists
    // 2. Check if amount of coin to sell > 0
    // 3. Disallow Sell Event to be before the initial buy event/DCA of coin
    // 4. Disallow Sell Event to have same time as any existing Buy/Sell/DCA Defining events (must be unique in eventDate) 
    // 5. Check if the coin buySellQuantity <= than the amount bought before this sell event date
    // 6. Check if the coin buySellQuantity makes the total amount sold to still be <= than the total amount bought (can use the data from portfolio table)
    
    // Get the coin from the portfolio table
    const coinPresentList: Portfolio[] = 
    await Portfolio.query()
      .where('coinName', '=', coinName)
    this.logger.log(`coinPresent: ${JSON.stringify(coinPresentList)}`)

    // 1. Check if coin to sell exists in portfolio
    if(coinPresentList.length !== 1){
      throw new AbsentException;
    }

    // 2. Check if amount of coin to sell > 0
    if(coin.buySellQuantity <= 0){
      throw new NoneOrNegativeBuySellAmount;
    }

    // If yes to 1. & 2., get all events from the coin, starting from the earliest event to latest event
    const { id } = coinPresentList[0]
    const coinEventLog: BuySellCoinEvent[] = 
      await BuySellCoinEvent.query()
      .where('coinId', '=', id)
      .orderBy('eventDate','asc')
    const firstDCADefiningEvent: BuySellCoinEvent = coinEventLog[0];
    this.logger.log(`firstDCADefiningEvent: ${JSON.stringify(firstDCADefiningEvent)}`)

    // 3. Ensure Sell Event to be after the initial buy event/DCA of coin 
    if(new Date(coin.buySellDate).getTime() <= new Date(firstDCADefiningEvent.eventDate).getTime()){
      throw new BeforeFirstBoughtException;
    }

    // 4. Ensure Sell Event date/time is unique/not shared with other existing events
    let similarDateTimeEventList: BuySellCoinEvent[] = [];
    for(let i = 0; i < coinEventLog.length; i++){
      if(new Date(coinEventLog[i].eventDate).getTime() === new Date(coin.buySellDate).getTime()){
        similarDateTimeEventList.push(coinEventLog[i]);
      }
    }
    this.logger.log(`similarDateTimeEventList: ${similarDateTimeEventList}`);

    // if the list is empty, the sell event date and time is unique
    if(similarDateTimeEventList.length  >= 1){
      throw new SellEventDateNotUniqueException;
    }

    // Get all the DCA events prior to sell event date in a list and retrieve the last DCA event from list
    let allDCAEventsList: BuySellCoinEvent[] = [];
    for(let i = 0; i < coinEventLog.length ; i++){
      if(
        coinEventLog[i].eventType === EventType.RecentDCADefiningEventType &&
        new Date(coinEventLog[i].eventDate).getTime() < new Date(coin.buySellDate).getTime() 
        ){
          allDCAEventsList.push(coinEventLog[i]);
      }
    }
    this.logger.log(`allDCAEventsList: ${JSON.stringify(allDCAEventsList)}`);
    // Get the last DCA event since this sell event
    // Calculate the total amount of coins bought since the last DCA event till (& not including) the coin's buySellDate
    const lastDCAEventSinceSellEvent:BuySellCoinEvent = allDCAEventsList.slice(-1)[0];
    let latestDCAAndBuyEventsList:BuySellCoinEvent[] = []; 
    let latestTotalAmountBought: number = 0;
    for(let i = 0; i < coinEventLog.length; i++){
      if(
        new Date(coinEventLog[i].eventDate).getTime() >= new Date(lastDCAEventSinceSellEvent.eventDate).getTime() &&
        new Date(coinEventLog[i].eventDate).getTime() < new Date(coin.buySellDate).getTime() &&
        coinEventLog[i].eventType !== EventType.SellEventType
        ){
          latestDCAAndBuyEventsList.push(coinEventLog[i]);
          latestTotalAmountBought += Number(coinEventLog[i].buyQuantity);
      }
    }
    this.logger.log(`latestDCAAndBuyEventList: ${JSON.stringify(latestDCAAndBuyEventsList)}`);
    this.logger.log(`latestTotalAmountBought: ${latestTotalAmountBought}`);

    // 5. Check if the coin buySellQuantity <= than the amount bought before this sell event date
    if(coin.buySellQuantity > latestTotalAmountBought){
      throw new ExceedingBuyQuantityException;
    }

    // 6. Check if the coin buySellQuantity makes the total amount sold to still be <= than the total amount bought
    const generalTotalBought: number = Number(coinPresentList[0].totalBought);
    const generalTotalSold: number = Number(coinPresentList[0].totalSold);
    const potentialTotalSold: number = generalTotalSold + Number(coin.buySellQuantity);
    this.logger.log(`potentialTotalSold: ${potentialTotalSold}`)
    
    if (potentialTotalSold > generalTotalBought){
      throw new ExceedingTotalBoughtException;
    }

    // 7. Check if Insufficient Amount Bought Spillover (refer to Potential Bugs & Issues in Excel sheet (Table_overhaul_19_04_2022) for more info)

    // Check if the potential sell event is going to be the last sell event or in between other sell events with reference to the copyOfCoinEventLog
    // Get all the proceeding sell events & set the potentialLastSellEvent to false if the potential sell event is not going to be the last sell event
    // Also, if the event is a DCA event, push the entries in the dcaEventRelatedToPotential list (which already has the starting dcaEvent)
    let potentialLastSellEvent:boolean = true;
    // The starting Sell Event (potentialSellEvent)
    const partialPotentialSellEvent: Partial<BuySellCoinEvent> = 
    {
      sellQuantity: coin.buySellQuantity, 
      eventDate: coin.buySellDate
    };
    let sellEventsProceedingPotential: Partial<BuySellCoinEvent>[] = [
      partialPotentialSellEvent
    ];
    // The starting DCA (DCA event before the potentialSellEvent)
    const partialLastDCAEventSinceSellEvent: Partial<BuySellCoinEvent> = 
      {
        buyQuantity: lastDCAEventSinceSellEvent.buyQuantity,
        eventDate: lastDCAEventSinceSellEvent.eventDate
      }
    // The second DCA (DCA event following the potentialSellEvent)
    const partialPotentialDCAEvent: Partial<BuySellCoinEvent> = 
      {
        buyQuantity: Number(latestTotalAmountBought) - Number(coin.buySellQuantity),
        eventDate: coin.buySellDate
      };
    let dcaEventRelatedToPotential: Partial<BuySellCoinEvent>[] = [
      partialLastDCAEventSinceSellEvent, partialPotentialDCAEvent
    ];
    // make copy of coinEventLog as to not contaminate the original
    let copyOfCoinEventLog: BuySellCoinEvent[] = coinEventLog;
    for(let i = 0; i < copyOfCoinEventLog.length ; i++){
      if(copyOfCoinEventLog[i].eventType === EventType.SellEventType && 
        new Date(copyOfCoinEventLog[i].eventDate).getTime() > 
        new Date(coin.buySellDate).getTime()
      ){
        const {sellQuantity, eventDate} = copyOfCoinEventLog[i];
        let partialSellEvent: Partial<BuySellCoinEvent> = {
          sellQuantity,
          eventDate
        };
        sellEventsProceedingPotential.push(partialSellEvent);
        potentialLastSellEvent = false;

      }
      else if(copyOfCoinEventLog[i].eventType === EventType.RecentDCADefiningEventType && 
        new Date(copyOfCoinEventLog[i].eventDate).getTime() > 
        new Date(coin.buySellDate).getTime()
      ){
        const {buyQuantity, eventDate} = copyOfCoinEventLog[i];
        let partialDCAEvent: Partial<BuySellCoinEvent> = {
          buyQuantity,
          eventDate
        };
        dcaEventRelatedToPotential.push(partialDCAEvent);
      }
    }
    this.logger.log(`dcaEventRelatedToPotential: ${JSON.stringify(dcaEventRelatedToPotential)}`)
    this.logger.log(`sellEventsProceedingPotential: ${JSON.stringify(sellEventsProceedingPotential)}`)
    // If potentialSellEvent is going to be found before other existing sell events, start checking the spillover
    if(!potentialLastSellEvent){
      for(let i = 0; i < dcaEventRelatedToPotential.length; i++){
        // When reached the final DCA (since no Sell event after it), break the loop)
        if(dcaEventRelatedToPotential.indexOf(dcaEventRelatedToPotential[i]) === (dcaEventRelatedToPotential.length - 1)){
          break;
        }
        // starting point of the current range
        let currentDCAEvent: Partial<BuySellCoinEvent> = dcaEventRelatedToPotential[i];
        // ending point of the current range
        let currentSellEvent: Partial<BuySellCoinEvent> = sellEventsProceedingPotential[i];
        // set variable (totalBoughtInCurrentRange) that will be the amount bought/owned in current range
        // since the partialPotentialDCAEvent is not present in the copyOfCoinEventLog, make the initial totalBoughtInCurrentRange to be equal to partialPotentialDCAEvent's buyQuantity when it reaches this DCA event to make up for its absence from the copyOfCoinEventLog
        // remainingAfterSellEvent is the amount left after the sell event, meant to update the following DCA buyQuantity in the dcaEventRelatedToPotential list
        let totalBoughtInCurrentRange: number = currentDCAEvent === partialPotentialDCAEvent ? partialPotentialDCAEvent.buyQuantity : 0;
        let remainingAfterSellEvent: number = 0;
        for(let i = 0; i < copyOfCoinEventLog.length; i++){  
          if(new Date(copyOfCoinEventLog[i].eventDate).getTime() >= new Date(currentDCAEvent.eventDate).getTime() && new Date(copyOfCoinEventLog[i].eventDate).getTime() < new Date(currentSellEvent.eventDate).getTime() && copyOfCoinEventLog[i].eventType !== EventType.SellEventType){
        // if event is a DCA event, ensure that it's value gets updated with the new dca buyQuantity (where the update was made on dcaEventRelatedToPotential on the iteration beforehand)
            if(copyOfCoinEventLog[i].eventType === EventType.RecentDCADefiningEventType){
              copyOfCoinEventLog[i].buyQuantity = currentDCAEvent.buyQuantity;
            }
            this.logger.log(`Initial totalBoughtInCurrentRange: ${totalBoughtInCurrentRange}`)
            this.logger.log(`buyQuantity: ${copyOfCoinEventLog[i].buyQuantity}`)
            totalBoughtInCurrentRange += Number(copyOfCoinEventLog[i].buyQuantity);
          }
        }
        remainingAfterSellEvent = totalBoughtInCurrentRange - Number(currentSellEvent.sellQuantity)
        this.logger.log(`totalBoughtInCurrentRange: ${totalBoughtInCurrentRange}`);
        this.logger.log(`remainingAfterSellEvent: ${remainingAfterSellEvent}`);
        // if the totalBoughtInCurrentRange is less than the currentSellEvent's sell quantity
        if(totalBoughtInCurrentRange < Number(currentSellEvent.sellQuantity)){
          this.logger.log(`sell quantity more than buy quantity (spillover issue) arises bewteen ${new Date(currentDCAEvent.eventDate)} & ${new Date(currentSellEvent.eventDate)}`);
          throw new ExceedingOwnedFromSpilloverException(new Date(currentDCAEvent.eventDate), new Date(currentSellEvent.eventDate));
        }
        if(dcaEventRelatedToPotential[i+1]){
          dcaEventRelatedToPotential[i+1].buyQuantity = remainingAfterSellEvent;
          this.logger.log(`the dcaEventRelatedToPotential list changed at index ${dcaEventRelatedToPotential.indexOf(dcaEventRelatedToPotential[i+1])}, where the list is updated as follows: ${JSON.stringify(dcaEventRelatedToPotential)}`)
        }
      }
      this.logger.log(`potential sell event doesn't cause any issues!`)
    }

    // Set the sellEvent to be passed to the generalCreateSellEvent function
    // transfer the coinEventLog as well for dca defining event function (which is in general-sell-event file)
    const {
      buySellQuantity,
      marketPrice,
      networkFee,
      exchangePremium,
      buySellDate
    } = coin

    const sellEvent: Partial<BuySellCoinEventEntity> = {
      coinId: id,
      eventType: EventType.SellEventType,
      aggregatePrice: null,
      sellQuantity:buySellQuantity,
      marketPrice,
      networkFee,
      exchangePremium,
      eventDate: buySellDate
    };

    const latestSellEvent: BuySellCoinEvent = 
      await this.generalSellEvent.generalCreateSellEvent(
        sellEvent, 
        latestDCAAndBuyEventsList,
        coinEventLog
      );
    return {
      status: true,
      latestBuySellEvent: latestSellEvent,
      coinId: id,
      latestBuySellDate: buySellDate
    }

  }
}