const { profileSchema } = require('../validators/profileValidator');
const { createJobSchema, updateJobSchema } = require('../validators/jobValidator');
const { registerSchema } = require('../validators/authValidator');

async function verifyPhase2() {
  console.log('=== VERIFYING PHASE 2 LOGIC, MODELS & VALIDATIONS ===\n');

  // Test 1: Password regex validation
  console.log('1. Testing new password validation rule (min 8 chars, 1 letter, 1 number)...');
  const weakShortPass = registerSchema.safeParse({
    name: 'Aakash',
    email: 'test@student.com',
    password: 'short',
    role: 'student',
  });
  const noNumberPass = registerSchema.safeParse({
    name: 'Aakash',
    email: 'test@student.com',
    password: 'lettersOnlyPassword',
    role: 'student',
  });
  const validPass = registerSchema.safeParse({
    name: 'Aakash',
    email: 'test@student.com',
    password: 'Password123',
    role: 'student',
  });

  if (!weakShortPass.success && !noNumberPass.success && validPass.success) {
    console.log('   [PASS] Password rules properly enforce min 8 chars with letters and numbers');
  } else {
    throw new Error('Password validation test failed');
  }

  // Test 2: Profile schema validation (branch, rollNo, cgpa)
  console.log('2. Testing Profile schema validation...');
  const invalidBranchProfile = profileSchema.safeParse({
    branch: 'INVALID_BRANCH',
    rollNo: '20BCSE01',
    cgpa: 8.5,
    backlogs: 0,
  });
  const validProfile = profileSchema.safeParse({
    branch: 'CSE',
    rollNo: '20BCSE01',
    cgpa: 8.5,
    backlogs: 0,
    skills: ['React', 'Node.js', 'MongoDB'],
    contact: { phone: '9876543210' },
  });

  if (!invalidBranchProfile.success && validProfile.success) {
    console.log('   [PASS] Profile validation correctly restricts branches and validates data');
  } else {
    throw new Error('Profile validation failed');
  }

  // Test 3: Job Posting Schema Validation
  console.log('3. Testing Job creation schema...');
  const validJob = createJobSchema.safeParse({
    company: 'Microsoft',
    title: 'Software Development Engineer',
    type: 'job',
    description: 'Full stack development role requiring strong CS fundamentals.',
    location: 'Bangalore / Remote',
    package: '18 LPA',
    deadline: new Date(Date.now() + 86400000 * 10).toISOString(),
    minCGPA: 7.5,
    maxBacklogs: 0,
    eligibleBranches: ['CSE', 'IT', 'ECE'],
    requiredSkills: ['JavaScript', 'React', 'Node.js'],
  });

  if (validJob.success) {
    console.log('   [PASS] Job posting schema validated successfully');
  } else {
    console.error(validJob.error);
    throw new Error('Job schema failed on valid input');
  }

  // Test 4: Job update partial schema
  console.log('4. Testing Job partial update schema...');
  const partialUpdate = updateJobSchema.safeParse({
    package: '20 LPA',
    minCGPA: 8.0,
  });
  if (partialUpdate.success) {
    console.log('   [PASS] Partial update schema permits selective field updates');
  } else {
    throw new Error('Partial update schema failed');
  }

  console.log('\n=== ALL PHASE 2 VALIDATION & ARCHITECTURE CHECKS PASSED (4/4) ===\n');
}

verifyPhase2().catch((err) => {
  console.error(err);
  process.exit(1);
});

