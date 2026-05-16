'use strict';
const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const env = require('../../config/env');
const { createError } = require('../../middleware/errorHandler');

/** Build dynamic WHERE clause from filter params */
const buildFilters = (filters, startIndex = 1) => {
  const conditions = [];
  const params = [];
  let idx = startIndex;

  if (filters.name) {
    conditions.push(`LOWER(u.name) LIKE LOWER($${idx++})`);
    params.push(`%${filters.name}%`);
  }
  if (filters.email) {
    conditions.push(`LOWER(u.email) LIKE LOWER($${idx++})`);
    params.push(`%${filters.email}%`);
  }
  if (filters.address) {
    conditions.push(`LOWER(u.address) LIKE LOWER($${idx++})`);
    params.push(`%${filters.address}%`);
  }
  if (filters.role) {
    conditions.push(`u.role = $${idx++}`);
    params.push(filters.role);
  }

  return { conditions, params };
};

const ALLOWED_SORT_COLUMNS = ['name', 'email', 'address', 'role', 'created_at'];
const ALLOWED_SORT_DIRS = ['ASC', 'DESC'];

/** List all users with optional filter + sort (admin only) */
const listUsers = async ({ name, email, address, role, sortBy = 'created_at', sortDir = 'DESC', page = 1, limit = 10 }) => {
  const safeSortBy = ALLOWED_SORT_COLUMNS.includes(sortBy) ? sortBy : 'created_at';
  const safeSortDir = ALLOWED_SORT_DIRS.includes(sortDir?.toUpperCase()) ? sortDir.toUpperCase() : 'DESC';

  const { conditions, params } = buildFilters({ name, email, address, role });
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const offset = (Math.max(1, page) - 1) * limit;

  const countResult = await db.query(
    `SELECT COUNT(*) FROM users u ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const dataParams = [...params, limit, offset];
  const result = await db.query(
    `SELECT u.id, u.name, u.email, u.address, u.role, u.created_at
     FROM users u
     ${whereClause}
     ORDER BY u.${safeSortBy} ${safeSortDir}
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    dataParams
  );

  return { users: result.rows, total, page: +page, limit: +limit };
};

/** Get single user detail; include avg store rating if owner */
const getUserById = async (userId) => {
  const result = await db.query(
    `SELECT id, name, email, address, role, created_at FROM users WHERE id = $1`,
    [userId]
  );
  if (result.rowCount === 0) throw createError(404, 'User not found.');

  const user = result.rows[0];

  if (user.role === 'owner') {
    const ratingResult = await db.query(
      `SELECT ROUND(AVG(r.value)::numeric, 2) AS avg_rating
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       WHERE s.owner_id = $1`,
      [userId]
    );
    user.avg_store_rating = ratingResult.rows[0]?.avg_rating ?? null;
  }

  return user;
};

/** Admin creates a user of any role */
const createUser = async ({ name, email, password, address, role, storeId }) => {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) {
    throw createError(409, 'An account with this email already exists.');
  }

  const hashed = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  const userResult = await db.query(
    `INSERT INTO users (name, email, password, address, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, address, role, created_at`,
    [name, email, hashed, address || null, role]
  );
  const user = userResult.rows[0];

  // If creating an owner with a storeId, link them
  if (role === 'owner' && storeId) {
    await db.query('UPDATE stores SET owner_id = $1 WHERE id = $2', [user.id, storeId]);
  }

  return user;
};

/** Admin: dashboard stats */
const getDashboardStats = async () => {
  const [usersRes, storesRes, ratingsRes] = await Promise.all([
    db.query('SELECT COUNT(*) FROM users'),
    db.query('SELECT COUNT(*) FROM stores'),
    db.query('SELECT COUNT(*) FROM ratings'),
  ]);

  return {
    totalUsers: parseInt(usersRes.rows[0].count, 10),
    totalStores: parseInt(storesRes.rows[0].count, 10),
    totalRatings: parseInt(ratingsRes.rows[0].count, 10),
  };
};

module.exports = { listUsers, getUserById, createUser, getDashboardStats };
