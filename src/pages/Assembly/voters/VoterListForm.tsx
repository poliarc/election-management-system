import React, { useState } from "react";
import { useForm } from "react-hook-form";
import type { UseFormRegister } from 'react-hook-form';
import type { VoterListCandidate } from "../../../types/voter";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

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
    const { register, handleSubmit, getValues, reset } = useForm<VoterListCandidate>({
        defaultValues: initialValues,
    });

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
        <div className="min-h-screen p-6 bg-gray-50">
            <div className="flex items-center mb-6">
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900">Personal Details</h2>
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Voter Information</h2>
                        {editingSection !== 'voter_info' && (
                            <EditButton onEdit={() => handleEdit('voter_info')} />
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <LabeledInput label="Date of Birth" field="voter_dob" register={register} type="date" disabled={editingSection !== 'voter_info'} />
                        <LabeledInput label="House No" field="house_no_eng" register={register} disabled={editingSection !== 'voter_info'} />
                        <LabeledInput label="Aadhar" field="aadhar" register={register} disabled={editingSection !== 'voter_info'} />
                        <LabeledInput label="Family ID" field="family_id" register={register} disabled={editingSection !== 'voter_info'} />
                    </div>
                    {editingSection === 'voter_info' && (
                        <SaveCancelButtons onSave={handleSave} onCancel={handleCancel} />
                    )}
                </div>

                {/* Political Profiling - Editable */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Voter Profiling</h2>
                        {editingSection !== 'political' && (
                            <EditButton onEdit={() => handleEdit('political')} />
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <LabeledInput label="Religion" field="religion" register={register} disabled={editingSection !== 'political'} />
                        <LabeledInput label="Caste" field="caste" register={register} disabled={editingSection !== 'political'} />
                        <LabeledInput label="Profession Type" field="profession_type" register={register} disabled={editingSection !== 'political'} />
                        <LabeledInput label="Profession Sub Category" field="profession_sub_catg" register={register} disabled={editingSection !== 'political'} />
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

                        <LabeledInput label="Voter Preference Rank" field="voter_preference_rank" register={register} type="number" disabled={editingSection !== 'political'} />
                        <LabeledInput label="Political Party" field="politcal_party" register={register} disabled={editingSection !== 'political'} />

                        <LabeledInput label="Influential Type" field="influecial_type" register={register} disabled={editingSection !== 'political'} />
                        <LabeledInput label="Influential Category" field="influencial_catg" register={register} disabled={editingSection !== 'political'} />

                        <LabeledInput label="Education" field="education" register={register} disabled={editingSection !== 'political'} />
                        <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1.5 text-gray-700">Expired/Alive</label>
                            <select
                                {...register("expired_alive")}
                                disabled={editingSection !== 'political'}
                                className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'political' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="">Select...</option>
                                <option value="Alive">Alive</option>
                                <option value="Expired">Expired</option>
                            </select>
                        </div>
                        <LabeledInput label="Approach Count" field="approch_count" register={register} type="number" disabled={editingSection !== 'political'} />
                        <LabeledInput label="Approach Reason" field="approach_reason" register={register} disabled={editingSection !== 'political'} />
                        <LabeledInput label="Labarthi State" field="labarthi_state" register={register} disabled={editingSection !== 'political'} />
                        <LabeledInput label="Labarthi Center" field="labarthi_center" register={register} disabled={editingSection !== 'political'} />
                        <div className="flex flex-col">
                            <label className="text-sm font-medium mb-1.5 text-gray-700">Married Status</label>
                            <select
                                {...register("married")}
                                disabled={editingSection !== 'political'}
                                className={`bg-white border border-gray-300 text-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${editingSection !== 'political' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            >
                                <option value="">Select...</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Widow">Widow</option>
                                <option value="War Widow">War Widow</option>
                                <option value="Separated">Separated</option>
                            </select>
                        </div>
                    </div>
                    {editingSection === 'political' && (
                        <SaveCancelButtons onSave={handleSave} onCancel={handleCancel} />
                    )}
                </div>

                {/* Voter Location - Editable */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Voter Location</h2>
                        {editingSection !== 'location' && (
                            <EditButton onEdit={() => handleEdit('location')} />
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" {...register("shifted")} id="shifted" disabled={editingSection !== 'location'} className="form-checkbox h-4 w-4 text-indigo-600 rounded" />
                            <label htmlFor="shifted" className="text-sm font-medium text-gray-700">Shifted</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" {...register("staying_outside")} id="staying_outside" disabled={editingSection !== 'location'} className="form-checkbox h-4 w-4 text-indigo-600 rounded" />
                            <label htmlFor="staying_outside" className="text-sm font-medium text-gray-700">Staying Outside</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" {...register("staying_within")} id="staying_within" disabled={editingSection !== 'location'} className="form-checkbox h-4 w-4 text-indigo-600 rounded" />
                            <label htmlFor="staying_within" className="text-sm font-medium text-gray-700">Staying Within</label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" {...register("labarthi_in_person")} id="labarthi_in_person" disabled={editingSection !== 'location'} className="form-checkbox h-4 w-4 text-indigo-600 rounded" />
                            <label htmlFor="labarthi_in_person" className="text-sm font-medium text-gray-700">Labarthi in Person</label>
                        </div>
                        <LabeledInput label="Shifted Address" field="shifted_address" register={register} disabled={editingSection !== 'location'} />
                        <LabeledInput label="Shifted Country" field="shifted_country" register={register} disabled={editingSection !== 'location'} />
                        <LabeledInput label="Shifted State" field="shifted_state" register={register} disabled={editingSection !== 'location'} />
                        <LabeledInput label="Shifted City" field="shifted_city" register={register} disabled={editingSection !== 'location'} />
                        <LabeledInput label="Staying Address" field="staying_address" register={register} disabled={editingSection !== 'location'} />
                        <LabeledInput label="Staying Country" field="staying_country" register={register} disabled={editingSection !== 'location'} />
                        <LabeledInput label="Staying State" field="staying_state" register={register} disabled={editingSection !== 'location'} />
                        <LabeledInput label="Staying City" field="staying_city" register={register} disabled={editingSection !== 'location'} />
                    </div>
                    {editingSection === 'location' && (
                        <SaveCancelButtons onSave={handleSave} onCancel={handleCancel} />
                    )}
                </div>
            </form>
        </div>
    );
};
