import React from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Save, X, ToggleRight, ToggleLeft } from "lucide-react";
import type {
    User,
    UserForm as UserFormType,
    Role,
} from "../../../types/user";
import { useGetAllStateMasterDataQuery } from "../../../store/api/stateMasterApi";

interface PartyUserFormProps {
    user?: User | null;
    onSave: (userData: UserFormType) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    partyId: number;
    partyName: string;
    roles: Role[];
    isLoadingRoles?: boolean;
}

export const PartyUserForm: React.FC<PartyUserFormProps> = ({
    user,
    onSave,
    onCancel,
    isLoading = false,
    partyId,
    partyName,
    roles,
    isLoadingRoles = false,
}) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isEditing = !!user;

    // Fetch state master data
    const { data: stateMasterData = [], isLoading: isLoadingStates } =
        useGetAllStateMasterDataQuery();

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
                role_id: user.role_id || undefined,
                state_id: user.state_id || undefined,
                district_id: user.district_id || undefined,
                isActive: user.isActive,
            }
            : {
                first_name: "",
                last_name: "",
                email: "",
                password: "",
                contact_no: "",
                party_id: partyId,
                role_id: undefined,
                state_id: undefined,
                district_id: undefined,
                isActive: true,
            },
    });

    const watchIsActive = watch("isActive", user?.isActive ?? true);
    const watchStateId = watch("state_id");

    // Filter states and districts
    const states = React.useMemo(
        () =>
            stateMasterData.filter(
                (item) => item.levelType === "State" && item.isActive === 1
            ),
        [stateMasterData]
    );

    const districts = React.useMemo(
        () =>
            stateMasterData.filter(
                (item) =>
                    item.levelType === "District" &&
                    item.isActive === 1 &&
                    (watchStateId ? item.ParentId === Number(watchStateId) : true)
            ),
        [stateMasterData, watchStateId]
    );

    // Reset district when state changes
    React.useEffect(() => {
        if (watchStateId && user?.state_id !== watchStateId) {
            setValue("district_id", undefined);
        }
    }, [watchStateId, setValue, user?.state_id]);

    React.useEffect(() => {
        if (user) {
            reset({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                contact_no: user.contact_no,
                party_id: partyId,
                role_id: user.role_id || undefined,
                state_id: user.state_id || undefined,
                district_id: user.district_id || undefined,
                isActive: user.isActive,
            });
        }
    }, [user, reset, partyId]);

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
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEditing ? "Edit User" : "Create New User"}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
                        title="Cancel"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name *
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
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.first_name ? "border-red-500" : "border-gray-300"
                                        }`}
                                    placeholder="Enter first name"
                                />
                                {errors.first_name && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.first_name.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Name *
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
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.last_name ? "border-red-500" : "border-gray-300"
                                        }`}
                                    placeholder="Enter last name"
                                />
                                {errors.last_name && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.last_name.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address *
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
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-500" : "border-gray-300"
                                    }`}
                                placeholder="Enter email address"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Contact Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Number
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
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contact_no ? "border-red-500" : "border-gray-300"
                                    }`}
                                placeholder="Enter 10-digit contact number (optional)"
                            />
                            {errors.contact_no && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.contact_no.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password {!isEditing && "*"}
                                {isEditing && (
                                    <span className="text-sm text-gray-500 font-normal">
                                        (Leave empty to keep current password)
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
                                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? "border-red-500" : "border-gray-300"
                                        }`}
                                    placeholder={
                                        isEditing
                                            ? "Enter new password (optional)"
                                            : "Enter password"
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Party Field - Disabled */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Party
                            </label>
                            <input
                                type="text"
                                value={partyName}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Party is automatically assigned
                            </p>
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Role
                            </label>
                            {isLoadingRoles ? (
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                                    <span className="text-gray-500">Loading roles...</span>
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
                                    <option value="">Select a role (optional)</option>
                                    {activeRoles.map((role) => (
                                        <option key={role.role_id} value={role.role_id}>
                                            {role.role}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* State and District Selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    State {!isEditing && "*"}
                                </label>
                                {isLoadingStates ? (
                                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                                        <span className="text-gray-500">Loading states...</span>
                                    </div>
                                ) : (
                                    <select
                                        {...register("state_id", {
                                            setValueAs: (value) => {
                                                const numValue = Number(value);
                                                return numValue === 0 || !value ? undefined : numValue;
                                            },
                                            ...(isEditing
                                                ? {}
                                                : {
                                                    required: "State selection is required",
                                                    validate: (value) => {
                                                        if (!value) {
                                                            return "Please select a state";
                                                        }
                                                        return true;
                                                    },
                                                }),
                                        })}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.state_id ? "border-red-500" : "border-gray-300"
                                            }`}
                                    >
                                        <option value="">
                                            {isEditing
                                                ? "Select a state (optional)"
                                                : "Select a state"}
                                        </option>
                                        {states.map((state) => (
                                            <option key={state.id} value={state.id}>
                                                {state.levelName}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {errors.state_id && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.state_id.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    District {!isEditing && "*"}
                                </label>
                                {isLoadingStates ? (
                                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                                        <span className="text-gray-500">Loading districts...</span>
                                    </div>
                                ) : (
                                    <select
                                        {...register("district_id", {
                                            setValueAs: (value) => {
                                                const numValue = Number(value);
                                                return numValue === 0 || !value ? undefined : numValue;
                                            },
                                            ...(isEditing
                                                ? {}
                                                : {
                                                    required: "District selection is required",
                                                    validate: (value) => {
                                                        if (!value) {
                                                            return "Please select a district";
                                                        }
                                                        return true;
                                                    },
                                                }),
                                        })}
                                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.district_id ? "border-red-500" : "border-gray-300"
                                            }`}
                                        disabled={!watchStateId}
                                    >
                                        <option value="">
                                            {isEditing
                                                ? "Select a district (optional)"
                                                : "Select a district"}
                                        </option>
                                        {districts.map((district) => (
                                            <option key={district.id} value={district.id}>
                                                {district.levelName}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {errors.district_id && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.district_id.message}
                                    </p>
                                )}
                                {!watchStateId && !isEditing && (
                                    <p className="text-gray-500 text-xs mt-1">
                                        Please select a state first
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Status Toggle */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                User Status
                            </label>
                            <button
                                type="button"
                                onClick={() => setValue("isActive", !watchIsActive)}
                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors w-full"
                            >
                                <div className="flex items-center gap-2">
                                    {watchIsActive ? (
                                        <>
                                            <ToggleRight className="w-6 h-6 text-green-500" />
                                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <ToggleLeft className="w-6 h-6 text-gray-400" />
                                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                                Inactive
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-sm text-gray-600">
                                        Click to {watchIsActive ? "deactivate" : "activate"} this
                                        user
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
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
