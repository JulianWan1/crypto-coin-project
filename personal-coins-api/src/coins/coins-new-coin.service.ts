import { Injectable } from '@nestjs/common';
import { Portfolio } from 'database/models/portfolio';
import { CreateNewEventDto } from 'src/dto/create-new-event.dto';
import { Logger } from '@nestjs/common';
import { EventType } from 'src/enum/event-type.enum';
import { BuySellCoinEventEntity } from 'src/entities/buy-sell-coin-event-entity';
import GeneralBuyEvent from 'src/general-api-functions/general-buy-event'
import GeneralDCADefiningEvent from 'src/general-api-functions/general-dca-defining-event';
import { DuplicateException, NoCoinFoundException, NoneOrNegativeBuySellAmount } from 'src/exceptions/api-exceptions';
import { existingCoinsList } from 'src/configurations/existing-coins.config';
import { ExistingCoins } from 'src/models/coin-related.model';

@Injectable()
export class CoinsNewService {
  private logger = new Logger('CoinsNewService');
  constructor(
    private readonly generalBuyEvent: GeneralBuyEvent,
    private readonly generalDcaDefiningEvent: GeneralDCADefiningEvent
    ){}
  async createNewCoin(coin: CreateNewEventDto){
    const { 
      coinName, 
      coinCode,
      buySellQuantity,
      marketPrice,
      networkFee, 
      exchangePremium,
      buySellDate 
    } = coin;
    
    // Check if the coin being passed exists
    // AS OF (06/08/2022): Setting Bitcoin, Ethereum, Cardano, & Solana as the only coins that exists for this app at the moment
    const existingCoins:ExistingCoins[] = existingCoinsList;
    let coinFound = existingCoins.find((existingCoin)=>{
      return (
        existingCoin.coinName === coinName && 
        existingCoin.coinCode === coinCode
      )
    });
    this.logger.log(JSON.stringify(coinFound));
    if(!coinFound){
      this.logger.log(JSON.stringify(coinFound));
      throw new NoCoinFoundException;
    };

    // Check if the req body has coin name and code that is already registered in portfolio table
    // to prevent duplicate entry
    const coinIdentityArray:Portfolio[] = await Portfolio
      .query()
      .select('coinName', 'coinCode')
      .returning(['coinName', 'coinCode'],)
      this.logger.log(`here is coinIdentityArray: ${JSON.stringify(coinIdentityArray)}`);
      let coinNameArray: string[] = [];
      let coinCodeArray: string[] = [];
      for(let coinIdentity of coinIdentityArray){
        coinNameArray.push(coinIdentity.coinName)
        coinCodeArray.push(coinIdentity.coinCode)
        this.logger.log(`coinNameArray: ${coinNameArray}`);
        this.logger.log(`coinCodeArray: ${coinCodeArray}`);
      }
    if(
      coinNameArray.includes(coinName) ||
      coinCodeArray.includes(coinCode)
    ){
      throw new DuplicateException;
    }

    // Ensure the amount of the buySellQuantity is more than 0
    if(buySellQuantity <= 0){
      throw new NoneOrNegativeBuySellAmount
    };

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
    const latestCoinAddedDate:Date = buySellDate
    
    this.logger.log(`latestCoinId: ${latestCoinId}`);

    // Create the first DCA Defining Event when a new coin is made
    const firstDCADefiningEvent: Partial<BuySellCoinEventEntity> = {
      coinId: latestCoinId,
      eventType: EventType.RecentDCADefiningEventType,
      eventDate: buySellDate
    };

    // insert the firstDCADefiningEvent to the BuySellCoinEvent table through the generalCreateFirstDCADefiningEvent
    await this.generalDcaDefiningEvent.generalCreateFirstDCADefiningEvent(firstDCADefiningEvent);

    // Set the general buy event function here
    // place in the buy param (partial BuySellCoinEventEntity)
    // set the aggregate price to null initially as to allow for calculation in the generalCreateBuyEvent func
    const firstBuyEvent: Partial<BuySellCoinEventEntity> = {
      coinId: latestCoinId,
      eventType: EventType.BuyEventType,
      buyQuantity:buySellQuantity,
      aggregatePrice: null,
      marketPrice,
      networkFee,
      exchangePremium,
      eventDate: buySellDate
    }

    // Updates the current portfolio table after a purchase was made
    // (for newly bought coin or pre-existing coin in Portfolio table)
    await this.generalBuyEvent.generalCreateBuyEvent(firstBuyEvent);

    return {
      status: true,
      latestCoin,
      latestCoinId,
      latestCoinAddedDate
    }

  }
}
