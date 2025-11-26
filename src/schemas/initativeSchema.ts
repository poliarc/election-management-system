import * as yup from "yup";

export const campaignFormSchema = yup.object().shape({
  fullName: yup
    .string()
    .required("Full name is required")
    .min(2, "Name must be at least 2 characters"),

  phone: yup
    .string()
    .required("Phone number is required")
    .matches(/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"),

  email: yup.string().email("Please enter a valid email address").optional(),

  address: yup.string().optional(),

  emergencyContact: yup
    .string()
    .matches(/^\+?[1-9]\d{1,14}$|^$/, "Please enter a valid phone number")
    .optional(),

  additionalGuests: yup
    .number()
    .min(0, "Cannot be negative")
    .max(5, "Maximum 5 additional guests allowed")
    .required("Please specify number of additional guests"),

  specialRequirements: yup.string().optional(),

  transportNeeded: yup.boolean().required(),

  accommodationNeeded: yup.boolean().required(),

  dietaryRestrictions: yup.string().optional(),
});

export type CampaignFormData = yup.InferType<typeof campaignFormSchema> & {
  images: File[];
};
