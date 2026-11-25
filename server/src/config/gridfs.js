const mongoose = require('mongoose');

let gridfsBucket;

/**
 * Initialize MongoDB GridFS Bucket using the active Mongoose connection
 */
const initGridFS = () => {
  if (!gridfsBucket && mongoose.connection.readyState === 1) {
    gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'resumes',
    });
    console.log('[Storage] GridFS Bucket initialized: "resumes"');
  }
  return gridfsBucket;
};

const getGridFSBucket = () => {
  if (!gridfsBucket) {
    return initGridFS();
  }
  return gridfsBucket;
};

module.exports = {
  initGridFS,
  getGridFSBucket,
};

