const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const checkRole = require('../middleware/roleMiddleware');

async function runUnitTests() {
  console.log('=== RUNNING PHASE 1 LOGIC & SECURITY CHECKS ===\n');

  // Test 1: Zod Registration validation - Reject officer
  console.log('1. Testing registration role restriction...');
  const officerAttempt = registerSchema.safeParse({
    name: 'Officer Raj',
    email: 'officer@campus.edu',
    password: 'Password123',
    role: 'officer',
  });
  if (!officerAttempt.success) {
    console.log('   [PASS] Registration strictly rejects "officer" role');
  } else {
    throw new Error('Registration allowed officer role!');
  }

  // Test 2: Zod Registration validation - Accept student and recruiter
  console.log('2. Testing student & recruiter schema parsing...');
  const studentAttempt = registerSchema.safeParse({
    name: 'Aakash Verma',
    email: 'aakash@campus.edu',
    password: 'Password123',
    role: 'student',
  });
  const recruiterAttempt = registerSchema.safeParse({
    name: 'Google Recruiter',
    email: 'recruiter@google.com',
    password: 'Password123',
    role: 'recruiter',
  });
  if (studentAttempt.success && recruiterAttempt.success) {
    console.log('   [PASS] Student and Recruiter schemas validated successfully');
  } else {
    throw new Error('Valid registration rejected!');
  }

  // Test 3: Password hashing & verification with bcryptjs
  console.log('3. Testing bcrypt hashing & verification...');
  const rawPass = 'Student@2026';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(rawPass, salt);
  const match = await bcrypt.compare(rawPass, hash);
  const mismatch = await bcrypt.compare('WrongPassword', hash);
  if (match && !mismatch) {
    console.log('   [PASS] bcrypt password hashing and comparison verified');
  } else {
    throw new Error('Bcrypt check failed!');
  }

  // Test 4: JWT Signing and Verification
  console.log('4. Testing JWT creation and payload decoding...');
  const secret = 'test_secret_key_12345';
  const testPayload = { userId: '654321098765432109876543', role: 'recruiter' };
  const token = jwt.sign(testPayload, secret, { expiresIn: '1h' });
  const decoded = jwt.verify(token, secret);
  if (decoded.userId === testPayload.userId && decoded.role === testPayload.role) {
    console.log('   [PASS] JWT token successfully generated and verified');
  } else {
    throw new Error('JWT verification failed');
  }

  // Test 5: Role-based access control (RBAC) middleware check
  console.log('5. Testing RBAC middleware...');
  const studentReq = { user: { role: 'student', name: 'Aakash' } };
  let errorStatus = null;
  let errorPayload = null;
  const mockRes = {
    status: (code) => {
      errorStatus = code;
      return {
        json: (payload) => {
          errorPayload = payload;
        },
      };
    },
  };

  const recruiterOnly = checkRole('recruiter');
  recruiterOnly(studentReq, mockRes, () => {});
  if (errorStatus === 403 && errorPayload.success === false) {
    console.log('   [PASS] RBAC properly blocks student from recruiter endpoints with 403 Forbidden');
  } else {
    throw new Error('RBAC allowed unauthorized role');
  }

  const officerOnly = checkRole('officer');
  let allowed = false;
  officerOnly({ user: { role: 'officer' } }, mockRes, () => {
    allowed = true;
  });
  if (allowed) {
    console.log('   [PASS] RBAC properly permits officer to access officer endpoints');
  } else {
    throw new Error('RBAC blocked authorized role');
  }

  console.log('\n=== ALL PHASE 1 CORE LOGIC & SECURITY TESTS PASSED (5/5) ===\n');
}

runUnitTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

