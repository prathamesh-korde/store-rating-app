'use strict';
const express = require('express');
const { authenticate } = require('../../middleware/auth');
const {
  registerController,
  loginController,
  logoutController,
  changePasswordController,
} = require('./auth.controller');

const router = express.Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/logout', authenticate, logoutController);
router.patch('/password', authenticate, changePasswordController);

module.exports = router;
