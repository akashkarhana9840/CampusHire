const { z } = require('zod');

// Password rule: min 8 chars, at least one letter and one number
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(50, 'Password cannot exceed 50 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Registration validation: ONLY 'student' and 'recruiter' allowed.
// Officers are created strictly via database seed script.
// Registration validation: ONLY 'student' and 'recruiter' allowed.
// Officers are created strictly via database seed script.
const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: passwordSchema,
  role: z.enum(['student', 'recruiter'], {
    errorMap: () => ({ message: 'Role must be either student or recruiter' }),
  }),
  // College ID is required for students only
  collegeId: z.string().trim().optional().refine((val, ctx) => {
    const { role } = ctx.parent;
    if (role === 'student' && (!val || val.length === 0)) {
      return false;
    }
    return true;
  }, { message: 'College ID is required for students' }),
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

module.exports = {
  registerSchema,
  loginSchema,
};

