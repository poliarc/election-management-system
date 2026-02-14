import React, { useState } from "react";
import { Vote, Save, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateElectionSetupMutation } from "../../store/api/electionSetupApi";

interface ElectionSetupForm {
    state_name: string;
    district_name: string;
    assembly_name: string;
    party_id: string;
    candidate_name: string;
    election_level: string;
}

export const ElectionSetup: React.FC = () => {
    const [formData, setFormData] = useState<ElectionSetupForm>({
        state_name: "",
        district_name: "",
        assembly_name: "",
        party_id: "",
        candidate_name: "",
        election_level: "",
    });

    const [createElectionSetup, { isLoading }] = useCreateElectionSetupMutation();

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleReset = () => {
        setFormData({
            state_name: "",
            district_name: "",
            assembly_name: "",
            party_id: "",
            candidate_name: "",
            election_level: "",
        });
        toast.success("Form reset successfully");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.state_name.trim()) {
            toast.error("State name is required");
            return;
        }
        if (!formData.district_name.trim()) {
            toast.error("District name is required");
            return;
        }
        if (!formData.assembly_name.trim()) {
            toast.error("Assembly name is required");
            return;
        }
        if (!formData.party_id.trim()) {
            toast.error("Party ID is required");
            return;
        }
        if (!formData.candidate_name.trim()) {
            toast.error("Candidate name is required");
            return;
        }
        if (!formData.election_level.trim()) {
            toast.error("Election level is required");
            return;
        }

        try {
            const result = await createElectionSetup({
                state_name: formData.state_name,
                district_name: formData.district_name,
                assembly_name: formData.assembly_name,
                party_id: parseInt(formData.party_id),
                candidate_name: formData.candidate_name,
                election_level: formData.election_level,
            }).unwrap();

            if (result.success) {
                toast.success("Election setup saved successfully!");
                handleReset();
            } else {
                toast.error(result.message || "Failed to save election setup");
            }
        } catch (error: any) {
            console.error("Error saving election setup:", error);

            // Handle RTK Query error
            if (error.status === 400 && error.data?.errors) {
                const errorMessages = error.data.errors.map((err: any) => err.message).join(', ');
                toast.error(`Validation failed: ${errorMessages}`);
            } else if (error.status === 401) {
                toast.error('Unauthorized. Please login again.');
            } else if (error.data?.message) {
                toast.error(error.data.message);
            } else {
                toast.error("Failed to save election setup. Please try again.");
            }
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Vote className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Election Setup</h1>
                </div>
                <p className="text-gray-600">
                    Configure election details including state, district, assembly, party, and candidate information
                </p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* State Name */}
                    <div>
                        <label
                            htmlFor="state_name"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            State Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="state_name"
                            name="state_name"
                            value={formData.state_name}
                            onChange={handleInputChange}
                            placeholder="Enter state name"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* District Name */}
                    <div>
                        <label
                            htmlFor="district_name"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            District Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="district_name"
                            name="district_name"
                            value={formData.district_name}
                            onChange={handleInputChange}
                            placeholder="Enter district name"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Assembly Name */}
                    <div>
                        <label
                            htmlFor="assembly_name"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Assembly Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="assembly_name"
                            name="assembly_name"
                            value={formData.assembly_name}
                            onChange={handleInputChange}
                            placeholder="Enter assembly name"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Party ID */}
                    <div>
                        <label
                            htmlFor="party_id"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Party ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            id="party_id"
                            name="party_id"
                            value={formData.party_id}
                            onChange={handleInputChange}
                            placeholder="Enter party ID"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Candidate Name */}
                    <div>
                        <label
                            htmlFor="candidate_name"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Candidate Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="candidate_name"
                            name="candidate_name"
                            value={formData.candidate_name}
                            onChange={handleInputChange}
                            placeholder="Enter candidate name"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Election Level */}
                    <div>
                        <label
                            htmlFor="election_level"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Election Level <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="election_level"
                            name="election_level"
                            value={formData.election_level}
                            onChange={handleInputChange}
                            placeholder="Enter election level"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Save Election Setup</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Reset Form</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-4xl mt-6">
                <div className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">i</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-blue-900 mb-1">
                            Information
                        </h3>
                        <p className="text-sm text-blue-800">
                            This form is connected to the API endpoint: <code className="bg-blue-100 px-1 py-0.5 rounded">/api/election-setup</code>. All fields are required and will be validated before submission.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
