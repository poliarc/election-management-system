import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  fullName: z.string().min(1, "Full Name is required"),
  placeOfBirth: z.string().optional(),
  partyName: z.string().optional(),
  education: z.string().optional(),
  profession: z.string().optional(),
  fathersName: z.string().optional(),
  mothersName: z.string().optional(),
  spousesName: z.string().optional(),
  spousesProfession: z.string().optional(),
  religion: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const fields: Array<{
  name: keyof FormValues;
  label: string;
  placeholder: string;
}> = [
  { name: "fullName", label: "Full Name", placeholder: "Enter full name" },
  { name: "placeOfBirth", label: "Place of Birth", placeholder: "City, State" },
  { name: "partyName", label: "Party Name", placeholder: "Party affiliation" },
  { name: "education", label: "Education", placeholder: "Highest qualification" },
  { name: "profession", label: "Profession", placeholder: "Current profession" },
  { name: "fathersName", label: "Father's Name", placeholder: "Enter father's name" },
  { name: "mothersName", label: "Mother's Name", placeholder: "Enter mother's name" },
  { name: "spousesName", label: "Spouse's Name", placeholder: "Enter spouse's name" },
  { name: "spousesProfession", label: "Spouse's Profession", placeholder: "Enter spouse's profession" },
  { name: "religion", label: "Religion", placeholder: "Enter religion" },
];

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      placeOfBirth: "",
      partyName: "",
      education: "",
      profession: "",
      fathersName: "",
      mothersName: "",
      spousesName: "",
      spousesProfession: "",
      religion: "",
    },
    mode: "onBlur",
  });

  const onSubmit = (data: FormValues) => {
    console.log("Profile submitted", data);
  };

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-[#1a1a2e]">
      <div className="relative isolate overflow-hidden">
        {/* Subtle warm background texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(59,130,246,0.07),transparent_40%),radial-gradient(circle_at_85%_30%,rgba(99,102,241,0.05),transparent_45%),radial-gradient(circle_at_50%_90%,rgba(59,130,246,0.04),transparent_50%)]" />
        
        <div className="relative mx-auto w-full max-w-6xl px-6 py-14 lg:px-10">
          {/* Header */}
          <div className="mb-10 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="h-px w-8 bg-[#3b82f6]" />
              <p className="text-xs uppercase tracking-[0.4em] text-[#3b82f6] font-medium">
                Profile Collection
              </p>
            </div>
            <h1 className="text-3xl font-semibold md:text-4xl text-[#111827]">
              Candidate Profile Intake
            </h1>
            
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-8 shadow-[0_4px_40px_-8px_rgba(59,130,246,0.12),0_1px_3px_rgba(0,0,0,0.05)]">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                {fields.map((field) => (
                  <div key={field.name} className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-[#374151]">
                      {field.label}
                      {field.name === "fullName" && (
                        <span className="ml-1 text-[#3b82f6]">*</span>
                      )}
                    </label>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      {...register(field.name)}
                      className="w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-4 py-3 text-sm text-[#111827] placeholder:text-[#9ca3af] shadow-sm outline-none transition-all duration-200 hover:border-[#3b82f6]/50 hover:bg-white focus:border-[#3b82f6] focus:bg-white focus:ring-2 focus:ring-[#3b82f6]/20"
                    />
                    {field.name === "fullName" && errors.fullName ? (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <span>⚠</span> {errors.fullName.message}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-4 border-t border-[#f3f4f6] pt-6 md:flex-row md:items-center md:justify-between">
                <p></p>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(37,99,235,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1d4ed8] hover:shadow-[0_6px_20px_-4px_rgba(37,99,235,0.7)] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2"
                >
                  Submit Profile
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}