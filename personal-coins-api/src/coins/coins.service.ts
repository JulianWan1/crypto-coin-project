import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateCoinDto } from 'src/dto/update-coin.dto';
import { Coin } from 'src/entities/coin.entity';
import { CreateCoinDto } from '../dto/create-coin.dto';
import { CreateCoinDao } from '../dao/create-coin.dao'
import { GetCoinDao } from 'src/dao/get-coin.dao';
import { UpdateCoinDao } from 'src/dao/update-coin.dao';
import { DeleteCoinDao } from 'src/dao/delete-coin.dao';

@Injectable()
export class CoinsService {

  constructor(
    private readonly createCoinDao:CreateCoinDao,
    private readonly getCoinDao:GetCoinDao,
    private readonly updateCoinDao:UpdateCoinDao,
    private readonly deleteCoinDao:DeleteCoinDao
    ){};

  private coins: Coin[] = [
    {
      id: 1,
      coinName: "Bitcoin",
      currentAmountOwned: 0.5,
      currentCoinMarketPrice: 59000.00,
      dollarCostAverage: 39000.00,
      dollarSoldAverage: 120000.00,
      totalBought: 0.5,
      totalSold: 0.5,
      unrealisedProfitLossPercentage: 51.28,
      realisedProfitLossPercentage: 207.7,
      lastBoughtAmount: 0.02,
      lastBoughtDate: "12/04/2020",
      lastSoldAmount: 0.1,
      lastSoldDate: "10/06/2019",
    },
    {
      id: 2,
      coinName: "Ethereum",
      currentAmountOwned: 1,
      currentCoinMarketPrice: 4000,
      dollarCostAverage: 1000,
      dollarSoldAverage: 3000,
      totalBought: 0.5,
      totalSold: 0.2,
      unrealisedProfitLossPercentage: 400,
      realisedProfitLossPercentage: 200,
      lastBoughtAmount: 0.03,
      lastBoughtDate: "12/04/2020",
      lastSoldAmount: 0.2,
      lastSoldDate: "10/06/2019"
  }
  ]

  async findAll(coinName?: string) {
    if(coinName){
      const userCoinList = await this.getCoinDao.getCoin()
      const userCoin = userCoinList.find(coin => coin.coinName === coinName);
        if(userCoin){
          return [userCoin]
        }
      throw new NotFoundException("No coin of such name found")
    }
    // const coinList = this.getCoinDao.getCoin
    // return coinList;
    const coinList:Coin[] = await this.getCoinDao.getCoin();
    return {
      data: coinList.map((eachCoin)=>({...eachCoin}))
    };
  };

  async find(id: number): Promise<Coin> {
    const userCoinList = await this.getCoinDao.getCoin()
    const userCoin = userCoinList.find(coin => coin.id === id);
      if(userCoin){
        return userCoin
      }
      throw new NotFoundException("No coin of such ID found to retrieve")
  //   const [coin, coinIndex] = this.findCoin(id);
  // if(coin && coinIndex || coinIndex === 0){
  //   return coin
  // }    
  // throw new Error('No coin found to retrieve')
  }

  create(newCoin: CreateCoinDto) {
    // const id = new Date().valueOf();
    // this.coins.push( 
    //   {
    //   id: id,
    //   ...newCoin,
    //   }
    // );
    return this.createCoinDao.createCoin(newCoin);
  }

  update(id: number, updatedCoinProperties: UpdateCoinDto): Promise<number>{
    // const [coin, coinIndex] = this.findCoin(id)
    // if(coin && coinIndex || coinIndex === 0){
    //   this.coins[coinIndex] = {...coin, ...updatedCoinProperties};
    //   return;
    // }
    if(id && updatedCoinProperties){
      return this.updateCoinDao.updateCoin(id,updatedCoinProperties);
    }
    throw new Error('No coin found to update');
  };

  delete(id: number): Promise<string>{
    if(id){
      return this.deleteCoinDao.deleteCoin(id);
    };
    throw new Error('No coin found to delete');
    // const coinIndex = this.findCoin(id)[1];
    // this.coins.splice(coinIndex,1);
  };

  private findCoin(id: number): [Coin,number]{
    const coinIndex = this.coins.findIndex((coin) => coin.id === id ); // when using "===" will have error <-- used ParseIntPipe to convert id into number
    const coin = this.coins[coinIndex];
    if(!coin){
      throw new NotFoundException('Could not find coin');
    }
    return [coin, coinIndex];
  }

}


// For the POST body
// {
//   "coin": {
//       "coinName": "Ethereum",
//       "currentAmountOwned": 1,
//       "currentCoinMarketPrice": 4000,
//       "dollarCostAverage": 1000,
//       "dollarSoldAverage": 3000,
//       "totalBought": 0.5,
//       "totalSold": 0.2,
//       "unrealisedProfitLossPercentage": 400,
//       "realisedProfitLossPercentage": 200,
//       "lastBoughtAmount": 0.03,
//       "lastBoughtDate": "12/04/2020",
//       "lastSoldAmount": 0.2,
//       "lastSoldDate": "10/06/2019"
//   }
// }