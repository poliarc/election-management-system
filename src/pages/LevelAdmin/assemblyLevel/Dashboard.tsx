import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import { fetchLevelAdminDashboard } from "../../../services/levelAdminApi";
import { useTranslation } from "react-i18next";

export default function AssemblyLevelDashboard() {
    const { t } = useTranslation();
    const { levelId } = useParams<{ levelId: string }>();
    const { levelAdminPanels } = useAppSelector((state) => state.auth);
    const [dashData, setDashData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

    useEffect(() => {
        if (!currentPanel?.id) return;
        setLoading(true);
        fetchLevelAdminDashboard(currentPanel.id)
            .then((res) => { if (res.success) setDashData(res.data); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [currentPanel?.id]);

    if (!currentPanel) {
        return (
            <div className="p-1">
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
                    <p className="text-red-700">{t("AssemblyLevelDashboard.Desc")}</p>
                </div>
            </div>
        );
    }

    const stats = dashData?.overallStats;
    const counts = dashData?.hierarchyCounts;
    const levelInfo = dashData?.levelInfo;

    const totalDistricts = counts?.total_districts ?? 0;
    const totalAssemblies = counts?.total_assemblies ?? 0;
    const totalUsers = stats?.total_users ?? 0;

    return (
        <div className="p-1 bg-[var(--bg-main)] min-h-screen">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-3 sm:p-3 text-white mb-1">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="shrink-0">
                        <h1 className="text-xl sm:text-2xl font-bold">{currentPanel.displayName} {t("AssemblyLevelDashboard.Dashboard")}</h1>
                        <p className="text-indigo-100 mt-1 text-xs sm:text-sm">
                            {levelInfo?.state_name || currentPanel.metadata?.stateName} - {levelInfo?.partyName || currentPanel.metadata?.partyName}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                        <div className="bg-[var(--bg-card)] text-[var(--text-color)] rounded-md shadow-md p-4 flex items-center justify-between">
                            <div>
                                <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-medium">{t("AssemblyLevelDashboard.Total_Districts") || "Total Districts"}</p>
                                <p className="text-xl sm:text-2xl font-semibold mt-1">{loading ? "..." : totalDistricts}</p>
                            </div>
                            <div className="bg-blue-50 rounded-full p-2">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="bg-[var(--bg-card)] text-[var(--text-color)] rounded-md shadow-md p-3 flex items-center justify-between">
                            <div>
                                <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-medium">{t("AssemblyLevelDashboard.Total_Assemblies") || "Total Assemblies"}</p>
                                <p className="text-xl sm:text-2xl font-semibold text-indigo-600 mt-1">{loading ? "..." : totalAssemblies}</p>
                            </div>
                            <div className="bg-indigo-50 rounded-full p-2">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                        <div className="bg-[var(--bg-card)] text-[var(--text-color)] rounded-md shadow-md p-4 flex items-center justify-between">
                            <div>
                                <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-medium">{t("AssemblyLevelDashboard.Total_Users") || "Total Users"}</p>
                                <p className="text-xl sm:text-2xl font-semibold text-green-600 mt-1">{loading ? "..." : totalUsers}</p>
                            </div>
                            <div className="bg-green-50 rounded-full p-2">
                                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-1 bg-[var(--bg-card)] rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-[var(--text-color)] mb-4">{t("AssemblyLevelDashboard.Panel_Information")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-[var(--text-secondary)]">{t("AssemblyLevelDashboard.Level_Type")}</p>
                        <p className="text-lg font-semibold text-[var(--text-color)]">{levelInfo?.display_level_name || currentPanel.metadata?.stateLevelType}</p>
                    </div>
                    <div>
                        <p className="text-sm text-[var(--text-secondary)]">{levelInfo?.state_level_type || t("AssemblyLevelDashboard.State")}</p>
                        <p className="text-lg font-semibold text-[var(--text-color)]">{levelInfo?.state_name || currentPanel.metadata?.stateName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-[var(--text-secondary)]">{t("AssemblyLevelDashboard.Party")}</p>
                        <p className="text-lg font-semibold text-[var(--text-color)]">{levelInfo?.partyName || currentPanel.metadata?.partyName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-[var(--text-secondary)]">{t("AssemblyLevelDashboard.Parent_Level")}</p>
                        <p className="text-lg font-semibold text-[var(--text-color)]">
                            {levelInfo?.parent_display_level_name || currentPanel.metadata?.parentLevelName || t("AssemblyLevelDashboard.None")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}



