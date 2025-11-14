import React from "react";
import { useForm } from "react-hook-form";
import type { BoothCandidate } from "../../../types/booth";

type Props = {
  initialValues?: BoothCandidate;
  onSubmit: (data: BoothCandidate) => void;
  onCancel: () => void;
};

export const BoothForm: React.FC<Props> = ({
  initialValues,
  onSubmit,
  onCancel,
}) => {
  const [loggedInUser, setLoggedInUser] = React.useState<any>(null);

  React.useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setLoggedInUser(parsedUser);
      } catch {
        setLoggedInUser(null);
      }
    }
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BoothCandidate>({
    defaultValues: initialValues || {
      boothNo: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      state: "",
      district: "",
      assembly: "",
      block: "",
      mandal: "",
      password: "",
      district_id: undefined,
      assembly_id: undefined,
      distNo: "",
      acNo: "",
      designation: "",
      polling_center_id: undefined,
      pollingCenter: "",
      pollingCenterNo: "",
    },
  });

  React.useEffect(() => {
    if (loggedInUser && !initialValues) {
      if (loggedInUser.state) {
        setValue("state", loggedInUser.state);
      }
      if (loggedInUser.district) {
        setValue("district", loggedInUser.district);
        if (loggedInUser.district_id) {
          setValue("district_id", loggedInUser.district_id);
        }
      }
      if (loggedInUser.assembly) {
        setValue("assembly", loggedInUser.assembly);
      }
      if (loggedInUser.assembly_id) {
        setValue("assembly_id", loggedInUser.assembly_id);
      }
      if (loggedInUser.distNo) {
        setValue("distNo", loggedInUser.distNo);
      }
      if (loggedInUser.acNo) {
        setValue("acNo", loggedInUser.acNo);
      }
    }
  }, [loggedInUser, initialValues, setValue]);

  const handleFormSubmit = (data: BoothCandidate) => {
    if (!data.boothNo || data.boothNo.trim() === "") {
      alert("Booth number is required");
      return;
    }
    onSubmit(data);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      <div>
        <label className="block text-sm">First Name</label>
        <input
          {...register("firstName", { required: "Required" })}
          className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
          placeholder="First Name"
        />
        {errors.firstName && (
          <span className="text-red-500 text-xs">{errors.firstName.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm">Last Name</label>
        <input
          {...register("lastName", { required: "Required" })}
          className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
          placeholder="Last Name"
        />
        {errors.lastName && (
          <span className="text-red-500 text-xs">{errors.lastName.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm">Phone No.</label>
        <input
          type="text"
          {...register("phone", {
            required: "Phone number is required",
            pattern: {
              value: /^\d{10}$/,
              message: "Phone number must be exactly 10 digits",
            },
          })}
          maxLength={10}
          onInput={(e) => {
            e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
            if (e.currentTarget.value.length > 10) {
              e.currentTarget.value = e.currentTarget.value.slice(0, 10);
            }
          }}
          className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
          placeholder="Enter 10-digit phone number"
        />
        {errors.phone && (
          <span className="text-red-500 text-xs">{errors.phone.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm">Designation</label>
        <select
          {...register("designation")}
          className="input w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
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
        {errors.designation && (
          <span className="text-red-500 text-xs">{errors.designation.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm">State</label>
        <input
          {...register("state", { required: "Required" })}
          disabled
          className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-100 cursor-not-allowed"
          placeholder="State"
        />
        {errors.state && (
          <span className="text-red-500 text-xs">{errors.state.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm">District</label>
        <input
          {...register("district", { required: "Required" })}
          disabled
          className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-100 cursor-not-allowed"
          placeholder="District"
        />
        {errors.district && (
          <span className="text-red-500 text-xs">{errors.district.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm">District No</label>
        <input
          {...register("distNo")}
          className="input w-full border border-gray-300 rounded-md px-4 py-2"
          placeholder="District No"
        />
      </div>

      <div>
        <label className="block text-sm">Assembly</label>
        <input
          {...register("assembly", { required: "Required" })}
          disabled
          className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-100 cursor-not-allowed"
          placeholder="Assembly"
        />
        {errors.assembly && (
          <span className="text-red-500 text-xs">{errors.assembly.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm">AC No</label>
        <input
          {...register("acNo")}
          className="input w-full border border-gray-300 rounded-md px-4 py-2"
          placeholder="AC No"
        />
      </div>

      <div>
        <label className="block text-sm">Booth No</label>
        <input
          {...register("boothNo", {
            required: "Booth is required",
            minLength: {
              value: 1,
              message: "Booth Name cannot be empty",
            },
          })}
          className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
          placeholder="Booth No"
        />
        {errors.boothNo && (
          <span className="text-red-500 text-xs">{errors.boothNo.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm">Block (Optional)</label>
        <input
          {...register("block")}
          className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
          placeholder="Block"
        />
      </div>

      <div>
        <label className="block text-sm">Mandal (Optional)</label>
        <input
          {...register("mandal")}
          className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
          placeholder="Mandal"
        />
      </div>

      <div>
        <label className="block text-sm">Polling Center (Optional)</label>
        <input
          {...register("pollingCenter")}
          className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
          placeholder="Polling Center"
        />
      </div>

      <div>
        <label className="block text-sm">Polling Center No (Optional)</label>
        <input
          {...register("pollingCenterNo")}
          className="input w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-100"
          placeholder="Polling Center No"
        />
      </div>

      <div>
        <label className="block text-sm">Email</label>
        <input
          type="email"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
              message: "Only valid Gmail address is allowed",
            },
          })}
          className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
          placeholder="Enter valid email address"
        />
        {errors.email && (
          <span className="text-red-500 text-xs">{errors.email.message}</span>
        )}
      </div>

      <div>
        <label className="block text-sm">Password</label>
        <input
          type="password"
          {...register("password", {
            required: initialValues ? false : "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters long",
            },
            validate: {
              hasUppercase: (value) => {
                if (initialValues && !value) return true;
                if (!/[A-Z]/.test(value)) {
                  return "Password must contain at least one uppercase letter";
                }
                return true;
              },
              hasLowercase: (value) => {
                if (initialValues && !value) return true;
                if (!/[a-z]/.test(value)) {
                  return "Password must contain at least one lowercase letter";
                }
                return true;
              },
              hasDigit: (value) => {
                if (initialValues && !value) return true;
                if (!/\d/.test(value)) {
                  return "Password must contain at least one digit";
                }
                return true;
              },
              hasSpecialChar: (value) => {
                if (initialValues && !value) return true;
                if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
                  return "Password must contain at least one special character";
                }
                return true;
              },
            },
          })}
          className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
          placeholder={
            initialValues
              ? "Leave blank to keep current password"
              : "Enter strong password"
          }
        />
        {errors.password && (
          <span className="text-red-500 text-xs">{errors.password.message}</span>
        )}
        {!initialValues && (
          <div className="text-xs text-gray-500 mt-1">
            Password must contain: uppercase, lowercase, digit, and special character
          </div>
        )}
      </div>

      <div className="md:col-span-3 flex gap-4 mt-4">
        <button
          type="submit"
          className="px-6 py-2 rounded w-full sm:w-[100%] text-white bg-blue-600 hover:bg-blue-700"
        >
          {initialValues ? "Update" : "Submit"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-400 text-white px-6 py-2 rounded w-full sm:w-[100%]"
        >
          Back
        </button>
      </div>
    </form>
  );
};
