import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";
import { fetchHierarchyChildren } from "../../../services/hierarchyApi";

export default function AfterAssemblyLevelDashboard() {
    const { levelId } = useParams<{ levelId: string }>();
    const { levelAdminPanels } = useAppSelector((state) => state.auth);
    const [stats, setStats] = useState({
        totalDistricts: 0,
        totalAssemblies: 0,
        totalLevels: 0,
    });
    const [loading, setLoading] = useState(true);

    const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

    useEffect(() => {
        const loadStats = async () => {
            const metadata = currentPanel?.metadata;
            if (!metadata?.stateId) return;

            try {
                setLoading(true);
                const districtResponse = await fetchHierarchyChildren(metadata.stateId, {
                    page: 1,
                    limit: 1000
                });

                if (districtResponse.success && districtResponse.data?.children) {
                    const districts = districtResponse.data.children;
                    let totalAssemblies = 0;

                    for (const district of districts) {
                        const assemblyResponse = await fetchHierarchyChildren(district.location_id, {
                            page: 1,
                            limit: 1000
                        });
                        if (assemblyResponse.success && assemblyResponse.data?.children) {
                            totalAssemblies += assemblyResponse.data.children.length;
                        }
                    }

                    setStats({
                        totalDistricts: districts.length,
                        totalAssemblies,
                        totalLevels: 0, // Will be calculated from after-assembly data
                    });
                }
            } catch (error) {
                console.error("Failed to load stats:", error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, [currentPanel]);

    if (!currentPanel) {
        return (
            <div className="p-1">
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
                    <p className="text-red-700">Level admin panel not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-1 bg-gray-50 min-h-screen">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg shadow-lg p-6 text-white mb-1">
                <h1 className="text-3xl font-bold">{currentPanel.displayName} Dashboard</h1>
                <p className="text-purple-100 mt-2">
                    {currentPanel.metadata?.stateName} - {currentPanel.metadata?.partyName}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Total Districts</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {loading ? "..." : stats.totalDistricts}
                            </p>
                        </div>
                        <div className="bg-blue-100 rounded-full p-3">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Total Assemblies</p>
                            <p className="text-3xl font-bold text-indigo-600 mt-2">
                                {loading ? "..." : stats.totalAssemblies}
                            </p>
                        </div>
                        <div className="bg-indigo-100 rounded-full p-3">
                            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Sub Levels</p>
                            <p className="text-3xl font-bold text-purple-600 mt-2">
                                {loading ? "..." : stats.totalLevels}
                            </p>
                        </div>
                        <div className="bg-purple-100 rounded-full p-3">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-1 bg-white rounded-lg shadow-md p-3">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Panel Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Level Type</p>
                        <p className="text-lg font-semibold text-gray-900">{currentPanel.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">State</p>
                        <p className="text-lg font-semibold text-gray-900">{currentPanel.metadata?.stateName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Party</p>
                        <p className="text-lg font-semibold text-gray-900">{currentPanel.metadata?.partyName}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Parent Level</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {currentPanel.metadata?.parentLevelName || "None"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
