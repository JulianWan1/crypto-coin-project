import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { Portfolio } from 'database/models/portfolio';
import { CreateNewEventDto } from 'src/dto/create-new-event.dto';
import { DuplicateException } from 'src/exceptions/api-exceptions';
import { NewBuySellAdded, NewCoinAdded } from 'src/models/coin-related.model';
import { CoinsBuyService } from './coins-buy.service';
import { CoinsNewService } from './coins-new-coin.service';
import { CoinsSellService } from './coins-sell.service';

@Controller('coins')
export class CoinsController {
  private logger = new Logger('CoinsController');
  constructor(
    private readonly coinsNewService: CoinsNewService,
    private readonly coinsBuyService: CoinsBuyService,
    private readonly coinsSellService: CoinsSellService
    ){}

  @Post('/')
  async createNewCoin(@Body() coin:CreateNewEventDto){
    // Check if the req body has coin name and code that is already registered in portfolio table
    // to prevent duplicate entry
    try{
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
        !coinNameArray.includes(coin.coinName) && 
        !coinCodeArray.includes(coin.coinCode)
        ){
        const retrievedCoin: NewCoinAdded =  await this.coinsNewService.createNewCoin(coin)
        return retrievedCoin
      }else{
        return new DuplicateException;
      }
    }catch(err){
      this.logger.log(err);
    }
  }

  // Ensure coinName is LOWERCASE when passed as a param for both buy and sell
  // when received, switch to UPPERCASE FOR FIRST LETTER
  @Post('buy/:coinName')
  async createBuyEvent(
    @Param('coinName') coinName: string,
    @Body() coin:CreateNewEventDto
  ){
    const newBuyEvent: NewBuySellAdded = await this.coinsBuyService.createNewBuy(coinName, coin);
    return newBuyEvent;
  }

  @Post('sell/:coinName')
  async createSellEvent(
  @Param('coinName') coinName: string,
  @Body() coin:CreateNewEventDto){

    return await this.coinsSellService.createNewSell(coinName, coin);

  }

  @Get()
  async getAllCoins(): Promise<any>{}

}