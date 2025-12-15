const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
// Load dotenv for flexible local dev envs (DOTENV_PATH overrides)
try {
  const dotenvPath = process.env.DOTENV_PATH || './.env.local';
  require('dotenv').config({ path: dotenvPath });
  if (process.env.DOTENV_PATH) console.log('Loaded env from', process.env.DOTENV_PATH);
} catch (e) {
  // ignore if dotenv not installed or file missing
}

const { mongoURL } = require('./configuration/index');

async function start() {
  let uri = process.env.MONGO_URL || mongoURL;

  // If no explicit MONGO_URL and default points to localhost, start in-memory mongo for dev
  if (!process.env.MONGO_URL) {
    console.log('No MONGO_URL provided — starting in-memory MongoDB for local development...');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    // show the full connection URI so developers can connect with mongosh or Compass
    console.log('In-memory MongoDB started. Connection URI: %s', uri);
    // keep mongod reference so it isn't GC'd while app runs
    process._localMongod = mongod;
  }

  mongoose
    .connect(uri)
    .then(() => {
      // require main app after mongoose connection to reuse existing startup logic
      const appModule = require('./app');
      // if app exported a startServer function, call it; otherwise app.js listens itself on connection open
      if (typeof appModule.startServer === 'function') {
        appModule.startServer();
      }
    })
    .catch((err) => {
      console.error('Failed to connect mongoose:', err.message || err);
      process.exit(1);
    });
}

start();
