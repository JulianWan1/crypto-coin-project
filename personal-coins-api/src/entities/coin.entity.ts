import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateCoinDto } from 'src/dto/update-coin.dto';

export class Coin {
  @ApiProperty() readonly id: number;
  @ApiProperty() readonly coinName: string;
  @ApiProperty() readonly currentAmountOwned: number;
  @ApiProperty() readonly currentCoinMarketPrice: number;
  @ApiProperty() readonly dollarCostAverage: number;
  @ApiProperty() readonly dollarSoldAverage: number; // may need a previous dollarCostAverage to help calculate realisedProfitLossPercentage?
  @ApiProperty() readonly totalBought: number;
  @ApiProperty() readonly totalSold: number;
  @ApiProperty() readonly unrealisedProfitLossPercentage: number;
  @ApiProperty() readonly realisedProfitLossPercentage: number;
  @ApiProperty() readonly lastBoughtAmount: number;
  @ApiProperty() readonly lastBoughtDate: string;
  @ApiProperty() readonly lastSoldAmount: number;
  @ApiProperty() readonly lastSoldDate: string;
}

export class CoinRetrieved {
  readonly id: number;
  readonly coin_name: string;
  readonly current_amount_owned: number;
  readonly current_coin_market_price: number;
  readonly dollar_cost_average: number;
  readonly dollar_sold_average: number; // may need a previous dollarCostAverage to help calculate realisedProfitLossPercentage?
  readonly total_bought: number;
  readonly total_sold: number;
  readonly unrealised_profit_loss_percentage: number;
  readonly realised_profit_loss_percentage: number;
  readonly last_bought_amount: number;
  readonly last_bought_date: string;
  readonly last_sold_amount: number;
  readonly last_sold_date: string;
}

// TODO:
// 1. Find a way to populate in a DRY manner
// 2. When to use Class, Interface, Entity, DTO, DAO
// 3. Normal to deserialize data retrieved from db this way? (Get object keys in form of table columns instead of the entity class)
// 4. Why Injectable does not get updated into module automatically

@Injectable()
export class CoinDeserializer {
  deserializeRetrievedCoin(retrievedCoin: CoinRetrieved[]): Coin[] {
    
    const deserializedCoinList: Coin[] = [];

    for (const coin of retrievedCoin){

      const {
        id,
        coin_name,
        current_amount_owned,
        current_coin_market_price,
        dollar_cost_average,
        dollar_sold_average,
        total_bought,
        total_sold,
        unrealised_profit_loss_percentage,
        realised_profit_loss_percentage,
        last_bought_amount,
        last_bought_date,
        last_sold_amount,
        last_sold_date
      } = coin;

      const deserializedCoin: Coin = {
        id,
        coinName: coin_name,
        currentAmountOwned: current_amount_owned,
        currentCoinMarketPrice: current_coin_market_price,
        dollarCostAverage: dollar_cost_average,
        dollarSoldAverage: dollar_sold_average,
        totalBought: total_bought,
        totalSold: total_sold,
        unrealisedProfitLossPercentage: unrealised_profit_loss_percentage,
        realisedProfitLossPercentage: realised_profit_loss_percentage,
        lastBoughtAmount: last_bought_amount,
        lastBoughtDate: last_bought_date,
        lastSoldAmount: last_sold_amount,
        lastSoldDate: last_sold_date
      }

      deserializedCoinList.push(deserializedCoin)
    }
    return deserializedCoinList
  }
}

@Injectable()
export class CoinSerializer {
  serializeCoin(coinToSerialize:UpdateCoinDto):CoinRetrieved{

    const{
      id,
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
    } = coinToSerialize;

    const serializedCoin:CoinRetrieved = {
      id,
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
    }

    return serializedCoin;
  }
}