const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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
