'use strict';
const express = require('express');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');
const {
  getDashboardController,
  listUsersController,
  getUserController,
  createUserController,
} = require('./users.controller');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireRole('admin'));

router.get('/dashboard', getDashboardController);
router.get('/users', listUsersController);
router.post('/users', createUserController);
router.get('/users/:id', getUserController);

module.exports = router;
