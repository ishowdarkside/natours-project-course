const express = require('express');
const router = express.Router();
const viewController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

router.get('/', authController.isLoggedIn, viewController.getOverview);
router.get('/login', viewController.getLoginForm);
//router.use(authController.isLoggedIn);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/me', authController.protect, viewController.getAccount);
router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData
);
module.exports = router;
