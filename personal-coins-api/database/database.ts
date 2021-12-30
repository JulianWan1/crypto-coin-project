import knex from 'knex';

const knexfile = require('./knexfile');

export const db = knex(knexfile.development);
