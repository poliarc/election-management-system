// import React, { useState, useEffect } from "react";
// import { Search, Filter, X, Database } from "lucide-react";

// type PartyTypeSearchParams = {
//   page: number;
//   limit: number;
//   search?: string;
//   isActive?: boolean;
// };

// interface PartyTypeSearchFilterProps {
//   searchParams: PartyTypeSearchParams;
//   onSearchChange: (params: PartyTypeSearchParams) => void;
//   totalResults: number;
// }

// export const PartyTypeSearchFilter: React.FC<PartyTypeSearchFilterProps> = ({
//   searchParams,
//   onSearchChange,
//   totalResults,
// }) => {
//   const [localSearch, setLocalSearch] = useState(searchParams.search || "");
//   const [showFilters, setShowFilters] = useState(false);

//   // Debounce search input
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       onSearchChange({
//         ...searchParams,
//         search: localSearch,
//         page: 1, // Reset to first page when searching
//       });
//     }, 300);

//     return () => clearTimeout(timer);
//   }, [localSearch]);

//   const handleFilterChange = (
//     key: keyof PartyTypeSearchParams,
//     value: string | number | boolean | undefined
//   ) => {
//     onSearchChange({
//       ...searchParams,
//       [key]: value,
//       page: 1, // Reset to first page when filtering
//     });
//   };

//   const clearFilters = () => {
//     setLocalSearch("");
//     onSearchChange({
//       page: 1,
//       limit: searchParams.limit,
//     });
//     setShowFilters(false);
//   };

//   const hasActiveFilters = localSearch || searchParams.isActive !== undefined;

//   return (
//     <div className="bg-white p-4 rounded-lg shadow-md mb-6">
//       {/* Search Bar */}
//       <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
//         <div className="relative flex-1">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//           <input
//             type="text"
//             value={localSearch}
//             onChange={(e) => setLocalSearch(e.target.value)}
//             placeholder="Search by party type name..."
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => setShowFilters(!showFilters)}
//             className={`flex items-center gap-2 px-4 py-2 border rounded-md transition-colors ${
//               showFilters || hasActiveFilters
//                 ? "bg-blue-50 border-blue-300 text-blue-700"
//                 : "border-gray-300 text-gray-700 hover:bg-gray-50"
//             }`}
//           >
//             <Filter className="w-4 h-4" />
//             Filters
//             {hasActiveFilters && (
//               <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
//                 {[localSearch, searchParams.isActive].filter(Boolean).length}
//               </span>
//             )}
//           </button>

//           {hasActiveFilters && (
//             <button
//               onClick={clearFilters}
//               className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
//               title="Clear all filters"
//             >
//               <X className="w-4 h-4" />
//               Clear
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Advanced Filters */}
//       {showFilters && (
//         <div className="mt-4 pt-4 border-t border-gray-200">
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//             {/* Status Filter */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Status
//               </label>
//               <select
//                 value={
//                   searchParams.isActive === undefined
//                     ? ""
//                     : searchParams.isActive
//                     ? "active"
//                     : "inactive"
//                 }
//                 onChange={(e) =>
//                   handleFilterChange(
//                     "isActive",
//                     e.target.value === ""
//                       ? undefined
//                       : e.target.value === "active"
//                   )
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">All Status</option>
//                 <option value="active">Active</option>
//                 <option value="inactive">Inactive</option>
//               </select>
//             </div>

//             {/* Results per page */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Results per page
//               </label>
//               <select
//                 value={searchParams.limit || 25}
//                 onChange={(e) =>
//                   handleFilterChange("limit", Number(e.target.value))
//                 }
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value={10}>10</option>
//                 <option value={25}>25</option>
//                 <option value={50}>50</option>
//                 <option value={100}>100</option>
//               </select>
//             </div>

//             {/* Quick Actions */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Quick Actions
//               </label>
//               <div className="flex gap-2">
//                 <button
//                   onClick={() => handleFilterChange("isActive", true)}
//                   className="flex items-center gap-1 px-3 py-2 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
//                 >
//                   <Database className="w-3 h-3" />
//                   Active Only
//                 </button>
//                 <button
//                   onClick={() => handleFilterChange("isActive", false)}
//                   className="flex items-center gap-1 px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
//                 >
//                   <Database className="w-3 h-3" />
//                   Inactive Only
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Results Summary */}
//       <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
//         <div>
//           {totalResults > 0 ? (
//             <span className="flex items-center gap-1">
//               <Database className="w-4 h-4" />
//               Showing {totalResults} party type{totalResults !== 1 ? "s" : ""}
//               {hasActiveFilters && " (filtered)"}
//             </span>
//           ) : (
//             <span className="flex items-center gap-1 text-gray-500">
//               <Database className="w-4 h-4" />
//               No party types found
//             </span>
//           )}
//         </div>

//         {/* Quick Stats */}
//         <div className="hidden sm:flex items-center gap-4 text-xs">
//           <div className="flex items-center gap-1">
//             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//             <span>Active</span>
//           </div>
//           <div className="flex items-center gap-1">
//             <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
//             <span>Inactive</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
