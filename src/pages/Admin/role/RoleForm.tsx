import React from "react";
import { useForm } from "react-hook-form";
// Validation schema not used in this placeholder; using basic required rule
import type { RoleForm as RoleFormType } from "../../../types/role";

interface RoleFormProps {
  initialValues?: RoleFormType;
  onSubmit: (data: RoleFormType) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const RoleForm: React.FC<RoleFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RoleFormType>({
    defaultValues: initialValues || {
      roleName: "",
      isActive: true,
    },
  });

  React.useEffect(() => {
    if (initialValues) {
      reset(initialValues);
    }
  }, [initialValues, reset]);

  const handleFormSubmit = (data: RoleFormType) => {
    onSubmit(data);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Role Name Field */}
        <div>
          <label
            htmlFor="roleName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Role Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="roleName"
            {...register("roleName", { required: "Role name is required" })}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.roleName ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter role name (e.g., Admin, Manager, User)"
            disabled={isLoading || isSubmitting}
          />
          {errors.roleName && (
            <p className="mt-1 text-sm text-red-600">
              {(errors.roleName.message as string) || "Role name is required"}
            </p>
          )}
        </div>

        {/* Active Status Field */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register("isActive")}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isLoading || isSubmitting}
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Uncheck to make this role inactive
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            disabled={isLoading || isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            disabled={isLoading || isSubmitting}
          >
            {(isLoading || isSubmitting) && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{initialValues ? "Update" : "Create"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
