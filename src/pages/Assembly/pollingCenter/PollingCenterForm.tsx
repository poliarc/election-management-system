// import React from "react";
// import { useForm } from "react-hook-form";
// import type { PollingCenterCandidate } from "../../../types/pollingCenter";

// type PollingCenterFormData = {
//   firstName: string;
//   lastName: string;
//   phone?: number | string;
//   email: string;
//   designation: string;
//   distNo: string;
//   acNo: string;
//   state: string;
//   state_id: number;
//   district: string;
//   district_id: number;
//   assembly: string;
//   assembly_id: number;
//   block?: string;
//   block_id?: number | null;
//   mandal?: string;
//   mandal_id?: number | null;
//   pollingCenter: string;
//   pollingCenterNo: string;
//   profileImage: FileList | null;
//   password: string;
// };

// type Props = {
//   initialValues?: Partial<PollingCenterCandidate>;
//   onSubmit: (data: PollingCenterCandidate) => void;
//   onCancel: () => void;
// };

// export const PollingCenterForm: React.FC<Props> = ({
//   initialValues,
//   onSubmit,
//   onCancel,
// }) => {
//   const isEditMode = typeof initialValues?.id === "number" && initialValues.id > 0;

//   // Get assembly context data from localStorage
//   const assemblyContextData = React.useMemo(() => {
//     try {
//       const raw = localStorage.getItem("user");
//       const parsed = raw ? JSON.parse(raw) : null;

//       return {
//         state: parsed?.state || "",
//         state_id: Number(parsed?.state_id || 0),
//         district: parsed?.district || "",
//         district_id: Number(parsed?.district_id || 0),
//         assembly: parsed?.assembly || "",
//         assembly_id: Number(parsed?.assembly_id || parsed?.id || 0),
//         distNo: parsed?.distNo || "",
//         acNo: parsed?.acNo || "",
//       };
//     } catch (error) {
//       console.error("Error parsing assembly context data:", error);
//       return {
//         state: "",
//         state_id: 0,
//         district: "",
//         district_id: 0,
//         assembly: "",
//         assembly_id: 0,
//         distNo: "",
//         acNo: "",
//       };
//     }
//   }, []);

//   const {
//     register,
//     handleSubmit,
//     setValue,
//     formState: { errors },
//   } = useForm<PollingCenterFormData>({
//     defaultValues: {
//       firstName: initialValues?.firstName || "",
//       lastName: initialValues?.lastName || "",
//       phone: initialValues?.phone || "",
//       email: initialValues?.email || "",
//       designation: initialValues?.Designation || "",
//       distNo: initialValues?.distNo || assemblyContextData.distNo,
//       acNo: initialValues?.acNo || assemblyContextData.acNo,
//       state: initialValues?.state || assemblyContextData.state,
//       state_id: initialValues?.state_id || assemblyContextData.state_id,
//       district: initialValues?.dist || assemblyContextData.district,
//       district_id: initialValues?.district_id || assemblyContextData.district_id,
//       assembly: initialValues?.assembly || assemblyContextData.assembly,
//       assembly_id: initialValues?.assembly_id || assemblyContextData.assembly_id,
//       block: initialValues?.block || "",
//       block_id: initialValues?.block_id || null,
//       mandal: initialValues?.mandal || "",
//       mandal_id: initialValues?.mandal_id || null,
//       pollingCenter: initialValues?.pollingCenter || "",
//       pollingCenterNo: initialValues?.pollingCenterNo || "",
//       profileImage: null,
//       password: "",
//     },
//   });

//   // Set initial values from assembly context data on component mount
//   React.useEffect(() => {
//     setValue("state", assemblyContextData.state);
//     setValue("state_id", assemblyContextData.state_id);
//     setValue("district", assemblyContextData.district);
//     setValue("district_id", assemblyContextData.district_id);
//     setValue("assembly", assemblyContextData.assembly);
//     setValue("assembly_id", assemblyContextData.assembly_id);
//     setValue("distNo", assemblyContextData.distNo);
//     setValue("acNo", assemblyContextData.acNo);
//   }, [
//     setValue,
//     assemblyContextData.state,
//     assemblyContextData.state_id,
//     assemblyContextData.district,
//     assemblyContextData.district_id,
//     assemblyContextData.assembly,
//     assemblyContextData.assembly_id,
//     assemblyContextData.distNo,
//     assemblyContextData.acNo,
//   ]);

//   const onFormSubmit = React.useCallback(
//     async (data: PollingCenterFormData) => {
//       // Transform for parent callback
//       const transformedData: PollingCenterCandidate = {
//         id: Number((initialValues as PollingCenterCandidate | undefined)?.id) || 0,
//         firstName: data.firstName,
//         lastName: data.lastName,
//         phone: data.phone ? Number(data.phone) : 0,
//         email: data.email,
//         state: data.state,
//         state_id: data.state_id,
//         dist: data.district,
//         district_id: data.district_id,
//         distNo: data.distNo,
//         pollingCenterName: data.pollingCenter,
//         age: 0,
//         pollingCenter: data.pollingCenter,
//         Designation: data.designation,
//         assembly: data.assembly,
//         assembly_id: data.assembly_id,
//         acNo: data.acNo,
//         block: data.block || "",
//         block_id: data.block_id ?? null,
//         mandal: data.mandal || "",
//         mandal_id: data.mandal_id ?? null,
//         pollingCenterNo: data.pollingCenterNo,
//         profileImage: data.profileImage,
//         password: data.password,
//       };

//       onSubmit(transformedData);
//     },
//     [initialValues, onSubmit]
//   );

//   return (
//     <form
//       onSubmit={handleSubmit(onFormSubmit)}
//       className="grid grid-cols-1 md:grid-cols-3 gap-4"
//     >
//       <div>
//         <label className="block text-sm">First Name</label>
//         <input
//           {...register("firstName", {
//             required: "First name is required",
//             minLength: {
//               value: 2,
//               message: "First name must be at least 2 characters",
//             },
//           })}
//           className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
//           placeholder="First Name"
//         />
//         {errors.firstName && (
//           <span className="text-red-500 text-xs">{errors.firstName.message}</span>
//         )}
//       </div>

//       <div>
//         <label className="block text-sm">Last Name</label>
//         <input
//           {...register("lastName", {
//             required: "Last name is required",
//             minLength: {
//               value: 2,
//               message: "Last name must be at least 2 characters",
//             },
//           })}
//           className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
//           placeholder="Last Name"
//         />
//         {errors.lastName && (
//           <span className="text-red-500 text-xs">{errors.lastName.message}</span>
//         )}
//       </div>

//       <div>
//         <label className="block text-sm">Phone No.</label>
//         <input
//           type="tel"
//           {...register("phone", {
//             required: false,
//             pattern: {
//               value: /^\d{10}$/,
//               message: "Phone number must be exactly 10 digits",
//             },
//             validate: {
//               onlyNumbers: (value) => {
//                 const stringValue = String(value || "");
//                 if (stringValue && !/^\d+$/.test(stringValue)) {
//                   return "Phone number can only contain digits";
//                 }
//                 return true;
//               },
//               exactLength: (value) => {
//                 const stringValue = String(value || "");
//                 if (stringValue && stringValue.length !== 10) {
//                   return "Phone number must be exactly 10 digits";
//                 }
//                 return true;
//               },
//             },
//           })}
//           maxLength={10}
//           onInput={(e) => {
//             e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
//             if (e.currentTarget.value.length > 10) {
//               e.currentTarget.value = e.currentTarget.value.slice(0, 10);
//             }
//           }}
//           className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
//           placeholder="Enter 10-digit phone number"
//           inputMode="numeric"
//           pattern="[0-9]{10}"
//         />
//         {errors.phone && (
//           <span className="text-red-500 text-xs">{errors.phone.message}</span>
//         )}
//       </div>

//       <div>
//         <label className="block mb-1 text-sm font-medium">Email</label>
//         <input
//           type="email"
//           placeholder="Enter Gmail"
//           {...register("email", {
//             required: "Email is required",
//             pattern: {
//               value: /^[a-zA-Z0-9._%+-]+@gmail\.com$/,
//               message: "Only valid Gmail address is allowed",
//             },
//           })}
//           className={`w-full rounded border px-3 py-2 ${
//             errors.email ? "border-red-600" : "border-gray-300"
//           }`}
//         />
//         {errors.email && (
//           <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
//         )}
//       </div>

//       <div>
//         <label className="block text-sm">Designation</label>
//         <select
//           {...register("designation", {
//             required: "Please select a designation",
//           })}
//           className="input w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
//         >
//           <option value="">Please Select</option>
//           <option value="State President">State President</option>
//           <option value="State Committee Member">State Committee Member</option>
//           <option value="District President">District President</option>
//           <option value="District Committee Member">District Committee Member</option>
//           <option value="Assembly Head">Assembly Head</option>
//           <option value="Assembly Committee Member">Assembly Committee Member</option>
//           <option value="Block President">Block President</option>
//           <option value="Block Committee Member">Block Committee Member</option>
//           <option value="Mandal President">Mandal President</option>
//           <option value="Mandal Committee Member">Mandal Committee Member</option>
//           <option value="Booth President">Booth President</option>
//           <option value="Booth Team">Booth Team</option>
//           <option value="BLA-1">BLA-1</option>
//           <option value="BLA-2">BLA-2</option>
//         </select>
//         {errors.designation && (
//           <span className="text-red-500 text-xs">{errors.designation.message}</span>
//         )}
//       </div>

//       <div>
//         <label className="block text-sm">
//           State <span className="text-gray-500">(Auto-filled)</span>
//         </label>
//         <input
//           {...register("state")}
//           disabled
//           className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-100 cursor-not-allowed"
//           placeholder="State"
//         />
//       </div>

//       <input type="hidden" {...register("state_id", { valueAsNumber: true })} />

//       <div>
//         <label className="block text-sm">
//           District <span className="text-gray-500">(Auto-filled)</span>
//         </label>
//         <input
//           {...register("district")}
//           disabled
//           className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-100 cursor-not-allowed"
//           placeholder="District"
//         />
//       </div>

//       <input type="hidden" {...register("district_id", { valueAsNumber: true })} />

//       <div>
//         <label className="block text-sm">District No</label>
//         <input
//           {...register("distNo")}
//           readOnly
//           className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm bg-gray-100"
//           placeholder="District No"
//         />
//       </div>

//       <div>
//         <label className="block text-sm">
//           Assembly <span className="text-gray-500">(Auto-filled)</span>
//         </label>
//         <input
//           {...register("assembly")}
//           disabled
//           className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-gray-100 cursor-not-allowed"
//           placeholder="Assembly"
//         />
//       </div>

//       <input type="hidden" {...register("assembly_id", { valueAsNumber: true })} />

//       <div>
//         <label className="block text-sm">AC No</label>
//         <input
//           {...register("acNo")}
//           readOnly
//           className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm bg-gray-100"
//           placeholder="AC No"
//         />
//       </div>

//       <div>
//         <label className="block text-sm">Block (Optional)</label>
//         <input
//           {...register("block")}
//           className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
//           placeholder="Block Name"
//         />
//       </div>

//       <input type="hidden" {...register("block_id")} />

//       <div>
//         <label className="block text-sm">Mandal (Optional)</label>
//         <input
//           {...register("mandal")}
//           className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
//           placeholder="Mandal Name"
//         />
//       </div>

//       <input type="hidden" {...register("mandal_id")} />

//       <div>
//         <label className="block text-sm">Polling Center</label>
//         <input
//           {...register("pollingCenter", {
//             required: "Polling center name is required",
//             minLength: {
//               value: 3,
//               message: "Polling center name must be at least 3 characters",
//             },
//           })}
//           className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
//           placeholder="Polling Center"
//         />
//         {errors.pollingCenter && (
//           <span className="text-red-500 text-xs">{errors.pollingCenter.message}</span>
//         )}
//       </div>

//       <div>
//         <label className="block text-sm">Polling Center No</label>
//         <input
//           {...register("pollingCenterNo", {
//             required: "Polling center number is required",
//             pattern: {
//               value: /^[A-Za-z0-9]+$/,
//               message: "Polling center number should contain only letters and numbers",
//             },
//           })}
//           className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
//           placeholder="Polling Center No"
//         />
//         {errors.pollingCenterNo && (
//           <span className="text-red-500 text-xs">{errors.pollingCenterNo.message}</span>
//         )}
//       </div>

//       <div>
//         <label className="block text-sm">Password</label>
//         <input
//           type="password"
//           {...register("password", {
//             required: isEditMode ? false : "Password is required",
//             validate: (value) => {
//               if (isEditMode && (!value || value.trim() === "")) {
//                 return true;
//               }

//               const hasUpperCase = /[A-Z]/.test(value);
//               const hasLowerCase = /[a-z]/.test(value);
//               const hasNumbers = /\d/.test(value);
//               const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
//               const minLength = value && value.length >= 8;

//               if (!minLength) {
//                 return "Password must be at least 8 characters long";
//               }
//               if (!hasUpperCase) {
//                 return "Password must contain at least one uppercase letter";
//               }
//               if (!hasLowerCase) {
//                 return "Password must contain at least one lowercase letter";
//               }
//               if (!hasNumbers) {
//                 return "Password must contain at least one number";
//               }
//               if (!hasSpecialChar) {
//                 return "Password must contain at least one special character";
//               }

//               return true;
//             },
//           })}
//           className="input w-full sm:w-[100%] border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-sm"
//           placeholder={isEditMode ? "Leave blank to keep current password" : "Password"}
//         />
//         {errors.password && (
//           <span className="text-red-500 text-xs">{errors.password.message}</span>
//         )}
//         {!isEditMode && (
//           <div className="text-xs text-gray-500 mt-1">
//             Password must contain: uppercase letter, lowercase letter, number, and special character (min 8 characters)
//           </div>
//         )}
//       </div>

//       <div className="md:col-span-3 flex gap-4 mt-4">
//         <button
//           type="submit"
//           className="bg-blue-600 text-white px-6 py-2 rounded w-full sm:w-[100%] hover:bg-blue-700 transition"
//         >
//           {initialValues ? "Update" : "Submit"}
//         </button>
//         <button
//           type="button"
//           onClick={onCancel}
//           className="bg-gray-400 text-white px-6 py-2 rounded w-full sm:w-[100%] hover:bg-gray-500 transition"
//         >
//           Back
//         </button>
//       </div>
//     </form>
//   );
// };
