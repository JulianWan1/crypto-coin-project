import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { Portfolio } from 'database/models/portfolio';
import { CreateNewCoinDto } from 'src/dto/create-new-coin.dto';
import { DuplicateException } from 'src/exceptions/api-exceptions';
import { CoinsNewService } from './coins-new-coin.service';

@Controller('coins')
export class CoinsController {
  private logger = new Logger('CoinsController');
  constructor(private readonly coinsNewService: CoinsNewService){}

  @Post('/')
  async createNewCoin(@Body() coin:CreateNewCoinDto){
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
        const retrievedCoin =  await this.coinsNewService.createNewCoin(coin)
        return retrievedCoin
      }else{
        return new DuplicateException;
      }
    }catch(err){
      this.logger.log(err);
    }
  }

  @Get()
  async getAllCoins(): Promise<any>{}

}