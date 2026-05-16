'use strict';
const db = require('../../config/db');
const { createError } = require('../../middleware/errorHandler');

/** Submit a rating + optional comment (user → store) */
const submitRating = async (userId, { storeId, value, comment }) => {
  // Check store exists
  const storeCheck = await db.query('SELECT id FROM stores WHERE id = $1', [storeId]);
  if (storeCheck.rowCount === 0) throw createError(404, 'Store not found.');

  // Check if already rated
  const existing = await db.query(
    'SELECT id FROM ratings WHERE user_id = $1 AND store_id = $2',
    [userId, storeId]
  );
  if (existing.rowCount > 0) throw createError(409, 'You have already rated this store. Use PATCH to update.');

  const result = await db.query(
    `INSERT INTO ratings (user_id, store_id, value, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, store_id, value, comment, created_at`,
    [userId, storeId, value, comment || null]
  );

  return result.rows[0];
};

/** Update an existing rating + optional comment */
const updateRating = async (userId, ratingId, { value, comment }) => {
  const result = await db.query(
    `UPDATE ratings SET value = $1, comment = $2, updated_at = NOW()
     WHERE id = $3 AND user_id = $4
     RETURNING id, user_id, store_id, value, comment, updated_at`,
    [value, comment ?? null, ratingId, userId]
  );
  if (result.rowCount === 0) throw createError(404, 'Rating not found or you do not own this rating.');
  return result.rows[0];
};

/** Owner dashboard: avg rating + list of raters with comments */
const getOwnerDashboard = async (ownerId) => {
  const storeResult = await db.query(
    'SELECT id, name FROM stores WHERE owner_id = $1',
    [ownerId]
  );
  if (storeResult.rowCount === 0) {
    return { avgRating: null, store: null, raters: [] };
  }

  const store = storeResult.rows[0];

  const ratingsResult = await db.query(
    `SELECT u.name AS user_name, u.email AS user_email,
            r.value, r.comment, r.created_at, r.updated_at
     FROM ratings r
     JOIN users u ON u.id = r.user_id
     WHERE r.store_id = $1
     ORDER BY r.created_at DESC`,
    [store.id]
  );

  const avgResult = await db.query(
    'SELECT ROUND(AVG(value)::numeric, 2) AS avg FROM ratings WHERE store_id = $1',
    [store.id]
  );

  return {
    store: { id: store.id, name: store.name },
    avgRating: avgResult.rows[0]?.avg ?? null,
    raters: ratingsResult.rows,
  };
};

module.exports = { submitRating, updateRating, getOwnerDashboard };
