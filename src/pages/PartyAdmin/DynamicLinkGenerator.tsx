import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Link, Copy, CheckCircle, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { useGetPartiesQuery } from "../../store/api/partyUserApi";
import { useGetAllStateMasterDataQuery } from "../../store/api/stateMasterApi";
import { useCreateRegistrationLinkMutation } from "../../store/api/registrationLinksApi";
import { useTranslation } from "react-i18next";

export const DynamicLinkGenerator: React.FC = () => {
    const {t} = useTranslation();
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
                    <h1 className="text-3xl font-bold text-[var(--text-color)] flex items-center gap-3">
                        <Link className="text-blue-600" />
                        {t("DynamicLinkGenerator.Title")}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2">
                        {t("DynamicLinkGenerator.Desc")} {currentParty?.partyName || "your party"}
                        {t("DynamicLinkGenerator.Desc1")}
                    </p>
                </div>

                {/* Link Generator Form */}
                <div className="bg-[var(--bg-card)] rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">
                        {t("DynamicLinkGenerator.Desc2")}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Party Info - Read Only */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t("DynamicLinkGenerator.Party")}
                            </label>
                            <input
                                type="text"
                                value={currentParty?.partyName || ""}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-[var(--text-secondary)] cursor-not-allowed"
                            />
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                {t("DynamicLinkGenerator.Desc3")}
                            </p>
                        </div>

                        {/* State Selection */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t("DynamicLinkGenerator.State")}
                            </label>
                            {isLoadingStates ? (
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[var(--bg-main)]">
                                    <span className="text-[var(--text-secondary)]">{t("DynamicLinkGenerator.Loading")}</span>
                                </div>
                            ) : (
                                <select
                                    value={selectedStateId}
                                    onChange={(e) => setSelectedStateId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">{t("DynamicLinkGenerator.Select_State")}</option>
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
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t("DynamicLinkGenerator.District_Optional")}
                            </label>
                            {isLoadingStates ? (
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-[var(--bg-main)]">
                                    <span className="text-[var(--text-secondary)]">{t("DynamicLinkGenerator.Loading1")}</span>
                                </div>
                            ) : (
                                <select
                                    value={selectedDistrictId}
                                    onChange={(e) => setSelectedDistrictId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={!selectedStateId}
                                >
                                    <option value="">{t("DynamicLinkGenerator.Select_district")}</option>
                                    {districts.map((district) => (
                                        <option key={district.id} value={district.id}>
                                            {district.levelName}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {!selectedStateId && (
                                <p className="text-[var(--text-secondary)] text-xs mt-1">
                                    {t("DynamicLinkGenerator.Desc4")}
                                </p>
                            )}
                        </div>

                        {/* Expiration Date */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t("DynamicLinkGenerator.Desc5")}
                            </label>
                            <input
                                type="datetime-local"
                                value={expirationDate}
                                onChange={(e) => setExpirationDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min={new Date().toISOString().slice(0, 16)}
                                placeholder={defaultExpiration}
                            />
                            <p className="text-xs text-[var(--text-secondary)] mt-1">
                                {t("DynamicLinkGenerator.Desc6")}
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
                                        {t("DynamicLinkGenerator.Generating")}
                                    </>
                                ) : (
                                    <>
                                        <Link className="w-5 h-5" />
                                        {t("DynamicLinkGenerator.Generate_Registration")}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Generated Link Display */}
                {generatedLink && (
                    <div className="bg-[var(--bg-card)] rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-[var(--text-color)] mb-4">
                            {t("DynamicLinkGenerator.Generated_Registration")}
                        </h2>

                        {/* Link Preview */}
                        <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-md p-4 mb-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        {t("DynamicLinkGenerator.Registration")}
                                    </p>
                                    <p className="text-sm text-[var(--text-secondary)] break-all">
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
                                                {t("DynamicLinkGenerator.Copied")}
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                {t("DynamicLinkGenerator.Copy")}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => openInNewTab(generatedLink)}
                                        className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                                        title="Open in new tab"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        {t("DynamicLinkGenerator.Preview")}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Link Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <h3 className="font-medium text-blue-900 mb-2">{t("DynamicLinkGenerator.Link_Details")}</h3>
                                <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">{t("DynamicLinkGenerator.Party:")}</span> {currentParty?.partyName}</p>
                                    <p><span className="font-medium">{t("DynamicLinkGenerator.State:")}</span> {selectedState?.levelName}</p>
                                    {selectedDistrict && (
                                        <p><span className="font-medium">{t("DynamicLinkGenerator.District:")}</span> {selectedDistrict.levelName}</p>
                                    )}
                                    {expirationDate && (
                                        <p><span className="font-medium">{t("DynamicLinkGenerator.Expires:")}</span> {new Date(expirationDate).toLocaleString()}</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                <h3 className="font-medium text-green-900 mb-2">{t("DynamicLinkGenerator.Desc7")}</h3>
                                <div className="space-y-1 text-sm text-green-800">
                                    <p>• {t("DynamicLinkGenerator.Desc8")}</p>
                                    {selectedDistrict ? (
                                        <p>• {t("DynamicLinkGenerator.Desc9")}</p>
                                    ) : (
                                        <p>• {t("DynamicLinkGenerator.Desc10")} {selectedState?.levelName}</p>
                                    )}
                                    <p>• {t("DynamicLinkGenerator.Desc11")}</p>
                                    <p>• {t("DynamicLinkGenerator.Desc12")}</p>
                                    <p>• {t("DynamicLinkGenerator.Desc13")}</p>
                                </div>
                            </div>
                        </div>

                        {/* Usage Instructions */}
                        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <h3 className="font-medium text-yellow-900 mb-2">{t("DynamicLinkGenerator.Desc14")}</h3>
                            <div className="space-y-1 text-sm text-yellow-800">
                                <p>{t("DynamicLinkGenerator.Desc15")}</p>
                                <p>{t("DynamicLinkGenerator.Desc16")}</p>
                                <p>{t("DynamicLinkGenerator.Desc17")}</p>
                                <p className="ml-4">• {t("DynamicLinkGenerator.Desc18")}</p>
                                <p className="ml-4">• {t("DynamicLinkGenerator.Desc19")}</p>
                                <p>{t("DynamicLinkGenerator.Desc20")}</p>
                                <p>{t("DynamicLinkGenerator.Desc21")}</p>
                                <p>{t("DynamicLinkGenerator.Desc22")}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
