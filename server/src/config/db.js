const mongoose = require('mongoose');
const { initGridFS } = require('./gridfs');
const { MongoMemoryServer } = require('mongodb-memory-server');

/**
 * Connect to MongoDB instance (Atlas or local). In development, if MONGODB_URI is not provided,
 * spin up an in‑memory MongoDB server (mongodb-memory-server) so the app can run without a real DB.
 */
const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    // If no URI is supplied (or still contains placeholder), start an in‑memory server
    if (!uri || uri.includes('<username>')) {
      const mongod = await MongoMemoryServer.create({instance: {ip: '127.0.0.1'}});
      uri = mongod.getUri();
      console.log('[Database] Using in‑memory MongoDB server');
    }
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    // Initialize GridFS bucket
    initGridFS();
  } catch (error) {
    console.error(`[Database Error] Connection failed: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;

