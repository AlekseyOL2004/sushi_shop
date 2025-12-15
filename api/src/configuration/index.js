const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0';
// default to local mongodb for development if MONGO_URL is not set
const mongoURL = process.env.MONGO_URL || 'mongodb://localhost:27017/api';
module.exports = { port, host, mongoURL };
