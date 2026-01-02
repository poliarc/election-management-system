import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  fetchBannerImages,
  uploadBannerImage,
  validateImageFile,
  type BannerImage,
} from "../services/bannerImagesApi";

interface BannerImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStateHierarchyId: number;
  userName: string;
  assemblyId: number;
}

export default function BannerImagesModal({
  isOpen,
  onClose,
  userStateHierarchyId,
  userName,
  assemblyId,
}: BannerImagesModalProps) {
  const [bannerImages, setBannerImages] = useState<BannerImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState<"web" | "app">("web");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"view" | "upload">("view");

  // Fetch banner images when modal opens
  useEffect(() => {
    if (isOpen && assemblyId) {
      fetchBannerImagesData();
    }
  }, [isOpen, assemblyId]);

  // Clean up preview URL when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearSelection();
      setActiveTab("view");
    }
  }, [isOpen]);

  const fetchBannerImagesData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchBannerImages(assemblyId);
      if (data.success) {
        // Filter images for this specific user
        const userImages = data.data.images.filter(
          (img) => img.id === userStateHierarchyId
        );
        setBannerImages(userImages);
      } else {
        toast.error("Failed to fetch banner images");
      }
    } catch (error) {
      console.error("Error fetching banner images:", error);
      toast.error("Error fetching banner images");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      toast.error(validation.error!);
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);
    try {
      const data = await uploadBannerImage(
        selectedFile,
        selectedImageType,
        userStateHierarchyId
      );

      if (data.success) {
        toast.success(`${selectedImageType} banner image uploaded successfully`);
        clearSelection();
        fetchBannerImagesData();
        setActiveTab("view");
      } else {
        toast.error(data.message || "Failed to upload banner image");
      }
    } catch (error) {
      console.error("Error uploading banner image:", error);
      toast.error("Error uploading banner image");
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-blur bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Banner Images</h2>
              <p className="text-indigo-100 text-sm">User: {userName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("view")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "view"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              View Images
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "upload"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Upload New
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === "view" && (
            <div>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  <p className="mt-4 text-gray-600">Loading banner images...</p>
                </div>
              ) : bannerImages.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mt-2 text-gray-500 font-medium">
                    No banner images found for this user
                  </p>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Upload First Image
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bannerImages.map((image) => (
                    <div key={image.id} className="space-y-4">
                      {/* Web Banner */}
                      {image.webBannerImage && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h3 className="font-semibold text-gray-900 mb-2">Web Banner</h3>
                          <div className="relative">
                            <img
                              src={image.webBannerImage}
                              alt="Web Banner"
                              className="w-full h-48 object-cover rounded-lg border border-gray-300"
                            />
                            <a
                              href={image.webBannerImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute top-2 right-2 bg-white bg-opacity-90 text-gray-800 p-2 rounded-full hover:bg-opacity-100 transition-all duration-200 shadow-lg"
                              title="Open in new tab"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Uploaded: {new Date(image.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* App Banner */}
                      {image.appBannerImage && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <h3 className="font-semibold text-gray-900 mb-2">App Banner</h3>
                          <div className="relative">
                            <img
                              src={image.appBannerImage}
                              alt="App Banner"
                              className="w-full h-48 object-cover rounded-lg border border-gray-300"
                            />
                            <a
                              href={image.appBannerImage}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute top-2 right-2 bg-white bg-opacity-90 text-gray-800 p-2 rounded-full hover:bg-opacity-100 transition-all duration-200 shadow-lg"
                              title="Open in new tab"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Uploaded: {new Date(image.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "upload" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upload Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Type
                  </label>
                  <select
                    value={selectedImageType}
                    onChange={(e) => setSelectedImageType(e.target.value as "web" | "app")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="web">Web Banner</option>
                    <option value="app">App Banner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Image File
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: JPEG, PNG, GIF, WebP (Max: 50MB)
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUploading ? "Uploading..." : "Upload Image"}
                  </button>

                  {selectedFile && (
                    <button
                      onClick={clearSelection}
                      className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Preview */}
              {previewUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full h-auto max-h-64 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      File: {selectedFile?.name} ({Math.round((selectedFile?.size || 0) / 1024)} KB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}