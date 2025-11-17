import React from "react";
import { Database } from "lucide-react";

const PartyWiseLevelPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 bg-gray-50 rounded-2xl shadow-md w-full">
      <div className="bg-linear-to-r from-purple-600 to-indigo-600 rounded-xl p-4 sm:p-6 mb-6 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white bg-opacity-20 p-3 rounded-lg">
            <Database className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Party Wise Level</h1>
            <p className="text-purple-100 mt-1">
              Configure and manage party levels and mappings
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <p className="text-gray-700">
          This is a placeholder page. Tell me what levels (e.g., National,
          State, District, Assembly, etc.) and what actions you want here
          (create/edit levels, assign to parties), and I will build it out.
        </p>
      </div>
    </div>
  );
};

export default PartyWiseLevelPage;
