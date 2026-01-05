import React from "react";
import { useForm } from "react-hook-form";
import { Save, X, Calendar, ToggleRight, ToggleLeft } from "lucide-react";
import { useGetAllStateMasterDataQuery } from "../../../store/api/stateMasterApi";
import type {
    RegistrationLink,
    CreateRegistrationLinkRequest,
    UpdateRegistrationLinkRequest,
} from "../../../store/api/registrationLinksApi";

interface RegistrationLinkFormProps {
    link?: RegistrationLink | null;
    onSave: (linkData: CreateRegistrationLinkRequest | UpdateRegistrationLinkRequest) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    partyId: number;
    partyName: string;
}

interface FormData {
    state_id: string;
    district_id?: string;
    expires_at?: string;
    isActive?: boolean;
}

export const RegistrationLinkForm: React.FC<RegistrationLinkFormProps> = ({
    link,
    onSave,
    onCancel,
    isLoading = false,
    partyId,
    partyName,
}) => {
    const isEditing = !!link;

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
    } = useForm<FormData>({
        defaultValues: link
            ? {
                state_id: link.state_id.toString(),
                district_id: link.district_id?.toString() || "",
                expires_at: link.expires_at ? new Date(link.expires_at).toISOString().slice(0, 16) : "",
                isActive: link.isActive === 1,
            }
            : {
                state_id: "",
                district_id: "",
                expires_at: "",
                isActive: true,
            },
    });

    const watchIsActive = watch("isActive", link ? link.isActive === 1 : true);
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
        if (watchStateId && link?.state_id !== Number(watchStateId)) {
            setValue("district_id", "");
        }
    }, [watchStateId, setValue, link?.state_id]);

    React.useEffect(() => {
        if (link) {
            reset({
                state_id: link.state_id.toString(),
                district_id: link.district_id?.toString() || "",
                expires_at: link.expires_at ? new Date(link.expires_at).toISOString().slice(0, 16) : "",
                isActive: link.isActive === 1,
            });
        }
    }, [link, reset]);

    const handleFormSubmit = async (data: FormData) => {
        const selectedState = states.find((s) => s.id === Number(data.state_id));
        const selectedDistrict = districts.find((d) => d.id === Number(data.district_id));

        const linkData = {
            state_id: Number(data.state_id),
            state_name: selectedState?.levelName || "",
            district_id: data.district_id ? Number(data.district_id) : null,
            district_name: selectedDistrict?.levelName || null,
            expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
            ...(isEditing && { isActive: data.isActive }),
        };

        if (!isEditing) {
            // For creating new links, add party info
            await onSave({
                ...linkData,
                party_id: partyId,
                party_name: partyName,
            } as CreateRegistrationLinkRequest);
        } else {
            // For updating existing links
            await onSave(linkData as UpdateRegistrationLinkRequest);
        }
    };

    // Calculate default expiration (30 days from now)
    const defaultExpiration = React.useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString().slice(0, 16);
    }, []);

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEditing ? "Edit Registration Link" : "Create Registration Link"}
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
                        {/* Party Info - Read Only */}
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
                                Party is automatically set for this admin panel
                            </p>
                        </div>

                        {/* State Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                State *
                            </label>
                            {isLoadingStates ? (
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                                    <span className="text-gray-500">Loading states...</span>
                                </div>
                            ) : (
                                <select
                                    {...register("state_id", {
                                        required: "State selection is required",
                                    })}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.state_id ? "border-red-500" : "border-gray-300"
                                        }`}
                                >
                                    <option value="">Select a state</option>
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

                        {/* District Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                District (Optional)
                            </label>
                            {isLoadingStates ? (
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                                    <span className="text-gray-500">Loading districts...</span>
                                </div>
                            ) : (
                                <select
                                    {...register("district_id")}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={!watchStateId}
                                >
                                    <option value="">Select a district (optional)</option>
                                    {districts.map((district) => (
                                        <option key={district.id} value={district.id}>
                                            {district.levelName}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {!watchStateId && (
                                <p className="text-gray-500 text-xs mt-1">
                                    Please select a state first
                                </p>
                            )}
                            <p className="text-gray-500 text-xs mt-1">
                                Leave empty to allow users to select any district in the state
                            </p>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Expiration Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Calendar className="inline w-4 h-4 mr-1" />
                                Expiration Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                {...register("expires_at")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min={new Date().toISOString().slice(0, 16)}
                                placeholder={defaultExpiration}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Leave empty for default 30-day expiration. Link will be automatically disabled after this date.
                            </p>
                        </div>

                        {/* Status Toggle (only for editing) */}
                        {isEditing && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Link Status
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
                                            Click to {watchIsActive ? "deactivate" : "activate"} this link
                                        </p>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Link Preview Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <h3 className="font-medium text-blue-900 mb-2">Link Behavior</h3>
                            <div className="space-y-1 text-sm text-blue-800">
                                <p>• Users will see a registration form</p>
                                <p>• Party and state will be pre-filled and disabled</p>
                                <p>• District will be {watchStateId && districts.find(d => d.id === Number(watch("district_id"))) ? "pre-filled and disabled" : "selectable from the state"}</p>
                                <p>• Users must complete personal information</p>
                                <p>• Account will be created automatically</p>
                            </div>
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
                                {isEditing ? "Update Link" : "Create Link"}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};