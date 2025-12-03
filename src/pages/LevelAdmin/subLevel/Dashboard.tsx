import { useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/hooks";

export default function SubLevelDashboard() {
    const { levelId } = useParams<{ levelId: string }>();
    const { levelAdminPanels } = useAppSelector((state) => state.auth);

    const currentPanel = levelAdminPanels.find((p) => p.id === Number(levelId));

    if (!currentPanel) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
                    <p className="text-red-700">Level admin panel not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-1 bg-gray-50 min-h-screen">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg shadow-lg p-3 text-white mb-1">
                <h1 className="text-3xl font-bold">{currentPanel.displayName} Dashboard</h1>
                <p className="text-teal-100 mt-2">
                    {currentPanel.metadata?.stateName} - {currentPanel.metadata?.partyName}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Total Levels</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
                        </div>
                        <div className="bg-teal-100 rounded-full p-3">
                            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Total Users</p>
                            <p className="text-3xl font-bold text-cyan-600 mt-2">0</p>
                        </div>
                        <div className="bg-cyan-100 rounded-full p-3">
                            <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Active Levels</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">0</p>
                        </div>
                        <div className="bg-green-100 rounded-full p-3">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6\1 bg-white rounded-lg shadow-md p-6">
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
