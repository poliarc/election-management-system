import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../store";
import { VoterEditForm } from "./VoterListForm";
import { VoterListTable } from "./VoterListList";
import type { VoterList, VoterListCandidate } from "../../../types/voter";
import toast from "react-hot-toast";
import { useUpdateVoterMutation, useGetVotersByAssemblyPaginatedQuery } from "../../../store/api/votersApi";
import { useDebounce } from "../../../hooks/useDebounce";
import { useTranslation } from "react-i18next";

export default function VoterListPage() {
    const { t } = useTranslation();
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
    const debouncedSearch = useDebounce(search, 500)

    // Get assembly_id from Redux state
    const selectedAssignment = useSelector(
        (state: RootState) => state.auth.selectedAssignment
    );
    const assembly_id = selectedAssignment?.stateMasterData_id;

        const { data, isLoading, isFetching, refetch, error } = useGetVotersByAssemblyPaginatedQuery(
            {
                assembly_id: assembly_id!,
                page,
                limit,
                search: debouncedSearch || undefined,
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
                toast.success(language === "en" ? t("voterListPage.toastVoterUpdated") : "मतदाता सफलतापूर्वक अपडेट किया गया");
                setSelectedVoter(null);
            }
        } catch (err) {
            toast.error(language === "en" ? t("voterListPage.toastUpdateFailed") : "मतदाता अपडेट करने में विफल");
        }
    };

    const handleCancel = () => {
        setSelectedVoter(null);
    };

    if (!assembly_id) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                    {language === "en" ? t("voterListPage.noAssemblySelected") : "कोई विधानसभा चयनित नहीं। कृपया पहले एक विधानसभा चुनें।"}
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-[var(--text-secondary)]">
                    {language === "en" ? t("voterListPage.loadingVoters") : "मतदाता लोड हो रहे हैं..."}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {language === "en" ? t("voterListPage.failedToLoadVoters") : "मतदाता लोड करने में विफल। कृपया पुनः प्रयास करें।"}
                </div>
            </div>
        );
    }

    const totalPages = data?.pagination?.totalPages || 1;
    const totalVoters = data?.pagination?.total || 0;

    return (
        <div className="p-1">
            <div className="mb-1 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-color)]">
                        {language === "en" ? t("voterListPage.title") : "मतदाता सूची प्रबंधन"}
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        {(language === "en" ? t("voterListPage.subtitle") : "मतदाता जानकारी प्रबंधित और अपडेट करें")} •{" "}
                        {totalVoters.toLocaleString()}{" "}
                        {language === "en" ? t("voterListPage.totalVoters") : "कुल मतदाता"}
                    </p>
                </div>
                <div className="relative inline-flex items-center bg-[var(--bg-color)] rounded-full p-1">
                    <button
                        onClick={() => setLanguage("en")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${language === "en"
                            ? "bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-color)]"
                            }`}
                    >
                        {t("voterListPage.btnEnglish")}
                    </button>
                    <button
                        onClick={() => setLanguage("hi")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${language === "hi"
                            ? "bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-color)]"
                            }`}
                    >
                        {t("voterListPage.btnRegional")}
                    </button>
                </div>
            </div>

            {selectedVoter ? (
                <VoterEditForm initialValues={selectedVoter} onSubmit={handleSave} onCancel={handleCancel} language={language} />
            ) : (
                <>
                    {/* Search and Filters */}
                    <div className="mb-1 bg-[var(--bg-card)] p-1 rounded-lg border border-[var(--border-color)]">
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    {language === "en" ? t("voterListPage.lblSearchVoters") : "मतदाता खोजें"}
                                </label>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    placeholder={language === "en" ? t("voterListPage.phSearchVoters") : "नाम, मोबाइल, EPIC, आधार, धर्म, जाति, पेशे से खोजें..."}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    {language === "en" ? t("voterListPage.lblFatherHusbandName") : "पिता/पति का नाम"}
                                </label>
                                <input
                                    type="text"
                                    value={fatherName}
                                    onChange={(e) => { setFatherName(e.target.value); setPage(1); }}
                                    placeholder={language === "en" ? t("voterListPage.phFatherHusbandName") : "संबंधी का नाम दर्ज करें..."}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    if(isFetching) return
                                    refetch()
                                }}
                                disabled={isLoading || isFetching}
                                className="px-4 py-2 bg-green-200 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer"
                            >
                               {isFetching ? (
                                <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                               ) : t.search}
                            </button>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 bg-green-200 text-[var(--text-secondary)] rounded-lg hover:bg-green-300 hover:text-black transition cursor-pointer"
                            >
                                {showFilters
                                    ? (language === "en" ? t("voterListPage.btnHideFilters") : "फ़िल्टर छुपाएं")
                                    : (language === "en" ? t("voterListPage.btnShowFilters") : "फ़िल्टर दिखाएं")}
                            </button>
                            {(search || fatherName || address || partFrom || partTo) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                >
                                    {language === "en" ? t("voterListPage.btnClearAll") : "सभी साफ़ करें"}
                                </button>
                            )}
                        </div>

                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[var(--border-color)]">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        {language === "en" ? t("voterListPage.lblAddress") : "पता"}
                                    </label>
                                    <input
                                        type="text"
                                        value={address}
                                        onChange={(e) => { setAddress(e.target.value); setPage(1); }}
                                        placeholder={language === "en" ? t("voterListPage.phAddress") : "पता दर्ज करें..."}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        {language === "en" ? t("voterListPage.lblPartFrom") : "भाग से"}
                                    </label>
                                    <input
                                        type="number"
                                        value={partFrom || ""}
                                        onChange={(e) => { setPartFrom(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                        placeholder={language === "en" ? t("voterListPage.phPartFrom") : "भाग संख्या से..."}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        {language === "en" ? t("voterListPage.lblPartTo") : "भाग तक"}
                                    </label>
                                    <input
                                        type="number"
                                        value={partTo || ""}
                                        onChange={(e) => { setPartTo(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                        placeholder={language === "en" ? t("voterListPage.phPartTo") : "भाग संख्या तक..."}
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
                        <div className="mt-6 flex items-center justify-between bg-[var(--bg-card)] p-4 rounded-lg border border-[var(--border-color)]">
                            <div className="text-sm text-[var(--text-secondary)]">
                                {(language === "en" ? t("voterListPage.showingPage") : "पृष्ठ दिखा रहा है")} {page}{" "}
                                {(language === "en" ? t("voterListPage.of") : "का")} {totalPages} •{" "}
                                {totalVoters.toLocaleString()}{" "}
                                {language === "en" ? t("voterListPage.totalVoters") : "कुल मतदाता"}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                                >
                                    {language === "en" ? t("voterListPage.btnPrevious") : "पिछला"}
                                </button>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                                >
                                    {language === "en" ? t("voterListPage.btnNext") : "अगला"}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}


