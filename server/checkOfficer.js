require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { MongoClient } = require('mongodb');
(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) { console.error('❌ MONGODB_URI missing'); process.exit(1); }
    const client = new MongoClient(uri);
    await client.connect();
    const user = await client.db().collection('users').findOne({ email: process.env.OFFICER_EMAIL });
    if (!user) {
      console.log('⚠️ Officer not found');
    } else {
      console.log('Officer record:', {
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        passwordHash: user.passwordHash ? user.passwordHash.slice(0,30)+'...' : null,
      });
    }
    await client.close();
  } catch (e) {
    console.error('❌ Error', e);
    process.exit(1);
  }
})();

