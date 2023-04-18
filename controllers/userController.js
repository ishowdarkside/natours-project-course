const User = require('../models/userModel');
const sharp = require('sharp');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./hanlderFactory');
const multer = require('multer');

/*const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  },
});*/

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else cb(new AppError('Not an image!please upload only image', 400), false);
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
exports.uploadUserPhoto = upload.single('photo');
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  /*
  KAKO IZGLEDA OBJ:
  On je trenutno req.body - podaci koje postujemo
  {name:"Ajdin",
  email:"ajdin@gmail.com"
}
i sad bukvalno sta radimo je pravimo novi objekt koji ce da sadrzi samo podatke
koji se dozvoljeni..a koji su dozvoljeni? Pa oni koje navedemo u filter obj funkciji
jer trenutno koristimo rest operator koji ce da pretvori sve te dzvoljene u jedan array
  i mi ovdje u codu loopamo kroz keys objekta i provjeravamo da li taj array sadrzi key 
  naseg body-a.ako sadrzi,u novi objekt stavi taj key sa original value-om
  */
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  console.log(req.file);
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'This route is not for password updates.Please use /updateMyPassword',
        400
      )
    );

  const filterObj = req.file
    ? { email: req.body.email, name: req.body.name, photo: req.file.filename }
    : { email: req.body.email, name: req.body.name };
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterObj, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: updatedUser,
  });
  //2) Update user document
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

//Do NOT update password with this:
exports.updateUser = factory.updateOne(User);
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.deleteUser = factory.deleteOne(User);
