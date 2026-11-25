require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createOfficer = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campushire';
    await mongoose.connect(mongoUri);
    console.log('[Bootstrapper] Connected to MongoDB...');

    const email = (process.env.OFFICER_EMAIL || 'officer@campushire.edu').toLowerCase();
    const name = process.env.OFFICER_NAME || 'Placement Officer';
    const password = process.env.OFFICER_PASSWORD || 'Officer@2026Secure';

    const existingOfficer = await User.findOne({ email });
    if (existingOfficer) {
      console.log(`[Bootstrapper] Officer with email "${email}" already exists. (Skipped)`);
      process.exit(0);
    }

    const passwordHash = await User.hashPassword(password);
    const officer = await User.create({
      name,
      email,
      passwordHash,
      role: 'officer',
      isActive: true,
    });

    console.log(`[Bootstrapper] Placement Officer created successfully:`);
    console.log(` - ID: ${officer._id}`);
    console.log(` - Name: ${officer.name}`);
    console.log(` - Email: ${officer.email}`);
    console.log(` - Role: ${officer.role}`);
    console.log(` - Active: ${officer.isActive}`);

    process.exit(0);
  } catch (error) {
    console.error('[Bootstrapper Error]:', error.message);
    process.exit(1);
  }
};

createOfficer();

