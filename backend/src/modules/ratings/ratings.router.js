'use strict';
const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');
const {
  submitRatingController,
  updateRatingController,
  ownerDashboardController,
} = require('./ratings.controller');

const router = express.Router();

// User rating routes
router.post('/ratings', authenticate, requireRole('user'), submitRatingController);
router.patch('/ratings/:id', authenticate, requireRole('user'), updateRatingController);

// Owner dashboard
router.get('/owner/dashboard', authenticate, requireRole('owner'), ownerDashboardController);

module.exports = router;
