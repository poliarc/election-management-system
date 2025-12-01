import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchVotersByAfterAssembly } from "../../services/partNoAssignmentApi";
import { VoterEditForm } from "../Assembly/voters/VoterListForm";
import { VoterListTable } from "../Assembly/voters/VoterListList";
import type { VoterList } from "../../types/voter";
import toast from "react-hot-toast";
import { useUpdateVoterMutation } from "../../store/api/votersApi";

const translations = {
    en: {
        title: "Search Voters",
        subtitle: "Search and manage voters in your assigned part numbers",
        totalVoters: "total voters",
        searchVoters: "Search Voters",
        searchPlaceholder: "Search by name, EPIC number...",
        gender: "Gender",
        selectGender: "Select Gender",
        male: "Male",
        female: "Female",
        ageFrom: "Age From",
        ageTo: "Age To",
        showFilters: "Show Filters",
        hideFilters: "Hide Filters",
        clearAll: "Clear All",
        noLevel: "No level selected. Please select a level first.",
        loadingVoters: "Loading voters...",
        failedToLoad: "Failed to load voters. Please try again.",
        showing: "Showing page",
        of: "of",
        previous: "Previous",
        next: "Next",
        voterUpdated: "Voter updated successfully",
        updateFailed: "Failed to update voter",
        assignedRanges: "Assigned Part No Ranges"
    },
    hi: {
        title: "मतदाता खोजें",
        subtitle: "अपने निर्धारित भाग संख्याओं में मतदाताओं को खोजें और प्रबंधित करें",
        totalVoters: "कुल मतदाता",
        searchVoters: "मतदाता खोजें",
        searchPlaceholder: "नाम, EPIC नंबर से खोजें...",
        gender: "लिंग",
        selectGender: "लिंग चुनें",
        male: "पुरुष",
        female: "महिला",
        ageFrom: "उम्र से",
        ageTo: "उम्र तक",
        showFilters: "फ़िल्टर दिखाएं",
        hideFilters: "फ़िल्टर छुपाएं",
        clearAll: "सभी साफ़ करें",
        noLevel: "कोई स्तर चयनित नहीं। कृपया पहले एक स्तर चुनें।",
        loadingVoters: "मतदाता लोड हो रहे हैं...",
        failedToLoad: "मतदाता लोड करने में विफल। कृपया पुनः प्रयास करें।",
        showing: "पृष्ठ दिखा रहा है",
        of: "का",
        previous: "पिछला",
        next: "अगला",
        voterUpdated: "मतदाता सफलतापूर्वक अपडेट किया गया",
        updateFailed: "मतदाता अपडेट करने में विफल",
        assignedRanges: "निर्धारित भाग संख्या श्रेणियां"
    }
};

export default function SearchVoter() {
    const { levelId } = useParams<{ levelId: string }>();
    const [selectedVoter, setSelectedVoter] = useState<VoterList | null>(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [language, setLanguage] = useState<"en" | "hi">("en");

    // Search/Filter states
    const [search, setSearch] = useState("");
    const [gender, setGender] = useState("");
    const [ageFrom, setAgeFrom] = useState<number | undefined>();
    const [ageTo, setAgeTo] = useState<number | undefined>();
    const [showFilters, setShowFilters] = useState(false);

    const t = translations[language];

    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const [updateVoter] = useUpdateVoterMutation();

    useEffect(() => {
        if (!levelId) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await fetchVotersByAfterAssembly(Number(levelId), {
                    page,
                    limit,
                    search: search || undefined,
                    gender: gender || undefined,
                    ageFrom,
                    ageTo
                });
                setData(result);
            } catch (err) {
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [levelId, page, limit, search, gender, ageFrom, ageTo]);

    const handleClearFilters = () => {
        setSearch("");
        setGender("");
        setAgeFrom(undefined);
        setAgeTo(undefined);
        setPage(1);
    };

    const handleEdit = (voter: any) => {
        setSelectedVoter(voter as VoterList);
    };

    const handleSave = async (updatedVoter: any) => {
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

    if (!levelId) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                    {t.noLevel}
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
    const partNoRanges = data?.partNoRanges || [];

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
                    <p className="text-gray-600 mt-1">
                        {t.subtitle} • {totalVoters.toLocaleString()} {t.totalVoters}
                    </p>
                    {partNoRanges.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-sm text-gray-600">{t.assignedRanges}:</span>
                            {partNoRanges.map((range: { part_no_from: string; part_no_to: string }, idx: number) => (
                                <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {range.part_no_from} - {range.part_no_to}
                                </span>
                            ))}
                        </div>
                    )}
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
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                            >
                                {showFilters ? t.hideFilters : t.showFilters}
                            </button>
                            {(search || gender || ageFrom || ageTo) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                >
                                    {t.clearAll}
                                </button>
                            )}
                        </div>

                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t.gender}
                                    </label>
                                    <select
                                        value={gender}
                                        onChange={(e) => { setGender(e.target.value); setPage(1); }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">{t.selectGender}</option>
                                        <option value="M">{t.male}</option>
                                        <option value="F">{t.female}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t.ageFrom}
                                    </label>
                                    <input
                                        type="number"
                                        value={ageFrom || ""}
                                        onChange={(e) => { setAgeFrom(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                        placeholder="18"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t.ageTo}
                                    </label>
                                    <input
                                        type="number"
                                        value={ageTo || ""}
                                        onChange={(e) => { setAgeTo(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
                                        placeholder="100"
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
