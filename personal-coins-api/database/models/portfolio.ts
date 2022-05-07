import { Model, snakeCaseMappers } from "objection";

// TODO: Set JSONSchema for input validation when making a post request
export class Portfolio extends Model {

  // set the entity of the model here (referred to previous work code)
  id: number;
  coinName: string;
  coinCode: string;
  currentAmountOwned: number | null;
  currentDollarCostAverage: number | null;
  dollarSoldAverage: number | null;
  totalBought: number | null;
  totalSold: number | null;
  realisedProfitLossPercentage: number | null;
  createdAt: Date;
  updatedAt: Date;

  // Tells Objection which table from the DB belongs to this Model
  static get tableName() {
    return 'portfolio';
  } 

  // Sets the relationship between the BuySellCoinEvent and the Portfolio models
  static get relationMappings(){
    // set import here to prevent circular dependency
    const BuySellCoinEvent = require('./buy-sell-coin-event');
    return {
      buySellCoinEvent: {
        relation: Model.HasManyRelation,
        modelClass: BuySellCoinEvent,
        join: {
          from: 'portfolio.id',
          to: 'buy_sell_coin_event.coin_id'
        }
      }
    };
  }
}