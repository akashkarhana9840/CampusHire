require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campushire';
    await mongoose.connect(mongoUri);
    console.log('[Student Reset] Connected to MongoDB');
    const email = 'student@example.com';
    const password = 'StudentPass123!';
    let user = await User.findOne({ email });
    if (!user) {
      const passwordHash = await User.hashPassword(password);
      await User.create({
        name: 'Test Student',
        email,
        passwordHash,
        role: 'student',
        isActive: true,
        collegeId: 'COL123',
      });
      console.log('[Student Reset] Student created');
    } else {
      const passwordHash = await User.hashPassword(password);
      user.passwordHash = passwordHash;
      user.role = 'student';
      user.isActive = true;
      await user.save();
      console.log('[Student Reset] Student updated');
    }
    process.exit(0);
  } catch (e) {
    console.error('[Student Reset] Error:', e);
    process.exit(1);
  }
})();
