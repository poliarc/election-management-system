import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Users, Network, LayoutDashboard, TrendingUp, MapPin, ChevronRight } from "lucide-react";
import { useAppSelector } from "../../store/hooks";
import { useGetPartyWiseLevelsByPartyQuery } from "../../store/api/partyWiseLevelApi";
import { useGetUsersByPartyQuery } from "../../store/api/partyUserApi";
import { useGetAllStateMasterDataQuery } from "../../store/api/stateMasterApi";
import { useTranslation } from "react-i18next";

export const PartyAdminDashboard: React.FC = () => {
    const {t} = useTranslation();
    const { partyId } = useParams<{ partyId: string }>();
    const navigate = useNavigate();
    const { partyAdminPanels } = useAppSelector((state) => state.auth);

    const currentParty = partyAdminPanels?.find(
        (panel) => panel.id === Number(partyId)
    );

    const { data: levels = [], isLoading } = useGetPartyWiseLevelsByPartyQuery(
        Number(partyId),
        { skip: !partyId }
    );

    const { data: usersResponse } = useGetUsersByPartyQuery(
        {
            partyId: Number(partyId),
            params: { page: 1, limit: 1 },
        },
        { skip: !partyId }
    );

    const { data: stateMasterData = [] } = useGetAllStateMasterDataQuery();

    const activeLevels = levels.filter((level) => level.isActive === 1);
    const totalUsers = usersResponse?.pagination?.total || 0;

    const states = stateMasterData.filter(
        (item) => item.levelType === "State" && item.isActive === 1
    );

    // Group levels by state
    const levelsByState = React.useMemo(() => {
        const grouped = new Map<number, typeof levels>();
        levels.forEach((level) => {
            if (!grouped.has(level.state_id)) {
                grouped.set(level.state_id, []);
            }
            grouped.get(level.state_id)!.push(level);
        });
        return grouped;
    }, [levels]);

    const handleStateClick = (stateId: number) => {
        navigate(`/partyadmin/${partyId}/levels/${stateId}`);
    };

    return (
        <div className="p-1 bg-[var(--bg-main)] min-h-screen">
            {/* Header */}
            <div className="mb-1">
                <h1 className="text-3xl font-bold text-[var(--text-color)]">
                    {currentParty?.displayName || "Party Admin"} {t("PartyAdminDashboard.Title")}
                </h1>
                <p className="text-[var(--text-secondary)] mt-2">
                    {t("PartyAdminDashboard.Desc")}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-1">
                <div className="bg-[var(--bg-card)] rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[var(--text-secondary)]">{t("PartyAdminDashboard.Total_Levels")}</p>
                            <p className="text-3xl font-bold text-[var(--text-color)] mt-2">
                                {isLoading ? "..." : levels.length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Network className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[var(--text-secondary)]">{t("PartyAdminDashboard.Active_Levels")}</p>
                            <p className="text-3xl font-bold text-[var(--text-color)] mt-2">
                                {isLoading ? "..." : activeLevels.length}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[var(--text-secondary)]">{t("PartyAdminDashboard.Total_Users")}</p>
                            <p className="text-3xl font-bold text-[var(--text-color)] mt-2">{totalUsers}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[var(--text-secondary)]">{t("PartyAdminDashboard.Party_Code")}</p>
                            <p className="text-2xl font-bold text-[var(--text-color)] mt-2">
                                {currentParty?.metadata?.partyCode || "N/A"}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <LayoutDashboard className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* States Overview */}
            <div className="bg-[var(--bg-card)] rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold text-[var(--text-color)] mb-4">
                    {t("PartyAdminDashboard.States_Overview")}
                </h2>
                {isLoading ? (
                    <p className="text-[var(--text-secondary)]">{t("PartyAdminDashboard.Loading")}</p>
                ) : states.length === 0 ? (
                    <p className="text-[var(--text-secondary)]">{t("PartyAdminDashboard.Loading_1")}</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {states.map((state) => {
                            const stateLevels = levelsByState.get(state.id) || [];
                            const activeStateLevels = stateLevels.filter(l => l.isActive === 1);

                            return (
                                <button
                                    key={state.id}
                                    onClick={() => handleStateClick(state.id)}
                                    className="p-4 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-color)]/5 hover:border-blue-300 transition-all text-left group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                                <MapPin className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-[var(--text-color)] group-hover:text-blue-600 transition-colors">
                                                    {state.levelName}
                                                </p>
                                                <p className="text-sm text-[var(--text-secondary)] mt-1">
                                                    {stateLevels.length} {t("PartyAdminDashboard.level")}{stateLevels.length !== 1 ? 's' : ''}
                                                    {stateLevels.length > 0 && (
                                                        <> • {activeStateLevels.length} {t("PartyAdminDashboard.active")}</>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-blue-600 transition-colors" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Recent Levels */}
            <div className="bg-[var(--bg-card)] rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-[var(--text-color)] mb-4">
                    {t("PartyAdminDashboard.Desc1")}
                </h2>
                {isLoading ? (
                    <p className="text-[var(--text-secondary)]">{t("PartyAdminDashboard.Loading")}</p>
                ) : levels.length === 0 ? (
                    <p className="text-[var(--text-secondary)]">
                        {t("PartyAdminDashboard.Desc2")}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {levels.slice(0, 5).map((level) => (
                            <div
                                key={level.party_wise_id}
                                className="flex items-center justify-between p-4 border border-[var(--border-color)] rounded-lg hover:bg-[var(--text-color)]/2"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Network className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[var(--text-color)]">
                                            {level.display_level_name}
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {level.state_name}
                                            {level.parent_level_name &&
                                                ` • Parent: ${level.parent_level_name}`}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${level.isActive === 1
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-[var(--text-color)]"
                                        }`}
                                >
                                    {level.isActive === 1 ? "Active" : "Inactive"}
                                </span>
                            </div>
                        ))}
                        {levels.length > 5 && (
                            <button
                                onClick={() => navigate(`/partyadmin/${partyId}/levels`)}
                                className="w-full py-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                            >
                                {t("PartyAdminDashboard.View_all")} {levels.length} {t("PartyAdminDashboard.level")} →
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};




