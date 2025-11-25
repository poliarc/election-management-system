import * as yup from "yup";

export const campaignSchema = yup.object().shape({
  title: yup
    .string()
    .required("Campaign title is required")
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must not exceed 100 characters"),
  description: yup
    .string()
    .required("Campaign description is required")
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must not exceed 500 characters"),
  location: yup
    .string()
    .max(200, "Location must not exceed 200 characters")
    .default(""),
  start_date: yup.string().default(""),
  end_date: yup
    .string()
    .default("")
    .test("date-order", "End date must be after start date", function (value) {
      const { start_date } = this.parent;
      if (!start_date || !value) return true;
      return new Date(value) >= new Date(start_date);
    }),
});

export type CampaignFormData = yup.InferType<typeof campaignSchema>;
