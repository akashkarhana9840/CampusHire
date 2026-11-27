require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campushire');
    const recruiters = await User.find({ role: 'recruiter' });
    console.log('Found recruiters:', recruiters.map(r => ({ email: r.email, isActive: r.isActive, hasPassword: !!r.passwordHash })));
    for (const r of recruiters) {
      const match = await r.comparePassword('DemoPass123!');
      console.log(`Password test for ${r.email}:`, match);
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
