'use strict';
const db = require('../../config/db');
const { createError } = require('../../middleware/errorHandler');

const ALLOWED_SORT_COLS = ['name', 'email', 'address', 'avg_rating', 'created_at'];

/** List all stores for admin (with avg rating + owner info) — supports unified search */
const listStoresAdmin = async ({ search, name, email, address, sortBy = 'created_at', sortDir = 'DESC', page = 1, limit = 10 }) => {
  const safeSortBy = ALLOWED_SORT_COLS.includes(sortBy) ? sortBy : 'created_at';
  const safeSortDir = (sortDir?.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

  const conditions = [];
  const params = [];
  let idx = 1;

  // Unified search: search across name, email, address with OR
  if (search) {
    conditions.push(`(LOWER(s.name) LIKE LOWER($${idx}) OR LOWER(s.email) LIKE LOWER($${idx}) OR LOWER(s.address) LIKE LOWER($${idx}))`);
    params.push(`%${search}%`);
    idx++;
  } else {
    if (name) { conditions.push(`LOWER(s.name) LIKE LOWER($${idx++})`); params.push(`%${name}%`); }
    if (email) { conditions.push(`LOWER(s.email) LIKE LOWER($${idx++})`); params.push(`%${email}%`); }
    if (address) { conditions.push(`LOWER(s.address) LIKE LOWER($${idx++})`); params.push(`%${address}%`); }
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*) FROM stores s ${whereClause}`, params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const offset = (Math.max(1, page) - 1) * limit;
  const dataParams = [...params, limit, offset];

  const orderCol = safeSortBy === 'avg_rating' ? 'avg_rating' : `s.${safeSortBy}`;

  const result = await db.query(
    `SELECT s.id, s.name, s.email, s.address, s.owner_id, s.image_url,
            u.name AS owner_name, u.email AS owner_email,
            ROUND(AVG(r.value)::numeric, 2) AS avg_rating,
            COUNT(r.id)::int AS total_ratings,
            s.created_at
     FROM stores s
     LEFT JOIN users u ON u.id = s.owner_id
     LEFT JOIN ratings r ON r.store_id = s.id
     ${whereClause}
     GROUP BY s.id, u.name, u.email
     ORDER BY ${orderCol} ${safeSortDir} NULLS LAST
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    dataParams
  );

  return { stores: result.rows, total, page: +page, limit: +limit };
};

/** List all stores for normal users (with avg rating + their own rating + comment) */
const listStoresUser = async ({ name, address, userId }) => {
  const conditions = [];
  const params = [userId];
  let idx = 2;

  if (name) { conditions.push(`(LOWER(s.name) LIKE LOWER($${idx}) OR LOWER(s.address) LIKE LOWER($${idx}))`); params.push(`%${name}%`); idx++; }
  if (address) { conditions.push(`LOWER(s.address) LIKE LOWER($${idx++})`); params.push(`%${address}%`); }

  const whereClause = conditions.length ? `AND ${conditions.join(' AND ')}` : '';

  const result = await db.query(
    `SELECT s.id, s.name, s.address, s.email, s.image_url,
            ROUND(AVG(r.value)::numeric, 2) AS avg_rating,
            ur.id AS user_rating_id,
            ur.value AS user_rating,
            ur.comment AS user_comment
     FROM stores s
     LEFT JOIN ratings r ON r.store_id = s.id
     LEFT JOIN ratings ur ON ur.store_id = s.id AND ur.user_id = $1
     WHERE 1=1 ${whereClause}
     GROUP BY s.id, ur.id, ur.value, ur.comment
     ORDER BY s.name ASC`,
    params
  );

  return result.rows;
};

/** Admin creates a store */
const createStore = async ({ name, email, address, ownerId, image_url }) => {
  const existing = await db.query('SELECT id FROM stores WHERE email = $1', [email]);
  if (existing.rowCount > 0) {
    throw createError(409, 'A store with this email already exists.');
  }

  if (ownerId) {
    const ownerCheck = await db.query("SELECT id, role FROM users WHERE id = $1 AND role = 'owner'", [ownerId]);
    if (ownerCheck.rowCount === 0) {
      throw createError(400, 'Specified owner does not exist or is not an owner-role user.');
    }
  }

  const result = await db.query(
    `INSERT INTO stores (name, email, address, owner_id, image_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, address, owner_id, image_url, created_at`,
    [name, email, address || null, ownerId || null, image_url || null]
  );

  return result.rows[0];
};

/** Get all stores (simple list for owner assignment dropdown) */
const listAllStores = async () => {
  const result = await db.query('SELECT id, name, image_url FROM stores ORDER BY name ASC');
  return result.rows;
};

/** Get store detail: store info + aggregate ratings + individual reviews with comments */
const getStoreDetail = async (id) => {
  // Store info with aggregate
  const storeResult = await db.query(
    `SELECT s.id, s.name, s.email, s.address, s.image_url, s.owner_id,
            u.name AS owner_name,
            ROUND(AVG(r.value)::numeric, 2) AS avg_rating,
            COUNT(r.id)::int AS total_ratings,
            s.created_at
     FROM stores s
     LEFT JOIN users u ON u.id = s.owner_id
     LEFT JOIN ratings r ON r.store_id = s.id
     WHERE s.id = $1
     GROUP BY s.id, u.name`,
    [id]
  );

  if (storeResult.rowCount === 0) {
    throw createError(404, 'Store not found.');
  }

  // Individual reviews with user info and comments
  const reviewsResult = await db.query(
    `SELECT r.id, r.value, r.comment, r.created_at,
            u.name AS reviewer_name, u.email AS reviewer_email
     FROM ratings r
     JOIN users u ON u.id = r.user_id
     WHERE r.store_id = $1
     ORDER BY r.created_at DESC`,
    [id]
  );

  return {
    ...storeResult.rows[0],
    reviews: reviewsResult.rows,
  };
};

/** Get top rated stores for admin dashboard */
const getTopRatedStores = async (limit = 4) => {
  const result = await db.query(
    `SELECT s.id, s.name, s.address, s.image_url,
            ROUND(AVG(r.value)::numeric, 2) AS avg_rating,
            COUNT(r.id)::int AS total_ratings,
            u.name AS owner_name
     FROM stores s
     LEFT JOIN ratings r ON r.store_id = s.id
     LEFT JOIN users u ON u.id = s.owner_id
     GROUP BY s.id, u.name
     HAVING COUNT(r.id) > 0
     ORDER BY avg_rating DESC, total_ratings DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
};

/** Get recently added stores for admin dashboard */
const getRecentStores = async (limit = 4) => {
  const result = await db.query(
    `SELECT s.id, s.name, s.address, s.image_url,
            ROUND(AVG(r.value)::numeric, 2) AS avg_rating,
            COUNT(r.id)::int AS total_ratings,
            u.name AS owner_name,
            s.created_at
     FROM stores s
     LEFT JOIN ratings r ON r.store_id = s.id
     LEFT JOIN users u ON u.id = s.owner_id
     GROUP BY s.id, u.name
     ORDER BY s.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
};

module.exports = {
  listStoresAdmin,
  listStoresUser,
  createStore,
  listAllStores,
  getStoreDetail,
  getTopRatedStores,
  getRecentStores,
};
