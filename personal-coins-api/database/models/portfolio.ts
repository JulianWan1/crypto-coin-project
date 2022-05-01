import { Model } from "objection";

export class Portfolio extends Model {
  // Tells Objection which table from the DB belongs to this Model
  static get tableName() {
    return 'portfolio';
  };
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