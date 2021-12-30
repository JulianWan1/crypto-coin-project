import { Injectable } from '@nestjs/common';
import { CreateCoinDto } from 'src/dto/create-coin.dto';
import { db } from '../../database/database';

@Injectable()
export class CreateCoinDao {
  async createCoin(newCoin: CreateCoinDto) {
    const {
      coinName,
      currentAmountOwned,
      currentCoinMarketPrice,
      dollarCostAverage,
      dollarSoldAverage,
      totalBought,
      totalSold,
      unrealisedProfitLossPercentage,
      realisedProfitLossPercentage,
      lastBoughtAmount,
      lastBoughtDate,
      lastSoldAmount,
      lastSoldDate,
    } = newCoin;
    const [id] = await db('user_coin')
      .insert({
        coin_name: coinName,
        current_amount_owned: currentAmountOwned,
        current_coin_market_price: currentCoinMarketPrice,
        dollar_cost_average: dollarCostAverage,
        dollar_sold_average: dollarSoldAverage,
        total_bought: totalBought,
        total_sold: totalSold,
        unrealised_profit_loss_percentage: unrealisedProfitLossPercentage,
        realised_profit_loss_percentage: realisedProfitLossPercentage,
        last_bought_amount: lastBoughtAmount,
        last_bought_date: lastBoughtDate,
        last_sold_amount: lastSoldAmount,
        last_sold_date: lastSoldDate
      })
      .returning('id');

    return id;
  };
};
