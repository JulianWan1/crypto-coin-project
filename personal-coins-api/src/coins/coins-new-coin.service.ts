import { Injectable } from '@nestjs/common';
import { Portfolio } from 'database/models/portfolio';
import { CreateNewCoinDto } from 'src/dto/create-new-coin.dto';
import { Logger } from '@nestjs/common';
import { EventType } from 'src/enum/event-type.enum';
import { BuySellCoinEventEntity } from 'src/entities/buy-sell-coin-event-entity';
import { BuySellCoinEvent } from 'database/models/buy-sell-coin-event';
import GeneralBuyEvent from 'src/general-api-functions/general-buy-event'
import GeneralPortfolioUpdate from 'src/general-api-functions/general-portfolio-update';

@Injectable()
export class CoinsNewService {
  private logger = new Logger('CoinsNewService');
  constructor(
    private readonly generalBuyEvent: GeneralBuyEvent,
    private readonly generalPortfolioUpdate: GeneralPortfolioUpdate
    ){}
  async createNewCoin(coin: CreateNewCoinDto){
    const { 
      coinName, 
      coinCode,
      buyQuantity,
      marketPrice,
      networkFee, 
      exchangePremium,
      buyDate 
    } = coin;
    
    // Set the coin in the portfolio table (initially with coinName and coinCode first, the rest null)
    await Portfolio.query().insert({
      coinName,
      coinCode
    });

    // Get the latest coin created in a list and its id
    const latestCoinList:Portfolio[] = await Portfolio.query()
      .select('*')
      .orderBy('id', 'desc')
      .limit(1)

    const latestCoin:Portfolio = latestCoinList[0];
    const latestCoinId:number = latestCoin.id;
    const latestCoinAddedDate:Date = buyDate
    
    this.logger.log(`latestCoinId: ${latestCoinId}`);

    // Create the first DCA Defining Event when a new coin is made
    const firstDCADefiningEvent: Partial<BuySellCoinEventEntity> = {
      coinId: latestCoinId,
      eventType: EventType.RecentDCADefiningEventType,
      eventDate: buyDate
    };

    // insert the firstDCADefiningEvent to the BuySellCoinEvent table
    await BuySellCoinEvent.query().insert(
      firstDCADefiningEvent
    );

    // Set the general buy event function here
    // place in the buy param (partial BuySellCoinEventEntity)
    // set the aggregate price to null initially as to allow for calculation in the generalCreateBuyEvent func
    const firstBuyEvent: Partial<BuySellCoinEventEntity> = {
      coinId: latestCoinId,
      eventType: EventType.BuyEventType,
      buyQuantity,
      aggregatePrice: null,
      marketPrice,
      networkFee,
      exchangePremium,
      eventDate: buyDate
    }
    
    await this.generalBuyEvent.generalCreateBuyEvent(firstBuyEvent);

    // // Updates the current portfolio table after a purchase was made
    // // (for newly bought coin or pre-existing coin in Portfolio table)
    // this.generalPortfolioUpdate.generalPortfolioUpdateFunction(buyEventForUpdate);

    return {
      status: true,
      latestCoin,
      latestCoinId,
      latestCoinAddedDate
    }

  }
}
