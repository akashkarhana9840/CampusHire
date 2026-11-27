// Seed script for CampusHire
// Usage: npm run seed   (development)
//        npm run seed -- --force   (override production protection)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { getGridFSBucket } = require('../config/gridfs');
const dotenv = require('dotenv');
const connectDB = require('../config/db');

dotenv.config();

const FORCE = process.argv.includes('--force');
if (process.env.NODE_ENV === 'production' && !FORCE) {
  console.error('❌ Seed script aborted: running in production without --force');
  process.exit(1);
}

// Validate required env vars
const requiredEnv = ['JWT_SECRET', 'OFFICER_EMAIL', 'OFFICER_PASSWORD'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
}

(async () => {
  try {
    await connectDB();
    const conn = mongoose.connection;
    console.log(`🔧 Connected to MongoDB database: ${conn.name}`);
    const bucket = getGridFSBucket();

    // Load models
    const User = require('../models/User');
    const Profile = require('../models/Profile');
    const Job = require('../models/Job');
    const Application = require('../models/Application');

    // Clear existing data (optional – adjust as needed)
    if (process.argv.includes('--reset')) {
      // WARNING: This will DELETE ALL existing data in the target database!
      await Promise.all([
  
        User.deleteMany({}),
        Profile.deleteMany({}),
        Job.deleteMany({}),
        Application.deleteMany({}),
        conn.db.collection('resumes.files').deleteMany({}),
        conn.db.collection('resumes.chunks').deleteMany({}),
      ]);
      console.log('🔄 Existing collections cleared because --reset flag was provided.');
    } else {
      console.log('⚠️ No --reset flag detected – existing collections will be preserved.');
    }



    const DEMO_PASSWORD = 'DemoPass123!';
    const hashedDemoPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

    // 1️⃣ Officer (from env)
    const officer = await User.create({
      name: process.env.OFFICER_NAME || 'Officer',
      email: process.env.OFFICER_EMAIL,
      passwordHash: await bcrypt.hash(process.env.OFFICER_PASSWORD, 10),
      role: 'officer',
      isActive: true,
    });

    // 2️⃣ Recruiters (3 active)
    const recruiterEmails = ['recruiter1@example.com', 'recruiter2@example.com', 'recruiter3@example.com'];
    const recruiters = await Promise.all(
      recruiterEmails.map((email, idx) =>
        User.create({
          name: `Recruiter ${idx + 1}`,
          email,
          passwordHash: hashedDemoPassword,
          role: 'recruiter',
          isActive: true,
        })
      )
    );

    // 3️⃣ Students (20)
    const branches = ['CSE', 'ECE', 'MECH', 'CIVIL', 'IT'];
    const studentUsers = [];
    const studentProfiles = [];
    for (let i = 1; i <= 20; i++) {
      const name = `Student ${i}`;
      const email = `student${i}@example.com`;
      const user = await User.create({
        name,
        email,
        passwordHash: hashedDemoPassword,
        role: 'student',
        collegeId: `COLLEGE${i}`,
        isActive: true,
      });
      const branch = branches[Math.floor(Math.random() * branches.length)];
      const rollNo = `2020${String(i).padStart(3, '0')}`;
      const cgpa = (Math.random() * 5 + 5).toFixed(2); // 5.00 - 10.00
      const backlogs = Math.floor(Math.random() * 4); // 0-3
      const skills = ['JavaScript', 'Node.js', 'React', 'MongoDB'];

      // Create placeholder PDF buffer
      const pdfContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 55 >>\nstream\nBT /F1 24 Tf 100 700 Td (${name} Resume) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000210 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n306\n%%EOF`;
      const uploadStream = bucket.openUploadStream(`${email}_resume.pdf`, {
        contentType: 'application/pdf',
      });
      uploadStream.end(Buffer.from(pdfContent));
      const resumeFileId = await new Promise((resolve, reject) => {
        uploadStream.on('finish', () => resolve(uploadStream.id));
        uploadStream.on('error', reject);
      });

      const profile = await Profile.create({
        userId: user._id,
        branch,
        rollNo,
        cgpa,
        backlogs,
        skills,
        resumeFileId,
      });

      studentUsers.push(user);
      studentProfiles.push(profile);
    }

    // 4️⃣ Jobs (15)
    const jobStatuses = ['open', 'pending', 'closed', 'rejected'];
    const jobs = [];
    for (let i = 1; i <= 15; i++) {
      const recruiter = recruiters[Math.floor(Math.random() * recruiters.length)];
      const status = jobStatuses[Math.floor(Math.random() * jobStatuses.length)];
      const eligibleBranches = [branches[Math.floor(Math.random() * branches.length)]];
      const minCGPA = (Math.random() * 3 + 5).toFixed(2); // 5 - 8
      const maxBacklogs = Math.floor(Math.random() * 3); // 0-2
      const deadline = new Date(`2027-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`);

      const job = await Job.create({
        postedBy: recruiter._id,
        status,
        company: `Company ${i}`,
        title: `Job Title ${i}`,
        type: 'job',
        description: `Demo job ${i}`,
        location: 'Remote',
        package: `${Math.floor(Math.random() * 10 + 5)} LPA`,
        deadline,
        eligibleBranches,
        minCGPA,
        maxBacklogs,
      });
      jobs.push(job);
    }

    // 5️⃣ Applications (~40)
    const possibleStatuses = ['Applied', 'Shortlisted', 'Interview', 'Hired', 'Rejected'];
    const applications = [];
    for (let i = 0; i < 40; i++) {
      // pick random student and open job (or any job if we want variety)
      const studentIdx = Math.floor(Math.random() * studentProfiles.length);
      const jobIdx = Math.floor(Math.random() * jobs.length);
      const student = studentUsers[studentIdx];
      const profile = studentProfiles[studentIdx];
      const job = jobs[jobIdx];

      // skip if already applied
      const exists = await Application.findOne({ studentId: student._id, jobId: job._id });
      if (exists) continue;

      // initial status is Applied, then optionally add more transitions
      const statusHistory = [{ status: 'Applied', changedAt: new Date(), changedBy: job.postedBy }];
      let currentStatus = 'Applied';
      // add 0-3 more random valid transitions
      const transitionCount = Math.floor(Math.random() * 4);
      for (let t = 0; t < transitionCount; t++) {
        const next = possibleStatuses[Math.min(possibleStatuses.indexOf(currentStatus) + 1, possibleStatuses.length - 1)];
        if (next === currentStatus) break;
        statusHistory.push({ status: next, changedAt: new Date(), changedBy: job.postedBy });
        currentStatus = next;
      }

      const application = await Application.create({
        studentId: student._id,
        jobId: job._id,
        applicantSnapshot: {
          branch: profile.branch.toUpperCase(),
          rollNo: profile.rollNo.toUpperCase(),
          cgpa: profile.cgpa,
          backlogs: profile.backlogs,
          skills: profile.skills,
          resumeFileId: profile.resumeFileId,
        },
        status: currentStatus,
        appliedAt: new Date(),
        statusHistory,
      });
      applications.push(application);
    }

    // Print credentials table
    console.log('\n=== Demo Credentials ===');
    console.log('Officer:');
    console.log(`  Email: ${process.env.OFFICER_EMAIL}`);
    console.log(`  Password: ${process.env.OFFICER_PASSWORD} (from .env)`);
    console.log('\nRecruiters (demo password):');
    recruiterEmails.forEach((email) => console.log(`  ${email}`));
    console.log('\nStudents (demo password):');
    studentUsers.slice(0, 5).forEach((u) => console.log(`  ${u.email}`));
    console.log('\nDemo password for seeded recruiters & students:');
    console.log(`  ${DEMO_PASSWORD}`);
    console.log('\nTotal created:');
    console.log(`  Officers: 1`);
    console.log(`  Recruiters: ${recruiters.length}`);
    console.log(`  Students: ${studentUsers.length}`);
    console.log(`  Jobs: ${jobs.length}`);
    console.log(`  Applications: ${applications.length}`);
    console.log('\nSeed completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed script error:', err);
    process.exit(1);
  }
})();

