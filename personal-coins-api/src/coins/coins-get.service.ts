import { Injectable, Logger } from "@nestjs/common";
import { BuySellCoinEvent } from "database/models/buy-sell-coin-event";
import { Portfolio } from "database/models/portfolio";
import { AbsentException } from "src/exceptions/api-exceptions";

@Injectable()
export class CoinsGetService{
  private logger = new Logger('CoinsDeleteService');

  // 1. Function to get all coins from portfolio
  async getAllPortfolioCoins(){
    // Get all the coins from portfolio
    const allPortfolioCoins:Portfolio[] =
      await Portfolio.query()
    return allPortfolioCoins;
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