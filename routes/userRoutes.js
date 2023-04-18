const express = require('express');
const usersController = require('../controllers/userController');
const authController = require('../controllers/authController');

//3) Routes
const router = express.Router();

router.get(
  '/me',
  authController.protect,
  usersController.getMe,
  usersController.getUser
);

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.get('/logout', authController.logout);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/updateMyPassword',
  authController.protect,
  authController.updatePassword
);

//all of thes middlewares that come after this code will be protected
router.use(authController.protect);

router.patch(
  '/updateMe',
  usersController.uploadUserPhoto,
  usersController.resizeUserPhoto,
  usersController.updateMe
);
router.delete('/deleteMe', usersController.deleteMe);
//Restrict all of the routes only to admin
router.use(authController.restrictTo('admin'));
router.route('/').get(usersController.getAllUsers);
router
  .route('/:id')
  .get(usersController.getUser)
  .patch(usersController.updateUser)
  .delete(usersController.deleteUser);

module.exports = router;
