import React from "react";
import { useForm, Controller } from "react-hook-form";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    _profileIsEditing?: boolean;
  }
}

// Mock API hooks - replace with actual State API hooks
const useGetProfileQuery = () => ({
  data: null,
  isLoading: false,
  isError: false,
  refetch: () => Promise.resolve(),
});

const useUpdateProfileMutation = () =>
  [() => Promise.resolve(), { isLoading: false }] as const;

const useUpdateProfileImageMutation = () =>
  [() => Promise.resolve(), { isLoading: false }] as const;

const MonkeyError = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="text-center p-8">
    <p className="text-gray-600 mb-4">{message}</p>
    <button
      onClick={onRetry}
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      Retry
    </button>
  </div>
);

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  loading?: boolean;
}

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  loading,
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

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

// ---- Form Values ----
type FormValues = {
  id?: string;
  pollingNo?: string;
  pollingCenterName?: string;
  boothNo?: string;
  designation: string;
  phoneNo: string;
  alternateNo: string;
  assembly?: string;
  block?: string;
  mandal?: string;
  acNo: string;
  distNo: string;
  father: string;
  mother: string;
  email: string;
  state: string;
  citizenship: string;
  district: string;
  voterIdNo?: string;
  dob?: string;
  married?: string;
  marriageAnniversary?: string;
  partyJoiningDate?: string;
  profileImage?: File | null;
  firstName?: string;
  lastName?: string;
};

export const StateProfile = () => {
  // Define a default image for profile background
  const image =
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=facearea&w=400&h=200&q=80";
  const location = useLocation();

  type CandidateLike =
    | {
        profileImage?: string | null;
        designation?: string;
        Designation?: string;
        phone?: string;
        acNo?: string;
        assembly?: string;
        block?: string;
        mandal?: string;
        distNo?: string;
        email?: string;
        state?: string;
        district?: string;
        dist?: string;
        firstName?: string;
        lastName?: string;
        pollingCenter?: string;
        pollingCenterName?: string;
        pollingCenterNo?: string;
        boothNo?: string;
      }
    | undefined;

  const viewedCandidate = location.state?.candidate as CandidateLike;

  // Mock API calls - replace with actual State API
  const { isLoading, isError, refetch } = useGetProfileQuery();

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [updateProfileImage, { isLoading: isUploadingImage }] =
    useUpdateProfileImageMutation();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      phoneNo: "",
      alternateNo: "",
      designation: "",
      assembly: "",
      block: "",
      mandal: "",
      acNo: "",
      distNo: "",
      pollingNo: "",
      pollingCenterName: "",
      boothNo: "",
      father: "",
      mother: "",
      email: "",
      state: "",
      citizenship: "",
      district: "",
      voterIdNo: "",
      dob: "",
      married: "",
      marriageAnniversary: "",
      partyJoiningDate: "",
      profileImage: null,
      firstName: "",
      lastName: "",
    },
  });

  React.useEffect(() => {
    if (viewedCandidate) {
      // Populate form with viewed candidate data
      reset({
        id: "",
        designation:
          viewedCandidate.designation || viewedCandidate.Designation || "",
        phoneNo: viewedCandidate.phone || "",
        alternateNo: "",
        assembly: viewedCandidate.assembly || "",
        block: viewedCandidate.block || "",
        mandal: viewedCandidate.mandal || "",
        acNo: viewedCandidate.acNo || "",
        distNo: viewedCandidate.distNo || "",
        pollingNo: viewedCandidate.pollingCenterNo || "",
        pollingCenterName:
          viewedCandidate.pollingCenterName ||
          viewedCandidate.pollingCenter ||
          "",
        boothNo: viewedCandidate.boothNo || "",
        father: "",
        mother: "",
        email: viewedCandidate.email || "",
        state: viewedCandidate.state || "",
        citizenship: "",
        district: viewedCandidate.district || viewedCandidate.dist || "",
        voterIdNo: "",
        dob: "",
        married: "",
        marriageAnniversary: "",
        partyJoiningDate: "",
        profileImage: null,
        firstName: viewedCandidate.firstName || "",
        lastName: viewedCandidate.lastName || "",
      });
    }
  }, [viewedCandidate, reset]);

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
    setPendingUrl(null);
    setConfirmOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return handleCancelUpload();
    try {
      await updateProfileImage();
      await refetch();
      setProfileImagePreview(null);
    } catch (err) {
      console.error("Image upload failed", err);
    } finally {
      if (pendingUrl) URL.revokeObjectURL(pendingUrl);
      setPendingFile(null);
      setPendingUrl(null);
      setConfirmOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  // ---- Edit mode flag ----
  const [isEditing, setIsEditing] = React.useState(false);
  React.useEffect(() => {
    window._profileIsEditing = isEditing;
    return () => {
      window._profileIsEditing = undefined;
    };
  }, [isEditing]);

  const canEdit = !viewedCandidate;

  const backendProfileImage: string | null =
    viewedCandidate?.profileImage ?? null;

  const getFirstLetter = () => {
    if (viewedCandidate) {
      const firstName = watch("firstName");
      const lastName = watch("lastName");
      return (
        firstName?.charAt(0)?.toUpperCase() ||
        lastName?.charAt(0)?.toUpperCase() ||
        "U"
      );
    }
    const state = watch("state");
    return state?.charAt(0)?.toUpperCase() || "S";
  };

  const onSubmit = async (data: FormValues) => {
    if (viewedCandidate) return;

    try {
      await updateProfile();
      setIsEditing(false);
      refetch();
      console.log("Profile data:", data);
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  if (!viewedCandidate && isLoading) return <div>Loading profile...</div>;
  if (!viewedCandidate && isError) {
    return (
      <MonkeyError
        message="We were unable to load your profile at this time. Please try again, or contact support if the issue persists."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="w-full m-0">
      {/* Header */}
      <div className="w-full bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 sm:p-6 border border-gray-100">
        {/* Profile Icon */}
        <div className="relative w-[74px] h-[74px] rounded-full bg-gradient-to-tr from-pink-200 via-red-100 to-yellow-100 p-[3px] shadow-inner">
          <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
            {profileImagePreview || backendProfileImage ? (
              <img
                src={
                  (profileImagePreview as string) ||
                  (backendProfileImage as string)
                }
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {getFirstLetter()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-semibold text-gray-800 leading-snug mt-4">
            {viewedCandidate
              ? `${watch("firstName")} ${watch("lastName")}`
              : watch("state") || "State Profile"}
          </h1>
        </div>
      </div>

      {/* Main Section */}
      <div className="mt-10 flex flex-col lg:flex-row gap-8">
        {/* Left: Form */}
        <div className="flex-1 bg-white rounded-2xl p-6 border border-blue-100">
          <form onSubmit={handleSubmit(onSubmit)}>
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
              ) : canEdit ? (
                <button
                  type="button"
                  className="bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-gray-800 text-base py-2 px-8 rounded-lg shadow-sm transition-all duration-200"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              ) : null}
            </div>

            {/* USER INFORMATION */}
            <section className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="First Name"
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
                      label="Last Name"
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
                      label="AlterNate No."
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
                      label="Assembly No"
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
                  name="block"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Block"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.block?.message}
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
                  name="pollingNo"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Polling No"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.pollingNo?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
                <Controller
                  name="pollingCenterName"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Polling Center Name"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      error={errors.pollingCenterName?.message}
                      disabled={!isEditing}
                    />
                  )}
                />
                <Controller
                  name="boothNo"
                  control={control}
                  render={({ field }) => (
                    <InputField
                      label="Booth No"
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

            {/* CONTACT / PERSONAL INFO */}
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
          </form>
        </div>

        {/* Right: Profile Card */}
        <div className="w-full lg:w-[32%] xl:w-[28%] h-fit bg-white rounded-2xl border border-blue-100 p-8 flex flex-col items-center shadow-xl transition-shadow duration-300">
          <div className="relative w-full flex flex-col items-center mb-4">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 z-0 w-40 h-20 rounded-b-3xl overflow-hidden">
              <img
                src={image}
                alt="Profile bg"
                className="w-full h-full object-cover object-center"
                draggable="false"
              />
            </div>
            <div className="relative z-10 mt-10">
              <span className="absolute -inset-1 rounded-full bg-gradient-to-tr from-blue-400 via-blue-200 to-blue-100 blur-sm opacity-60"></span>
              {profileImagePreview ? (
                <img
                  src={profileImagePreview}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-white object-cover relative z-10"
                />
              ) : backendProfileImage ? (
                <img
                  src={backendProfileImage}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-white object-cover relative z-10"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center relative z-10">
                  <span className="text-white font-bold text-4xl">
                    {getFirstLetter()}
                  </span>
                </div>
              )}
              {canEdit && isEditing && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleImageSelected}
                  />
                  <button
                    type="button"
                    onClick={handleSelectImageClick}
                    className="absolute -right-1 bottom-2 z-20 w-9 h-9 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:bg-gray-50 active:scale-95 transition disabled:opacity-60"
                    disabled={isUploadingImage || isUpdating}
                    title={
                      isUploadingImage ? "Uploading..." : "Upload profile image"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5 text-gray-700"
                    >
                      <path d="M9 2a1 1 0 00-.894.553L7.382 4H5a3 3 0 00-3 3v10a3 3 0 003 3h14a3 3 0 003-3V7a3 3 0 00-3-3h-2.382l-.724-1.447A1 1 0 0015 2H9zm3 6a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="text-center mt-8 w-full flex flex-col items-center">
            <h3 className="text-2xl font-bold text-blue-700 flex flex-col items-center">
              <span>
                {viewedCandidate
                  ? `${watch("firstName")} ${watch("lastName")}`
                  : watch("state") || "State Profile"}
              </span>
            </h3>
          </div>
        </div>
      </div>

      {/* Confirm image upload modal */}
      <ConfirmationModal
        isOpen={confirmOpen}
        onClose={handleCancelUpload}
        onConfirm={handleConfirmUpload}
        title="Upload profile image?"
        message="Do you want to set this image as your profile photo?"
        confirmText="Upload"
        cancelText="Cancel"
        loading={isUploadingImage}
      />
    </div>
  );
};

export default StateProfile;
