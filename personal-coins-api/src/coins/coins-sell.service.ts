import { Injectable, Logger } from "@nestjs/common";
import { BuySellCoinEvent } from "database/models/buy-sell-coin-event";
import { Portfolio } from "database/models/portfolio";
import { CreateNewEventDto } from "src/dto/create-new-event.dto";
import { BuySellCoinEventEntity } from "src/entities/buy-sell-coin-event-entity";
import { EventType } from "src/enum/event-type.enum";
import { AbsentException, BeforeFirstBoughtException, ExceedingBuyQuantityException, ExceedingTotalBoughtException, NoneOrNegativeBuySellAmount, SellEventDateNotUniqueException } from "src/exceptions/api-exceptions";
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