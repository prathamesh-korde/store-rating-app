'use strict';
const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');
const {
  listAdminStoresController,
  createStoreController,
  listUserStoresController,
  listAllStoresController,
  getStoreDetailController,
  getTopRatedStoresController,
  getRecentStoresController,
} = require('./stores.controller');

const router = express.Router();

// Admin routes
router.get('/admin/stores', authenticate, requireRole('admin'), listAdminStoresController);
router.post('/admin/stores', authenticate, requireRole('admin'), createStoreController);
router.get('/admin/stores/all', authenticate, requireRole('admin'), listAllStoresController);
router.get('/admin/stores/top-rated', authenticate, requireRole('admin'), getTopRatedStoresController);
router.get('/admin/stores/recent', authenticate, requireRole('admin'), getRecentStoresController);

// Store detail — accessible to authenticated users of any role
router.get('/stores/:id', authenticate, getStoreDetailController);

// Normal user routes
router.get('/stores', authenticate, requireRole('user'), listUserStoresController);

module.exports = router;
