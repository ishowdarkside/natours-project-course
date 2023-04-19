const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, ':', err.message);
  console.log(err.stack);
  process.exit(1);
});

const app = require('./app');
const port = +process.env.PORT || 3000;
dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE__PASSWORD
);

mongoose.connect(DB).then((con) => {
  console.log('DB Connection successful');
});

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLER REJECTION! Shutting Down!');
  console.log(err.name, ':', err.message);
  console.log(err.stack);
  server.close(() => {
    process.exit(1);
  });
});
