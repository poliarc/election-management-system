// src/pages/Assembly/Profile.tsx
declare global {
  interface Window {
    _profileIsEditing?: boolean;
  }
}

import React from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { areAllRowsFilled } from "../../../utils/utilsForm";
import { Plus, Trash } from "lucide-react";
import { useGetProfileQuery, useUpdateProfileMutation } from "../../../store/api/profileApi";

// Confirmation modal for profile image upload
const InlineConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  loading?: boolean;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  loading,
}) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-lg p-6 w-[90%] max-w-md">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{message}</p>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded bg-gray-100">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            >
              {loading ? "Please wait..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  };

// Reusable Input Field
type InputFieldProps = {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
};

const InputField = ({
  label,
  value,
  onChange,
  type = "text",
  error,
  disabled,
  placeholder,
  maxLength,
}: InputFieldProps) => (
  <div className="min-w-0 mb-2">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type={type}
      disabled={disabled}
      placeholder={placeholder}
      maxLength={maxLength}
      style={{
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        height: "38px",
        border: "1px solid #CBD5E1",
        fontSize: "15px",
        background: disabled ? "#F1F5F9" : "#F8FAFC",
        cursor: disabled ? "not-allowed" : "text",
      }}
      className="rounded-lg px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-150 shadow-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
);

// Form Values Type
type FormValues = {
  firstName: string;
  lastName: string;
  phoneNo: string;
  father: string;
  mother: string;
  citizenship: string;
  voterIdNo: string;
  dob: string;
  married: string;
  marriageAnniversary: string;
  partyJoiningDate: string;
  state: string;
  district: string;
  assembly: string;
  is_youth: number;
  is_women: number;
  is_employee: number;
  is_minority: number;
  is_sc: number;
  is_st: number;
  is_obc: number;
  is_it_media: number;
  is_kisan: number;
  is_majdoor: number;
  is_student: number;
  education: {
    std: string;
    institute: string;
    boardUniversity: string;
    year: string;
  }[];
  professionalExp: {
    designation: string;
    organization: string;
    years: string;
    durationFrom: string;
    durationTo: string;
  }[];
  children: {
    name: string;
    age: string;
    gender: string;
    dob: string;
  }[];
  positionHeld: {
    title: string;
    designation: string;
    state: string;
    district: string;
    durationFrom: string;
    durationTo: string;
  }[];
  electionContested: {
    electionName: string;
    year: string;
    result: string;
    state: string;
    district: string;
    assembly: string;
  }[];
  publicRepresentativeDetails: {
    electionName: string;
    year: string;
    result: string;
    state: string;
    district: string;
    assembly: string;
  }[];
  vehicle: {
    type: string;
    count: string;
  }[];
  profileImage?: File | null;
  partyName: string;
  role: string;
};

export const DistrictProfile = () => {
  const image =
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=400&h=200&q=80";

  // RTK Query hooks
  const { data: profileData, isLoading, isError, error } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  // State management
  const [currentUser, setCurrentUser] = React.useState<any>(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [userId, setUserId] = React.useState<number | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [headerAvatarError, setHeaderAvatarError] = React.useState(false);
  const [cardAvatarError, setCardAvatarError] = React.useState(false);
  const [profileImagePreview, setProfileImagePreview] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [pendingUrl, setPendingUrl] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNo: "",
      father: "",
      mother: "",
      citizenship: "",
      voterIdNo: "",
      dob: "",
      married: "",
      marriageAnniversary: "",
      partyJoiningDate: "",
      state: "",
      district: "",
      assembly: "",
      is_youth: 0,
      is_women: 0,
      is_employee: 0,
      is_minority: 0,
      is_sc: 0,
      is_st: 0,
      is_obc: 0,
      is_it_media: 0,
      is_kisan: 0,
      is_majdoor: 0,
      is_student: 0,
      education: [],
      professionalExp: [],
      children: [],
      positionHeld: [],
      electionContested: [],
      publicRepresentativeDetails: [],
      vehicle: [],
      profileImage: null,
      partyName: "",
      role: "",
    },
  });

  // Field arrays
  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({
    control,
    name: "education",
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control,
    name: "professionalExp",
  });

  const { fields: childrenFields, append: appendChildren, remove: removeChildren } = useFieldArray({
    control,
    name: "children",
  });

  const { fields: positionFields, append: appendPosition, remove: removePosition } = useFieldArray({
    control,
    name: "positionHeld",
  });

  // const { fields: electionFields, append: appendElection, remove: removeElection } = useFieldArray({
  //   control,
  //   name: "electionContested",
  // });

  // const { fields: prFields, append: appendPR, remove: removePR } = useFieldArray({
  //   control,
  //   name: "publicRepresentativeDetails",
  // });

  const { fields: vehicleFields, append: appendVehicle, remove: removeVehicle } = useFieldArray({
    control,
    name: "vehicle",
  });

  // Watch field arrays for validation
  const educationValues = useWatch({ control, name: "education" });
  const experienceValues = useWatch({ control, name: "professionalExp" });
  const childrenValues = useWatch({ control, name: "children" });
  const positionValues = useWatch({ control, name: "positionHeld" });
  // const electionValues = useWatch({ control, name: "electionContested" });
  // const prValues = useWatch({ control, name: "publicRepresentativeDetails" });
  const vehicleValues = useWatch({ control, name: "vehicle" });
  const profileImage = watch("profileImage");

  // Helper function to format dates
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  // Populate form when profile data loads
  React.useEffect(() => {
    if (profileData) {
      reset({
        firstName: profileData.first_name ?? "",
        lastName: profileData.last_name ?? "",
        phoneNo: profileData.contact_no ?? "",
        father: profileData.father ?? "",
        mother: profileData.mother ?? "",
        citizenship: profileData.citizenship ?? "",
        voterIdNo: profileData.voterIdNo ?? "",
        dob: formatDate(profileData.dob),
        married: profileData.married ?? "",
        marriageAnniversary: formatDate(profileData.marriageAnniversary),
        partyJoiningDate: formatDate(profileData.partyJoiningDate),
        state: profileData.state ?? "",
        district: profileData.district ?? "",
        assembly: profileData.assembly ?? "",
        is_youth: profileData.is_youth ?? 0,
        is_women: profileData.is_women ?? 0,
        is_employee: profileData.is_employee ?? 0,
        is_minority: profileData.is_minority ?? 0,
        is_sc: profileData.is_sc ?? 0,
        is_st: profileData.is_st ?? 0,
        is_obc: profileData.is_obc ?? 0,
        is_it_media: profileData.is_it_media ?? 0,
        is_kisan: profileData.is_kisan ?? 0,
        is_majdoor: profileData.is_majdoor ?? 0,
        is_student: profileData.is_student ?? 0,
        education: profileData.education || [],
        professionalExp: profileData.professionalExp || [],
        children: profileData.children || [],
        positionHeld: profileData.positionHeld || [],
        electionContested: profileData.electionContested || [],
        publicRepresentativeDetails: profileData.publicRepresentativeDetails || [],
        vehicle: profileData.vehicle || [],
        profileImage: null,
        partyName: profileData.partyName ?? "",
        role: profileData.role ?? "",
      });

      setCurrentUser(profileData);
      setUserId(profileData.user_id);
    }
  }, [profileData, reset]);

  // Handle profile image preview
  React.useEffect(() => {
    if (profileImage && profileImage instanceof File) {
      const url = URL.createObjectURL(profileImage);
      setProfileImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setProfileImagePreview(null);
  }, [profileImage]);

  // Clear preview when backend image updates
  React.useEffect(() => {
    if (currentUser?.profileImage) {
      setProfileImagePreview(null);
      setHeaderAvatarError(false);
      setCardAvatarError(false);
    }
  }, [currentUser?.profileImage]);

  // Set editing flag on window
  React.useEffect(() => {
    window._profileIsEditing = isEditing;
    return () => {
      window._profileIsEditing = undefined;
    };
  }, [isEditing]);

  // Image upload handlers
  const handleSelectImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelected: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setProfileImagePreview(url);
    setPendingFile(file);
    setPendingUrl(url);
    setConfirmOpen(true);
  };

  const handleCancelUpload = () => {
    if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    setProfileImagePreview(null);
    setPendingFile(null);
    setConfirmOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile || !userId) return handleCancelUpload();
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("profileImage", pendingFile);

      const result = await updateProfile({ id: userId, data: formData }).unwrap();

      setCurrentUser(result);
      localStorage.setItem("user", JSON.stringify(result));
      setProfileImagePreview(null);
      console.log("Profile image updated");
    } catch (err) {
      console.error("Image upload failed", err);
    } finally {
      if (pendingUrl) URL.revokeObjectURL(pendingUrl);
      setPendingFile(null);
      setPendingUrl(null);
      setConfirmOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsUploading(false);
    }
  };

  // Form submit handler
  const onSubmit = async (data: FormValues) => {
    if (!userId) return console.error("User ID not found");

    try {
      const payload = {
        first_name: data.firstName,
        last_name: data.lastName,
        contact_no: data.phoneNo,
        father: data.father,
        mother: data.mother,
        citizenship: data.citizenship,
        voterIdNo: data.voterIdNo,
        dob: data.dob,
        married: data.married,
        marriageAnniversary: data.marriageAnniversary,
        partyJoiningDate: data.partyJoiningDate,
        state: data.state,
        district: data.district,
        assembly: data.assembly,
        is_youth: data.is_youth,
        is_women: data.is_women,
        is_employee: data.is_employee,
        is_minority: data.is_minority,
        is_sc: data.is_sc,
        is_st: data.is_st,
        is_obc: data.is_obc,
        is_it_media: data.is_it_media,
        is_kisan: data.is_kisan,
        is_majdoor: data.is_majdoor,
        is_student: data.is_student,
        education: data.education,
        professionalExp: data.professionalExp,
        children: data.children,
        positionHeld: data.positionHeld,
        electionContested: data.electionContested,
        publicRepresentativeDetails: data.publicRepresentativeDetails,
        vehicle: data.vehicle,
      };

      const result = await updateProfile({ id: userId, data: payload }).unwrap();

      setCurrentUser(result);
      localStorage.setItem("user", JSON.stringify(result));
      setIsEditing(false);
      console.log("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  const initial = (currentUser?.firstName || "U").trim().charAt(0).toUpperCase();

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full m-0 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="w-full m-0 flex items-center justify-center min-h-[400px]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Failed to load profile</h3>
          <p className="text-red-600 text-sm">
            {error && 'status' in error ? `Error: ${error.status}` : 'Please try again later.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full m-0">
      {/* Header */}
      <div className="w-full bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 sm:p-6 border border-gray-100">
        <div className="relative w-[74px] h-[74px] rounded-full bg-gradient-to-tr from-pink-200 via-red-100 to-yellow-100 p-[3px] shadow-inner">
          <div className="w-full h-full bg-white rounded-full overflow-hidden flex items-center justify-center">
            {currentUser?.profileImage && !headerAvatarError ? (
              <img
                src={currentUser.profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={() => setHeaderAvatarError(true)}
              />
            ) : (
              <span className="text-xl font-semibold text-gray-700">{initial}</span>
            )}
          </div>
        </div>

        <div className="text-center sm:text-left">
          <h1 className="text-lg font-semibold text-gray-800 leading-snug">
            {watch("firstName")} {watch("lastName")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{watch("state")}</p>
        </div>
      </div>

      {/* Main Section */}
      <div className="mt-10 flex flex-col lg:flex-row gap-8">
        {/* Left: Form */}
        <div className="flex-1 bg-white rounded-2xl p-6 border border-blue-100">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Edit/Save Buttons */}
            <div className="flex justify-between items-center mb-8">
              {isEditing ? (
                <div className="flex w-full gap-3">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white text-base py-2 px-8 rounded-lg shadow-sm transition-all duration-200 disabled:opacity-60"
                  >
                    {isUpdating ? "Saving..." : "Save"}
                  </button>
                  <div className="flex-1" />
                  <button
                    type="button"
                    className="bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800 text-base py-2 px-8 rounded-lg shadow-sm transition-all duration-200"
                    onClick={() => {
                      setIsEditing(false);
                      reset();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800 text-base py-2 px-8 rounded-lg shadow-sm transition-all duration-200"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              )}
            </div>

            {/* Basic Information */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="First name"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.firstName?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Last name"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.lastName?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
                <Controller
                  name="phoneNo"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: "Contact number must be 10 digits",
                    },
                  }}
                  render={({ field }) => (
                    <InputField
                      label="Phone No."
                      type="text"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.phoneNo?.message}
                      disabled={!isEditing}
                      maxLength={10}
                    />
                  )}
                />
                <Controller
                  name="father"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Father Name"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.father?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
                <Controller
                  name="mother"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Mother Name"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.mother?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
                <Controller
                  name="citizenship"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Citizenship"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.citizenship?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
                <Controller
                  name="partyName"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Party Name"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.partyName?.message}
                      disabled={true}
                    />
                  )}
                />
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Role"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.role?.message}
                      disabled={true}
                    />
                  )}
                />
              </div>
            </section>

            <div className="w-full flex justify-center my-6">
              <div className="h-[1.5px] w-2/3 bg-gradient-to-r from-blue-100 via-blue-300 to-blue-100 rounded-full" />
            </div>

            {/* Dates Section */}
            <section className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
                <Controller
                  name="dob"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Date Of Birth"
                      type="date"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.dob?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
                <Controller
                  name="married"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Married (Yes/No)"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.married?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
                <Controller
                  name="marriageAnniversary"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Marriage Anniversary Date"
                      type="date"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.marriageAnniversary?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
                <Controller
                  name="partyJoiningDate"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Party Joining Date"
                      type="date"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.partyJoiningDate?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
              </div>
            </section>

            <div className="w-full flex justify-center my-6">
              <div className="h-[1.5px] w-2/3 bg-gradient-to-r from-blue-100 via-blue-300 to-blue-100 rounded-full" />
            </div>

            {/* Boolean Fields */}
            <section className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
                {(
                  [
                    { name: "is_youth", label: "Youth" },
                    { name: "is_women", label: "Women" },
                    { name: "is_employee", label: "Employee" },
                    { name: "is_minority", label: "Minority" },
                    { name: "is_sc", label: "SC" },
                    { name: "is_st", label: "ST" },
                    { name: "is_obc", label: "OBC" },
                    { name: "is_it_media", label: "IT / Media" },
                    { name: "is_kisan", label: "Kisan" },
                    { name: "is_majdoor", label: "Majdoor" },
                    { name: "is_student", label: "Student" },
                  ] as const
                ).map((item) => (
                  <Controller
                    key={item.name}
                    name={item.name as any}
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center gap-4">
                        <span className="text-gray-700 text-sm font-medium w-32">
                          {item.label}:
                        </span>
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            value="1"
                            checked={field.value === 1}
                            onChange={() => field.onChange(1)}
                            disabled={!isEditing}
                            className="h-4 w-4 text-indigo-600"
                          />
                          <span className="text-sm">Yes</span>
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            value="0"
                            checked={field.value === 0 || !field.value}
                            onChange={() => field.onChange(0)}
                            disabled={!isEditing}
                            className="h-4 w-4 text-indigo-600"
                          />
                          <span className="text-sm">No</span>
                        </label>
                      </div>
                    )}
                  />
                ))}
              </div>
            </section>

            <div className="w-full flex justify-center my-6">
              <div className="h-[1.5px] w-2/3 bg-gradient-to-r from-blue-100 via-blue-300 to-blue-100 rounded-full" />
            </div>

            {/* Education Section */}
            <section className="mb-8">
              <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
                {/* Education */}
                <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">Education</h2>
                    {isEditing && (
                      <button
                        type="button"
                        disabled={!areAllRowsFilled(educationValues, ["std", "institute", "boardUniversity", "year"])}
                        onClick={() => appendEducation({ std: "", institute: "", boardUniversity: "", year: "" })}
                        className={`flex items-center gap-1 ${!areAllRowsFilled(educationValues, ["std", "institute", "boardUniversity", "year"])
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-800"
                          }`}
                      >
                        <Plus size={18} /> Add Education
                      </button>
                    )}
                  </div>

                  {educationFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 items-end">
                      <Controller
                        name={`education.${index}.std`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Std / Class" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`education.${index}.institute`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="School / College / Institute" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`education.${index}.boardUniversity`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Board / University" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <div className="flex gap-2 items-end">
                        <Controller
                          name={`education.${index}.year`}
                          control={control}
                          render={({ field }) => (
                            <InputField label="Passout Year" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                          )}
                        />
                        {isEditing && (
                          <button type="button" onClick={() => removeEducation(index)} className="text-red-500 hover:text-red-700 mb-2">
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Professional Experience */}
                <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">Professional Experience</h2>
                    {isEditing && (
                      <button
                        type="button"
                        disabled={!areAllRowsFilled(experienceValues, ["designation", "organization", "years", "durationFrom", "durationTo"])}
                        onClick={() => appendExp({ designation: "", organization: "", years: "", durationFrom: "", durationTo: "" })}
                        className={`flex items-center gap-1 ${!areAllRowsFilled(experienceValues, ["designation", "organization", "years", "durationFrom", "durationTo"])
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-800"
                          }`}
                      >
                        <Plus size={18} /> Add Experience
                      </button>
                    )}
                  </div>

                  {expFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 items-end">
                      <Controller
                        name={`professionalExp.${index}.designation`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Designation" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`professionalExp.${index}.organization`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Organization" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`professionalExp.${index}.years`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Years" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`professionalExp.${index}.durationFrom`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Duration From" type="date" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <div className="flex gap-2 items-end">
                        <Controller
                          name={`professionalExp.${index}.durationTo`}
                          control={control}
                          render={({ field }) => (
                            <InputField label="Duration To" type="date" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                          )}
                        />
                        {isEditing && (
                          <button type="button" onClick={() => removeExp(index)} className="text-red-500 hover:text-red-700 mb-2">
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Children */}
                <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">Children</h2>
                    {isEditing && (
                      <button
                        type="button"
                        disabled={!areAllRowsFilled(childrenValues, ["name", "dob", "gender", "age"])}
                        onClick={() => appendChildren({ name: "", dob: "", gender: "", age: "" })}
                        className={`flex items-center gap-1 ${!areAllRowsFilled(childrenValues, ["name", "dob", "gender", "age"])
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-800"
                          }`}
                      >
                        <Plus size={18} /> Add Child
                      </button>
                    )}
                  </div>

                  {childrenFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 items-end">
                      <Controller
                        name={`children.${index}.name`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Child Name" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`children.${index}.gender`}
                        control={control}
                        render={({ field }) => (
                          <div className="min-w-0 mb-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select
                              className="border rounded-lg p-3 w-full text-sm"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              disabled={!isEditing}
                            >
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        )}
                      />
                      <Controller
                        name={`children.${index}.age`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Age" type="number" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <div className="flex gap-2 items-end">
                        <Controller
                          name={`children.${index}.dob`}
                          control={control}
                          render={({ field }) => (
                            <InputField label="Date of Birth" type="date" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                          )}
                        />
                        {isEditing && (
                          <button type="button" onClick={() => removeChildren(index)} className="text-red-500 hover:text-red-700 mb-2">
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Political Position Details */}
                <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">Political Position Details</h2>
                    {isEditing && (
                      <button
                        type="button"
                        disabled={!areAllRowsFilled(positionValues, ["title", "designation", "state", "district", "durationFrom", "durationTo"])}
                        onClick={() => appendPosition({ title: "", designation: "", state: "", district: "", durationFrom: "", durationTo: "" })}
                        className={`flex items-center gap-1 ${!areAllRowsFilled(positionValues, ["title", "designation", "state", "district", "durationFrom", "durationTo"])
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-800"
                          }`}
                      >
                        <Plus size={18} /> Add Position
                      </button>
                    )}
                  </div>

                  {positionFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 items-end">
                      <Controller
                        name={`positionHeld.${index}.title`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Position Title" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`positionHeld.${index}.designation`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Designation" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`positionHeld.${index}.state`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="State" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`positionHeld.${index}.district`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="District" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`positionHeld.${index}.durationFrom`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Duration From" type="date" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <div className="flex gap-2 items-end">
                        <Controller
                          name={`positionHeld.${index}.durationTo`}
                          control={control}
                          render={({ field }) => (
                            <InputField label="Duration To" type="date" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                          )}
                        />
                        {isEditing && (
                          <button type="button" onClick={() => removePosition(index)} className="text-red-500 hover:text-red-700 mb-2">
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Election Contested */}
                {/* <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">Election Contested</h2>
                    {isEditing && (
                      <button
                        type="button"
                        disabled={!areAllRowsFilled(electionValues, ["electionName", "year", "result", "state", "district", "assembly"])}
                        onClick={() => appendElection({ electionName: "", year: "", result: "", state: "", district: "", assembly: "" })}
                        className={`flex items-center gap-1 ${
                          !areAllRowsFilled(electionValues, ["electionName", "year", "result", "state", "district", "assembly"])
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:text-blue-800"
                        }`}
                      >
                        <Plus size={18} /> Add Election
                      </button>
                    )}
                  </div>

                  {electionFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 items-end">
                      <Controller
                        name={`electionContested.${index}.electionName`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Election Name" placeholder="MP, MLA, Ward, Sarpanch" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`electionContested.${index}.year`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Year" type="number" placeholder="e.g. 2024" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`electionContested.${index}.result`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Result / Remarks" placeholder="Won, Lost, Pending" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`electionContested.${index}.state`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="State" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`electionContested.${index}.district`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="District" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <div className="flex gap-2 items-end">
                        <Controller
                          name={`electionContested.${index}.assembly`}
                          control={control}
                          render={({ field }) => (
                            <InputField label="Assembly" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                          )}
                        />
                        {isEditing && (
                          <button type="button" onClick={() => removeElection(index)} className="text-red-500 hover:text-red-700 mb-2">
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div> */}

                {/* Public Representative Details */}
                {/* <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">Public Representative Details</h2>
                    {isEditing && (
                      <button
                        type="button"
                        disabled={!areAllRowsFilled(prValues, ["electionName", "year", "result", "state", "district", "assembly"])}
                        onClick={() => appendPR({ electionName: "", year: "", result: "", state: "", district: "", assembly: "" })}
                        className={`flex items-center gap-1 ${
                          !areAllRowsFilled(prValues, ["electionName", "year", "result", "state", "district", "assembly"])
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:text-blue-800"
                        }`}
                      >
                        <Plus size={18} /> Add Winner
                      </button>
                    )}
                  </div>

                  {prFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 items-end">
                      <Controller
                        name={`publicRepresentativeDetails.${index}.electionName`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Election Name" placeholder="MP, MLA, Ward, Sarpanch" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`publicRepresentativeDetails.${index}.year`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Year" type="number" placeholder="2024" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`publicRepresentativeDetails.${index}.result`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Result / Remarks" placeholder="Won / Lost / Margin" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`publicRepresentativeDetails.${index}.state`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="State" placeholder="Enter State" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <Controller
                        name={`publicRepresentativeDetails.${index}.district`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="District" placeholder="Enter District" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <div className="flex gap-2 items-end">
                        <Controller
                          name={`publicRepresentativeDetails.${index}.assembly`}
                          control={control}
                          render={({ field }) => (
                            <InputField label="Assembly" placeholder="Enter Assembly" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                          )}
                        />
                        {isEditing && (
                          <button type="button" onClick={() => removePR(index)} className="text-red-500 hover:text-red-700 mb-2">
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div> */}

                {/* Vehicles */}
                <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">Vehicles</h2>
                    {isEditing && (
                      <button
                        type="button"
                        disabled={!areAllRowsFilled(vehicleValues, ["type", "count"])}
                        onClick={() => appendVehicle({ type: "", count: "" })}
                        className={`flex items-center gap-1 ${!areAllRowsFilled(vehicleValues, ["type", "count"])
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-800"
                          }`}
                      >
                        <Plus size={18} /> Add Vehicle
                      </button>
                    )}
                  </div>

                  {vehicleFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 items-end">
                      <Controller
                        name={`vehicle.${index}.type`}
                        control={control}
                        render={({ field }) => (
                          <InputField label="Vehicle Type (Two/Four)" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                        )}
                      />
                      <div className="flex gap-2 items-end">
                        <Controller
                          name={`vehicle.${index}.count`}
                          control={control}
                          render={({ field }) => (
                            <InputField label="Number of Vehicles" value={field.value ?? ""} onChange={field.onChange} disabled={!isEditing} />
                          )}
                        />
                        {isEditing && (
                          <button type="button" onClick={() => removeVehicle(index)} className="text-red-500 hover:text-red-700 mb-2">
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Right: Profile Card */}
        <div className="w-full lg:w-[32%] xl:w-[28%] h-fit bg-white rounded-2xl border border-blue-100 p-8 flex flex-col items-center shadow-xl transition-shadow duration-300">
          <div className="relative w-full flex flex-col items-center mb-4">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 z-0 w-40 h-20 rounded-b-3xl overflow-hidden">
              <img src={image} alt="Profile bg" className="w-full h-full object-cover object-center" draggable="false" />
            </div>
            <div className="relative z-10 mt-10">
              <span className="absolute -inset-1 rounded-full bg-gradient-to-tr from-blue-400 via-blue-200 to-blue-100 blur-sm opacity-60"></span>
              {profileImagePreview ? (
                <img src={profileImagePreview} alt="Profile" className="w-32 h-32 rounded-full border-4 border-white object-cover relative z-10" />
              ) : currentUser?.profileImage && !cardAvatarError ? (
                <img
                  src={currentUser.profileImage}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-white object-cover relative z-10"
                  onError={() => setCardAvatarError(true)}
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center text-blue-600 text-5xl relative z-10 font-bold">
                  {initial}
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelected} className="hidden" />
            {isEditing && (
              <button
                type="button"
                onClick={handleSelectImageClick}
                className="absolute right-8 bottom-2 z-20 w-9 h-9 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:bg-gray-50 active:scale-95 transition disabled:opacity-60"
                disabled={isUploading || isUpdating}
                title={isUploading ? "Uploading..." : "Upload profile image"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-700">
                  <path d="M9 2a1 1 0 00-.894.553L7.382 4H5a3 3 0 00-3 3v10a3 3 0 003 3h14a3 3 0 003-3V7a3 3 0 00-3-3h-2.382l-.724-1.447A1 1 0 0015 2H9zm3 6a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z" />
                </svg>
              </button>
            )}
          </div>
          <div className="text-center mt-8 w-full flex flex-col items-center">
            <h3 className="text-2xl font-bold text-blue-700 flex flex-col items-center">
              <span>{watch("firstName")} {watch("lastName")}</span>
            </h3>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200 uppercase tracking-wide shadow-sm">
                {watch("state")}
              </span>
            </div>
            <p className="text-blue-500 text-base mt-3">
              {watch("assembly")}, {watch("district")}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <InlineConfirmationModal
        isOpen={confirmOpen}
        onClose={handleCancelUpload}
        onConfirm={handleConfirmUpload}
        title="Update profile photo?"
        message="Do you want to upload this photo as your profile picture?"
        confirmText="Upload"
        loading={isUploading}
      />
    </div>
  );
};
