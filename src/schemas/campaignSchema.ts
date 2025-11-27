import * as yup from "yup";

export const campaignSchema = yup.object().shape({
  name: yup
    .string()
    .required("Campaign name is required")
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must not exceed 100 characters"),
  description: yup
    .string()
    .required("Campaign description is required")
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must not exceed 500 characters"),
  start_date: yup.string().required("Start date is required"),
  end_date: yup
    .string()
    .required("End date is required")
    .test("date-order", "End date must be after start date", function (value) {
      const { start_date } = this.parent;
      if (!start_date || !value) return true;
      return new Date(value) >= new Date(start_date);
    }),
  campaign_level: yup
    .string()
    .oneOf(["State", "District", "Assembly", "Block", "Mandal"])
    .required("Campaign level is required"),
  hierarchy_selections: yup
    .array()
    .of(
      yup.object().shape({
        hierarchy_type: yup
          .string()
          .oneOf(["stateMasterData", "afterAssemblyData"])
          .required(),
        hierarchy_id: yup.number().required(),
        toggle_on: yup.boolean().required(),
      })
    )
    .min(1, "At least one target area must be selected")
    .required(),
});

export type CampaignFormData = yup.InferType<typeof campaignSchema> & {
  images?: File[];
};

// Legacy schema for backward compatibility
export const legacyCampaignSchema = yup.object().shape({
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
  images: yup.array().of(yup.string().url("Must be a valid URL")).default([]),
  target_levels: yup.array().of(yup.string()).default([]),
});

export type LegacyCampaignFormData = yup.InferType<
  typeof legacyCampaignSchema
> & {
  imageFiles?: File[];
  targetScopes?: { levelType: string; level_id: string }[];
  autoInclude?: boolean;
};
