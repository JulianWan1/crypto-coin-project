import { Injectable, Res } from "@nestjs/common";
import { db } from "database/database";
import { UpdateCoinDto } from "src/dto/update-coin.dto";
import { CoinSerializer } from "src/entities/coin.entity";

// export interface UpdateCoinResult {
//   id: number;
//   updatedProperties: UpdateCoinDto;
// }

@Injectable()
export class UpdateCoinDao {
  
  constructor(private readonly coinSerializer:CoinSerializer){}

  async updateCoin(updatedCoinId:number, updatedCoinProperties:UpdateCoinDto){

    const serializedCoin = this.coinSerializer.serializeCoin(updatedCoinProperties)

    try {
      const count =  await db('user_coin')
      .where({id: updatedCoinId})
      .update(serializedCoin)
      
      if(count){
        return count
      }
    }
    catch(err) {
      throw err
    };
  };
  
}