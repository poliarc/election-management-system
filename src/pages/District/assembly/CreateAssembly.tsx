import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateAssemblyMutation } from "../../../store/api/assemblyApi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import toast from "react-hot-toast";

export default function CreateAssembly() {
  const navigate = useNavigate();
  const [assemblyName, setAssemblyName] = useState("");
  const [createAssembly, { isLoading }] = useCreateAssemblyMutation();

  const selectedAssignment = useSelector(
    (state: RootState) => state.auth.selectedAssignment
  );

  const [districtInfo, setDistrictInfo] = useState({
    districtName: "",
    stateName: "",
    parentId: 0,
  });

  useEffect(() => {
    if (selectedAssignment) {
      setDistrictInfo({
        districtName: selectedAssignment.levelName,
        stateName: selectedAssignment.parentLevelName || "",
        parentId: selectedAssignment.stateMasterData_id,
      });
    }
  }, [selectedAssignment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assemblyName.trim()) {
      toast.error("Please enter assembly name");
      return;
    }

    if (!districtInfo.parentId) {
      toast.error("District information not found");
      return;
    }

    try {
      await createAssembly({
        levelName: assemblyName.trim(),
        levelType: "Assembly",
        ParentId: districtInfo.parentId,
      }).unwrap();

      toast.success("Assembly created successfully");
      navigate("/district/assembly");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create assembly");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header Card */}
        <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold">Create New Assembly</h1>
          </div>
          <p className="text-blue-100 ml-14">
            Add a new assembly constituency to your district
          </p>
        </div>

        {/* Context Info Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-blue-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Current Context
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg mt-1">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">State</p>
                <p className="text-lg font-semibold text-gray-900">
                  {districtInfo.stateName || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-100 p-2 rounded-lg mt-1">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">District</p>
                <p className="text-lg font-semibold text-gray-900">
                  {districtInfo.districtName || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="assemblyName"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Assembly Constituency Name{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  id="assemblyName"
                  value={assemblyName}
                  onChange={(e) => setAssemblyName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                  placeholder="e.g., Jhajjar, Bahadurgarh, etc."
                  required
                  disabled={isLoading}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Enter the official name of the assembly constituency
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={isLoading || !assemblyName.trim()}
                className="flex-1 bg-linear-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-semibold flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating Assembly...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Create Assembly
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/district/assembly")}
                disabled={isLoading}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Quick Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Assembly will be created under the current district</li>
                <li>You can assign users to this assembly after creation</li>
                <li>Make sure to use the official constituency name</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
