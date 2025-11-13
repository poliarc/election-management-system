import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import type { BlockCandidate } from "../../../types/block";

type Props = {
  initialValues?: BlockCandidate;
  onSubmit: (data: BlockCandidate) => void;
  onCancel: () => void;
};

const BlockForm: React.FC<Props> = ({ initialValues, onSubmit, onCancel }) => {
  const methods = useForm<BlockCandidate>({
    defaultValues: initialValues || {
      blockName: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      state: "",
      district: "",
      profileImage: null,
      password: "",
      assembly: "",
      distNo: "",
      acNo: "",
      designation: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  const internalSubmit = (data: BlockCandidate) => {
    // No API calls here — delegate to parent via onSubmit
    onSubmit(data);
    onCancel();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(internalSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* First Name */}
        <div>
          <label className="block text-sm">First Name</label>
          <input
            {...register("firstName", { required: "Required" })}
            className="input w-full border border-gray-300 rounded-md px-4 py-2"
            placeholder="First Name"
          />
          {errors.firstName && <span className="text-red-500">{errors.firstName.message}</span>}
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm">Last Name</label>
          <input
            {...register("lastName", { required: "Required" })}
            className="input w-full border border-gray-300 rounded-md px-4 py-2"
            placeholder="Last Name"
          />
          {errors.lastName && <span className="text-red-500">{errors.lastName.message}</span>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm">Phone No.</label>
          <input
            type="text"
            {...register("phone", {
              required: "Phone number is required",
              pattern: { value: /^\d{10}$/, message: "Phone number must be exactly 10 digits" },
              validate: {
                onlyNumbers: (value) => (/^\d+$/.test(value) ? true : "Phone number can only contain digits"),
                exactLength: (value) => (value.length === 10 ? true : "Phone number must be exactly 10 digits"),
              },
            })}
            maxLength={10}
            onInput={(e: any) => {
              e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
              if (e.currentTarget.value.length > 10) e.currentTarget.value = e.currentTarget.value.slice(0, 10);
            }}
            className="input w-full border border-gray-300 rounded-md px-4 py-2"
            placeholder="Enter 10-digit phone number"
          />
          {errors.phone && <span className="text-red-500">{errors.phone.message}</span>}
        </div>

        <div>
          <label className="block text-sm">Designation</label>
          <select {...register("designation")} className="input w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="">Please Select</option>
            <option value="State President">State President</option>
            <option value="State Committee Member">State Committee Member</option>
            <option value="District President">District President</option>
            <option value="District Committee Member">District Committee Member</option>
            <option value="Assembly Head">Assembly Head</option>
            <option value="Assembly Committee Member">Assembly Committee Member</option>
            <option value="Block President">Block President</option>
            <option value="Block Committee Member">Block Committee Member</option>
            <option value="Mandal President">Mandal President</option>
            <option value="Mandal Committee Member">Mandal Committee Member</option>
            <option value="Booth President">Booth President</option>
            <option value="Booth Team">Booth Team</option>
            <option value="BLA-1">BLA-1</option>
            <option value="BLA-2">BLA-2</option>
          </select>
          {errors.designation && <span className="text-red-500">{errors.designation.message}</span>}
        </div>

        {/* State */}
        <div>
          <label className="block text-sm">State</label>
          <input
            {...register("state", { required: "Required" })}
            defaultValue={initialValues?.state || ""}
            className="input w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-100"
            placeholder="State"
            readOnly
          />
          {errors.state && <span className="text-red-500">{errors.state.message}</span>}
        </div>

        {/* District */}
        <div>
          <label className="block text-sm">District</label>
          <input
            {...register("district", { required: "Required" })}
            defaultValue={initialValues?.district || ""}
            className="input w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-100"
            placeholder="District"
            readOnly
          />
          {errors.district && <span className="text-red-500">{errors.district.message}</span>}
        </div>

        {/* District No */}
        <div>
          <label className="block text-sm">District No</label>
          <input {...register("distNo")} defaultValue={initialValues?.distNo || ""} className="input w-full border border-gray-300 rounded-md px-4 py-2" />
          {errors.distNo && <span className="text-red-500">{errors.distNo.message}</span>}
        </div>

        {/* Assembly */}
        <div>
          <label className="block text-sm">Assembly</label>
          <input
            {...register("assembly", { required: "Required" })}
            defaultValue={initialValues?.assembly || ""}
            className="input w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-100"
            placeholder="Assembly"
            readOnly
          />
          {errors.assembly && <span className="text-red-500">{errors.assembly.message}</span>}
        </div>

        {/* AC No */}
        <div>
          <label className="block text-sm">AC No</label>
          <input {...register("acNo")} defaultValue={initialValues?.acNo || ""} className="input w-full border border-gray-300 rounded-md px-4 py-2" />
          {errors.acNo && <span className="text-red-500">{errors.acNo.message}</span>}
        </div>

        {/* Block Name */}
        <div>
          <label className="block text-sm">Block Name</label>
          <input
            {...register("blockName", { required: "Required" })}
            className="input w-full border border-gray-300 rounded-md px-4 py-2"
            placeholder="Block Name"
          />
          {errors.blockName && <span className="text-red-500">{errors.blockName.message}</span>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm">Email</label>
          <input
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message: "Please enter a valid email address" },
            })}
            className="input w-full border border-gray-300 rounded-md px-4 py-2"
            placeholder="Enter valid email address"
          />
          {errors.email && <span className="text-red-500">{errors.email.message}</span>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm">Password</label>
          <input
            type="password"
            {...register("password", {
              required: initialValues ? false : "Password is required",
              minLength: { value: 8, message: "Password must be at least 8 characters long" },
              validate: {
                hasUppercase: (value) => { if (initialValues && !value) return true; return /[A-Z]/.test(value) || "Password must contain at least one uppercase letter" },
                hasLowercase: (value) => { if (initialValues && !value) return true; return /[a-z]/.test(value) || "Password must contain at least one lowercase letter" },
                hasDigit: (value) => { if (initialValues && !value) return true; return /\d/.test(value) || "Password must contain at least one digit" },
                hasSpecialChar: (value) => { if (initialValues && !value) return true; return /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(value) || "Password must contain at least one special character" },
              }
            })}
            className="input w-full border border-gray-300 rounded-md px-4 py-2"
            placeholder={initialValues ? "Leave blank to keep current password" : "Enter strong password"}
          />
          {errors.password && <span className="text-red-500">{errors.password.message}</span>}
          {!initialValues && <div className="text-xs text-gray-500 mt-1">Password must contain: uppercase, lowercase, digit, and special character</div>}
        </div>

        {/* Profile Image */}
        <div>
          <label className="block text-sm">Profile Image</label>
          <input type="file" {...register("profileImage")} className="input w-full border border-gray-300 rounded-md px-4 py-2" />
        </div>

        {/* Buttons */}
        <div className="md:col-span-2 flex gap-4 mt-4">
          <button type="submit" className={`px-6 py-2 rounded w-full sm:w-full text-white bg-blue-600 hover:bg-blue-700`}>
            {initialValues ? "Update" : "Submit"}
          </button>

          <button type="button" onClick={onCancel} className="bg-gray-400 text-white px-6 py-2 rounded w-full" >
            Back
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default BlockForm;
