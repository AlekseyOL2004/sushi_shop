const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRouter = require('./routers/user');
const { port, host, mongoURL } = require('./configuration/index');

const app = express();
// Allow all origins to simplify local development for students
app.use(cors());
app.use(express.json()); //body-parser
app.use('/users', userRouter);

const startServer = () => {
  app.listen(port, host, () => {
    console.log(`Server is available on http://${host}:${port}`);
  });
};

// If this file is run directly (npm start / node src/app.js), connect using configured mongoURL
if (require.main === module) {
  mongoose.connect(mongoURL);
  mongoose.connection
    .on('error', (error) => {
      console.log(error.message);
    })
    .once('open', () => {
      startServer();
    });
}

module.exports = { app, startServer };
