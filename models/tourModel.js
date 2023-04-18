const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');
const toursSchema = new mongoose.Schema(
  {
    name: {
      required: [true, 'Tour must have a name'],
      unique: true,
      type: String,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 chars.'],
      minlength: [10, 'A tour name must have more or equal then 10 chars.'],
      validate: [
        {
          validator: function (val) {
            if (/^[a-z\s]+$/i.test(val)) {
              return true;
            } else return false;
          },
          message: 'Tour can include letters only',
        },
      ],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy,medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Tour must include price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only point sto current doc on NEW document creation
          return val < this.price;
        },
        message: `Discount price {(VALUE)} should be below the regular price`,
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'Tour must have a Description!'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    creaatedAt: {
      select: false,
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        adress: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//toursSchema.index({ price: 1 });
toursSchema.index({ price: 1, ratingsAverage: -1 });
toursSchema.index({ slug: 1 });
toursSchema.index({ startLocation: '2dsphere' });
toursSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//Virtual populate
toursSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
//DOC MIDDLEWARE,runs before .save() and .create()
// (insertMany doesnt trigger middleware)

toursSchema.pre('save', function (next) {
  this.slug = slugify(this.name);
  next();
});

toursSchema.post('save', function (doc, next) {
  console.log('File saved successfully!');
  next();
});

/*
toursSchema.pre('save', async function(next){
  const guidesPromises = this.guides.map(async id => await User.findById(id));
  this.guides = await Promise.all(guidesPromises);
  next()
})*/
//Query Middleware
toursSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

toursSchema.pre(/^find/, function (next) {
  this.populate({ path: 'guides', select: '-__v,-passwordChangedAt' });
  next();
});

const Tour = mongoose.model('Tour', toursSchema);
module.exports = Tour;
