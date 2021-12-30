import { Injectable } from "@nestjs/common";
import { db } from "database/database";

@Injectable()
export class DeleteCoinDao {
  
  async deleteCoin(deleteCoinId:number):Promise<string>{
  
    try{
      const deletedCoinCount = await db('user_coin')
      .where({id: deleteCoinId})
      .del();

      const message = `${deletedCoinCount} Coin has been dropped (Coin ${deleteCoinId})`
      return message;
    }
    catch(err){
      throw err
    };
  };

}