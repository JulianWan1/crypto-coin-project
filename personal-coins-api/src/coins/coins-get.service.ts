import { Injectable, Logger } from "@nestjs/common";
import { contains } from "class-validator";
import { BuySellCoinEvent } from "database/models/buy-sell-coin-event";
import { Portfolio } from "database/models/portfolio";
import { EventType } from "src/enum/event-type.enum";
import { AbsentException } from "src/exceptions/api-exceptions";
import { MainPagePortfolio } from "src/models/coin-related.model";

@Injectable()
export class CoinsGetService{
  private logger = new Logger('CoinsDeleteService');

  // 1. Function to get all coins from portfolio
  async getAllPortfolioCoins(){
    // Get all the coins from portfolio
    const allPortfolioCoins:Portfolio[] =
      await Portfolio.query()
    // Have to set the last bought & sell quantities and dates respectively for each coin
    // Loop through allPortfolioCoins array
    // In each iteration:
    // - set initial variables for the last bought & date, last sold & date (if there is a sell)
    // - query all the events for the coin
    // - get all the buy events & sell events
    // - get the final buy and sell event
    // - set the variables with the respective final events
    // - push the entry in mainPagePortfolioCoins
    // once done, return mainPortfolioCoins as response body
    let mainPagePortfolioCoins:MainPagePortfolio[] = []
    for(let i = 0; i < allPortfolioCoins.length; i++){
      let lastBoughtAmount: number = 0;
      let lastBoughtDate: Date;
      let lastSoldAmount: number | null = null;
      let lastSoldDate: Date | null = null;
      
      let selectedCoinId:number = allPortfolioCoins[i].id;
      let allSelectedCoinEvents: BuySellCoinEvent[] = 
        await BuySellCoinEvent.query()
          .where('coinId', '=', selectedCoinId)
          .orderBy([
            {column:'eventDate', order:'asc'},
            {column:'eventType', order:'asc'}
          ])

      let allSelectedCoinBuyEvents: BuySellCoinEvent[] = [];
      let allSelectedCoinSellEvents: BuySellCoinEvent[] = [];
      for(let i = 0; i < allSelectedCoinEvents.length; i++){
        if(allSelectedCoinEvents[i].eventType === EventType.BuyEventType){
          allSelectedCoinBuyEvents.push(allSelectedCoinEvents[i]);
        }else if(allSelectedCoinEvents[i].eventType === EventType.SellEventType){
          allSelectedCoinSellEvents.push(allSelectedCoinEvents[i]);
        }
      }
      let lastBoughtEvent:BuySellCoinEvent = allSelectedCoinBuyEvents.slice(-1)[0];
      let lastSoldEvent:BuySellCoinEvent | null = allSelectedCoinSellEvents.length > 0 ? allSelectedCoinSellEvents.slice(-1)[0] : null;
      this.logger.log(`lastBoughtEvent for coinId ${selectedCoinId}: ${JSON.stringify(lastBoughtEvent)}`);
      this.logger.log(`lastSoldEvent for coinId ${selectedCoinId}: ${lastSoldEvent === null ? lastSoldEvent : JSON.stringify(lastSoldEvent)}`)
      if(lastBoughtEvent){
        lastBoughtAmount = Number(lastBoughtEvent.buyQuantity);
        lastBoughtDate = lastBoughtEvent.eventDate;
      }
      if(lastSoldEvent){
        lastSoldAmount = Number(lastSoldEvent.sellQuantity);
        lastSoldDate = lastSoldEvent.eventDate;
      }
      
      let updatedPortfolioCoin:MainPagePortfolio = 
        {...allPortfolioCoins[i], 
          lastBoughtAmount, 
          lastBoughtDate, 
          lastSoldAmount, 
          lastSoldDate
        }

      mainPagePortfolioCoins.push(updatedPortfolioCoin);
      this.logger.log(`mainPagePortfolioCoins: ${JSON.stringify(mainPagePortfolioCoins)}`);
    }
    return mainPagePortfolioCoins;
  };

  // 2. Function to get all events for a specific coin
  async getAllCoinEvents(coinName: string){
    coinName = coinName[0].toUpperCase() + coinName.slice(1);
    this.logger.log(`Transformed toUpperCase coinName: ${coinName}`);
    // Get the coin from the portfolio table
    const coinPresentList: Portfolio[] = 
    await Portfolio.query()
      .where('coinName', '=', coinName)
    this.logger.log(`Coin to be retrieved: ${JSON.stringify(coinPresentList)}`)
    // Check if coin exists in portfolio
    if(coinPresentList.length !== 1){
      throw new AbsentException;
    }
    this.logger.log(`coinPresent: ${JSON.stringify(coinPresentList[0])}`);
    // Retrieve all events of specific coin from the coinEventLog
    // Arrange based on eventDate and eventType, both ascending order (lowest to highest value)
    const coinId: number = coinPresentList[0].id;
    const coinEventLog:BuySellCoinEvent[] = 
      await BuySellCoinEvent.query()
        .where('coinId', '=', coinId)
        .orderBy([
          {column:'eventDate', order:'asc'},
          {column:'eventType', order:'asc'}
        ])
    this.logger.log(`coinEventLog: ${JSON.stringify(coinEventLog)}`)
    return {
      coinName,
      coinEventLog
    };
  }

}