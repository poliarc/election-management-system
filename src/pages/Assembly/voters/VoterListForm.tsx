import React, { useState } from "react";
import { useForm } from "react-hook-form";
import type { UseFormRegister } from 'react-hook-form';
import type { VoterListCandidate } from "../../../types/voter";
import { 
    ArrowLeft, Edit2, User, Phone, FileText, 
    Briefcase, Users, CheckSquare, MapPin 
} from "lucide-react";
import toast from "react-hot-toast";
import { useGetAllStateMasterDataQuery } from "../../../store/api/stateMasterApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { useTranslation } from "react-i18next";

interface LabeledInputProps {
    label: string;
    t: (key: string, options?: any) => string;
    field: keyof VoterListCandidate;
    register: UseFormRegister<VoterListCandidate>;
    type?: string;
    disabled?: boolean;
    maxLength?: number;
    pattern?: string;
}

const LabeledInput: React.FC<LabeledInputProps> = ({
    label,
    t,
    field,
    register,
    type = "text",
    disabled,
    maxLength,
    pattern,
}) => (
    <div className="flex flex-col">
        <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">
            {label}
        </label>
        <input
            type={type}
            {...register(field)}
            placeholder={t("voterEditForm.placeholderEnter", { field: label })}
            disabled={disabled}
            maxLength={maxLength}
            pattern={pattern}
            className={`
                bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] 
                rounded-lg px-3.5 py-2.5 text-sm transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                disabled:bg-[var(--text-color)] disabled:bg-opacity-5 disabled:cursor-not-allowed disabled:text-[var(--text-secondary)]
            `}
        />
    </div>
);

interface DisplayFieldProps {
    label: string;
    value: string | number | undefined;
}

const DisplayField: React.FC<DisplayFieldProps> = ({ label, value }) => (
    <div className="flex flex-col p-3 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
            {label}
        </div>
        <div className="text-sm font-medium text-[var(--text-color)] truncate">
            {value || '-'}
        </div>
    </div>
);

const EditButton = ({
    onEdit,
    label,
}: {
    onEdit: () => void;
    label: string;
}) => (
    <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
    >
        <Edit2 className="w-4 h-4" />
        {label}
    </button>
);

const SaveCancelButtons = ({
    onSave,
    onCancel,
    btnCancel,
    btnSaveChanges,
}: {
    onSave: () => void;
    onCancel: () => void;
    btnCancel: string;
    btnSaveChanges: string;
}) => (
    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border-color)]">
        <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-lg text-sm font-medium border border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--text-color)]/5 transition-colors"
        >
            {btnCancel}
        </button>
        <button
            type="button"
            onClick={onSave}
            className="px-5 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
        >
            {btnSaveChanges}
        </button>
    </div>
);

// Helper for Section Headers
const SectionHeader = ({ icon: Icon, title, isEditing, onEdit, editLabel }: any) => (
    <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md">
                <Icon className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-color)]">{title}</h2>
        </div>
        {!isEditing && onEdit && (
            <EditButton onEdit={onEdit} label={editLabel} />
        )}
    </div>
);

type Props = {
    initialValues?: VoterListCandidate;
    onSubmit: (data: VoterListCandidate) => void;
    onCancel: () => void;
    language?: string
};

export const VoterEditForm: React.FC<Props> = ({
    initialValues,
    onSubmit,
    onCancel,
    language = "en"
}) => {
    const { t } = useTranslation();
    const [editingSection, setEditingSection] = useState<string | null>(null);

    const user = useSelector((state: RootState) => state.auth.user);
    const selectedAssignment = useSelector((state: RootState) => state.auth.selectedAssignment);

    const { register, handleSubmit, getValues, reset, watch, setValue } = useForm<VoterListCandidate>({
        defaultValues: initialValues,
    });

    const { data: stateMasterData = [] } = useGetAllStateMasterDataQuery();

    const getUserStateName = React.useMemo(() => {
        if (!user?.state_id || !stateMasterData.length) return null;

        if (selectedAssignment?.stateMasterData_id) {
            const assignmentState = stateMasterData.find(item =>
                item.id === selectedAssignment.stateMasterData_id &&
                item.levelType === "State" &&
                item.isActive === 1
            );
            if (assignmentState) return assignmentState.levelName;
        }

        const userState = stateMasterData.find(item =>
            item.id === user.state_id &&
            item.levelType === "State" &&
            item.isActive === 1
        );
        return userState?.levelName || null;
    }, [user?.state_id, selectedAssignment?.stateMasterData_id, stateMasterData]);

    const expiredAliveValue = watch("expired_alive");
    const influencerValue = watch("influencer");
    const labarthiInPersonValue = watch("labarthi_in_person");
    const labarthiCenterValue = watch("labarthi_center");
    const labarthiStateValue = watch("labarthi_state");
    const stayingOutsideValue = watch("staying_outside");
    const shiftedValue = watch("shifted");
    const stayingWithinValue = watch("staying_within");
    const watchShiftedStateId = watch("shifted_state");
    const watchStayingStateId = watch("staying_state");
    const isExpired = expiredAliveValue === "Expired";

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

    React.useEffect(() => {
        if (watchShiftedStateId) setValue("shifted_city", "");
    }, [watchShiftedStateId, setValue]);

    React.useEffect(() => {
        if (watchStayingStateId) {
            setValue("staying_city", "");
            setValue("staying_address", "");
        }
    }, [watchStayingStateId, setValue]);

    React.useEffect(() => {
        if (watch("staying_city")) setValue("staying_address", "");
    }, [watch("staying_city"), setValue]);

    const countries = [
        "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria", "Bangladesh", "Belgium", "Brazil", "Canada", "China", "Denmark", "Egypt", "France", "Germany", "India", "Indonesia", "Iran", "Iraq", "Italy", "Japan", "Jordan", "Kenya", "Malaysia", "Mexico", "Netherlands", "New Zealand", "Norway", "Pakistan", "Philippines", "Russia", "Saudi Arabia", "Singapore", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden", "Switzerland", "Thailand", "Turkey", "United Arab Emirates", "United Kingdom", "United States", "Vietnam"
    ];

    React.useEffect(() => {
        if (initialValues) reset(initialValues);
    }, [initialValues, reset]);

    React.useEffect(() => {
        if (getUserStateName && !watch("staying_state")) {
            setValue("staying_state", getUserStateName);
        }
    }, [getUserStateName, setValue, watch]);

    const handleEdit = (sectionName: string) => setEditingSection(sectionName);

    const handleSave = () => {
        onSubmit(getValues());
        setEditingSection(null);
    };

    const handleCancel = () => {
        reset(initialValues);
        setEditingSection(null);
        toast(t("voterEditForm.toastChangesDiscarded"), { icon: "ℹ️" });
    };

    // Shared Select styles
    const selectBaseStyle = `bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg px-3.5 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:bg-[var(--text-color)] disabled:bg-opacity-5 disabled:cursor-not-allowed disabled:text-[var(--text-secondary)]`;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-3 mb-6 bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-color)] shadow-sm">
                <button
                    onClick={onCancel}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-color)] hover:bg-[var(--text-color)]/5 rounded-lg transition-colors"
                    aria-label={t("voterEditForm.btnBack")}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-[var(--text-color)]">{t("voterEditForm.titleEditVoterDetails")}</h1>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Update demographic and operational data for this individual</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
                {/* Personal Details - Read Only */}
                <div className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-5 md:p-6">
                    <SectionHeader icon={User} title={t("voterEditForm.sectionPersonalDetails")} isEditing={false} />
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <DisplayField label={t("voterEditForm.lblVoterName")} value={language === 'en' ? initialValues?.voter_full_name_en : initialValues?.voter_full_name_hi} />
                        <DisplayField label={t("voterEditForm.lblRelativeName")} value={language === 'en' ? initialValues?.relative_full_name_en : initialValues?.relative_full_name_hi} />
                        <DisplayField label={t("voterEditForm.lblVoterId")} value={initialValues?.voter_id_epic_no} />
                        <DisplayField label={t("voterEditForm.lblGender")} value={initialValues?.gender} />
                        <DisplayField label={t("voterEditForm.lblAge")} value={initialValues?.age} />
                        <DisplayField label={t("voterEditForm.lblDateOfBirth")} value={initialValues?.voter_dob} />
                        <DisplayField label={t("voterEditForm.lblRelation")} value={initialValues?.relation} />
                        <DisplayField label={t("voterEditForm.lblPartNo")} value={initialValues?.part_no} />
                        <DisplayField label={t("voterEditForm.lblSerialNo")} value={initialValues?.sl_no_in_part} />
                        <DisplayField label={t("voterEditForm.lblPsLocation")} value={initialValues?.ps_loc_hin} />
                        <DisplayField label={t("voterEditForm.lblAcNo")} value={initialValues?.ac_no} />
                        <DisplayField label={t("voterEditForm.lblAcName")} value={initialValues?.ac_name_en} />
                    </div>
                </div>

                {/* Contact Details - Editable */}
                <div className={`bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-5 md:p-6 transition-all ${editingSection === 'contact' ? 'ring-2 ring-indigo-500/20' : ''}`}>
                    <SectionHeader icon={Phone} title={t("voterEditForm.sectionContactDetails")} isEditing={editingSection === 'contact'} onEdit={() => handleEdit('contact')} editLabel={t("voterEditForm.btnEdit")} />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <LabeledInput t={t} label={t("voterEditForm.lblContactNumber1")} field="contact_number1" register={register} disabled={editingSection !== 'contact'} maxLength={10} pattern="[0-9]{10}" />
                        <LabeledInput t={t} label={t("voterEditForm.lblContactNumber2")} field="contact_number2" register={register} disabled={editingSection !== 'contact'} maxLength={10} pattern="[0-9]{10}" />
                        <LabeledInput t={t} label={t("voterEditForm.lblContactNumber3")} field="contact_number3" register={register} disabled={editingSection !== 'contact'} maxLength={10} pattern="[0-9]{10}" />
                        <LabeledInput t={t} label={t("voterEditForm.lblContactNumber4")} field="contact_number4" register={register} disabled={editingSection !== 'contact'} maxLength={10} pattern="[0-9]{10}" />
                    </div>
                    {editingSection === 'contact' && (
                        <SaveCancelButtons onSave={handleSave} onCancel={handleCancel} btnCancel={t("voterEditForm.btnCancel")} btnSaveChanges={t("voterEditForm.btnSaveChanges")} />
                    )}
                </div>

                {/* Voter Information - Editable */}
                <div className={`bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-5 md:p-6 transition-all ${editingSection === 'voter_info' ? 'ring-2 ring-indigo-500/20' : ''}`}>
                    <SectionHeader icon={FileText} title={t("voterEditForm.sectionVoterInformation")} isEditing={editingSection === 'voter_info'} onEdit={() => handleEdit('voter_info')} editLabel={t("voterEditForm.btnEdit")} />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="flex flex-col">
                            <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblExpiredAlive")}</label>
                            <select {...register("expired_alive")} disabled={editingSection !== 'voter_info'} className={selectBaseStyle}>
                                <option value="">{t("voterEditForm.optSelect")}</option>
                                <option value="Alive">{t("voterEditForm.optAlive")}</option>
                                <option value="Expired">{t("voterEditForm.optExpired")}</option>
                            </select>
                        </div>
                        {!isExpired && (
                            <>
                                <LabeledInput t={t} label={t("voterEditForm.lblDateOfBirth")} field="voter_dob" register={register} type="date" disabled={editingSection !== 'voter_info'} />
                                <div className="flex flex-col">
                                    <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblMaritalStatus")}</label>
                                    <select {...register("married")} disabled={editingSection !== 'voter_info'} className={selectBaseStyle}>
                                        <option value="">{t("voterEditForm.optSelect")}</option>
                                        <option value="Single">{t("voterEditForm.optSingle")}</option>
                                        <option value="Married">{t("voterEditForm.optMarried")}</option>
                                        <option value="Widow">{t("voterEditForm.optWidow")}</option>
                                        <option value="War Widow">{t("voterEditForm.optWarWidow")}</option>
                                        <option value="Separated">{t("voterEditForm.optSeparated")}</option>
                                    </select>
                                </div>
                                <LabeledInput t={t} label={t("voterEditForm.lblHouseNo")} field="house_no_eng" register={register} disabled={editingSection !== 'voter_info'} />
                                <LabeledInput t={t} label={t("voterEditForm.lblAadhar")} field="aadhar" register={register} disabled={editingSection !== 'voter_info'} />
                                <LabeledInput t={t} label={t("voterEditForm.lblFamilyId")} field="family_id" register={register} disabled={editingSection !== 'voter_info'} />
                            </>
                        )}
                    </div>
                    {editingSection === 'voter_info' && (
                        <SaveCancelButtons onSave={handleSave} onCancel={handleCancel} btnCancel={t("voterEditForm.btnCancel")} btnSaveChanges={t("voterEditForm.btnSaveChanges")} />
                    )}
                </div>

                {/* Political Profiling - Editable */}
                {!isExpired && (
                    <div className={`bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-5 md:p-6 transition-all ${editingSection === 'political' ? 'ring-2 ring-indigo-500/20' : ''}`}>
                        <SectionHeader icon={Briefcase} title={t("voterEditForm.sectionVoterProfiling")} isEditing={editingSection === 'political'} onEdit={() => handleEdit('political')} editLabel={t("voterEditForm.btnEdit")} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblReligion")}</label>
                                <select {...register("religion")} disabled={editingSection !== 'political'} className={selectBaseStyle}>
                                    <option value="">{t("voterEditForm.optSelect")}</option>
                                    <option value="Hindu">{t("voterEditForm.optReligionHindu")}</option>
                                    <option value="Muslim">{t("voterEditForm.optReligionMuslim")}</option>
                                    <option value="Christian">{t("voterEditForm.optReligionChristian")}</option>
                                    <option value="Sikh">{t("voterEditForm.optReligionSikh")}</option>
                                    <option value="Buddhist">{t("voterEditForm.optReligionBuddhist")}</option>
                                    <option value="Jain">{t("voterEditForm.optReligionJain")}</option>
                                    <option value="Other">{t("voterEditForm.optOther")}</option>
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblCaste")}</label>
                                <select {...register("caste")} disabled={editingSection !== 'political'} className={selectBaseStyle}>
                                    <option value="">{t("voterEditForm.optSelect")}</option>
                                    <option value="General">{t("voterEditForm.optCasteGeneral")}</option>
                                    <option value="OBC">{t("voterEditForm.optCasteObc")}</option>
                                    <option value="SC">{t("voterEditForm.optCasteSc")}</option>
                                    <option value="ST">{t("voterEditForm.optCasteSt")}</option>
                                    <option value="Other">{t("voterEditForm.optOther")}</option>
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblProfessionType")}</label>
                                <select {...register("profession_type")} disabled={editingSection !== 'political'} className={selectBaseStyle}>
                                    <option value="">{t("voterEditForm.optSelect")}</option>
                                    <option value="Government Employee">{t("voterEditForm.optProfessionGovernmentEmployee")}</option>
                                    <option value="Private Employee">{t("voterEditForm.optProfessionPrivateEmployee")}</option>
                                    <option value="Business">{t("voterEditForm.optProfessionBusiness")}</option>
                                    <option value="Farmer">{t("voterEditForm.optProfessionFarmer")}</option>
                                    <option value="Student">{t("voterEditForm.optProfessionStudent")}</option>
                                    <option value="Housewife">{t("voterEditForm.optProfessionHousewife")}</option>
                                    <option value="Retired">{t("voterEditForm.optProfessionRetired")}</option>
                                    <option value="Unemployed">{t("voterEditForm.optProfessionUnemployed")}</option>
                                    <option value="Other">{t("voterEditForm.optOther")}</option>
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblProfessionSubCategory")}</label>
                                <select {...register("profession_sub_catg")} disabled={editingSection !== 'political'} className={selectBaseStyle}>
                                    <option value="">{t("voterEditForm.optSelect")}</option>
                                    <option value="Teacher">{t("voterEditForm.optProfessionSubTeacher")}</option>
                                    <option value="Doctor">{t("voterEditForm.optProfessionSubDoctor")}</option>
                                    <option value="Engineer">{t("voterEditForm.optProfessionSubEngineer")}</option>
                                    <option value="Lawyer">{t("voterEditForm.optProfessionSubLawyer")}</option>
                                    <option value="Police">{t("voterEditForm.optProfessionSubPolice")}</option>
                                    <option value="Army">{t("voterEditForm.optProfessionSubArmy")}</option>
                                    <option value="Shopkeeper">{t("voterEditForm.optProfessionSubShopkeeper")}</option>
                                    <option value="Driver">{t("voterEditForm.optProfessionSubDriver")}</option>
                                    <option value="Labor">{t("voterEditForm.optProfessionSubLabor")}</option>
                                    <option value="Other">{t("voterEditForm.optOther")}</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblPoliticalParty")}</label>
                                <select {...register("politcal_party")} disabled={editingSection !== 'political'} className={selectBaseStyle}>
                                    <option value="">{t("voterEditForm.optSelect")}</option>
                                    <option value="Bharatiya Janata Party">{t("voterEditForm.optPartyBjp")}</option>
                                    <option value="Communist Party of India">{t("voterEditForm.optPartyCpi")}</option>
                                    <option value="Communist Party of India (Marxist)">{t("voterEditForm.optPartyCpiMarxist")}</option>
                                    <option value="Indian National Congress">{t("voterEditForm.optPartyInc")}</option>
                                    <option value="Nationalist Congress Party">{t("voterEditForm.optPartyNcp")}</option>
                                    <option value="Aam Aadmi Party">{t("voterEditForm.optPartyAap")}</option>
                                    <option value="Bahujan Samaj Party">{t("voterEditForm.optPartyBsp")}</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblVoterPreferenceRank")}</label>
                                <select {...register("voter_preference_rank")} disabled={editingSection !== 'political'} className={selectBaseStyle}>
                                    <option value="">{t("voterEditForm.optSelect")}</option>
                                    <option value="Anti">{t("voterEditForm.optPreferenceAnti")}</option>
                                    <option value="Neutral">{t("voterEditForm.optPreferenceNeutral")}</option>
                                    <option value="Favour">{t("voterEditForm.optPreferenceFavour")}</option>
                                </select>
                            </div>

                            <LabeledInput t={t} label={t("voterEditForm.lblEducation")} field="education" register={register} disabled={editingSection !== 'political'} />
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblPhysicalVerified")}</label>
                                <select {...register("physical_verified")} disabled={editingSection !== 'political'} className={selectBaseStyle}>
                                    <option value="">{t("voterEditForm.optSelect")}</option>
                                    <option value="yes">{t("voterEditForm.optYes")}</option>
                                    <option value="no">{t("voterEditForm.optNo")}</option>
                                </select>
                            </div>
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblEuSsrFormSubmitted")}</label>
                                <select {...register("eu_ssr_form_submitted")} disabled={editingSection !== 'political'} className={selectBaseStyle}>
                                    <option value="">{t("voterEditForm.optSelect")}</option>
                                    <option value="yes">{t("voterEditForm.optYes")}</option>
                                    <option value="no">{t("voterEditForm.optNo")}</option>
                                </select>
                            </div>
                        </div>
                        {editingSection === 'political' && (
                            <SaveCancelButtons onSave={handleSave} onCancel={handleCancel} btnCancel={t("voterEditForm.btnCancel")} btnSaveChanges={t("voterEditForm.btnSaveChanges")} />
                        )}
                    </div>
                )}

                {/* Influencer - Editable */}
                {!isExpired && (
                    <div className={`bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-5 md:p-6 transition-all ${editingSection === 'influencer' ? 'ring-2 ring-indigo-500/20' : ''}`}>
                        <SectionHeader icon={Users} title={t("voterEditForm.sectionInfluencer")} isEditing={editingSection === 'influencer'} onEdit={() => handleEdit('influencer')} editLabel={t("voterEditForm.btnEdit")} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div className="flex flex-col">
                                <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblInfluencer")}</label>
                                <select {...register("influencer")} disabled={editingSection !== 'influencer'} className={selectBaseStyle}>
                                    <option value="">{t("voterEditForm.optSelect")}</option>
                                    <option value="yes">{t("voterEditForm.optYes")}</option>
                                    <option value="no">{t("voterEditForm.optNo")}</option>
                                </select>
                            </div>
                            {influencerValue === "yes" && (
                                <>
                                    <div className="flex flex-col">
                                        <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblInfluentialType")}</label>
                                        <select {...register("influecial_type")} disabled={editingSection !== 'influencer'} className={selectBaseStyle}>
                                            <option value="">{t("voterEditForm.optSelect")}</option>
                                            <option value="Political Leader">{t("voterEditForm.optInfluentialTypePoliticalLeader")}</option>
                                            <option value="Religious Leader">{t("voterEditForm.optInfluentialTypeReligiousLeader")}</option>
                                            <option value="Community Leader">{t("voterEditForm.optInfluentialTypeCommunityLeader")}</option>
                                            <option value="Business Leader">{t("voterEditForm.optInfluentialTypeBusinessLeader")}</option>
                                            <option value="Social Worker">{t("voterEditForm.optInfluentialTypeSocialWorker")}</option>
                                            <option value="Youth Leader">{t("voterEditForm.optInfluentialTypeYouthLeader")}</option>
                                            <option value="Other">{t("voterEditForm.optOther")}</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblInfluentialCategory")}</label>
                                        <select {...register("influencial_catg")} disabled={editingSection !== 'influencer'} className={selectBaseStyle}>
                                            <option value="">{t("voterEditForm.optSelect")}</option>
                                            <option value="High">{t("voterEditForm.optInfluentialCategoryHigh")}</option>
                                            <option value="Medium">{t("voterEditForm.optInfluentialCategoryMedium")}</option>
                                            <option value="Low">{t("voterEditForm.optInfluentialCategoryLow")}</option>
                                        </select>
                                    </div>
                                    <LabeledInput t={t} label={t("voterEditForm.lblVoterMobilizationCapacity")} field="voter_mobilization_capacity" register={register} type="number" disabled={editingSection !== 'influencer'} />
                                </>
                            )}
                        </div>
                        {editingSection === 'influencer' && (
                            <SaveCancelButtons onSave={handleSave} onCancel={handleCancel} btnCancel={t("voterEditForm.btnCancel")} btnSaveChanges={t("voterEditForm.btnSaveChanges")} />
                        )}
                    </div>
                )}

                {/* Labarthi - Editable */}
                {!isExpired && (
                    <div className={`bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-5 md:p-6 transition-all ${editingSection === 'labarthi' ? 'ring-2 ring-indigo-500/20' : ''}`}>
                        <SectionHeader icon={CheckSquare} title={t("voterEditForm.sectionLabarthi")} isEditing={editingSection === 'labarthi'} onEdit={() => handleEdit('labarthi')} editLabel={t("voterEditForm.btnEdit")} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div className="flex items-center gap-3 bg-[var(--bg-main)] p-3 rounded-lg border border-[var(--border-color)]">
                                <input type="checkbox" {...register("labarthi_in_person")} id="labarthi_in_person" disabled={editingSection !== 'labarthi'} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                                <label htmlFor="labarthi_in_person" className="text-sm font-medium text-[var(--text-color)]">{t("voterEditForm.lblLabarthiInPerson")}</label>
                            </div>
                            {labarthiInPersonValue && (
                                <>
                                    <div className="flex flex-col">
                                        <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblLabarthiCenter")}</label>
                                        <select {...register("labarthi_center")} disabled={editingSection !== 'labarthi'} className={selectBaseStyle}>
                                            <option value="">{t("voterEditForm.optSelect")}</option>
                                            <option value="yes">{t("voterEditForm.optYes")}</option>
                                            <option value="no">{t("voterEditForm.optNo")}</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblLabarthiState")}</label>
                                        <select {...register("labarthi_state")} disabled={editingSection !== 'labarthi'} className={selectBaseStyle}>
                                            <option value="">{t("voterEditForm.optSelect")}</option>
                                            <option value="yes">{t("voterEditForm.optYes")}</option>
                                            <option value="no">{t("voterEditForm.optNo")}</option>
                                        </select>
                                    </div>
                                    {(labarthiCenterValue === "yes" || labarthiStateValue === "yes") && (
                                        <div className="flex flex-col">
                                            <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">
                                                {labarthiCenterValue === "yes" && labarthiStateValue === "yes"
                                                    ? t("voterEditForm.lblLabarthiCenterStateScheme")
                                                    : labarthiCenterValue === "yes"
                                                        ? t("voterEditForm.lblLabarthiCenterScheme")
                                                        : t("voterEditForm.lblLabarthiStateScheme")
                                                }
                                            </label>
                                            <input
                                                type="text"
                                                {...register("labarthi_scheme")}
                                                placeholder={
                                                    labarthiCenterValue === "yes" && labarthiStateValue === "yes"
                                                        ? t("voterEditForm.phEnterLabarthiCenterStateScheme")
                                                        : labarthiCenterValue === "yes"
                                                            ? t("voterEditForm.phEnterLabarthiCenterScheme")
                                                            : t("voterEditForm.phEnterLabarthiStateScheme")
                                                }
                                                disabled={editingSection !== 'labarthi'}
                                                className={`
                                                    bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-color)] rounded-lg px-3.5 py-2.5 text-sm
                                                    focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500
                                                    disabled:bg-[var(--text-color)] disabled:bg-opacity-5 disabled:cursor-not-allowed disabled:text-[var(--text-secondary)]
                                                `}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        {editingSection === 'labarthi' && (
                            <SaveCancelButtons onSave={handleSave} onCancel={handleCancel} btnCancel={t("voterEditForm.btnCancel")} btnSaveChanges={t("voterEditForm.btnSaveChanges")} />
                        )}
                    </div>
                )}

                {/* Voter Location - Editable */}
                {!isExpired && (
                    <div className={`bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-color)] p-5 md:p-6 transition-all ${editingSection === 'location' ? 'ring-2 ring-indigo-500/20' : ''}`}>
                        <SectionHeader icon={MapPin} title={t("voterEditForm.sectionVoterLocation")} isEditing={editingSection === 'location'} onEdit={() => handleEdit('location')} editLabel={t("voterEditForm.btnEdit")} />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

                            <div className="flex items-center gap-3 bg-[var(--bg-main)] p-3 rounded-lg border border-[var(--border-color)]">
                                <input type="checkbox" {...register("staying_within")} id="staying_within" disabled={editingSection !== 'location'} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                                <label htmlFor="staying_within" className="text-sm font-medium text-[var(--text-color)]">{t("voterEditForm.lblWithinState")}</label>
                            </div>

                            {stayingWithinValue && (
                                <>
                                    <div className="flex flex-col">
                                        <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblStayingState")}</label>
                                        <select {...register("staying_state")} disabled={true} className={`${selectBaseStyle} opacity-70`}>
                                            <option value="">{t("voterEditForm.optSelectState")}</option>
                                            {states.map((state) => (
                                                <option key={state.id} value={state.levelName}>{state.levelName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblStayingDistrict")}</label>
                                        <select {...register("staying_city")} disabled={editingSection !== 'location' || !watchStayingStateId} className={selectBaseStyle}>
                                            <option value="">{t("voterEditForm.optSelectDistrict")}</option>
                                            {stayingDistricts.map((district) => (
                                                <option key={district.id} value={district.levelName}>{district.levelName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblStayingAssembly")}</label>
                                        <select {...register("staying_address")} disabled={editingSection !== 'location' || !watch("staying_city")} className={selectBaseStyle}>
                                            <option value="">{t("voterEditForm.optSelectAssembly")}</option>
                                            {assemblies.map((assembly) => (
                                                <option key={assembly.id} value={assembly.levelName}>{assembly.levelName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="flex items-center gap-3 bg-[var(--bg-main)] p-3 rounded-lg border border-[var(--border-color)] mt-2 lg:col-span-3 lg:mt-0 lg:col-start-1">
                                <input type="checkbox" {...register("shifted")} id="shifted" disabled={editingSection !== 'location'} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                                <label htmlFor="shifted" className="text-sm font-medium text-[var(--text-color)]">{t("voterEditForm.lblShifted")}</label>
                            </div>

                            {shiftedValue && (
                                <>
                                    <div className="flex flex-col">
                                        <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblShiftedState")}</label>
                                        <select {...register("shifted_state")} disabled={editingSection !== 'location'} className={selectBaseStyle}>
                                            <option value="">{t("voterEditForm.optSelectState")}</option>
                                            {states.map((state) => (
                                                <option key={state.id} value={state.levelName}>{state.levelName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblShiftedDistrict")}</label>
                                        <select {...register("shifted_city")} disabled={editingSection !== 'location' || !watchShiftedStateId} className={selectBaseStyle}>
                                            <option value="">{t("voterEditForm.optSelectDistrict")}</option>
                                            {shiftedDistricts.map((district) => (
                                                <option key={district.id} value={district.levelName}>{district.levelName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="flex items-center gap-3 bg-[var(--bg-main)] p-3 rounded-lg border border-[var(--border-color)] mt-2 lg:col-span-3 lg:mt-0 lg:col-start-1">
                                <input type="checkbox" {...register("staying_outside")} id="staying_outside" disabled={editingSection !== 'location'} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                                <label htmlFor="staying_outside" className="text-sm font-medium text-[var(--text-color)]">{t("voterEditForm.lblStayingOutsideCountry")}</label>
                            </div>

                            {stayingOutsideValue && (
                                <div className="flex flex-col">
                                    <label className="text-xs font-semibold mb-1.5 text-[var(--text-secondary)] uppercase tracking-wide">{t("voterEditForm.lblOutsideCountry")}</label>
                                    <select {...register("outside_country")} disabled={editingSection !== 'location'} className={selectBaseStyle}>
                                        <option value="">{t("voterEditForm.optSelectCountry")}</option>
                                        {countries.map((country) => (
                                            <option key={country} value={country}>{country}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        {editingSection === 'location' && (
                            <SaveCancelButtons onSave={handleSave} onCancel={handleCancel} btnCancel={t("voterEditForm.btnCancel")} btnSaveChanges={t("voterEditForm.btnSaveChanges")} />
                        )}
                    </div>
                )}
            </form>
        </div>
    );
};