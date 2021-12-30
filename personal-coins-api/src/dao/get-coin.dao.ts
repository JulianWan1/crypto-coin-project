import { Injectable } from "@nestjs/common";
import { Coin, CoinDeserializer, CoinRetrieved } from "src/entities/coin.entity";
import { db } from '../../database/database';

@Injectable()
export class GetCoinDao {

  constructor(private readonly coinDeserializer:CoinDeserializer){}

  async getCoin():Promise<Coin[]>{
    
    const allSelectedCoins:CoinRetrieved[] = await db('user_coin')
    .select().table('user_coin')
    const deserializedCoin = this.coinDeserializer.deserializeRetrievedCoin(allSelectedCoins)
    return deserializedCoin;
  };
};