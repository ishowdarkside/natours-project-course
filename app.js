const express = require('express');
const url = require('url');
const path = require('path');
const AppError = require('./utils/appError');
const globalErrorHanlder = require('./controllers/errorController');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const ReviewRouter = require('./routes/reviewRoute');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const httpParameterPolution = require('hpp');
const viewRouter = require('./routes/viewRoutes');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
// 1) GLOBAL MIDDLEWARES
app.enable('trust proxy');
//Development logging

//Set Security HTTP Headers
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP,please try again in an hour!',
});

app.use('/api', limiter);

//body parser,reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
//Data sanitization aginst NoSQL query Injection
app.use(mongoSanitize());

//Data sanitization aginst XSS Attacks
app.use(xss());

app.use(compression());
//Prevent parameter polution
app.use(
  httpParameterPolution({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

//Serving static files

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  next();
});
// ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', ReviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`cant find ${req.originalUrl}`, 404));
});

app.use(globalErrorHanlder);
module.exports = app;
