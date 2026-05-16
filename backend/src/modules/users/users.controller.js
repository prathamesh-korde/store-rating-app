'use strict';
const Joi = require('joi');
const usersService = require('./users.service');
const { catchAsync, createError } = require('../../middleware/errorHandler');

const createUserSchema = Joi.object({
  name: Joi.string().min(20).max(60).required().messages({
    'string.min': 'Name must be at least 20 characters.',
    'string.max': 'Name must not exceed 60 characters.',
    'any.required': 'Name is required.',
  }),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .max(16)
    .pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .required()
    .messages({
      'string.pattern.base': 'Password must have at least one uppercase letter and one special character.',
    }),
  address: Joi.string().max(400).optional().allow(''),
  role: Joi.string().valid('admin', 'user', 'owner').required(),
  storeId: Joi.string().uuid().optional(),
});

const getDashboardController = catchAsync(async (req, res) => {
  const stats = await usersService.getDashboardStats();
  res.json({ success: true, data: stats, message: 'Dashboard data retrieved.' });
});

const listUsersController = catchAsync(async (req, res) => {
  const { name, email, address, role, sortBy, sortDir, page, limit } = req.query;
  const result = await usersService.listUsers({
    name, email, address, role, sortBy, sortDir,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
  });
  res.json({ success: true, data: result, message: 'Users retrieved.' });
});

const getUserController = catchAsync(async (req, res) => {
  const user = await usersService.getUserById(req.params.id);
  res.json({ success: true, data: user, message: 'User retrieved.' });
});

const createUserController = catchAsync(async (req, res) => {
  const { error, value } = createUserSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const details = error.details.map((d) => d.message);
    throw createError(400, 'Validation failed.', details);
  }
  const user = await usersService.createUser(value);
  res.status(201).json({ success: true, data: user, message: 'User created successfully.' });
});

module.exports = {
  getDashboardController,
  listUsersController,
  getUserController,
  createUserController,
};
