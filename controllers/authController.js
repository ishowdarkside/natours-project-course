const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { isReadable } = require('stream');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  const token = signToken(user._id);
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1) Check if Email and password actually Exists
  if (!email || !password)
    return next(new AppError('Please provide email and password', 400));
  //2) Check if user exist && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await User.correctPassword(password, user.password)))
    return next(new AppError('Invalid credentials', 401));

  //3) if everything ok,send token to client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) token = req.cookies.jwt;

  if (!token)
    return next(
      new AppError('You are not logged in! Please login to get access.'),
      401
    );
  // 2) Verification token,
  const decoded = await jwt.verify(token, process.env.JWT_SECRET);
  if (!decoded) return next(new AppError('JWT MALFORMED'));
  //console.log(decoded);
  // 3) Check if user still exists
  const currUser = await User.findById(decoded.id);

  if (!currUser)
    return next(
      new AppError(
        'The user belonging to this token does not no longer exist',
        401
      )
    );
  // 4) Check if user changed password after the token was issued.
  if (currUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed the password! Login again', 401)
    );
  }

  //Grant access to PROTECTED ROUTE
  req.user = currUser;
  res.locals.user = currUser;
  next();
});

//Only for rendered pages,no errors!
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (!req.cookies.jwt) res.redirect('/login');
    if (req.cookies.jwt) {
      const decoded = await jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);
      if (!decoded) return next();
      const currUser = await User.findById(decoded.id);

      if (!currUser) return next();

      if (currUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      res.locals.user = currUser;
      return next();
    }
  } catch (err) {
    return res.redirect('/login');
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //Roles ['admin,'lead-guide']

    if (!roles.includes(req.user.role))
      return next(
        new AppError('You dont have permission to perforom this action', 403)
      );

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError('There is no user with that email adress', 404));

  //2) Generate the random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3) Send it back as an email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't request this change,feel free to ignore this email`;
  try {
    await new Email(user, resetURL).sendPasswordReset();
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('Something wen wrong sending a email', 500));
  }
  res.status(200).json({
    status: 'success',
    message: 'Token send to email!',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gte: Date.now() },
  });

  //2) If token has not expired,and there is user,set the new password
  if (!user) return next(new AppError('Token is invalid,or has expired'), 400);
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3) Update changedPasswordAt property for the user

  //4) Log the user In,send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from the collection

  const targetUser = await User.findById(req.user.id).select('password');
  //2) Check if POSTed password is correct
  const comparePass = await bcrypt.compare(
    req.body.password,
    targetUser.password
  );
  if (!comparePass) return next(new AppError('Invalid Password', 401));
  //3)If so,update the password
  targetUser.password = req.body.newPassword;
  targetUser.passwordChangedAt = Date.now();
  await targetUser.save();
  //4) Log user in send JWT,
  createSendToken(targetUser, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};
