import { Model } from "objection";

// TODO: Set JSONSchema for input validation when making a post request
export class BuySellCoinEvent extends Model {

  id: number;
  coinId: number;
  eventType: number;
  buyQuantity: number | null;
  aggregatePrice: number | null;
  sellQuantity: number | null;
  marketPrice: number | null;
  networkFee: number | null;
  exchangePremium: number | null;
  eventDate: Date;
  createdAt: Date;
  updatedAt: Date;
  
  static get tableName() {
    return 'buySellCoinEvent';
  }
}