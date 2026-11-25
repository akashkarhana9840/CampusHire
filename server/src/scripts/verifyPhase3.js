const { checkStudentEligibility, isValidStatusTransition } = require('../services/eligibilityService');

async function testPhase3() {
  console.log('=== VERIFYING PHASE 3 ELIGIBILITY ENGINE & STATUS FSM ===\n');

  // Test 1: Incomplete profile rejection
  console.log('1. Testing eligibility with missing profile/resume...');
  const noProfileResult = checkStudentEligibility(null, {
    eligibleBranches: ['CSE'],
    minCGPA: 7.0,
    maxBacklogs: 0,
  });
  if (!noProfileResult.isEligible && noProfileResult.reasons.length > 0) {
    console.log('   [PASS] Null profile is flagged ineligible');
  } else {
    throw new Error('Null profile failed check');
  }

  const noResumeResult = checkStudentEligibility(
    { branch: 'CSE', cgpa: 8.5, backlogs: 0, resumeFileId: null },
    { eligibleBranches: ['CSE'], minCGPA: 7.0, maxBacklogs: 0 }
  );
  if (!noResumeResult.isEligible && noResumeResult.reasons.some((r) => r.includes('Resume'))) {
    console.log('   [PASS] Profile missing resume is flagged ineligible');
  } else {
    throw new Error('Profile missing resume should be ineligible');
  }

  // Test 2: Ineligible branch, CGPA, and backlogs
  console.log('2. Testing eligibility rejection for branch, CGPA, and backlogs...');
  const student = {
    branch: 'MECH',
    cgpa: 6.5,
    backlogs: 2,
    resumeFileId: '654321098765432109876543',
  };
  const job = {
    eligibleBranches: ['CSE', 'IT'],
    minCGPA: 7.5,
    maxBacklogs: 0,
  };
  const failedResult = checkStudentEligibility(student, job);
  if (!failedResult.isEligible && failedResult.reasons.length === 3) {
    console.log('   [PASS] Student failing branch, CGPA, and backlogs correctly gets 3 specific reasons');
  } else {
    throw new Error('Eligibility logic did not catch all criteria violations');
  }

  // Test 3: Fully eligible student
  console.log('3. Testing fully eligible student...');
  const eligibleStudent = {
    branch: 'CSE',
    cgpa: 8.8,
    backlogs: 0,
    resumeFileId: '654321098765432109876543',
  };
  const successResult = checkStudentEligibility(eligibleStudent, job);
  if (successResult.isEligible && successResult.reasons.length === 0) {
    console.log('   [PASS] Eligible student passes all criteria');
  } else {
    throw new Error('Eligible student was flagged as ineligible');
  }

  // Test 4: Application finite state machine status transitions
  console.log('4. Testing FSM application status transitions...');
  // Valid transitions
  const t1 = isValidStatusTransition('Applied', 'Shortlisted');
  const t2 = isValidStatusTransition('Shortlisted', 'Interview');
  const t3 = isValidStatusTransition('Interview', 'Hired');
  const t4 = isValidStatusTransition('Applied', 'Rejected');

  // Invalid transitions
  const t5 = isValidStatusTransition('Applied', 'Hired'); // Cannot jump directly from Applied to Hired
  const t6 = isValidStatusTransition('Hired', 'Shortlisted'); // Terminal state
  const t7 = isValidStatusTransition('Rejected', 'Interview'); // Terminal state

  if (t1 && t2 && t3 && t4 && !t5 && !t6 && !t7) {
    console.log('   [PASS] Status transitions follow strict Finite State Machine rules');
  } else {
    throw new Error('FSM state transition validation failed');
  }

  console.log('\n=== ALL PHASE 3 LOGIC & FSM TESTS PASSED (4/4) ===\n');
}

testPhase3().catch((err) => {
  console.error(err);
  process.exit(1);
});

