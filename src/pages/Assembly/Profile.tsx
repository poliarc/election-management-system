// src/pages/Profile/Profile.tsx
declare global {
  interface Window {
    _profileIsEditing?: boolean;
  }
}

import React from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
import { areAllRowsFilled } from "../../utils/utilsForm";

// import { yupResolver } from "@hookform/resolvers/yup";
import { Plus, Trash } from "lucide-react";
// import image from "../../../public/images/constituency-1.png";
// import { profileSchema } from "../../schemas/profileSchema";
// import { useLocation } from "react-router-dom"; // (not used)
import { useLocation } from "react-router-dom";

// Minimal inline confirmation modal used for local-only profile image confirmation
const InlineConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  type?: string;
  loading?: boolean;
}> = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", loading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg p-6 w-[90%] max-w-md">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 rounded bg-blue-600 text-white">
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
// import { MonkeyError } from "../../utils/PageError";

// ---- API Response Type ----
export interface UserProfile {
  karyakarta_id: number;
  firstName: string;
  lastName: string;
  phone: string;
  alternateNo: string;
  designation: string;
  distNo: string;
  acNo: string;
  fatherName: string | null;
  motherName: string | null;
  email: string;
  state: string | null;
  citizenship: string | null;
  district: string | null;
  Assembly: string | null;
  block: string | null;
  mandal: string | null;
  voterId: string | null;
  poolingCenter: string | null;
  boothNo: string | null;
  date_of_birth: string | null;
  maritalStatus: string | null;
  marriage_anniversary_date: string | null;
  party_joining_date: string | null;
  vehicle: string | null;
}

// ---- Reusable Input ----
type InputFieldProps = {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
};

const InputField = ({
  label,
  value,
  onChange,
  type = "text",
  error,
  disabled,
  placeholder,
}: InputFieldProps) => (
  <div className="min-w-0 mb-2">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type={type}
      disabled={disabled}
      placeholder={placeholder}
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

// ---- Form Values (must match Yup schema keys) ----
type FormValues = {
  assembly_id?: number;
  id?: number;
  firstName: string;
  lastName: string;
  phoneNo: string;
  alternateNo: string;
  designation: string;
  acNo: string;
  distNo: string;
  father: string;
  mother: string;
  email: string;
  state: string;
  citizenship: string;
  district: string;
  assembly?: string;
  block?: string;
  blockName?: string;
  mandal?: string;
  voterIdNo?: string;
  pollingCenter?: string;
  pollingCenterNo?: string;
  boothNo?: string;
  dob?: string;
  married?: string;
  marriageAnniversary?: string;
  partyJoiningDate?: string;
  education: {
    std: string;
    institute: string;
    boardUniversity: string;
    // university: string;
    year: string;
  }[];
  professionalExp: {
    designation: string;
    organization: string;
    years: string;
    durationFrom: string;
    durationTo: string;
  }[];
  children: { name: string; age: string; gender: string; dob: string }[];
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

  positionHeld2: { title: string; duration: string }[];

  vehicle: { type: string; count: string }[];
  // ensure this exists (your schema referenced profileImage)
  profileImage?: File | null;
};

export const Profile = () => {

  const image =
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=400&h=200&q=80";
  const location = useLocation();
  type CandidateLike =
    | {
      profileImage?: string | null;
      designation?: string;
      phone?: string;
      distNo?: string;
      acNo?: string;
      boothNo?: string;
      assembly?: string;
      blockName?: string;
      block?: string;
      pollingCenter?: string;
      pollingCenterNo?: string;
      mandal?: string;
      email?: string;
      state?: string;
      district?: string;
      firstName?: string;
      lastName?: string;
    }
    | undefined;

  const viewedCandidate = location.state?.candidate as CandidateLike;

  // Local-only: read current user from localStorage (fallback for no API)
  const [currentUser, setCurrentUser] = React.useState<any>(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  // Sync currentUser from localStorage when component mounts or localStorage changes
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        setCurrentUser(JSON.parse(raw));
      }
    } catch (err) {
      console.error("Failed to load user from localStorage", err);
    }
  }, []);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    // resolver: yupResolver(profileSchema) as any, // keep aligned with schema; `as any` avoids minor TS inference issues
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNo: "",
      alternateNo: "",
      designation: "",
      acNo: "",
      distNo: "",
      father: "",
      mother: "",
      email: "",
      state: "",
      citizenship: "",
      district: "",
      assembly: "",
      block: "",
      mandal: "",
      voterIdNo: "",
      pollingCenter: "",
      boothNo: "",
      dob: "",
      married: "",
      marriageAnniversary: "",
      partyJoiningDate: "",
      education: [],
      professionalExp: [],
      children: [],
      positionHeld: [],
      electionContested: [],
      publicRepresentativeDetails: [],
      // positionHeld2: [],
      vehicle: [],
      profileImage: null,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "education",
  });

  const {
    fields: fieldsExp,
    append: appendExp,
    remove: removeExp,
  } = useFieldArray({
    control,
    name: "professionalExp",
  });

  const {
    fields: fieldsChildren,
    append: appendChildren,
    remove: removeChildren,
  } = useFieldArray({
    control,
    name: "children",
  });

  const {
    fields: fieldsPosition,
    append: appendPosition,
    remove: removePosition,
  } = useFieldArray({
    control,
    name: "positionHeld",
  });

  const {
    fields: fieldsElection,
    append: appendElection,
    remove: removeElection,
  } = useFieldArray({
    control,
    name: "electionContested",
  });

  const {
    fields: fieldsPR,
    append: appendPR,
    remove: removePR,
  } = useFieldArray({
    control,
    name: "publicRepresentativeDetails",
  });

  const {
    fields: fieldsVehicle,
    append: appendVehicle,
    remove: removeVehicle,
  } = useFieldArray({
    control,
    name: "vehicle",
  });

  const educationValues = useWatch({ control, name: "education" });
  const experienceFields = useWatch({ control, name: "professionalExp" });
  const childrenFields = useWatch({ control, name: "children" });
  const positionFields = useWatch({ control, name: "positionHeld" });
  const electionFields = useWatch({ control, name: "electionContested" });
  const prFields = useWatch({ control, name: "publicRepresentativeDetails" });
  const vehicleFields = useWatch({ control, name: "vehicle" });

   React.useEffect(() => {
    if (viewedCandidate) {
      console.log(viewedCandidate)
      // Populate form with viewed candidate data
      reset({
        assembly_id: undefined,
        // NId: "",
        designation: viewedCandidate.designation || "",
        phoneNo: viewedCandidate.phone || "",
        alternateNo: "",
        acNo: viewedCandidate.acNo || "",
        assembly: viewedCandidate.assembly || "",
        distNo: viewedCandidate.distNo || "",
        boothNo: viewedCandidate.boothNo || "",
        blockName: viewedCandidate.blockName || viewedCandidate.block || "",
        pollingCenter: viewedCandidate.pollingCenter || "",
        pollingCenterNo: viewedCandidate.pollingCenterNo || "",
        mandal: viewedCandidate.mandal || "",
        father: "",
        mother: "",
        email: viewedCandidate.email || "",
        state: viewedCandidate.state || "",
        citizenship: "",
        district: viewedCandidate.district || "",
        voterIdNo: "",
        dob: "",
        married: "",
        marriageAnniversary: "",
        partyJoiningDate: "",
        education: [],
        professionalExp: [],
        children: [],
        positionHeld: [],
        electionContested: [],
        publicRepresentativeDetails: [],
        positionHeld2: [],
        vehicle: [],
        profileImage: null,
        firstName: viewedCandidate.firstName || "",
        lastName: viewedCandidate.lastName || "",
      });
    } else if (currentUser) {
      const p = currentUser;
      // console.log(p)

     const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "";

    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            console.error("Invalid date format:", dateString);
            return "";
        }
        const year = date.getFullYear();   
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        return `${year}-${month}-${day}`;

    } catch (e) {
        console.error("Error processing date:", dateString, e);
        return "";
    }
};
      reset({
        assembly_id: currentUser.assembly_id ?? "",
        // NId: p.NId ?? "",
        designation: p.designation ?? "",
        phoneNo: p.phone ?? "",
        alternateNo: p.alternateNo ?? "",
        acNo: p.acNo ?? "",
        distNo: p.distNo ?? "",
        father: p.father ?? "",
        mother: p.mother ?? "",
        email: p.email ?? "",
        state: p.state ?? "",
        citizenship: p.citizenship ?? "",
        district: p.district ?? "",
        pollingCenter: p.pollingCenter ?? "",
        pollingCenterNo: p.pollingCenterNo ?? "",
        voterIdNo: p.voterIdNo ?? "",
        dob: formatDate(p.dob) ?? "",
        married: p.married ?? "",
        marriageAnniversary: formatDate(p.marriageAnniversary) ?? "",
        partyJoiningDate: formatDate(p.partyJoiningDate) ?? "",
        education: p.education || [],
        professionalExp: p.professionalExp || [],
        children: p.children || [],
        positionHeld: p.positionHeld || [],
        electionContested: p.electionContested || [],
        publicRepresentativeDetails: p.publicRepresentativeDetails || [],
        positionHeld2: p.positionHeld2 || [],
        vehicle: p.vehicle || [],
        profileImage: null, // will handle file/image separately
      });
    }
  }, [currentUser, reset, viewedCandidate]);

  React.useEffect(() => {
    if (currentUser) {
      const p = currentUser;
      reset({
        id: p.assembly_id ?? "",
        firstName: p.firstName ?? "",
        lastName: p.lastName ?? "",
        phoneNo: p.phone ?? "",
        alternateNo: p.alternateNo ?? "",
        designation: p.designation ?? "",
        acNo: p.acNo ?? "",
        distNo: p.distNo ?? "",
        father: p.father ?? "",
        mother: p.mother ?? "",
        email: p.email ?? "",
        state: typeof p.state === "string" ? p.state : "",
        citizenship: p.citizenship ?? "",
        district: p.district ?? "",
        assembly: p.assembly ?? "",
        block: p.block ?? "",
        mandal: p.mandal ?? "",
        voterIdNo: p.voterIdNo ?? "",
        pollingCenter: p.poolingCenter ?? "",
        boothNo: p.boothNo ?? "",
        dob: p.dob ?? "",
        married: p.married ?? "",
        marriageAnniversary: p.marriageAnniversary ?? "",
        partyJoiningDate: p.partyJoiningDate ?? "",
        education: p.education ?? [],
        professionalExp: p.professionalExp ?? [],
        children: p.children ?? [],
        positionHeld: p.positionHeld ?? [],
        electionContested: p.electionContested ?? [],
        publicRepresentativeDetails: p.publicRepresentativeDetails ?? [],
        positionHeld2: p.positionHeld2 ?? [],
        vehicle: Array.isArray(p.vehicle) ? p.vehicle : [],
        profileImage: null, // will handle file/image separately
      });
    }
  }, [currentUser, reset]);

  // ---- Image preview handling ----
  const [profileImagePreview, setProfileImagePreview] = React.useState<
    string | null
  >(null);
  const profileImage = watch("profileImage");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);
  const [pendingUrl, setPendingUrl] = React.useState<string | null>(null);


  const handleSelectImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelected: React.ChangeEventHandler<
    HTMLInputElement
  > = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview and ask for confirmation
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
    if (!pendingFile) return handleCancelUpload();
    setIsUploading(true);
    try {
      // Local-only: save image as an object URL to the stored user
      const url = pendingUrl || URL.createObjectURL(pendingFile);
      const updated = { ...(currentUser || {}), profileImage: url };
      setCurrentUser(updated);
      try {
        localStorage.setItem("user", JSON.stringify(updated));
      } catch {}
      setProfileImagePreview(null);
    } catch (err) {
      console.error("Image upload failed (local)", err);
    } finally {
      if (pendingUrl) URL.revokeObjectURL(pendingUrl);
      setPendingFile(null);
      setPendingUrl(null);
      setConfirmOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsUploading(false);
    }
  };

  React.useEffect(() => {
    if (profileImage && profileImage instanceof File) {
      const url = URL.createObjectURL(profileImage);
      setProfileImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setProfileImagePreview(null);
  }, [profileImage]);

  // If backend image updates, ensure preview is cleared
  React.useEffect(() => {
    if (currentUser?.profileImage) {
      setProfileImagePreview(null);
      setHeaderAvatarError(false);
      setCardAvatarError(false);
    }
  }, [currentUser?.profileImage]);

  // ---- Edit mode flag ----
  const [isEditing, setIsEditing] = React.useState(false);
  const [headerAvatarError, setHeaderAvatarError] = React.useState(false);
  const [cardAvatarError, setCardAvatarError] = React.useState(false);
  const initial = (currentUser?.firstName || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  React.useEffect(() => {
    window._profileIsEditing = isEditing;
    return () => {
      window._profileIsEditing = undefined;
    };
  }, [isEditing]);


    React.useEffect(() => {
    window._profileIsEditing = isEditing;
    return () => {
      window._profileIsEditing = undefined;
    };
  }, [isEditing]);

  // Image upload helpers for the camera button block
//   const canEdit = isEditing;


  const onSubmit = async (data: FormValues) => {
    try {
      setIsSaving(true);
      // Ensure we have a user object to update
      const userToUpdate = currentUser || {};
      
      const payload = {
        ...userToUpdate,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phoneNo,
        alternateNo: data.alternateNo,
        designation: data.designation,
        acNo: data.acNo,
        distNo: data.distNo,
        father: data.father,
        mother: data.mother,
        email: data.email,
        state: data.state,
        citizenship: data.citizenship,
        district: data.district,
        assembly: data.assembly,
        block: data.block,
        mandal: data.mandal,
        voterIdNo: data.voterIdNo,
        poolingCenter: data.pollingCenter,
        boothNo: data.boothNo,
        dob: data.dob,
        married: data.married,
        marriageAnniversary: data.marriageAnniversary,
        partyJoiningDate: data.partyJoiningDate,
        education: data.education,
        professionalExp: data.professionalExp,
        children: data.children,
        positionHeld: data.positionHeld,
        electionContested: data.electionContested,
        publicRepresentativeDetails: data.publicRepresentativeDetails,
        positionHeld2: data.positionHeld2,
        vehicle: data.vehicle,
      };

      // Update state
      setCurrentUser(payload);
      
      // Save to localStorage
      localStorage.setItem("user", JSON.stringify(payload));
      
      // Exit edit mode
      setIsEditing(false);
      console.log("Profile saved successfully (local)");
    } catch (err) {
      console.error("Update failed (local)", err);
    } finally {
      setIsSaving(false);
    }
  };
  // No network: always render the form. If no data, fields stay empty or use viewedCandidate.

  return (
    <div className="w-full m-0">
      {/* Header */}
      <div className="w-full bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 sm:p-6 border border-gray-100">
        {/* Profile Icon */}
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
              <span className="text-xl font-semibold text-gray-700">
                {initial}
              </span>
            )}
          </div>
        </div>

        {/* User Info */}
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
            <div className="flex justify-between items-center mb-8">
              {
                // FIX: केवल तभी बटन दिखाएं जब viewedCandidate न हो
                !viewedCandidate && (
                      isEditing ? (
                    <div className="flex w-full gap-3">
                      <button
                        type="submit"
                            disabled={isSaving}
                            className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white text-base py-2 px-8 rounded-lg shadow-sm transition-all duration-200 disabled:opacity-60"
                          >
                        {isSaving ? "Saving..." : "Save"}
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
                  )
                )
              }
            </div>

            {/* USER INFORMATION */}
            <section className="mb-8">
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
                  render={({ field }) => (
                    <InputField
                      label="Phone No."
                      type="text"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.phoneNo?.message}
                      disabled={!isEditing}
                    />
                  )}
                />

                <Controller
                  name="alternateNo"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Alternate No."
                      type="text"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.alternateNo?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Email"
                      type="email"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.email?.message}
                      disabled
                    />
                  )}
                />
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="State"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.state?.message}
                      disabled={!isEditing}
                    />
                  )}
                />

                <Controller
                  name="distNo"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="District No"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.distNo?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
                <Controller
                  name="district"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="District"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.district?.message}
                      disabled={!isEditing}
                    />
                  )}
                />

                <Controller
                  name="acNo"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Ac No"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.acNo?.message}
                      disabled={!isEditing}
                    />
                  )}
                />

                <Controller
                  name="assembly"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Assembly"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.assembly?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
                <Controller
                  name="blockName"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Block"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.blockName?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
                <Controller
                  name="mandal"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Mandal"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.mandal?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
                <Controller
                  name="pollingCenterNo"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Polling Center No"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.pollingCenterNo?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
                <Controller
                  name="pollingCenter"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Polling Center"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.pollingCenter?.message}
                      disabled={!isEditing}
                    />
                  )}
                />

             
                <Controller
                  name="boothNo"
                  control={control}
                  render={({ field }) => (
                    <InputField
                    label="Booth No."
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={errors.boothNo?.message}
                    disabled={!isEditing}
                    />
                  )}
                />
                  <Controller
                    name="designation"
                    control={control}
                    render={({ field }) => (
                      <InputField
                        label="Designation"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        error={errors.designation?.message}
                        disabled={!isEditing}
                      />
                    )}
                  />
              </div>
            </section>

            <div className="w-full flex justify-center my-6">
              <div className="h-[1.5px] w-2/3 bg-gradient-to-r from-blue-100 via-blue-300 to-blue-100 rounded-full" />
            </div>

            {/* CONTACT / VOTER INFO */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
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
                  name="voterIdNo"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="VoterID No"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.voterIdNo?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
              </div>
            </section>

            <div className="w-full flex justify-center my-6">
              <div className="h-[1.5px] w-2/3 bg-gradient-to-r from-blue-100 via-blue-300 to-blue-100 rounded-full" />
            </div>

            {/* DATES */}
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

            {/* EXTRA DETAILS */}
            <section className="mb-8">
              <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
                {/* -------------------- EDUCATION -------------------- */}
                <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">Education</h2>
                    {isEditing && (
                      <button
                        type="button"
                        disabled={
                          !areAllRowsFilled(educationValues, [
                            "std",
                            "institute",
                            "boardUniversity",
                            "year",
                          ])
                        }
                        onClick={() =>
                          append({
                            std: "",
                            institute: "",
                            boardUniversity: "",
                            year: "",
                          })
                        }
                        className={`flex items-center gap-1 ${!areAllRowsFilled(educationValues, [
                          "std",
                          "institute",
                          "boardUniversity",
                          "year",
                        ])
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-800"
                          }`}
                      >
                        <Plus size={18} /> Add Education
                      </button>
                    )}
                  </div>

                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 items-end"
                    >
                      {/* Std/Class  */}
                      <Controller
                        name={`education.${index}.std`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Std / Class"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* School / College / Institute Name */}
                      <Controller
                        name={`education.${index}.institute`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="School / College / Institute"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Board / University Name */}
                      <Controller
                        name={`education.${index}.boardUniversity`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Board / University"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Passout Year + Delete */}
                      <div className="flex gap-2 items-end">
                        <Controller
                          name={`education.${index}.year`}
                          control={control}
                          render={({ field }) => (
                            <InputField
                              label="Passout Year"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              disabled={!isEditing}
                            />
                          )}
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-700 mb-2"
                          >
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* -------------------- PROFESSIONAL EXPERIENCE -------------------- */}
                <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">
                      Professional Experience
                    </h2>
                    {isEditing && (
                      <button
                        type="button"
                        disabled={
                          !areAllRowsFilled(experienceFields, [
                            "designation",
                            "organization",
                            "years",
                            "durationFrom",
                            "durationTo",
                          ])
                        }
                        onClick={() =>
                          appendExp({
                            designation: "",
                            organization: "",
                            years: "",
                            durationFrom: "",
                            durationTo: "",
                          })
                        }
                        className={`flex items-center gap-1 ${!areAllRowsFilled(experienceFields, [
                          "designation",
                          "organization",
                          "years",
                          "durationFrom",
                          "durationTo",
                        ])
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-800"
                          }`}
                      >
                        <Plus size={18} /> Add Experience
                      </button>
                    )}
                  </div>

                  {fieldsExp.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 items-end"
                    >
                      {/* Designation */}
                      <Controller
                        name={`professionalExp.${index}.designation`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Designation"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Organization */}
                      <Controller
                        name={`professionalExp.${index}.organization`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Organization"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Years */}
                      <Controller
                        name={`professionalExp.${index}.years`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Years"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Duration From */}
                      <Controller
                        name={`professionalExp.${index}.durationFrom`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Duration From"
                            type="date"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Duration To + Delete */}
                      <div className="flex gap-2 items-end">
                        <Controller
                          name={`professionalExp.${index}.durationTo`}
                          control={control}
                          render={({ field }) => (
                            <InputField
                              label="Duration To"
                              type="date"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              disabled={!isEditing}
                            />
                          )}
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeExp(index)}
                            className="text-red-500 hover:text-red-700 mb-2"
                          >
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* -------------------- CHILDREN -------------------- */}
                <div className=" bg-white rounded-xl p-6 border border-blue-100 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">Children</h2>
                    {isEditing && (
                      <button
                        type="button"
                        disabled={
                          !areAllRowsFilled(childrenFields, [
                            "name",
                            "dob",
                            "gender",
                            "age",
                          ])
                        }
                        onClick={() =>
                          appendChildren({
                            name: "",
                            dob: "",
                            gender: "",
                            age: "",
                          })
                        }
                        className={`flex items-center gap-1 ${!areAllRowsFilled(childrenFields, [
                          "name",
                          "dob",
                          "gender",
                          "age",
                        ])
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-800"
                          }`}
                      >
                        <Plus size={18} /> Add Child
                      </button>
                    )}
                  </div>

                  {fieldsChildren.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 items-end"
                    >
                      {/* Child Name */}
                      <Controller
                        name={`children.${index}.name`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Child Name"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Gender */}
                      <Controller
                        name={`children.${index}.gender`}
                        control={control}
                        render={({ field }) => (
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
                        )}
                      />
                      {/* Age + Delete button */}
                      <Controller
                        name={`children.${index}.age`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Age"
                            type="number"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />
                      {/* Date of Birth */}
                      <div className="flex gap-2 items-end">
                        <Controller
                          name={`children.${index}.dob`}
                          control={control}
                          render={({ field }) => (
                            <InputField
                              label="Date of Birth"
                              type="date"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              disabled={!isEditing}
                            />
                          )}
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeChildren(index)}
                            className="text-red-500 hover:text-red-700 mb-2"
                          >
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* -------------------- POSITION HELD -------------------- */}
                <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">
                      Political Position Details
                    </h2>
                    {isEditing && (
                      <button
                        type="button"
                        disabled={
                          !areAllRowsFilled(positionFields, [
                            "title",
                            "designation",
                            "state",
                            "district",
                            "durationFrom",
                            "durationTo",
                          ])
                        }
                        onClick={() =>
                          appendPosition({
                            title: "",
                            designation: "",
                            state: "",
                            district: "",
                            durationFrom: "",
                            durationTo: "",
                          })
                        }
                        className={`flex items-center gap-1 ${!areAllRowsFilled(positionFields, [
                          "title",
                          "designation",
                          "state",
                          "district",
                          "durationFrom",
                          "durationTo",
                        ])
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-800"
                          }`}
                      >
                        <Plus size={18} /> Add Position
                      </button>
                    )}
                  </div>

                  {fieldsPosition.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 items-end"
                    >
                      {/* Postion Title */}
                      <Controller
                        name={`positionHeld.${index}.title`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Postion Title"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />
                      {/* Designation */}
                      <Controller
                        name={`positionHeld.${index}.designation`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Designation"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* State */}
                      <Controller
                        name={`positionHeld.${index}.state`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="State"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* District */}
                      <Controller
                        name={`positionHeld.${index}.district`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="District"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Duration From */}
                      <Controller
                        name={`positionHeld.${index}.durationFrom`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Duration From"
                            type="date"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Duration To + Delete */}
                      <div className="flex gap-2 items-end">
                        <Controller
                          name={`positionHeld.${index}.durationTo`}
                          control={control}
                          render={({ field }) => (
                            <InputField
                              label="Duration To"
                              type="date"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              disabled={!isEditing}
                            />
                          )}
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removePosition(index)}
                            className="text-red-500 hover:text-red-700 mb-2"
                          >
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* -------------------- ELECTION CONTESTED -------------------- */}
                <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">
                      Election Contested
                    </h2>
                    {isEditing && (
                      <button
                        type="button"
                        disabled={
                          !areAllRowsFilled(electionFields, [
                            "electionName",
                            "year",
                            "result",
                            "state",
                            "district",
                            "assembly",
                          ])
                        }
                        onClick={() =>
                          appendElection({
                            electionName: "",
                            year: "",
                            result: "",
                            state: "",
                            district: "",
                            assembly: "",
                          })
                        }
                        className={`flex items-center gap-1 ${!areAllRowsFilled(electionFields, [
                          "electionName",
                          "year",
                          "result",
                          "state",
                          "district",
                          "assembly",
                        ])
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-800"
                          }`}
                      >
                        <Plus size={18} /> Add Election
                      </button>
                    )}
                  </div>

                  {fieldsElection.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 items-end"
                    >
                      {/* Election Name (with placeholder MP, MLA, Ward, Sarpanch) */}
                      <Controller
                        name={`electionContested.${index}.electionName`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Election Name"
                            placeholder="MP, MLA, Ward, Sarpanch"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Year */}
                      <Controller
                        name={`electionContested.${index}.year`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Year"
                            type="number"
                            placeholder="e.g. 2024"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Result / Remarks */}
                      <Controller
                        name={`electionContested.${index}.result`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Result / Remarks"
                            placeholder=" Won, Lost, Pending"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* State */}
                      <Controller
                        name={`electionContested.${index}.state`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="State"
                            // placeholder="Enter State"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* District */}
                      <Controller
                        name={`electionContested.${index}.district`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="District"
                            // placeholder="Enter District"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Assembly + Delete */}
                      <div className="flex gap-2 items-end">
                        <Controller
                          name={`electionContested.${index}.assembly`}
                          control={control}
                          render={({ field }) => (
                            <InputField
                              label="Assembly"
                              // placeholder="Enter Assembly"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              disabled={!isEditing}
                            />
                          )}
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeElection(index)}
                            className="text-red-500 hover:text-red-700 mb-2"
                          >
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* -------------------- PUBLIC REPRESENTATIVE DETAILS -------------------- */}
                <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">
                      Public Representative Details
                    </h2>
                    {isEditing && (
                      <button
                        type="button"
                        disabled={
                          !areAllRowsFilled(prFields, [
                            "electionName",
                            "year",
                            "result",
                            "state",
                            "district",
                            "assembly",
                          ])
                        }
                        onClick={() =>
                          appendPR({
                            electionName: "",
                            year: "",
                            result: "",
                            state: "",
                            district: "",
                            assembly: "",
                          })
                        }
                        className={`flex items-center gap-1 ${!areAllRowsFilled(prFields, [
                          "electionName",
                          "year",
                          "result",
                          "state",
                          "district",
                          "assembly",
                        ])
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-800"
                          }`}
                      >
                        <Plus size={18} /> Add Winner
                      </button>
                    )}
                  </div>

                  {fieldsPR.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 items-end"
                    >
                      {/* Election Name */}
                      <Controller
                        name={`publicRepresentativeDetails.${index}.electionName`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Election Name"
                            placeholder="MP, MLA, Ward, Sarpanch"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Year */}
                      <Controller
                        name={`publicRepresentativeDetails.${index}.year`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Year"
                            type="number"
                            placeholder="2024"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Result / Remarks */}
                      <Controller
                        name={`publicRepresentativeDetails.${index}.result`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Result / Remarks"
                            placeholder="Won / Lost / Margin"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* State */}
                      <Controller
                        name={`publicRepresentativeDetails.${index}.state`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="State"
                            placeholder="Enter State"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* District */}
                      <Controller
                        name={`publicRepresentativeDetails.${index}.district`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="District"
                            placeholder="Enter District"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Assembly + Delete */}
                      <div className="flex gap-2 items-end">
                        <Controller
                          name={`publicRepresentativeDetails.${index}.assembly`}
                          control={control}
                          render={({ field }) => (
                            <InputField
                              label="Assembly"
                              placeholder="Enter Assembly"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              disabled={!isEditing}
                            />
                          )}
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removePR(index)}
                            className="text-red-500 hover:text-red-700 mb-2"
                          >
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* -------------------- POSITION HELD (SECOND) -------------------- */}
                {/* <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">Position Held</h2>
                    {isEditing && (
                      <button
                        type="button"
                        disabled={
                          !areAllRowsFilled(pos2Fields, ["title", "duration"])
                        }
                        onClick={() =>
                          appendPos2({
                            title: "",
                            duration: "",
                          })
                        }
                        className={`flex items-center gap-1 ${
                          !areAllRowsFilled(pos2Fields, ["title", "duration"])
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-blue-600 hover:text-blue-800"
                        }`}
                      >
                        <Plus size={18} /> Add Position
                      </button>
                    )}
                  </div>

                  {fieldsPos2.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 items-end"
                    >
                      {/* Position Title 
                      <Controller
                        name={`positionHeld2.${index}.title`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Position Title"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Duration + Delete 
                      <div className="flex gap-2 items-end">
                        <Controller
                          name={`positionHeld2.${index}.duration`}
                          control={control}
                          render={({ field }) => (
                            <InputField
                              label="Duration"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              disabled={!isEditing}
                            />
                          )}
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removePos2(index)}
                            className="text-red-500 hover:text-red-700 mb-2"
                          >
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div> */}

                {/* -------------------- VEHICLES -------------------- */}
                <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold text-lg">Vehicles</h2>
                    {isEditing && (
                      <button
                        type="button"
                        disabled={
                          !areAllRowsFilled(vehicleFields, ["type", "count"])
                        }
                        onClick={() =>
                          appendVehicle({
                            type: "",
                            count: "",
                          })
                        }
                        className={`flex items-center gap-1 ${!areAllRowsFilled(vehicleFields, ["type", "count"])
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-blue-600 hover:text-blue-800"
                          }`}
                      >
                        <Plus size={18} /> Add Vehicle
                      </button>
                    )}
                  </div>

                  {fieldsVehicle.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 items-end"
                    >
                      {/* Vehicle Type */}
                      <Controller
                        name={`vehicle.${index}.type`}
                        control={control}
                        render={({ field }) => (
                          <InputField
                            label="Vehicle Type (Two/Four)"
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            disabled={!isEditing}
                          />
                        )}
                      />

                      {/* Count + Delete */}
                      <div className="flex gap-2 items-end">
                        <Controller
                          name={`vehicle.${index}.count`}
                          control={control}
                          render={({ field }) => (
                            <InputField
                              label="Number of Vehicles"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              disabled={!isEditing}
                            />
                          )}
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeVehicle(index)}
                            className="text-red-500 hover:text-red-700 mb-2"
                          >
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
            {/* Background image behind avatar */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 z-0 w-40 h-20 rounded-b-3xl overflow-hidden">
              <img
                src={image}
                alt="Profile bg"
                className="w-full h-full object-cover object-center"
                draggable="false"
              />
            </div>
            {/* Avatar */}
            <div className="relative z-10 mt-10">
              <span className="absolute -inset-1 rounded-full bg-gradient-to-tr from-blue-400 via-blue-200 to-blue-100 blur-sm opacity-60"></span>
              {profileImagePreview ? (
                <img
                  src={profileImagePreview}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-white object-cover relative z-10"
                />
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
            {/* Hidden file input for selecting a new photo */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelected}
              className="hidden"
            />
            {/* Camera/upload button overlay - visible only in edit mode */}
            {isEditing && (
              <button
                type="button"
                onClick={handleSelectImageClick}
                className="absolute right-8 bottom-2 z-20 w-9 h-9 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:bg-gray-50 active:scale-95 transition disabled:opacity-60"
                disabled={isUploading || isSaving}
                title={isUploading ? "Uploading..." : "Upload profile image"}
              >
                {/* camera icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 text-gray-700"
                >
                  <path d="M9 2a1 1 0 00-.894.553L7.382 4H5a3 3 0 00-3 3v10a3 3 0 003 3h14a3 3 0 003-3V7a3 3 0 00-3-3h-2.382l-.724-1.447A1 1 0 0015 2H9zm3 6a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z" />
                </svg>
              </button>
            )}
          </div>
          <div className="text-center mt-8 w-full flex flex-col items-center">
            <h3 className="text-2xl font-bold text-blue-700 flex flex-col items-center">
              <span>{watch("firstName")}</span>
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
      {/* Confirm upload modal (inline local-only) */}
      <InlineConfirmationModal
        isOpen={confirmOpen}
        onClose={handleCancelUpload}
        onConfirm={handleConfirmUpload}
        title="Update profile photo?"
        message="Do you want to upload this photo as your profile picture?"
        confirmText="Upload"
        type="info"
        loading={isUploading}
      />
    </div>
  );
};
