import { Model } from "objection";

export class BuySellCoinEvent extends Model {
  static get tableName() {
    return 'buy_sell_coin_event';
  }
}