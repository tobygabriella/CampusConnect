import * as z from "zod";

// Base without .refine()
const rawBaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  role: z.string(),
  college: z.string().nullable().optional(),
  collegesServed: z.array(z.string()).optional(),
});

export const serviceProviderSchema = z.object({
  profession: z.string().min(1, "Profession is required"),
  biography: z.string().min(1, "Biography is required"),
  experience: z.string().min(1, "Experience is required"),
  location: z.string().min(1, "Location is required"),
  policy: z.string().min(1, "Policy is required"),
  cancellationWindow: z
    .string()
    .min(1, "Cancellation window is required")
    .regex(/^\d+$/, "Must be a number")
    .refine((val) => parseInt(val) <= 72, {
      message: "Cannot exceed 72 hours",
    }),
  rescheduleFee: z
    .string()
    .min(1, "Reschedule fee is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Must be a valid amount"),
  services: z
    .array(
      z
        .object({
          id: z.string().optional(),
          name: z.string().min(1, "Service name required"),
          price: z
            .string()
            .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price"),
          depositAmount: z
            .string()
            .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid deposit"),
          duration: z
            .string()
            .regex(/^\d+$/, "Duration must be a number"),
        })
        .refine(
          (data) =>
            parseFloat(data.depositAmount) <=
            parseFloat(data.price) * 0.5,
          {
            message: "Deposit cannot exceed 50% of the price",
            path: ["depositAmount"],
          }
        )
    )
    .min(1, "At least one service is required"),
});

export const getCombinedSchema = (role, isPreparingSwitch = false) => {
    const shouldIncludeProviderFields = role === "service_provider" || isPreparingSwitch;
  
    const mergedSchema = shouldIncludeProviderFields
      ? rawBaseSchema.merge(serviceProviderSchema)
      : rawBaseSchema;
  
    return mergedSchema.refine((data) => {
      if (data.role === "student" && !data.college) return false;
      if ((data.role === "service_provider" || isPreparingSwitch) &&
          (!data.collegesServed || data.collegesServed.length === 0)) return false;
      return true;
    }, {
      message: "College or Colleges Served is required based on role",
    });
  };
  