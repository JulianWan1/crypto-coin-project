import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user_coin', (table) => {
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {

}
