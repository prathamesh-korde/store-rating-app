'use strict';
const Joi = require('joi');
const authService = require('./auth.service');
const { catchAsync, createError } = require('../../middleware/errorHandler');
const env = require('../../config/env');

// ── Validation Schemas ──────────────────────────────────────
const registerSchema = Joi.object({
  name: Joi.string().min(20).max(60).required().messages({
    'string.min': 'Name must be at least 20 characters.',
    'string.max': 'Name must not exceed 60 characters.',
    'any.required': 'Name is required.',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address.',
    'any.required': 'Email is required.',
  }),
  password: Joi.string()
    .min(8)
    .max(16)
    .pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters.',
      'string.max': 'Password must not exceed 16 characters.',
      'string.pattern.base': 'Password must contain at least one uppercase letter and one special character (!@#$%^&*).',
      'any.required': 'Password is required.',
    }),
  address: Joi.string().max(400).optional().allow(''),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .max(16)
    .pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters.',
      'string.max': 'New password must not exceed 16 characters.',
      'string.pattern.base': 'New password must contain at least one uppercase letter and one special character.',
    }),
});

// ── Cookie helper ────────────────────────────────────────────
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// ── Controllers ──────────────────────────────────────────────
const registerController = catchAsync(async (req, res) => {
  const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const details = error.details.map((d) => d.message);
    throw createError(400, 'Validation failed.', details);
  }

  const user = await authService.register(value);
  res.status(201).json({ success: true, data: user, message: 'Registration successful.' });
});

const loginController = catchAsync(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    throw createError(400, 'Invalid credentials format.');
  }

  const { token, user } = await authService.login(value);
  res.cookie('token', token, COOKIE_OPTIONS);
  res.json({ success: true, data: { user, token }, message: 'Login successful.' });
});

const logoutController = catchAsync(async (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'Lax' });
  res.json({ success: true, data: null, message: 'Logged out successfully.' });
});

const changePasswordController = catchAsync(async (req, res) => {
  const { error, value } = changePasswordSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const details = error.details.map((d) => d.message);
    throw createError(400, 'Validation failed.', details);
  }

  const result = await authService.changePassword(req.user.id, value);
  res.json({ success: true, data: null, message: result.message });
});

module.exports = {
  registerController,
  loginController,
  logoutController,
  changePasswordController,
};
