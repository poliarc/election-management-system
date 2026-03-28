import React from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Save, X, ToggleRight, ToggleLeft } from "lucide-react";
import type { User, UserForm as UserFormType, Role } from "../../../types/user";
import { fetchHierarchyChildren } from "../../../services/hierarchyApi";
import type { HierarchyChild } from "../../../types/hierarchy";
import { useTranslation } from "react-i18next";

interface LevelAdminUserFormProps {
    user?: User | null;
    onSave: (userData: UserFormType) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    partyId: number;
    partyName: string;
    stateId: number;
    stateName: string;
    roles: Role[];
    isLoadingRoles?: boolean;
}

export const LevelAdminUserForm: React.FC<LevelAdminUserFormProps> = ({
    user,
    onSave,
    onCancel,
    isLoading = false,
    partyId,
    partyName,
    stateId,
    stateName,
    roles,
    isLoadingRoles = false,
}) => {
    const {t} = useTranslation();
    const [showPassword, setShowPassword] = React.useState(false);
    const [districts, setDistricts] = React.useState<HierarchyChild[]>([]);
    const [isLoadingDistricts, setIsLoadingDistricts] = React.useState(false);
    const isEditing = !!user;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
        setValue,
    } = useForm<UserFormType>({
        defaultValues: user
            ? {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                contact_no: user.contact_no,
                party_id: partyId,
                state_id: stateId,
                district_id: user.district_id || undefined,
                role_id: user.role_id || undefined,
                isActive: user.isActive,
            }
            : {
                first_name: "",
                last_name: "",
                email: "",
                password: "",
                contact_no: "",
                party_id: partyId,
                state_id: stateId,
                district_id: undefined,
                role_id: undefined,
                isActive: true,
            },
    });

    const watchIsActive = watch("isActive", user?.isActive ?? true);

    // Load districts based on stateId
    React.useEffect(() => {
        const loadDistricts = async () => {
            if (!stateId) return;

            try {
                setIsLoadingDistricts(true);
                const response = await fetchHierarchyChildren(stateId, {
                    page: 1,
                    limit: 1000
                });

                if (response.success && response.data?.children) {
                    setDistricts(response.data.children);
                }
            } catch (error) {
                console.error("Failed to load districts:", error);
                setDistricts([]);
            } finally {
                setIsLoadingDistricts(false);
            }
        };

        loadDistricts();
    }, [stateId]);

    React.useEffect(() => {
        if (user) {
            reset({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                contact_no: user.contact_no,
                party_id: partyId,
                state_id: stateId,
                district_id: user.district_id || undefined,
                role_id: user.role_id || undefined,
                isActive: user.isActive,
            });
        }
    }, [user, reset, partyId, stateId]);

    const handleFormSubmit = async (data: UserFormType) => {
        // Remove password field if editing and password is empty
        if (isEditing && !data.password) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...userData } = data;
            await onSave(userData as UserFormType);
        } else {
            await onSave(data);
        }
    };

    const activeRoles = roles.filter((role) => role.isActive === 1);

    return (
        <div className="bg-[var(--bg-card)] rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-[var(--bg-main)] border-b border-[var(--border-color)]">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--text-color)]">
                        {isEditing ? "Edit User" : "Create New User"}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors p-1 rounded-md hover:bg-[var(--text-color)]/5"
                        title="Cancel"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
                <div className="space-y-6">
                    {/* Name Fields - Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t("LevelAdminUserForm.First_Name")}
                            </label>
                            <input
                                type="text"
                                {...register("first_name", {
                                    required: "First name is required",
                                    minLength: {
                                        value: 2,
                                        message: "First name must be at least 2 characters",
                                    },
                                })}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.first_name ? "border-red-500" : "border-gray-300"}`}
                                placeholder="Enter first name"
                            />
                            {errors.first_name && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.first_name.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t("LevelAdminUserForm.Last_Name")}
                            </label>
                            <input
                                type="text"
                                {...register("last_name", {
                                    required: "Last name is required",
                                    minLength: {
                                        value: 2,
                                        message: "Last name must be at least 2 characters",
                                    },
                                })}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.last_name ? "border-red-500" : "border-gray-300"}`}
                                placeholder="Enter last name"
                            />
                            {errors.last_name && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.last_name.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Email and Contact - Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t("LevelAdminUserForm.Email_Address")}
                            </label>
                            <input
                                type="email"
                                {...register("email", {
                                    required: "Email is required",
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: "Invalid email address",
                                    },
                                })}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-500" : "border-gray-300"}`}
                                placeholder="Enter email address"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t("LevelAdminUserForm.Contact_Number")}
                            </label>
                            <input
                                type="tel"
                                maxLength={10}
                                {...register("contact_no", {
                                    pattern: {
                                        value: /^[0-9]{10}$/,
                                        message: "Contact number must be 10 digits",
                                    },
                                })}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contact_no ? "border-red-500" : "border-gray-300"}`}
                                placeholder="Enter 10-digit contact number (optional)"
                            />
                            {errors.contact_no && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.contact_no.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Password - Row 3 */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t("LevelAdminUserForm.Password")} {!isEditing && "*"}
                            {isEditing && (
                                <span className="text-sm text-[var(--text-secondary)] font-normal">
                                    {" "}{t("LevelAdminUserForm.Desc")}
                                </span>
                            )}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                {...register("password", {
                                    ...(isEditing
                                        ? {}
                                        : {
                                            required: "Password is required",
                                            minLength: {
                                                value: 6,
                                                message: "Password must be at least 6 characters",
                                            },
                                        }),
                                })}
                                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? "border-red-500" : "border-gray-300"}`}
                                placeholder={isEditing ? "Enter new password (optional)" : "Enter password"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-secondary)]"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    {/* Party and State - Row 4 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t("LevelAdminUserForm.Party")}

                            </label>
                            <input
                                type="text"
                                value={partyName}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-[var(--text-secondary)] cursor-not-allowed"
                            />
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                {t("LevelAdminUserForm.Desc1")}

                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t("LevelAdminUserForm.State")}
                            </label>
                            <input
                                type="text"
                                value={stateName}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-[var(--text-secondary)] cursor-not-allowed"
                            />
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                {t("LevelAdminUserForm.Desc2")}
                            </p>
                        </div>
                    </div>

                    {/* District and Role - Row 5 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t("LevelAdminUserForm.District")}
                            </label>
                            {isLoadingDistricts ? (
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[var(--bg-main)]">
                                    <span className="text-[var(--text-secondary)]">{t("LevelAdminUserForm.Loading")}</span>
                                </div>
                            ) : (
                                <select
                                    {...register("district_id", {
                                        required: "District is required",
                                        setValueAs: (value) => {
                                            const numValue = Number(value);
                                            return numValue === 0 || !value ? undefined : numValue;
                                        },
                                        validate: (value) => {
                                            if (!value) {
                                                return "Please select a district";
                                            }
                                            return true;
                                        },
                                    })}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.district_id ? "border-red-500" : "border-gray-300"}`}
                                >
                                    <option value="">{t("LevelAdminUserForm.Select_district")}</option>
                                    {districts.map((district) => (
                                        <option key={district.location_id} value={district.location_id}>
                                            {district.location_name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {errors.district_id && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.district_id.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t("LevelAdminUserForm.Role")}
                            </label>
                            {isLoadingRoles ? (
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[var(--bg-main)]">
                                    <span className="text-[var(--text-secondary)]">{t("LevelAdminUserForm.Loading1")}</span>
                                </div>
                            ) : (
                                <select
                                    {...register("role_id", {
                                        setValueAs: (value) => {
                                            const numValue = Number(value);
                                            return numValue === 0 || !value ? undefined : numValue;
                                        },
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">{t("LevelAdminUserForm.Desc3")}</option>
                                    {activeRoles.map((role) => (
                                        <option key={role.role_id} value={role.role_id}>
                                            {role.role}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Status Toggle - Row 6 */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                            {t("LevelAdminUserForm.User_Status")}
                        </label>
                        <button
                            type="button"
                            onClick={() => setValue("isActive", !watchIsActive)}
                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-[var(--text-color)]/5 transition-colors w-full"
                        >
                            <div className="flex items-center gap-2">
                                {watchIsActive ? (
                                    <>
                                        <ToggleRight className="w-6 h-6 text-green-500" />
                                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                            {t("LevelAdminUserForm.Active")}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <ToggleLeft className="w-6 h-6 text-[var(--text-secondary)]" />
                                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-[var(--text-color)]">
                                            {t("LevelAdminUserForm.Inactive")}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {t("LevelAdminUserForm.Click_to")} {watchIsActive ? "deactivate" : "activate"} {t("LevelAdminUserForm.this_user")}
                                </p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-[var(--border-color)]">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 rounded-md text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 transition-colors"
                    >
                        {t("LevelAdminUserForm.Cancel")}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || isLoading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting || isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                {isEditing ? "Updating..." : "Creating..."}
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {isEditing ? "Update User" : "Create User"}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};




