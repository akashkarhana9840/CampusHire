const { z } = require('zod');

const branchEnum = z.enum(['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'AIML']);

const createJobSchema = z.object({
  company: z.string().trim().min(2, 'Company name is required'),
  title: z.string().trim().min(2, 'Job title is required'),
  type: z.enum(['job', 'internship'], {
    errorMap: () => ({ message: 'Type must be "job" or "internship"' }),
  }),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  location: z.string().trim().optional().default('On-site'),
  package: z.string().trim().min(1, 'Package / CTC is required'),
  deadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Valid deadline date is required',
    })
    .refine((val) => new Date(val).getTime() > Date.now(), {
      message: 'Application deadline must be a future date',
    }),
  minCGPA: z.number().min(0, 'minCGPA cannot be negative').max(10, 'minCGPA cannot exceed 10.0').default(0),
  maxBacklogs: z.number().int().min(0, 'maxBacklogs cannot be negative').default(0),
  eligibleBranches: z.array(branchEnum).min(1, 'At least one eligible branch is required'),
  requiredSkills: z.array(z.string().trim()).default([]),
});

const updateJobSchema = createJobSchema.partial();

module.exports = {
  createJobSchema,
  updateJobSchema,
};

