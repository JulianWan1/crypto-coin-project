import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('user_coin', (table) => {
    table.increments('id');
    table.string('coin_name').notNullable().unique();
    table.decimal('current_amount_owned', 9, 5).notNullable();
    table.decimal('current_coin_market_price', 9, 5).notNullable();
    table.decimal('dollar_cost_average', 8, 2).notNullable();
    table.decimal('dollar_sold_average', 8, 2).notNullable();
    table.decimal('total_bought', 9, 5).notNullable();
    table.decimal('total_sold', 9, 5).notNullable();
    table.decimal('unrealised_profit_loss_percentage', 7, 2).notNullable();
    table.decimal('realised_profit_loss_percentage', 7, 2).notNullable();
    table.decimal('last_bought_amount', 9, 5).notNullable();
    table.string('last_bought_date').notNullable();
    table.decimal('last_sold_amount', 9, 5).notNullable();
    table.string('last_sold_date').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('user_coin');
}
