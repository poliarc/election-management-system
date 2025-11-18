// import React from "react";
// import { useForm } from "react-hook-form";

// type PartyTypeFormType = {
//   typeName: string;
//   isActive: boolean;
// };

// interface PartyTypeFormProps {
//   initialValues?: PartyTypeFormType;
//   onSubmit: (data: PartyTypeFormType) => void;
//   onCancel: () => void;
//   isLoading: boolean;
// }

// export const PartyTypeForm: React.FC<PartyTypeFormProps> = ({
//   initialValues,
//   onSubmit,
//   onCancel,
//   isLoading,
// }) => {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//     reset,
//   } = useForm<PartyTypeFormType>({
//     defaultValues: initialValues || {
//       typeName: "",
//       isActive: true,
//     },
//   });

//   React.useEffect(() => {
//     if (initialValues) {
//       reset(initialValues);
//     }
//   }, [initialValues, reset]);

//   const handleFormSubmit = (data: PartyTypeFormType) => {
//     onSubmit(data);
//   };

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-md">
//       <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
//         {/* Party Type Name Field */}
//         <div>
//           <label
//             htmlFor="typeName"
//             className="block text-sm font-medium text-gray-700 mb-2"
//           >
//             Party Type Name <span className="text-red-500">*</span>
//           </label>
//           <input
//             type="text"
//             id="typeName"
//             {...register("typeName", {
//               required: "Party type name is required",
//             })}
//             className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//               errors.typeName ? "border-red-500" : "border-gray-300"
//             }`}
//             placeholder="Enter party type name (e.g., National Party, State Party)"
//             disabled={isLoading || isSubmitting}
//           />
//           {errors.typeName && (
//             <p className="mt-1 text-sm text-red-600">
//               {errors.typeName.message}
//             </p>
//           )}
//         </div>

//         {/* Active Status Field */}
//         <div>
//           <label className="flex items-center space-x-2">
//             <input
//               type="checkbox"
//               {...register("isActive")}
//               className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//               disabled={isLoading || isSubmitting}
//             />
//             <span className="text-sm font-medium text-gray-700">Active</span>
//           </label>
//           <p className="mt-1 text-xs text-gray-500">
//             Uncheck to make this party type inactive
//           </p>
//         </div>

//         {/* Form Actions */}
//         <div className="flex justify-end space-x-4 pt-4 border-t">
//           <button
//             type="button"
//             onClick={onCancel}
//             className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
//             disabled={isLoading || isSubmitting}
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
//             disabled={isLoading || isSubmitting}
//           >
//             {(isLoading || isSubmitting) && (
//               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//             )}
//             <span>{initialValues ? "Update" : "Create"}</span>
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };
