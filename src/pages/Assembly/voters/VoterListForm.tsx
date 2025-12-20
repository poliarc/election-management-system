import React, { useState } from "react";
import { useForm } from "react-hook-form";
import type { UseFormRegister } from 'react-hook-form';
import type { VoterListCandidate } from "../../../types/voter";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useGetAllStateMasterDataQuery } from "../../../store/api/stateMasterApi";

interface LabeledInputProps {
    label: string;
    field: keyof VoterListCandidate;
    register: UseFormRegister<VoterListCandidate>;
    type?: string;
    disabled?: boolean;
    maxLength?: number;
    pattern?: string;
}

const LabeledInput: React.FC<LabeledInputProps> = ({
    label,
    field,
    register,
    type = "text",
    disabled,
    maxLength,
    pattern,
}) => (
    <div className="flex flex-col">
        <label className="text-sm font-medium mb-1.5 text-gray-700">
            {label}
        </label>
        <input
            type={type}
            {...register(field)}
            placeholder={`Enter ${label}`}
            disabled={disabled}
            maxLength={maxLength}
            pattern={pattern}
            className={`
        bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm
        focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400
        ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}
      `}
        />
    </div>
);

interface DisplayFieldProps {
    label: string;
    value: string | number | undefined;
}

const DisplayField: React.FC<DisplayFieldProps> = ({ label, value }) => (
    <div className="flex items-start gap-3">
        <div className="text-sm font-medium text-gray-600 w-1/3 min-w-[120px] pt-1">
            {label}:
        </div>
        <div className="text-sm text-gray-900 w-2/3 pt-1">
            {value || '-'}
        </div>
    </div>
);

const EditButton = ({
    onEdit
}: {
    onEdit: () => void;
}) => (
    <button
        type="button"
        onClick={onEdit}
        className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition"
    >
        Edit
    </button>
);

const SaveCancelButtons = ({
    onSave,
    onCancel
}: {
    onSave: () => void;
    onCancel: () => void;
}) => (
    <div className="flex justify-end gap-3 mt-6">
        <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
        >
            Cancel
        </button>
        <button
            type="button"
            onClick={onSave}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
        >
            Save Changes
        </button>
    </div>
);

type Props = {
    initialValues?: VoterListCandidate;
    onSubmit: (data: VoterListCandidate) => void;
    onCancel: () => void;
};

export const VoterEditForm: React.FC<Props> = ({
    initialValues,
    onSubmit,
    onCancel,
}) => {
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const { register, handleSubmit, getValues, reset, watch, setValue } = useForm<VoterListCandidate>({
        defaultValues: initialValues,
    });

    // Fetch state master data
    const { data: stateMasterData = [] } = useGetAllStateMasterDataQuery();

    const expiredAliveValue = watch("expired_alive");
    const influencerValue = watch("influencer");
    const labarthiInPersonValue = watch("labarthi_in_person");
    const stayingOutsideValue = watch("staying_outside");
    const shiftedValue = watch("shifted");
    const stayingWithinValue = watch("staying_within");
    const watchShiftedStateId = watch("shifted_state");
    const watchStayingStateId = watch("staying_state");
    const isExpired = expiredAliveValue === "Expired";

    // Filter states and districts for shifted location
    const states = React.useMemo(() => {
        return stateMasterData.filter(item => item.levelType === "State" && item.isActive === 1);
    }, [stateMasterData]);

    const shiftedDistricts = React.useMemo(() => {
        if (!watchShiftedStateId) return [];
        const selectedState = stateMasterData.find(item =>
            item.levelType === "State" &&
            item.levelName === watchShiftedStateId &&
            item.isActive === 1
        );
        return stateMasterData.filter(item =>
            item.levelType === "District" &&
            item.isActive === 1 &&
            (selectedState ? item.ParentId === selectedState.id : false)
        );
    }, [stateMasterData, watchShiftedStateId]);

    const stayingDistricts = React.useMemo(() => {
        if (!watchStayingStateId) return [];
        const selectedState = stateMasterData.find(item =>
            item.levelType === "State" &&
            item.levelName === watchStayingStateId &&
            item.isActive === 1
        );
        return stateMasterData.filter(item =>
            item.levelType === "District" &&
            item.isActive === 1 &&
            (selectedState ? item.ParentId === selectedState.id : false)
        );
    }, [stateMasterData, watchStayingStateId]);

    const assemblies = React.useMemo(() => {
        const stayingCityValue = watch("staying_city");
        if (!stayingCityValue) return [];
        const selectedDistrict = stateMasterData.find(item =>
            item.levelType === "District" &&
            item.levelName === stayingCityValue &&
            item.isActive === 1
        );
        return stateMasterData.filter(item =>
            item.levelType === "Assembly" &&
            item.isActive === 1 &&
            (selectedDistrict ? item.ParentId === selectedDistrict.id : false)
        );
    }, [stateMasterData, watch("staying_city")]);

    // Reset dependent fields when parent changes
    React.useEffect(() => {
        if (watchShiftedStateId) {
            setValue("shifted_city", "");
        }
    }, [watchShiftedStateId, setValue]);

    React.useEffect(() => {
        if (watchStayingStateId) {
            setValue("staying_city", "");
            setValue("staying_address", "");
        }
    }, [watchStayingStateId, setValue]);

    React.useEffect(() => {
        const stayingCityValue = watch("staying_city");
        if (stayingCityValue) {
            setValue("staying_address", "");
        }
    }, [watch("staying_city"), setValue]);

    // Countries list for outside country field
    const countries = [
        "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria", "Bangladesh", "Belgium", "Brazil", "Canada", "China", "Denmark", "Egypt", "France", "Germany", "India", "Indonesia", "Iran", "Iraq", "Italy", "Japan", "Jordan", "Kenya", "Malaysia", "Mexico", "Netherlands", "New Zealand", "Norway", "Pakistan", "Philippines", "Russia", "Saudi Arabia", "Singapore", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden", "Switzerland", "Thailand", "Turkey", "United Arab Emirates", "United Kingdom", "United States", "Vietnam"
    ];

    React.useEffect(() => {
        if (initialValues) {
            reset(initialValues);
        }
    }, [initialValues, reset]);

    const handleEdit = (sectionName: string) => {
        setEditingSection(sectionName);
    };

    const handleSave = () => {
        const editedFields = getValues();
        onSubmit(editedFields);
        setEditingSection(null);
    };

    const handleCancel = () => {
        reset(initialValues);
        setEditingSection(null);
        toast("Changes discarded", { icon: "ℹ️" });
    };

    return (
        <div className="min-h-screen p-1 bg-gray-50">
            <div className="flex items-center mb-1">
                <button
                    onClick={onCancel}
                    className="p-2 mr-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Edit Voter Details</h1>
            </div>

            <form onSubmit={handleSubmit(handleSave)}>
                {/* Personal Details - Read Only */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-1">
                    <h2 className="text-lg font-semibold mb-1 text-gray-900">Personal Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <DisplayField label="Voter Name" value={initialValues?.voter_full_name_en} />
                        <DisplayField label="Relative Name" value={initialValues?.relative_full_name_en} />
                        <DisplayField label="Voter ID" value={initialValues?.voter_id_epic_no} />
                        <DisplayField label="Gender" value={initialValues?.gender} />
                        <DisplayField label="Age" value={initialValues?.age} />
                        <DisplayField label="Date of Birth" value={initialValues?.voter_dob} />
                        <DisplayField label="Relation" value={initialValues?.relation} />
                        <DisplayField label="Part No" value={initialValues?.part_no} />
                        <DisplayField label="Serial No" value={initialValues?.sl_no_in_part} />
                        <DisplayField label="PS Location" value={initialValues?.ps_loc_hin} />
                        <DisplayField label="AC No" value={initialValues?.ac_no} />
                        <DisplayField label="AC Name" value={initialValues?.ac_name_en} />
                    </div>
                </div>

                {/* Contact Details - Editable */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-1">
                    <div className="flex justify-between items-center mb-1">
                        <h2 className="text-lg font-semibold text-gray-900">Contact Details</h2>
                        {editingSection !== 'contact' && (
                            <EditButton onEdit={() => handleEdit('contact')} />
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <LabeledInput label="Contact Number 1" field="contact_number1" register={register} disabled={editingSection !== 'contact'} maxLength={10} pattern="[0-9]{10}" />
                        <LabeledInput label="Contact Number 2" field="contact_number2" register={register} disabled={editingSection !== 'contact'} maxLength={10} pattern="[0-9]{10}" />
                        <LabeledInput label="Contact Number 3" field="contact_number3" register={register} disabled={editingSection !== 'contact'} maxLength={10} pattern="[0-9]{10}" />
                        <LabeledInput label="Contact Number 4" field="contact_number4" register={register} disabled={editingSection !== 'contact'} maxLength={10} pattern="[0-9]{10}" />
                    </div>
                    {editingSection === 'contact' && (
                        <SaveCancelButtons onSave={handleSave} onCancel={handleCancel} />
                    )}
                </div>

                {/* Voter Information - Editable */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-1">
                    <div className="flex justify-between items-center mb-1">
                        <h2 className="text-lg font-semibold text-gray-900">Voter Information</h2>
                        {editingSection !== 'voter_info' && (
                            <EditButton onEdit={() => handleEdit('voter_info')} />
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1.5 text-gray-700">Expired/Alive</label>
                            <select
                                {...register("expired_alive")}
                                disabled={editingSection !== 'voter_info'}
                                className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'voter_info' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="">Select...</option>
                                <option value="Alive">Alive</option>
                                <option value="Expired">Expired</option>
                            </select>
                        </div>
                        {!isExpired && (
                            <>
                                <LabeledInput label="Date of Birth" field="voter_dob" register={register} type="date" disabled={editingSection !== 'voter_info'} />
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-1.5 text-gray-700">Marital Status</label>
                                    <select
                                        {...register("married")}
                                        disabled={editingSection !== 'voter_info'}
                                        className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'voter_info' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="">Select...</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Widow">Widow</option>
                                        <option value="War Widow">War Widow</option>
                                        <option value="Separated">Separated</option>
                                    </select>
                                </div>
                                <LabeledInput label="House No" field="house_no_eng" register={register} disabled={editingSection !== 'voter_info'} />
                                <LabeledInput label="Aadhar" field="aadhar" register={register} disabled={editingSection !== 'voter_info'} />
                                <LabeledInput label="Family ID" field="family_id" register={register} disabled={editingSection !== 'voter_info'} />
                            </>
                        )}
                    </div>
                    {editingSection === 'voter_info' && (
                        <SaveCancelButtons onSave={handleSave} onCancel={handleCancel} />
                    )}
                </div>

                {/* Political Profiling - Editable */}
                {!isExpired && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-1">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-lg font-semibold text-gray-900">Voter Profiling</h2>
                            {editingSection !== 'political' && (
                                <EditButton onEdit={() => handleEdit('political')} />
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1.5 text-gray-700">Religion</label>
                                <select
                                    {...register("religion")}
                                    disabled={editingSection !== 'political'}
                                    className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'political' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Select...</option>
                                    <option value="Hindu">Hindu</option>
                                    <option value="Muslim">Muslim</option>
                                    <option value="Christian">Christian</option>
                                    <option value="Sikh">Sikh</option>
                                    <option value="Buddhist">Buddhist</option>
                                    <option value="Jain">Jain</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1.5 text-gray-700">Caste</label>
                                <select
                                    {...register("caste")}
                                    disabled={editingSection !== 'political'}
                                    className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'political' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Select...</option>
                                    <option value="General">General</option>
                                    <option value="OBC">OBC</option>
                                    <option value="SC">SC</option>
                                    <option value="ST">ST</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1.5 text-gray-700">Profession Type</label>
                                <select
                                    {...register("profession_type")}
                                    disabled={editingSection !== 'political'}
                                    className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'political' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Select...</option>
                                    <option value="Government Employee">Government Employee</option>
                                    <option value="Private Employee">Private Employee</option>
                                    <option value="Business">Business</option>
                                    <option value="Farmer">Farmer</option>
                                    <option value="Student">Student</option>
                                    <option value="Housewife">Housewife</option>
                                    <option value="Retired">Retired</option>
                                    <option value="Unemployed">Unemployed</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1.5 text-gray-700">Profession Sub Category</label>
                                <select
                                    {...register("profession_sub_catg")}
                                    disabled={editingSection !== 'political'}
                                    className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'political' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Select...</option>
                                    <option value="Teacher">Teacher</option>
                                    <option value="Doctor">Doctor</option>
                                    <option value="Engineer">Engineer</option>
                                    <option value="Lawyer">Lawyer</option>
                                    <option value="Police">Police</option>
                                    <option value="Army">Army</option>
                                    <option value="Shopkeeper">Shopkeeper</option>
                                    <option value="Driver">Driver</option>
                                    <option value="Labor">Labor</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1.5 text-gray-700">Political Party</label>
                                <select
                                    {...register("politcal_party")}
                                    disabled={editingSection !== 'political'}
                                    className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'political' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Select...</option>
                                    <option value="Bharatiya Janata Party">Bharatiya Janata Party</option>
                                    <option value="Communist Party of India">Communist Party of India</option>
                                    <option value="Communist Party of India (Marxist)">Communist Party of India (Marxist)</option>
                                    <option value="Indian National Congress">Indian National Congress</option>
                                    <option value="Nationalist Congress Party">Nationalist Congress Party</option>
                                    <option value="Asom Gana Parishad">Asom Gana Parishad</option>
                                    <option value="All India United Democratic Front">All India United Democratic Front</option>
                                    <option value="Bodoland Peoples Front">Bodoland Peoples Front</option>
                                    <option value="Aam Aadmi Party">Aam Aadmi Party</option>
                                    <option value="Bahujan Samaj Party">Bahujan Samaj Party</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1.5 text-gray-700">Voter Preference Rank</label>
                                <select
                                    {...register("voter_preference_rank")}
                                    disabled={editingSection !== 'political'}
                                    className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'political' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Select...</option>
                                    <option value="Anti">Anti</option>
                                    <option value="Neutral">Neutral</option>
                                    <option value="Favour">Favour</option>
                                </select>
                            </div>

                            <LabeledInput label="Education" field="education" register={register} disabled={editingSection !== 'political'} />
                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1.5 text-gray-700">Physical Verified</label>
                                <select
                                    {...register("physical_verified")}
                                    disabled={editingSection !== 'political'}
                                    className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'political' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Select...</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1.5 text-gray-700">EU/SSR Form Submitted</label>
                                <select
                                    {...register("eu_ssr_form_submitted")}
                                    disabled={editingSection !== 'political'}
                                    className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'political' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Select...</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                        </div>
                        {editingSection === 'political' && (
                            <SaveCancelButtons onSave={handleSave} onCancel={handleCancel} />
                        )}
                    </div>
                )}

                {/* Influencer - Editable */}
                {!isExpired && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-1">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-lg font-semibold text-gray-900">Influencer</h2>
                            {editingSection !== 'influencer' && (
                                <EditButton onEdit={() => handleEdit('influencer')} />
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex flex-col">
                                <label className="text-sm font-medium mb-1.5 text-gray-700">Influencer</label>
                                <select
                                    {...register("influencer")}
                                    disabled={editingSection !== 'influencer'}
                                    className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'influencer' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Select...</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>
                            {influencerValue === "yes" && (
                                <>
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium mb-1.5 text-gray-700">Influential Type</label>
                                        <select
                                            {...register("influecial_type")}
                                            disabled={editingSection !== 'influencer'}
                                            className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'influencer' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="">Select...</option>
                                            <option value="Political Leader">Political Leader</option>
                                            <option value="Religious Leader">Religious Leader</option>
                                            <option value="Community Leader">Community Leader</option>
                                            <option value="Business Leader">Business Leader</option>
                                            <option value="Social Worker">Social Worker</option>
                                            <option value="Youth Leader">Youth Leader</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium mb-1.5 text-gray-700">Influential Category</label>
                                        <select
                                            {...register("influencial_catg")}
                                            disabled={editingSection !== 'influencer'}
                                            className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'influencer' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="">Select...</option>
                                            <option value="High">High</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Low">Low</option>
                                        </select>
                                    </div>
                                    <LabeledInput label="Voter Mobilization Capacity" field="voter_mobilization_capacity" register={register} type="number" disabled={editingSection !== 'influencer'} />
                                </>
                            )}
                        </div>
                        {editingSection === 'influencer' && (
                            <SaveCancelButtons onSave={handleSave} onCancel={handleCancel} />
                        )}
                    </div>
                )}

                {/* Labarthi - Editable */}
                {!isExpired && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-1">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-lg font-semibold text-gray-900">Labarthi</h2>
                            {editingSection !== 'labarthi' && (
                                <EditButton onEdit={() => handleEdit('labarthi')} />
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" {...register("labarthi_in_person")} id="labarthi_in_person" disabled={editingSection !== 'labarthi'} className="form-checkbox h-4 w-4 text-indigo-600 rounded" />
                                <label htmlFor="labarthi_in_person" className="text-sm font-medium text-gray-700">Labarthi in Person</label>
                            </div>
                            {labarthiInPersonValue && (
                                <>
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium mb-1.5 text-gray-700">Labarthi Center</label>
                                        <select
                                            {...register("labarthi_center")}
                                            disabled={editingSection !== 'labarthi'}
                                            className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'labarthi' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="">Select...</option>
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium mb-1.5 text-gray-700">Labarthi State</label>
                                        <select
                                            {...register("labarthi_state")}
                                            disabled={editingSection !== 'labarthi'}
                                            className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'labarthi' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="">Select...</option>
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                        </select>
                                    </div>
                                    <LabeledInput label="Labarthi Scheme" field="labarthi_scheme" register={register} disabled={editingSection !== 'labarthi'} />
                                </>
                            )}
                        </div>
                        {editingSection === 'labarthi' && (
                            <SaveCancelButtons onSave={handleSave} onCancel={handleCancel} />
                        )}
                    </div>
                )}

                {/* Approach - Editable */}
                {!isExpired && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-1">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-lg font-semibold text-gray-900">Approach</h2>
                            {editingSection !== 'approach' && (
                                <EditButton onEdit={() => handleEdit('approach')} />
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <LabeledInput label="Approach Count" field="approch_count" register={register} type="number" disabled={editingSection !== 'approach'} />
                            <LabeledInput label="Approach Reason" field="approach_reason" register={register} disabled={editingSection !== 'approach'} />
                        </div>
                        {editingSection === 'approach' && (
                            <SaveCancelButtons onSave={handleSave} onCancel={handleCancel} />
                        )}
                    </div>
                )}

                {/* Voter Location - Editable */}
                {!isExpired && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-1">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-lg font-semibold text-gray-900">Voter Location</h2>
                            {editingSection !== 'location' && (
                                <EditButton onEdit={() => handleEdit('location')} />
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Staying Outside Checkbox */}
                            <div className="flex items-center gap-2">
                                <input type="checkbox" {...register("staying_outside")} id="staying_outside" disabled={editingSection !== 'location'} className="form-checkbox h-4 w-4 text-indigo-600 rounded" />
                                <label htmlFor="staying_outside" className="text-sm font-medium text-gray-700">Staying Outside</label>
                            </div>

                            {/* Outside Country Field - Show when staying_outside is checked */}
                            {stayingOutsideValue && (
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-1.5 text-gray-700">Outside Country</label>
                                    <select
                                        {...register("outside_country")}
                                        disabled={editingSection !== 'location'}
                                        className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'location' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="">Select Country...</option>
                                        {countries.map((country) => (
                                            <option key={country} value={country}>
                                                {country}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Shifted Checkbox */}
                            <div className="flex items-center gap-2">
                                <input type="checkbox" {...register("shifted")} id="shifted" disabled={editingSection !== 'location'} className="form-checkbox h-4 w-4 text-indigo-600 rounded" />
                                <label htmlFor="shifted" className="text-sm font-medium text-gray-700">Shifted</label>
                            </div>

                            {/* Shifted Fields - Show when shifted is checked */}
                            {shiftedValue && (
                                <>
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium mb-1.5 text-gray-700">Shifted State</label>
                                        <select
                                            {...register("shifted_state")}
                                            disabled={editingSection !== 'location'}
                                            className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'location' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="">Select State...</option>
                                            {states.map((state) => (
                                                <option key={state.id} value={state.levelName}>
                                                    {state.levelName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium mb-1.5 text-gray-700">Shifted District</label>
                                        <select
                                            {...register("shifted_city")}
                                            disabled={editingSection !== 'location' || !watchShiftedStateId}
                                            className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'location' || !watchShiftedStateId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="">Select District...</option>
                                            {shiftedDistricts.map((district) => (
                                                <option key={district.id} value={district.levelName}>
                                                    {district.levelName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Staying Within Checkbox */}
                            <div className="flex items-center gap-2">
                                <input type="checkbox" {...register("staying_within")} id="staying_within" disabled={editingSection !== 'location'} className="form-checkbox h-4 w-4 text-indigo-600 rounded" />
                                <label htmlFor="staying_within" className="text-sm font-medium text-gray-700">Staying Within</label>
                            </div>

                            {/* Staying Within Fields - Show when staying_within is checked */}
                            {stayingWithinValue && (
                                <>
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium mb-1.5 text-gray-700">Staying State</label>
                                        <select
                                            {...register("staying_state")}
                                            disabled={editingSection !== 'location'}
                                            className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'location' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="">Select State...</option>
                                            {states.map((state) => (
                                                <option key={state.id} value={state.levelName}>
                                                    {state.levelName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium mb-1.5 text-gray-700">Staying District</label>
                                        <select
                                            {...register("staying_city")}
                                            disabled={editingSection !== 'location' || !watchStayingStateId}
                                            className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'location' || !watchStayingStateId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="">Select District...</option>
                                            {stayingDistricts.map((district) => (
                                                <option key={district.id} value={district.levelName}>
                                                    {district.levelName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-sm font-medium mb-1.5 text-gray-700">Staying Assembly</label>
                                        <select
                                            {...register("staying_address")}
                                            disabled={editingSection !== 'location' || !watch("staying_city")}
                                            className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'location' || !watch("staying_city") ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        >
                                            <option value="">Select Assembly...</option>
                                            {assemblies.map((assembly) => (
                                                <option key={assembly.id} value={assembly.levelName}>
                                                    {assembly.levelName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}


                        </div>
                        {editingSection === 'location' && (
                            <SaveCancelButtons onSave={handleSave} onCancel={handleCancel} />
                        )}
                    </div>
                )}
            </form>
        </div>
    );
};
