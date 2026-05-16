'use strict';
const Joi = require('joi');
const ratingsService = require('./ratings.service');
const { catchAsync, createError } = require('../../middleware/errorHandler');

const submitSchema = Joi.object({
  storeId: Joi.string().uuid().required(),
  value: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'Rating must be between 1 and 5.',
    'number.max': 'Rating must be between 1 and 5.',
  }),
  comment: Joi.string().max(500).optional().allow('', null),
});

const updateSchema = Joi.object({
  value: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(500).optional().allow('', null),
});

const submitRatingController = catchAsync(async (req, res) => {
  const { error, value } = submitSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const details = error.details.map((d) => d.message);
    throw createError(400, 'Validation failed.', details);
  }
  const rating = await ratingsService.submitRating(req.user.id, value);
  res.status(201).json({ success: true, data: rating, message: 'Rating submitted.' });
});

const updateRatingController = catchAsync(async (req, res) => {
  const { error, value } = updateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const details = error.details.map((d) => d.message);
    throw createError(400, 'Validation failed.', details);
  }
  const rating = await ratingsService.updateRating(req.user.id, req.params.id, value);
  res.json({ success: true, data: rating, message: 'Rating updated.' });
});

const ownerDashboardController = catchAsync(async (req, res) => {
  const data = await ratingsService.getOwnerDashboard(req.user.id);
  res.json({ success: true, data, message: 'Owner dashboard data retrieved.' });
});

module.exports = { submitRatingController, updateRatingController, ownerDashboardController };
