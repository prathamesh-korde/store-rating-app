'use strict';
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

const hash = (pw) => bcrypt.hash(pw, SALT_ROUNDS);

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🌱 Seeding database...\n');

    // Clear existing data (order matters for FK constraints)
    await client.query('DELETE FROM ratings');
    await client.query('DELETE FROM stores');
    await client.query('DELETE FROM users');

    // ── 1. Admin ─────────────────────────────────────────
    const adminPw = await hash('Admin@12345');
    const adminRes = await client.query(
      `INSERT INTO users (name, email, password, address, role) VALUES ($1,$2,$3,$4,'admin') RETURNING id`,
      ['Platform Administrator User', 'admin@platform.com', adminPw, '123 Admin Street, Platform City']
    );
    const adminId = adminRes.rows[0].id;

    // ── 2. Store Owners ────────────────────────────────────
    const ownerCredentials = [
      { name: 'First Store Owner Account User', email: 'owner1@stores.com', pw: 'Owner1@pass', addr: '10 Owner Lane, Business District' },
      { name: 'Second Store Owner Account User', email: 'owner2@stores.com', pw: 'Owner2@pass', addr: '20 Owner Lane, Business District' },
      { name: 'Third Store Owner Account User', email: 'owner3@stores.com', pw: 'Owner3@pass', addr: '30 Owner Lane, Business District' },
    ];

    const ownerIds = [];
    for (const o of ownerCredentials) {
      const pw = await hash(o.pw);
      const res = await client.query(
        `INSERT INTO users (name, email, password, address, role) VALUES ($1,$2,$3,$4,'owner') RETURNING id`,
        [o.name, o.email, pw, o.addr]
      );
      ownerIds.push(res.rows[0].id);
    }

    // ── 3. Stores ─────────────────────────────────────────
    const storeData = [
      { name: 'The Grand Coffee House Store', email: 'grandcoffee@stores.com', address: '100 Main Street, Downtown', ownerIdx: 0 },
      { name: 'Fresh Organic Grocery Market', email: 'freshorganic@stores.com', address: '200 Park Avenue, Uptown', ownerIdx: 1 },
      { name: 'Tech Gadgets Electronics Shop', email: 'techgadgets@stores.com', address: '300 Silicon Road, Tech Park', ownerIdx: 2 },
    ];

    const storeIds = [];
    for (const s of storeData) {
      const res = await client.query(
        `INSERT INTO stores (name, email, address, owner_id) VALUES ($1,$2,$3,$4) RETURNING id`,
        [s.name, s.email, s.address, ownerIds[s.ownerIdx]]
      );
      storeIds.push(res.rows[0].id);
    }

    // ── 4. Normal Users ───────────────────────────────────
    const userCredentials = [
      { name: 'Alice Johnson Regular Customer', email: 'alice@example.com', pw: 'Alice@1234', addr: '1 Elm Street, Suburbia' },
      { name: 'Bob Smith Everyday Shopper User', email: 'bob@example.com', pw: 'Bob@12345', addr: '2 Oak Avenue, Greenville' },
      { name: 'Carol White Frequent Buyer User', email: 'carol@example.com', pw: 'Carol@123', addr: '3 Maple Drive, Riverside' },
      { name: 'David Brown Active Community User', email: 'david@example.com', pw: 'David@123', addr: '4 Pine Road, Lakewood' },
      { name: 'Emma Davis Loyal Platform Member', email: 'emma@example.com', pw: 'Emma@1234', addr: '5 Birch Way, Hillside' },
    ];

    const userIds = [];
    for (const u of userCredentials) {
      const pw = await hash(u.pw);
      const res = await client.query(
        `INSERT INTO users (name, email, password, address, role) VALUES ($1,$2,$3,$4,'user') RETURNING id`,
        [u.name, u.email, pw, u.addr]
      );
      userIds.push(res.rows[0].id);
    }

    // ── 5. Sample Ratings ─────────────────────────────────
    const ratingData = [
      { userIdx: 0, storeIdx: 0, value: 5 },
      { userIdx: 0, storeIdx: 1, value: 4 },
      { userIdx: 1, storeIdx: 0, value: 4 },
      { userIdx: 1, storeIdx: 2, value: 3 },
      { userIdx: 2, storeIdx: 1, value: 5 },
      { userIdx: 2, storeIdx: 2, value: 4 },
      { userIdx: 3, storeIdx: 0, value: 3 },
      { userIdx: 3, storeIdx: 1, value: 4 },
      { userIdx: 4, storeIdx: 2, value: 5 },
      { userIdx: 4, storeIdx: 0, value: 4 },
    ];

    for (const r of ratingData) {
      await client.query(
        `INSERT INTO ratings (user_id, store_id, value) VALUES ($1,$2,$3)`,
        [userIds[r.userIdx], storeIds[r.storeIdx], r.value]
      );
    }

    await client.query('COMMIT');

    console.log('✅ Seed complete!\n');
    console.log('═══════════════════════════════════════════');
    console.log('  SEED CREDENTIALS');
    console.log('═══════════════════════════════════════════');
    console.log('\n🔑 ADMIN');
    console.log('   Email:    admin@platform.com');
    console.log('   Password: Admin@12345\n');
    console.log('🏪 STORE OWNERS');
    ownerCredentials.forEach((o, i) => {
      console.log(`   Owner ${i + 1}: ${o.email} / ${o.pw}`);
    });
    console.log('\n👤 NORMAL USERS');
    userCredentials.forEach((u, i) => {
      console.log(`   User ${i + 1}: ${u.email} / ${u.pw}`);
    });
    console.log('\n🏬 STORES');
    storeData.forEach((s, i) => {
      console.log(`   Store ${i + 1}: ${s.name} (${s.email})`);
    });
    console.log('═══════════════════════════════════════════\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
