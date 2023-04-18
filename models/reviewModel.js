const mongoose = require('mongoose');
const Tour = require('./tourModel');
const ReviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must belong to a user'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

ReviewSchema.index({ tour: 1, user: 1 }, { unique: true });

ReviewSchema.pre(/^find/, function (next) {
  /*
  this.populate({ path: 'tour', select: 'name' }).populate({
    path: 'user',
    select: 'name photo',
  });

  next();*/

  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

ReviewSchema.statics.calcAverageRatings = async function (tourId) {
  //funkcija uzima id toura i matchuje sve reviews sa tim tour id
  //zatim ih sve grupise i racuna im average rating i broj ratingsa

  //zatim kad dobijemo podatke updateujemo tour sa tim id-em sa tim podacima
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findOneAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRatings,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findOneAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

ReviewSchema.post('save', function () {
  //This points to current reviews
  // this.constructor  points to Model
  this.constructor.calcAverageRatings(this.tour);
  //nakon sto save-as document pozovi funkciju
  //i passuj u nju id toura za koji je review napisan
});

ReviewSchema.pre(/^findOneAnd/, async function (next) {
  //FindOne funkcijama this keyword nije current document vec query object
  //zato moramo na ovaj nacin dobit docuement i stavit ga na query object
  this.r = await this.model.findOne(this.getQuery());
  console.log(r);
});

ReviewSchema.post(/^findOndeAnd/, async function () {
  //iz queryobjecta uzimamo document koji smoo u prethodnom stepu stavili na query obj
  //zatim pozivamo njegov constructor a to je ReviewModel
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', ReviewSchema);

module.exports = Review;
