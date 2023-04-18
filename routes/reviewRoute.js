const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const ReviewRouter = express.Router({ mergeParams: true });

ReviewRouter.use(authController.protect);

ReviewRouter.route('/')
  .get(reviewController.getAllReviews)
  .post(
    reviewController.setTourUserIds,
    authController.restrictTo('user'),
    reviewController.createReview
  );

ReviewRouter.route('/:id')
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .get(authController.restrictTo('user', 'admin'), reviewController.getReview);

module.exports = ReviewRouter;
