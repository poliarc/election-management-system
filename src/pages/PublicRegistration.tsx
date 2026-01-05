import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, UserPlus, CheckCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateUserMutation } from "../store/api/partyUserApi";
import { useGetAllStateMasterDataQuery } from "../store/api/stateMasterApi";
import { useGetRegistrationLinkByTokenQuery } from "../store/api/registrationLinksApi";
import type { UserForm as UserFormType } from "../types/user";

interface RegistrationFormData extends Omit<UserFormType, 'party_id' | 'state_id' | 'district_id'> {
    party_id: string;
    state_id: string;
    district_id?: string;
}

export const PublicRegistration: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Get URL parameters - support both token and direct parameters
    const token = searchParams.get("token");
    const directPartyId = searchParams.get("party_id");
    const directPartyName = searchParams.get("party_name");
    const directStateId = searchParams.get("state_id");
    const directStateName = searchParams.get("state_name");
    const directDistrictId = searchParams.get("district_id");
    const directDistrictName = searchParams.get("district_name");

    // API hooks
    const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
    const { data: stateMasterData = [], isLoading: isLoadingStates } =
        useGetAllStateMasterDataQuery();

    // Fetch registration link data if token is provided
    const {
        data: linkData,
        isLoading: isLoadingLink,
        error: linkError
    } = useGetRegistrationLinkByTokenQuery(token || "", {
        skip: !token,
    });

    // Determine the actual values to use (token data takes precedence)
    const partyId = linkData?.party_id?.toString() || directPartyId;
    const partyName = linkData?.party_full_name || linkData?.party_name || directPartyName;
    const stateId = linkData?.state_id?.toString() || directStateId;
    const stateName = linkData?.state_full_name || linkData?.state_name || directStateName;
    const districtId = linkData?.district_id?.toString() || directDistrictId;
    const districtName = linkData?.district_full_name || linkData?.district_name || directDistrictName;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        setValue,
    } = useForm<RegistrationFormData>({
        defaultValues: {
            first_name: "",
            last_name: "",
            email: "",
            password: "",
            contact_no: "",
            party_id: partyId || "",
            state_id: stateId || "",
            district_id: districtId || "",
            isActive: true,
        },
    });

    const watchStateId = watch("state_id");

    // Filter districts
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

    // Set form values when component mounts with URL parameters or token data
    useEffect(() => {
        if (partyId) setValue("party_id", partyId);
        if (stateId) setValue("state_id", stateId);
        if (districtId) setValue("district_id", districtId);
    }, [partyId, stateId, districtId, setValue]);

    // Reset district when state changes (only if district is not pre-selected from URL)
    useEffect(() => {
        if (watchStateId && !districtId) {
            setValue("district_id", "");
        }
    }, [watchStateId, setValue, districtId]);

    // Handle token-based link validation and errors
    useEffect(() => {
        if (token && linkError) {
            toast.error("Invalid or expired registration link.");
            navigate("/login");
            return;
        }

        if (token && linkData) {
            // Check if link is expired
            if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
                toast.error("This registration link has expired.");
                navigate("/login");
                return;
            }

            // Check if link is active
            if (linkData.isActive === 0) {
                toast.error("This registration link is no longer active.");
                navigate("/login");
                return;
            }
        }

        // Validate direct parameters if no token
        if (!token && (!partyId || !partyName || !stateId || !stateName)) {
            toast.error("Invalid registration link. Missing required parameters.");
            navigate("/login");
            return;
        }

        // Validate that the state exists in the master data
        if (stateMasterData.length > 0 && stateId) {
            const stateExists = stateMasterData.some(
                item => item.id === Number(stateId) && item.levelType === "State" && item.isActive === 1
            );

            if (!stateExists) {
                toast.error("Invalid state in registration link.");
                navigate("/login");
                return;
            }

            // If district is provided, validate it exists and belongs to the state
            if (districtId) {
                const districtExists = stateMasterData.some(
                    item => item.id === Number(districtId) &&
                        item.levelType === "District" &&
                        item.isActive === 1 &&
                        item.ParentId === Number(stateId)
                );

                if (!districtExists) {
                    toast.error("Invalid district in registration link.");
                    navigate("/login");
                    return;
                }
            }
        }
    }, [token, linkData, linkError, partyId, partyName, stateId, stateName, districtId, navigate, stateMasterData]);

    const handleFormSubmit = async (data: RegistrationFormData) => {
        try {
            const userData: UserFormType = {
                ...data,
                party_id: Number(data.party_id),
                state_id: Number(data.state_id),
                district_id: data.district_id ? Number(data.district_id) : undefined,
            };

            await createUser(userData).unwrap();
            setIsSuccess(true);
            toast.success("Registration successful! You can now login with your credentials.");
        } catch (error: any) {
            let errorMessage = "Registration failed. Please try again.";

            if (error?.data?.error?.details && Array.isArray(error.data.error.details)) {
                const validationErrors = error.data.error.details
                    .map((detail: any) => `${detail.path}: ${detail.message}`)
                    .join(", ");
                errorMessage = `Validation Error: ${validationErrors}`;
            } else if (error?.data?.error?.message) {
                errorMessage = error.data.error.message;
            } else if (error?.data?.message) {
                errorMessage = error.data.message;
            }

            toast.error(errorMessage);
        }
    };

    // Show loading state while fetching token data
    if (token && (isLoadingLink || isLoadingStates)) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Registration Form</h2>
                    <p className="text-gray-600">Please wait while we prepare your registration...</p>
                </div>
            </div>
        );
    }

    // Show error state for invalid token
    if (token && linkError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Invalid Registration Link
                    </h1>
                    <p className="text-gray-600 mb-6">
                        This registration link is invalid, expired, or has been deactivated.
                    </p>
                    <button
                        onClick={() => navigate("/login")}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Registration Successful!
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Your account has been created successfully. You can now login with your email and password.
                    </p>
                    <button
                        onClick={() => navigate("/login")}
                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 text-white p-6">
                    <div className="flex items-center gap-3">
                        <UserPlus className="w-8 h-8" />
                        <div>
                            <h1 className="text-2xl font-bold">User Registration</h1>
                            <p className="text-blue-100">
                                Join {partyName} in {stateName}
                                {districtName && `, ${districtName}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
                    {/* Hidden fields for pre-selected values */}
                    <input type="hidden" {...register("party_id")} value={partyId || ""} />
                    <input type="hidden" {...register("state_id")} value={stateId || ""} />
                    {districtId && (
                        <input type="hidden" {...register("district_id")} value={districtId} />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <div className="md:col-span-2">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Personal Information
                            </h2>
                        </div>

                        {/* First Name */}
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
                                placeholder="Enter your first name"
                            />
                            {errors.first_name && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.first_name.message}
                                </p>
                            )}
                        </div>

                        {/* Last Name */}
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
                                placeholder="Enter your last name"
                            />
                            {errors.last_name && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.last_name.message}
                                </p>
                            )}
                        </div>

                        {/* Email */}
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
                                placeholder="Enter your email address"
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
                                Contact Number *
                            </label>
                            <input
                                type="tel"
                                maxLength={10}
                                {...register("contact_no", {
                                    required: "Contact number is required",
                                    pattern: {
                                        value: /^[0-9]{10}$/,
                                        message: "Contact number must be 10 digits",
                                    },
                                })}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.contact_no ? "border-red-500" : "border-gray-300"
                                    }`}
                                placeholder="Enter 10-digit contact number"
                            />
                            {errors.contact_no && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.contact_no.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    {...register("password", {
                                        required: "Password is required",
                                        minLength: {
                                            value: 6,
                                            message: "Password must be at least 6 characters",
                                        },
                                    })}
                                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? "border-red-500" : "border-gray-300"
                                        }`}
                                    placeholder="Enter your password"
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

                        {/* Location Information */}
                        <div className="md:col-span-2">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 mt-6">
                                Location Information
                            </h2>
                        </div>

                        {/* Party - Read Only */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Party
                            </label>
                            <input
                                type="text"
                                value={partyName || ""}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                        </div>

                        {/* State */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                State
                            </label>
                            <input
                                type="text"
                                value={stateName || ""}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                State is pre-selected from the registration link
                            </p>
                        </div>

                        {/* District */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                District {districtId ? "" : "*"}
                            </label>
                            {districtId && districtName ? (
                                // District is pre-selected from URL - show as disabled input
                                <>
                                    <input
                                        type="text"
                                        value={districtName}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        District is pre-selected from the registration link
                                    </p>
                                </>
                            ) : (
                                // District not in URL - show dropdown for the selected state
                                <>
                                    {isLoadingStates ? (
                                        <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                                            <span className="text-gray-500">Loading districts...</span>
                                        </div>
                                    ) : (
                                        <select
                                            {...register("district_id", {
                                                required: !districtId ? "District selection is required" : false,
                                            })}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.district_id ? "border-red-500" : "border-gray-300"
                                                }`}
                                        >
                                            <option value="">Select a district</option>
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
                                </>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-8">
                        <button
                            type="submit"
                            disabled={isSubmitting || isCreating}
                            className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isSubmitting || isCreating ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Create Account
                                </>
                            )}
                        </button>
                    </div>

                    {/* Login Link */}
                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Login here
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};