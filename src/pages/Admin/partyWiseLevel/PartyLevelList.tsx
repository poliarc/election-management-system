import React, { useState, useEffect } from "react";
import { Plus, Eye, Search, Calendar } from "lucide-react";
import type { PartyLevelConfig } from "../../../types/partyLevel";

interface PartyLevelListProps {
  onAdd: () => void;
  onView: (config: PartyLevelConfig) => void;
}

const PartyLevelList: React.FC<PartyLevelListProps> = ({ onAdd, onView }) => {
  const [configurations, setConfigurations] = useState<PartyLevelConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfigurations = () => {
      try {
        const stored = localStorage.getItem("partyLevelConfigurations");
        if (stored) {
          const configs = JSON.parse(stored);
          setConfigurations(configs);
        }
      } catch (error) {
        console.error("Error loading configurations:", error);
      } finally {
        setLoading(false);
      }
    };

    loadConfigurations();
  }, []);

  const filteredConfigurations = configurations.filter(
    (config) =>
      config.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.stateName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 bg-white dark:bg-gray-900 p-6 rounded-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white dark:from-blue-700 dark:to-indigo-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Party Wise Level Master</h1>
            <p className="text-blue-100 mt-1">
              Manage organizational hierarchy for parties across states
            </p>
          </div>
          <button
            onClick={onAdd}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-lg shadow-md transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Party Level</span>
          </button>
        </div>

        
        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl p-4 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {configurations.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Total Configurations
            </div>
          </div>

          <div className="rounded-xl p-4 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Set(configurations.map((c) => c.partyId)).size}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Unique Parties
            </div>
          </div>

          <div className="rounded-xl p-4 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Set(configurations.map((c) => c.stateId)).size}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              States Covered
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by party or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Party
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Active Levels
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Added On
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredConfigurations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Calendar className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-lg font-medium dark:text-gray-300">
                        No configurations found
                      </p>
                      <p className="text-sm mt-1 dark:text-gray-400">
                        Click "Add Party Level" to create your first
                        configuration
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredConfigurations.map((config) => (
                  <tr
                    key={`${config.partyId}-${config.stateId}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {config.partyName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-700 dark:text-gray-300">
                        {config.stateName}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                          {config.levels.filter((l) => l.isActive).length}{" "}
                          Levels
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {config.createdAt
                          ? new Date(config.createdAt).toLocaleDateString()
                          : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onView(config)}
                        className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartyLevelList;
