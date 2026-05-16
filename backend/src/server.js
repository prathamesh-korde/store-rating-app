'use strict';
require('dotenv').config();
const app = require('./app');
const env = require('./config/env');
const { pool } = require('./config/db');

const startServer = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully.');

    // Auto-patch: ensure columns exist
    const patches = [
      'ALTER TABLE ratings ADD COLUMN IF NOT EXISTS comment TEXT',
      'ALTER TABLE stores ADD COLUMN IF NOT EXISTS image_url TEXT',
    ];
    for (const sql of patches) {
      try { await client.query(sql); } catch (_) { /* already exists */ }
    }
    console.log('✅ Schema auto-patched.');

    client.release();

    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
      console.log(`   API: http://localhost:${env.PORT}/api/v1`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message);
    console.warn('⚠️  Starting server without DB — requests will fail.');
    app.listen(env.PORT, () => {
      console.log(`🚀 Server running (no DB) on port ${env.PORT}`);
    });
  }
};

startServer();
