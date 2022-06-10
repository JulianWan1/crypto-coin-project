import { Body, Controller, Delete, Get, Logger, Param, Patch, Post } from '@nestjs/common';
import { Portfolio } from 'database/models/portfolio';
import { CreateNewEventDto } from 'src/dto/create-new-event.dto';
import { UpdateEventDto } from 'src/dto/update-event.dto';
import { DuplicateException } from 'src/exceptions/api-exceptions';
import { NewBuySellAdded, NewCoinAdded } from 'src/models/coin-related.model';
import { CoinsBuyService } from './coins-buy.service';
import { CoinsDeleteService } from './coins-delete.service';
import { CoinsEventDeleteService } from './coins-event-delete.service';
import { CoinsEventUpdateService } from './coins-event-update.service';
import { CoinsGetService } from './coins-get.service';
import { CoinsNewService } from './coins-new-coin.service';
import { CoinsSellService } from './coins-sell.service';

@Controller('coins')
export class CoinsController {
  private logger = new Logger('CoinsController');
  constructor(
    private readonly coinsNewService: CoinsNewService,
    private readonly coinsBuyService: CoinsBuyService,
    private readonly coinsSellService: CoinsSellService,
    private readonly coinsEventUpdateService: CoinsEventUpdateService,
    private readonly coinsEventDeleteService: CoinsEventDeleteService,
    private readonly coinsDeleteService: CoinsDeleteService,
    private readonly coinsGetService: CoinsGetService
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
  @Body() coin:CreateNewEventDto
  ){

    return await this.coinsSellService.createNewSell(coinName, coin);

  }

  // PATCH and not PUT as the update is not necessarily meant to update the all of the fields of an event log
  // PATCH only updates the fields that were supplied, leaving the others alone.
  // hence all fields/params of an event are not required to be in the request body
  @Patch('update/:eventId')
  async updateBuySellEvent(
  @Param('eventId') eventId: number,
  @Body() buySellEvent:UpdateEventDto
  ){

    return await this.coinsEventUpdateService.updateEventLog(eventId, buySellEvent);

  }

  // Delete the coin from portfolio & all events associated with it
  @Delete('delete/:coinName')
  async deleteCoin(
    @Param('coinName') coinName: string
  ){

    return await this.coinsDeleteService.deleteCoin(coinName);

  }

  // Delete a specifc event for a specific coin from the BuySellEvent table
  @Delete('delete/:coinName/:eventId')
  async deleteBuySellEvent(
    @Param('coinName') coinName: string,
    @Param('eventId') eventId: number
  ){

    return await this.coinsEventDeleteService.deleteEventLog(coinName, eventId);

  }

  // Get all the coins from the Portfolio table
  @Get('/')
  async getAllCoins():Promise<Portfolio[]>{
    return await this.coinsGetService.getAllPortfolioCoins()
  }

  // Get all the events for a specific coin
  @Get(':coinName')
  async getAllSpecificCoinEvents(
    @Param('coinName') coinName: string
  ){
    return await this.coinsGetService.getAllCoinEvents(coinName)
  }

}