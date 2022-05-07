import { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER } from "../src/configurations/env.config";
import { knexSnakeCaseMappers } from 'objection'

// Update with your config settings.
module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: DB_USER,
      password: DB_PASSWORD,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
    },
    ...knexSnakeCaseMappers(),
  },
};
