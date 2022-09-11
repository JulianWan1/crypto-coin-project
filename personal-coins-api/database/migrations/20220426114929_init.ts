import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable('portfolio', (table) => {
      table.increments();
      table.string('coin_name').notNullable().unique();
      table.string('coin_code').notNullable().unique();
      table.decimal('current_amount_owned', 12, 6).nullable();
      table.decimal('current_dollar_cost_average', 9, 2).nullable();
      table.decimal('dollar_sold_average', 9, 2).nullable();
      table.decimal('total_bought', 12, 6).nullable();
      table.decimal('total_sold', 12, 6).nullable();
      table.decimal('realised_profit_loss_percentage', 8, 3).nullable();
      table.timestamps(false, true); 
    })
    .createTable('buy_sell_coin_event', (table) => {
      table.increments();
      table.integer('coin_id').references('id').inTable('portfolio');
      table.integer('event_type').notNullable();
      table.decimal('buy_quantity', 12, 6).nullable();
      table.decimal('aggregate_price', 9, 2).nullable();
      table.decimal('sell_quantity', 12, 6).nullable();
      table.decimal('market_price', 9, 2).nullable();
      table.decimal('network_fee', 9, 2).nullable();
      table.decimal('exchange_premium', 9, 2).nullable();
      table.dateTime('event_date').notNullable();
      table.timestamps(false, true);
    })
};


export async function down(knex: Knex): Promise<void> {
  return knex.raw(
    'DROP TABLE IF EXISTS portfolio, buy_sell_coin_event CASCADE'
  )
};

