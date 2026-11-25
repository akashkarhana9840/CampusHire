const { z } = require('zod');

const branchEnum = z.enum(['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'AIML'], {
  errorMap: () => ({ message: 'Branch must be one of: CSE, IT, ECE, EEE, MECH, CIVIL, AIDS, AIML' }),
});

const profileSchema = z.object({
  branch: branchEnum,
  rollNo: z.string().trim().min(2, 'Roll number must be at least 2 characters').toUpperCase(),
  cgpa: z.number().min(0, 'CGPA cannot be negative').max(10, 'CGPA cannot exceed 10.0'),
  backlogs: z.number().int().min(0, 'Backlogs cannot be negative').default(0),
  skills: z.array(z.string().trim()).default([]),
  contact: z
    .object({
      phone: z.string().trim().optional(),
      linkedin: z.string().trim().optional(),
      github: z.string().trim().optional(),
    })
    .optional(),
});

module.exports = {
  profileSchema,
};

