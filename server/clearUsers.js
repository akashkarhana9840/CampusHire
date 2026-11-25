require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const result = await mongoose.connection.db.collection('users').deleteMany({});
    console.log('✅ Deleted users:', result.deletedCount);
    await mongoose.disconnect();
  } catch (e) {
    console.error('❌ Error clearing users', e);
    process.exit(1);
  }
})();
