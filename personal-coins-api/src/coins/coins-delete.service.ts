import { Injectable, Logger } from "@nestjs/common";
import { BuySellCoinEvent } from "database/models/buy-sell-coin-event";
import { Portfolio } from "database/models/portfolio";
import { AbsentException } from "src/exceptions/api-exceptions";

@Injectable()
export class CoinsDeleteService{
  private logger = new Logger('CoinsDeleteService');
  // constructor(private readonly generalPortfolioUpdate:GeneralPortfolioUpdate){}
  async deleteCoin(coinName: string){
    coinName = coinName[0].toUpperCase() + coinName.slice(1);

    // Get the coin from the portfolio table
    const coinPresentList: Portfolio[] = 
    await Portfolio.query()
      .where('coinName', '=', coinName)
    this.logger.log(`Coin to be deleted: ${JSON.stringify(coinPresentList)}`)
    // Check if coin exists in portfolio
    if(coinPresentList.length !== 1){
      throw new AbsentException;
    }
    this.logger.log(`coinPresent: ${JSON.stringify(coinPresentList[0])}`);

    // Delete all the events where the coinId equals the id of the coin
    const {id} = coinPresentList[0];
    const numberOfEventsDeleted:number = 
      await BuySellCoinEvent.query()
        .delete()
        .where('coinId', '=', id)
    
    // Delete the coin from the Portfolio
    const deletedCoin:Portfolio[] = 
      await Portfolio.query()
        .delete()
        .where('id', '=', id)
        .returning('*')

    return {
      status: true,
      deletedCoin,
      numberOfEventsDeleted
    }
  }
}