import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Link, Copy, CheckCircle, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { useGetPartiesQuery } from "../../store/api/partyUserApi";
import { useGetAllStateMasterDataQuery } from "../../store/api/stateMasterApi";
import { useCreateRegistrationLinkMutation } from "../../store/api/registrationLinksApi";

export const DynamicLinkGenerator: React.FC = () => {
    const { partyId } = useParams<{ partyId: string }>();
    const [selectedStateId, setSelectedStateId] = useState<string>("");
    const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
    const [generatedLink, setGeneratedLink] = useState<string>("");
    const [copiedLink, setCopiedLink] = useState<string>("");
    const [expirationDate, setExpirationDate] = useState<string>("");

    // API hooks
    const { data: partiesResponse } = useGetPartiesQuery();
    const { data: stateMasterData = [], isLoading: isLoadingStates } =
        useGetAllStateMasterDataQuery();
    const [createLink, { isLoading: isCreating }] = useCreateRegistrationLinkMutation();

    const parties = partiesResponse || [];
    const currentParty = parties.find((p) => p.party_id === Number(partyId));

    // Filter states and districts
    const states = React.useMemo(
        () =>
            stateMasterData.filter(
                (item) => item.levelType === "State" && item.isActive === 1
            ),
        [stateMasterData]
    );

    const districts = React.useMemo(
        () =>
            stateMasterData.filter(
                (item) =>
                    item.levelType === "District" &&
                    item.isActive === 1 &&
                    (selectedStateId ? item.ParentId === Number(selectedStateId) : true)
            ),
        [stateMasterData, selectedStateId]
    );

    const selectedState = states.find((s) => s.id === Number(selectedStateId));
    const selectedDistrict = districts.find((d) => d.id === Number(selectedDistrictId));

    // Reset district when state changes
    React.useEffect(() => {
        if (selectedStateId) {
            setSelectedDistrictId("");
        }
    }, [selectedStateId]);

    // Calculate default expiration (30 days from now)
    const defaultExpiration = React.useMemo(() => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString().slice(0, 16);
    }, []);

    const generateLink = async () => {
        if (!selectedStateId || !currentParty) {
            toast.error("Please select a state");
            return;
        }

        try {
            const linkData = {
                party_id: Number(partyId),
                party_name: currentParty.partyName,
                state_id: Number(selectedStateId),
                state_name: selectedState!.levelName,
                district_id: selectedDistrictId ? Number(selectedDistrictId) : null,
                district_name: selectedDistrict?.levelName || null,
                expires_at: expirationDate ? new Date(expirationDate).toISOString() : null,
            };

            const result = await createLink(linkData).unwrap();

            if (result.data?.registration_url) {
                setGeneratedLink(result.data.registration_url);
                toast.success("Registration link generated successfully!");
            } else {
                toast.error("Failed to generate registration link");
            }
        } catch (error: any) {
            const errorMessage = error?.data?.message || "Failed to generate registration link";
            toast.error(errorMessage);
        }
    };

    const copyToClipboard = async (link: string) => {
        try {
            await navigator.clipboard.writeText(link);
            setCopiedLink(link);
            toast.success("Link copied to clipboard!");

            // Reset copied state after 3 seconds
            setTimeout(() => {
                setCopiedLink("");
            }, 3000);
        } catch (error) {
            toast.error("Failed to copy link");
        }
    };

    const openInNewTab = (link: string) => {
        window.open(link, "_blank");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Link className="text-blue-600" />
                        Dynamic Registration Links
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Create custom registration links for {currentParty?.partyName || "your party"}
                        with pre-filled party and location information
                    </p>
                </div>

                {/* Link Generator Form */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Generate Registration Link
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Party Info - Read Only */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Party
                            </label>
                            <input
                                type="text"
                                value={currentParty?.partyName || ""}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Party is automatically set for this admin panel
                            </p>
                        </div>

                        {/* State Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                State *
                            </label>
                            {isLoadingStates ? (
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                                    <span className="text-gray-500">Loading states...</span>
                                </div>
                            ) : (
                                <select
                                    value={selectedStateId}
                                    onChange={(e) => setSelectedStateId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a state</option>
                                    {states.map((state) => (
                                        <option key={state.id} value={state.id}>
                                            {state.levelName}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* District Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                District (Optional)
                            </label>
                            {isLoadingStates ? (
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                                    <span className="text-gray-500">Loading districts...</span>
                                </div>
                            ) : (
                                <select
                                    value={selectedDistrictId}
                                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={!selectedStateId}
                                >
                                    <option value="">Select a district (optional)</option>
                                    {districts.map((district) => (
                                        <option key={district.id} value={district.id}>
                                            {district.levelName}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {!selectedStateId && (
                                <p className="text-gray-500 text-xs mt-1">
                                    Please select a state first
                                </p>
                            )}
                        </div>

                        {/* Expiration Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expiration Date & Time (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={expirationDate}
                                onChange={(e) => setExpirationDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min={new Date().toISOString().slice(0, 16)}
                                placeholder={defaultExpiration}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Leave empty for default 30-day expiration
                            </p>
                        </div>

                        {/* Generate Button */}
                        <div className="md:col-span-2">
                            <button
                                onClick={generateLink}
                                disabled={!selectedStateId || isCreating}
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {isCreating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Generating Link...
                                    </>
                                ) : (
                                    <>
                                        <Link className="w-5 h-5" />
                                        Generate Registration Link
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Generated Link Display */}
                {generatedLink && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Generated Registration Link
                        </h2>

                        {/* Link Preview */}
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                        Registration Link:
                                    </p>
                                    <p className="text-sm text-gray-600 break-all">
                                        {generatedLink}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copyToClipboard(generatedLink)}
                                        className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                                        title="Copy to clipboard"
                                    >
                                        {copiedLink === generatedLink ? (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => openInNewTab(generatedLink)}
                                        className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                                        title="Open in new tab"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Preview
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Link Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <h3 className="font-medium text-blue-900 mb-2">Link Details</h3>
                                <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">Party:</span> {currentParty?.partyName}</p>
                                    <p><span className="font-medium">State:</span> {selectedState?.levelName}</p>
                                    {selectedDistrict && (
                                        <p><span className="font-medium">District:</span> {selectedDistrict.levelName}</p>
                                    )}
                                    {expirationDate && (
                                        <p><span className="font-medium">Expires:</span> {new Date(expirationDate).toLocaleString()}</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                <h3 className="font-medium text-green-900 mb-2">What happens when users register?</h3>
                                <div className="space-y-1 text-sm text-green-800">
                                    <p>• Party and state will be pre-filled and disabled</p>
                                    {selectedDistrict ? (
                                        <p>• District will be pre-filled and disabled</p>
                                    ) : (
                                        <p>• Users can select any district within {selectedState?.levelName}</p>
                                    )}
                                    <p>• Users must fill in personal information (name, email, phone, password)</p>
                                    <p>• All form validations will apply</p>
                                    <p>• Registration will be completed automatically</p>
                                </div>
                            </div>
                        </div>

                        {/* Usage Instructions */}
                        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <h3 className="font-medium text-yellow-900 mb-2">How to use this link:</h3>
                            <div className="space-y-1 text-sm text-yellow-800">
                                <p>1. Copy the generated link using the "Copy" button</p>
                                <p>2. Share it via WhatsApp, email, SMS, or social media</p>
                                <p>3. Users clicking the link will see a registration form with:</p>
                                <p className="ml-4">• Pre-filled party and location information (disabled fields)</p>
                                <p className="ml-4">• Required personal information fields to complete</p>
                                <p>4. New registrations will be automatically assigned to your party and selected location</p>
                                <p>5. Users will receive confirmation and can login immediately after registration</p>
                                <p>6. This link is stored in your database and can be managed from the Registration Links Manager</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};