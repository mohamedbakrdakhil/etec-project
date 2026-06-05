const mysql = require('mysql2/promise');
require('dotenv').config();

// Support Railway MySQL plugin variables (MYSQLHOST, etc.) + custom DB_ variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 30,      // 10 → 30 pour supporter 500 users
  queueLimit: 100,          // file d'attente si toutes les connexions sont occupées
  connectTimeout: 10000,    // timeout connexion 10s
  timezone: '+01:00',       // GMT+1 Maroc
});

pool.getConnection()
  .then(conn => {
    console.log('✅ Connexion MySQL réussie');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erreur MySQL:', err.message);
  });

module.exports = pool;
