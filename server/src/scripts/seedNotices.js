require('dotenv').config();
const mongoose = require('mongoose');
const Notice = require('../models/Notice');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campushire');
    const officer = await User.findOne({ role: 'officer' });
    if (!officer) {
      console.log('No officer found');
      process.exit(1);
    }
    await Notice.deleteMany({});
    await Notice.create([
      {
        title: 'Campus Placement Season 2026-27 Announced',
        message: 'Placement drives begin next week. Ensure your profile, CGPA records, and resume PDFs are updated before applying to Tier-1 companies.',
        postedBy: officer._id,
      },
      {
        title: 'Google & Microsoft Pre-Placement Talk Schedule',
        message: 'Pre-placement talk for CSE, IT and ECE will be conducted this Friday at 3:00 PM in the Main Auditorium.',
        postedBy: officer._id,
      },
      {
        title: 'Recruiter Guidelines & Verification Update',
        message: 'All recruiters are requested to update job eligibility criteria (min CGPA, max backlogs, eligible branches) before opening the drives.',
        postedBy: officer._id,
      }
    ]);
    console.log('Sample notices created successfully!');
    process.exit(0);
  } catch (e) {
    console.error('Error adding notices:', e);
    process.exit(1);
  }
})();
