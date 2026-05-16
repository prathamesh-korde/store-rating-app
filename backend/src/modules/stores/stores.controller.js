'use strict';
const Joi = require('joi');
const storesService = require('./stores.service');
const { catchAsync, createError } = require('../../middleware/errorHandler');

const createStoreSchema = Joi.object({
  name: Joi.string().min(20).max(60).required().messages({
    'string.min': 'Store name must be at least 20 characters.',
    'string.max': 'Store name must not exceed 60 characters.',
  }),
  email: Joi.string().email().required(),
  address: Joi.string().max(400).optional().allow(''),
  ownerId: Joi.string().uuid().optional(),
  image_url: Joi.string().uri().optional().allow('', null),
  image: Joi.any().optional(),
});

const listAdminStoresController = catchAsync(async (req, res) => {
  const { search, name, email, address, sortBy, sortDir, page, limit } = req.query;
  const result = await storesService.listStoresAdmin({
    search, name, email, address, sortBy, sortDir,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
  });
  res.json({ success: true, data: result, message: 'Stores retrieved.' });
});

const createStoreController = catchAsync(async (req, res) => {
  const { error, value } = createStoreSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const details = error.details.map((d) => d.message);
    throw createError(400, 'Validation failed.', details);
  }
  delete value.image; // image handled separately via Cloudinary if needed
  const store = await storesService.createStore(value);
  res.status(201).json({ success: true, data: store, message: 'Store created successfully.' });
});

const listUserStoresController = catchAsync(async (req, res) => {
  const { name, address } = req.query;
  const stores = await storesService.listStoresUser({ name, address, userId: req.user.id });
  res.json({ success: true, data: stores, message: 'Stores retrieved.' });
});

const listAllStoresController = catchAsync(async (req, res) => {
  const stores = await storesService.listAllStores();
  res.json({ success: true, data: stores, message: 'All stores listed.' });
});

const getStoreDetailController = catchAsync(async (req, res) => {
  const store = await storesService.getStoreDetail(req.params.id);
  res.json({ success: true, data: store, message: 'Store details retrieved.' });
});

const getTopRatedStoresController = catchAsync(async (req, res) => {
  const stores = await storesService.getTopRatedStores(4);
  res.json({ success: true, data: stores, message: 'Top rated stores.' });
});

const getRecentStoresController = catchAsync(async (req, res) => {
  const stores = await storesService.getRecentStores(4);
  res.json({ success: true, data: stores, message: 'Recent stores.' });
});

module.exports = {
  listAdminStoresController,
  createStoreController,
  listUserStoresController,
  listAllStoresController,
  getStoreDetailController,
  getTopRatedStoresController,
  getRecentStoresController,
};
