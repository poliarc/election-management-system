import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { VoterEditForm } from "./VoterListForm";
import { VoterListTable } from "./VoterListList";
import type { VoterList, VoterListCandidate } from "../../../types/voter";
import toast from "react-hot-toast";
import { useUpdateVoterMutation, useGetVotersByAssemblyPaginatedQuery } from "../../../store/api/votersApi";

const translations = {
    en: {
        title: "Voter List Management",
        subtitle: "Manage and update voter information",
        totalVoters: "total voters",
        searchVoters: "Search Voters",
        searchPlaceholder: "Search by name, mobile, EPIC, Aadhar, religion, caste, profession...",
        fatherHusbandName: "Father/Husband Name",
        fatherHusbandPlaceholder: "Enter relative name...",
        address: "Address",
        addressPlaceholder: "Enter address...",
        partFrom: "Part From",
        partFromPlaceholder: "From part no...",
        partTo: "Part To",
        partToPlaceholder: "To part no...",
        showFilters: "Show Filters",
        hideFilters: "Hide Filters",
        clearAll: "Clear All",
        noAssembly: "No assembly selected. Please select an assembly first.",
        loadingVoters: "Loading voters...",
        failedToLoad: "Failed to load voters. Please try again.",
        showing: "Showing page",
        of: "of",
        previous: "Previous",
        next: "Next",
        voterUpdated: "Voter updated successfully",
        updateFailed: "Failed to update voter"
    },
    hi: {
        title: "मतदाता सूची प्रबंधन",
        subtitle: "मतदाता जानकारी प्रबंधित और अपडेट करें",
        totalVoters: "कुल मतदाता",
        searchVoters: "मतदाता खोजें",
        searchPlaceholder: "नाम, मोबाइल, EPIC, आधार, धर्म, जाति, पेशे से खोजें...",
        fatherHusbandName: "पिता/पति का नाम",
        fatherHusbandPlaceholder: "संबंधी का नाम दर्ज करें...",
        address: "पता",
        addressPlaceholder: "पता दर्ज करें...",
        partFrom: "भाग से",
        partFromPlaceholder: "भाग संख्या से...",
        partTo: "भाग तक",
        partToPlaceholder: "भाग संख्या तक...",
        showFilters: "फ़िल्टर दिखाएं",
        hideFilters: "फ़िल्टर छुपाएं",
        clearAll: "सभी साफ़ करें",
        noAssembly: "कोई विधानसभा चयनित नहीं। कृपया पहले एक विधानसभा चुनें।",
        loadingVoters: "मतदाता लोड हो रहे हैं...",
        failedToLoad: "मतदाता लोड करने में विफल। कृपया पुनः प्रयास करें।",
        showing: "पृष्ठ दिखा रहा है",
        of: "का",
        previous: "पिछला",
        next: "अगला",
        voterUpdated: "मतदाता सफलतापूर्वक अपडेट किया गया",
        updateFailed: "मतदाता अपडेट करने में विफल"
    }
};

export default function VoterListPage() {
    const [selectedVoter, setSelectedVoter] = useState<VoterList | null>(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [language, setLanguage] = useState<"en" | "hi">("en");

    // Search/Filter states
    const [search, setSearch] = useState("");
    const [fatherName, setFatherName] = useState("");
    const [address, setAddress] = useState("");
    const [partFrom, setPartFrom] = useState<number | undefined>();
    const [partTo, setPartTo] = useState<number | undefined>();
    const [showFilters, setShowFilters] = useState(false);

    const t = translations[language];

    // Get assembly_id from Redux state
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

    const { data, isLoading, error } = useGetVotersByAssemblyPaginatedQuery(
        {
            assembly_id: assembly_id!,
            page,
            limit,
            search: search || undefined,
            fatherName: fatherName || undefined,
            address: address || undefined,
            partFrom,
            partTo
        },
        { skip: !assembly_id } // Skip query if no assembly_id
    );
    const [updateVoter] = useUpdateVoterMutation();

    const handleClearFilters = () => {
        setSearch("");
        setFatherName("");
        setAddress("");
        setPartFrom(undefined);
        setPartTo(undefined);
        setPage(1);
    };

    const handleEdit = (voter: VoterList) => {
        setSelectedVoter(voter);
    };

    const handleSave = async (updatedVoter: VoterListCandidate) => {
        try {
            if (selectedVoter?.id) {
                await updateVoter({ id: selectedVoter.id, ...updatedVoter }).unwrap();
                toast.success(t.voterUpdated);
                setSelectedVoter(null);
            }
        } catch (err) {
            toast.error(t.updateFailed);
        }
    };

    const handleCancel = () => {
        setSelectedVoter(null);
    };

    if (!assembly_id) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                    {t.noAssembly}
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-gray-600">{t.loadingVoters}</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {t.failedToLoad}
                </div>
            </div>
        );
    }

    const totalPages = data?.pagination?.totalPages || 1;
    const totalVoters = data?.pagination?.total || 0;

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
                    <p className="text-gray-600 mt-1">
                        {t.subtitle} • {totalVoters.toLocaleString()} {t.totalVoters}
                    </p>
                </div>
                <div className="relative inline-flex items-center bg-gray-200 rounded-full p-1">
                    <button
                        onClick={() => setLanguage("en")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${language === "en"
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => setLanguage("hi")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${language === "hi"
                            ? "bg-white text-indigo-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        हिंदी
                    </button>
                </div>
            </div>

            {selectedVoter ? (
                <VoterEditForm initialValues={selectedVoter} onSubmit={handleSave} onCancel={handleCancel} />
            ) : (
                <>
                    {/* Search and Filters */}
                    <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t.searchVoters}
                                </label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    placeholder={t.searchPlaceholder}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t.fatherHusbandName}
                                </label>
                                <input
                                    type="text"
                                    value={fatherName}
                                    onChange={(e) => { setFatherName(e.target.value); setPage(1); }}
                                    placeholder={t.fatherHusbandPlaceholder}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 bg-green-200 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer"
                            >
                                {showFilters ? t.hideFilters : t.showFilters}
                            </button>
                            {(search || fatherName || address || partFrom || partTo) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                >
                                    {t.clearAll}
                                </button>
                            )}
                        </div>

                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t.address}
                                    </label>
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => { setAddress(e.target.value); setPage(1); }}
                                        placeholder={t.addressPlaceholder}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t.partFrom}
                                    </label>
                                    <input
                                        type="number"
                                        value={partFrom || ""}
                                        onChange={(e) => { setPartFrom(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                        placeholder={t.partFromPlaceholder}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t.partTo}
                                    </label>
                                    <input
                                        type="number"
                                        value={partTo || ""}
                                        onChange={(e) => { setPartTo(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                        placeholder={t.partToPlaceholder}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <VoterListTable
                        voters={data?.data || []}
                        onEdit={handleEdit}
                        language={language}
                    />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                            <div className="text-sm text-gray-600">
                                {t.showing} {page} {t.of} {totalPages} • {totalVoters.toLocaleString()} {t.totalVoters}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                                >
                                    {t.previous}
                                </button>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                                >
                                    {t.next}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
