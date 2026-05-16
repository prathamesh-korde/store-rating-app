'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const env = require('../../config/env');
const { createError } = require('../../middleware/errorHandler');

/**
 * Register a new normal user (public endpoint).
 */
const register = async ({ name, email, password, address }) => {
  // Check duplicate email
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount > 0) {
    throw createError(409, 'An account with this email already exists.');
  }

  const hashed = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  const result = await db.query(
    `INSERT INTO users (name, email, password, address, role)
     VALUES ($1, $2, $3, $4, 'user')
     RETURNING id, name, email, address, role, created_at`,
    [name, email, hashed, address || null]
  );

  return result.rows[0];
};

/**
 * Login: verify credentials, return JWT (stored in cookie by controller).
 */
const login = async ({ email, password }) => {
  const result = await db.query(
    'SELECT id, name, email, password, role FROM users WHERE email = $1',
    [email]
  );

  if (result.rowCount === 0) {
    throw createError(401, 'Invalid email or password.');
  }

  const user = result.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw createError(401, 'Invalid email or password.');
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

/**
 * Change own password after verifying current password.
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const result = await db.query('SELECT password FROM users WHERE id = $1', [userId]);
  if (result.rowCount === 0) {
    throw createError(404, 'User not found.');
  }

  const match = await bcrypt.compare(currentPassword, result.rows[0].password);
  if (!match) {
    throw createError(400, 'Current password is incorrect.');
  }

  const hashed = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
  await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, userId]);

  return { message: 'Password updated successfully.' };
};

module.exports = { register, login, changePassword };
