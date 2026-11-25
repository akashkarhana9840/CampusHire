require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { MongoClient } = require('mongodb');
(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('❌ MONGODB_URI missing'); process.exit(1); }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    await client.db().dropDatabase();
    console.log('✅ Dropped campus_hire database');
  } catch (e) {
    console.error('❌ Error dropping DB', e);
    process.exit(1);
  } finally {
    await client.close();
  }
})();

