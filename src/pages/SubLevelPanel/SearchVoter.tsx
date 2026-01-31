import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchVotersByAfterAssembly } from "../../services/partNoAssignmentApi";
import { fetchVotersByBoothLevel } from "../../services/boothApi";
import { VoterEditForm } from "../Assembly/voters/VoterListForm";
import { VoterListTable } from "../Assembly/voters/VoterListList";
import type { VoterList } from "../../types/voter";
import toast from "react-hot-toast";
import { useUpdateVoterMutation } from "../../store/api/votersApi";
import { useAppSelector } from "../../store/hooks";

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
    const { selectedAssignment } = useAppSelector((state) => state.auth);
    const [selectedVoter, setSelectedVoter] = useState<VoterList | null>(null);
    const [page, setPage] = useState(1);
    const [limit] = useState(25);
    const [language, setLanguage] = useState<"en" | "hi">("en");

    // Search/Filter states
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [gender, setGender] = useState("");
    const [ageFrom, setAgeFrom] = useState<number | undefined>();
    const [ageTo, setAgeTo] = useState<number | undefined>();
    const [showFilters, setShowFilters] = useState(false);

    const t = translations[language];

    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const [updateVoter] = useUpdateVoterMutation();

    // Check if current level is Booth type
    const isBooth = selectedAssignment?.levelType === "Booth" || selectedAssignment?.partyLevelName === "Booth";
    const boothLevelId = selectedAssignment?.level_id;

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on search change
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (!levelId) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                let result;

                // Use booth-level API if it's a booth, otherwise use after-assembly API
                if (isBooth && boothLevelId) {
                    const apiParams = {
                        page,
                        limit,
                        search: debouncedSearch || undefined,
                        gender: gender || undefined,
                        ageFrom,
                        ageTo
                    };
                    console.log('🔍 Fetching booth voters with params:', apiParams);
                    console.log('📊 Gender filter value:', gender, 'Type:', typeof gender);

                    result = await fetchVotersByBoothLevel(boothLevelId, apiParams);

                    console.log('✅ Booth voters result:', {
                        total: result?.pagination?.total,
                        returned: result?.data?.length,
                        hasGenderFilter: !!gender,
                        genderValue: gender
                    });
                } else {
                    result = await fetchVotersByAfterAssembly(Number(levelId), {
                        page,
                        limit,
                        search: debouncedSearch || undefined,
                        gender: gender || undefined,
                        ageFrom,
                        ageTo
                    });
                }

                setData(result);
            } catch (err) {
                console.error('Error fetching voters:', err);
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [levelId, page, limit, debouncedSearch, gender, ageFrom, ageTo, isBooth, boothLevelId]);

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

    const totalPages = data?.pagination?.totalPages || 1;
    const totalVoters = data?.pagination?.total || 0;
    const partNoRanges = data?.partNoRanges || [];
    const boothRange = data?.boothRange;

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
                    <p className="text-gray-600 mt-1">
                        {t.subtitle} • {totalVoters.toLocaleString()} {t.totalVoters}
                    </p>
                    {isBooth && boothRange && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-sm text-gray-600">Booth Range:</span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                Booth {boothRange.boothFrom} - {boothRange.boothTo}
                            </span>
                        </div>
                    )}
                    {!isBooth && partNoRanges.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-sm text-gray-600">{t.assignedRanges}:</span>
                            {partNoRanges.map((range: { part_no_from: string; part_no_to: string }, idx: number) => (
                                <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                    {range.part_no_from} - {range.part_no_to}
                                </span>
                            ))}
                        </div>
                    )}
                    {/* Active Filters Indicator */}
                    {(debouncedSearch || gender || ageFrom || ageTo) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-sm text-gray-600">Active Filters:</span>
                            {debouncedSearch && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Search: {debouncedSearch}
                                </span>
                            )}
                            {gender && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Gender: {gender === 'M' ? 'Male' : 'Female'}
                                </span>
                            )}
                            {(ageFrom || ageTo) && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    Age: {ageFrom || '0'} - {ageTo || '∞'}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="relative inline-flex items-center bg-gray-200 rounded-full p-1">
                    <button
                        onClick={() => setLanguage("en")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${language === "en"
                            ? "bg-white text-teal-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        English
                    </button>
                    <button
                        onClick={() => setLanguage("hi")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${language === "hi"
                            ? "bg-white text-teal-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        Regional
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
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t.searchPlaceholder}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="bg-white p-12 rounded-lg border border-gray-200 flex items-center justify-center">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                                <div className="text-gray-600">{t.loadingVoters}</div>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {t.failedToLoad}
                        </div>
                    ) : (
                        <VoterListTable
                            voters={data?.data || []}
                            onEdit={handleEdit}
                            language={language}
                        />
                    )}

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
                                    className="px-4 py-2 bg-teal-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-teal-700 transition"
                                >
                                    {t.previous}
                                </button>
                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 bg-teal-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-teal-700 transition"
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
