require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campushire';
    await mongoose.connect(mongoUri);
    console.log('[Reset] Connected to MongoDB');
    const email = (process.env.OFFICER_EMAIL || 'officer@example.com').toLowerCase();
    const password = process.env.OFFICER_PASSWORD || 'OfficerPass123!';
    const officer = await User.findOne({ email });
    if (!officer) {
      console.log('[Reset] Officer not found, creating...');
      const passwordHash = await User.hashPassword(password);
      await User.create({ name: process.env.OFFICER_NAME || 'Placement Officer', email, passwordHash, role: 'officer', isActive: true });
      console.log('[Reset] Officer created');
    } else {
      const passwordHash = await User.hashPassword(password);
      officer.passwordHash = passwordHash;
      officer.role = 'officer';
      officer.isActive = true;
      await officer.save();
      console.log('[Reset] Officer password updated');
    }
    process.exit(0);
  } catch (e) {
    console.error('[Reset] Error:', e);
    process.exit(1);
  }
})();
