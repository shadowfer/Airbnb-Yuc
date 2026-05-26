


require('dotenv').config();

const { Sequelize } = require('sequelize');


const dbName = process.env.NODE_ENV === 'test'
  ? (process.env.DB_TEST_NAME || 'hospedaje_db_test')
  : (process.env.DB_NAME || 'hospedaje_db');

const sequelize = new Sequelize(
  dbName,
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

module.exports = sequelize;