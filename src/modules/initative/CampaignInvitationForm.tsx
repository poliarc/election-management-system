import React, { useState } from "react";
import { X, Upload, Camera, User, Users } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import type { CampaignFormData, CampaignEvent } from "../../types/initative";

interface CampaignInvitationFormProps {
  notification: CampaignEvent; // should include acceptance_id when accepted
  onSubmit: (formData: FormData) => Promise<void> | void;
  onClose: () => void;
}

export const CampaignInvitationForm: React.FC<CampaignInvitationFormProps> = ({
  notification,
  onSubmit,
  onClose,
}) => {
  const [imagePreview, setImagePreview] = useState<string[]>([]);

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<CampaignFormData>({
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      address: "",
      emergencyContact: "",
      additionalGuests: 0,
      specialRequirements: "",
      transportNeeded: false,
      accommodationNeeded: false,
      dietaryRestrictions: "",
      images: [],
    },
  });

  // Watch images for preview functionality
  const watchedImages = watch("images");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const currentImages = watchedImages || [];
      setValue("images", [...currentImages, ...files]);

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImagePreview((prev) => [
            ...prev,
            (event.target?.result as string) || "",
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    const currentImages = watchedImages || [];
    setValue(
      "images",
      currentImages.filter((_, i) => i !== index)
    );
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
  };

  // Build FormData to match backend campaign.report controller and multer.single("images")
  const buildReportFormData = (data: CampaignFormData) => {
    const fd = new FormData();

    // Required by backend controller
    fd.append("attendees", (data.additionalGuests ?? 0).toString());
    fd.append("personName", data.fullName);
    fd.append("personPhone", data.phone);
    fd.append("description", data.specialRequirements || "");

    // Backend expects a single file field name: "images"
    if (data.images && data.images.length > 0) {
      fd.append("images", data.images[0]); // multer.single("images")
    }

    // Date: if not provided in UI, use today
    fd.append("date", new Date().toISOString().split("T")[0]);

    // Acceptance id is required and must be for an accepted campaign
    if (notification.acceptance_id) {
      fd.append("campaign_acceptance_id", String(notification.acceptance_id));
    }

    // Do NOT append levelType/level_id from storage.
    // If backend fallback needs an id in body, you may include assembly_id:
    // if (user?.assembly_id) {
    //   fd.append("userLevelId", String(user.assembly_id));
    //   fd.append("userLevelType", "KARYAKARTA");
    // }

    return fd;
  };

  const onFormSubmit = async (data: CampaignFormData) => {
    const formData = buildReportFormData(data);
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 lg:left-[258px]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Join Campaign</h2>
              <p className="text-blue-100">{notification.title}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div
          className="p-6 overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 140px)" }}
        >
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <Controller
                    name="fullName"
                    control={control}
                    rules={{ required: "Full name is required" }}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your full name"
                      />
                    )}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <Controller
                    name="phone"
                    control={control}
                    rules={{
                      required: "Phone is required",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Phone number must be exactly 10 digits",
                      },
                    }}
                    render={({ field: { onChange, value, ...field } }) => (
                      <input
                        {...field}
                        value={value || ""}
                        onChange={(e) => {
                          const inputValue = e.target.value.replace(/\D/g, "");
                          if (inputValue.length <= 10) {
                            onChange(inputValue);
                          }
                        }}
                        type="tel"
                        required
                        maxLength={10}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter 10 digit phone number"
                      />
                    )}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="your.email@example.com"
                      />
                    )}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact
                  </label>
                  <Controller
                    name="emergencyContact"
                    control={control}
                    rules={{
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Emergency contact must be exactly 10 digits",
                      },
                    }}
                    render={({ field: { onChange, value, ...field } }) => (
                      <input
                        {...field}
                        value={value || ""}
                        onChange={(e) => {
                          const inputValue = e.target.value.replace(/\D/g, "");
                          if (inputValue.length <= 10) {
                            onChange(inputValue);
                          }
                        }}
                        type="tel"
                        maxLength={10}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter 10 digit emergency contact"
                      />
                    )}
                  />
                  {errors.emergencyContact && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.emergencyContact.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your complete address"
                    />
                  )}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>

            {/* Event Specific Information */}
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Campaign Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Guests
                  </label>
                  <Controller
                    name="additionalGuests"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="number"
                        min={0}
                        max={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    )}
                  />
                  {errors.additionalGuests && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.additionalGuests.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dietary Requirements
                  </label>
                  <Controller
                    name="dietaryRestrictions"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Vegetarian/Non-vegetarian/Other"
                      />
                    )}
                  />
                  {errors.dietaryRestrictions && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.dietaryRestrictions.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-3">
                  <Controller
                    name="transportNeeded"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <input
                        {...field}
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                    )}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Transportation needed
                  </span>
                </label>

                <label className="flex items-center gap-3">
                  <Controller
                    name="accommodationNeeded"
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <input
                        {...field}
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                    )}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Accommodation needed
                  </span>
                </label>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requirements or Comments
                </label>
                <Controller
                  name="specialRequirements"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Any special requirements or suggestions"
                    />
                  )}
                />
                {errors.specialRequirements && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.specialRequirements.message}
                  </p>
                )}
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-purple-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-purple-600" />
                Upload Photos
              </h3>

              <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Upload your photos
                  </span>
                  <span className="text-xs text-gray-500">
                    PNG, JPG or GIF (max 5MB)
                  </span>
                </label>
              </div>

              {imagePreview.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreview.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 -mx-6 -mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold text-lg flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-xl hover:from-blue-700 hover:to-purple-800 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5" />
                      Join Campaign
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
