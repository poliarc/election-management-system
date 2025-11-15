// import React, { useEffect, useMemo, useState } from "react";
// import ActionDropdown from "../../../components/common/ActionDropdown";
// import type { Block, BlockCandidate } from "../../../types/block";
// import { useNavigate } from "react-router-dom";

// const BLOCKS_KEY = "blocks";

// const loadBlocks = (): Block[] => {
//   try {
//     const raw = localStorage.getItem(BLOCKS_KEY);
//     return raw ? JSON.parse(raw) : [];
//   } catch {
//     return [];
//   }
// };

// const toBlockCandidate = (block: Block): BlockCandidate & { id?: number } => ({
//   id: block.id,
//   blockName: block.blockName ?? "",
//   firstName: block.firstName ?? "",
//   lastName: block.lastName ?? "",
//   email: block.email ?? "",
//   phone: block.phone,
//   state: block.state ?? "",
//   district: block.district ?? "",
//   acNo: block.acNo ?? "",
//   distNo: block.distNo ?? "",
//   designation: block.designation ?? "",
//   profileImage: null as any,
//   password: "",
//   assembly: block.assembly ?? "",
//   assembly_id: block.assembly_id,
// });

// const BlockPage: React.FC = () => {
//   const navigate = useNavigate();
//   const [loggedInUser, setLoggedInUser] = useState<any | null>(null);
//   const [assemblyFilter, setAssemblyFilter] = useState<number | "">("");
//   const [blockNameFilter, setBlockNameFilter] = useState("");
//   const [searchQuery, setSearchQuery] = useState("");

//   const [showCount, setShowCount] = useState(25);
//   const handleShowCountChange = (count: number) => {
//     setShowCount(count);
//   };

//   const [blocks, setBlocks] = useState<Block[]>(() => loadBlocks());

//   useEffect(() => {
//     const userStr = localStorage.getItem("user");
//     if (userStr) {
//       try {
//         const parsed = JSON.parse(userStr);
//         setLoggedInUser(parsed);
//         setAssemblyFilter(parsed.assembly_id ?? "");
//       } catch {
//         setLoggedInUser(null);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     try {
//       localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));
//     } catch {}
//   }, [blocks]);



//   const assemblyFilteredBlocks = useMemo(() => {
//     if (assemblyFilter === "" || assemblyFilter == null) return [] as Block[];
//     return blocks.filter((b) => b.assembly_id === assemblyFilter);
//   }, [blocks, assemblyFilter]);

//   // apply filters
//   const [filteredBlocks, setFilteredBlocks] = useState<Block[]>([]);
//   useEffect(() => {
//     let filtered = assemblyFilteredBlocks.slice();
//     if (blockNameFilter) filtered = filtered.filter((b) => b.blockName === blockNameFilter);
//     if (searchQuery) {
//       const q = searchQuery.toLowerCase();
//       filtered = filtered.filter(
//         (b) =>
//           b.firstName?.toLowerCase().includes(q) ||
//           b.lastName?.toLowerCase().includes(q) ||
//           b.email?.toLowerCase().includes(q) ||
//           String(b.phone).includes(q) ||
//           b.designation?.toLowerCase().includes(q)
//       );
//     }
//     filtered.sort((a, b) => b.id - a.id);
//     setFilteredBlocks(filtered);
//   }, [assemblyFilteredBlocks, blockNameFilter, searchQuery]);

//   const uniqueBlockNames = useMemo(() => {
//     const names = Array.from(new Set(assemblyFilteredBlocks.map((b) => b.blockName).filter(Boolean)));
//     names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
//     return names;
//   }, [assemblyFilteredBlocks]);

//   const handleStatusChange = (idx: number) => {
//     const target = filteredBlocks.slice(0, showCount)[idx];
//     if (!target) return;
//     setBlocks((prev) =>
//       prev.map((b) =>
//         b.id === target.id
//           ? ({ ...b, status: (b.status === "1" ? "0" : "1") } as Block)
//           : b
//       )
//     );
//   };

//   const handleView = (idx: number) => {
//     const target = filteredBlocks.slice(0, showCount)[idx];
//     if (!target) return;
//     navigate("/assembly/block/profile", { state: { candidate: toBlockCandidate(target) } });
//   };

//   return (
//     <div className="p-6 rounded-2xl shadow-md bg-gray-50 w-full">
//       <div className="flex items-center justify-between mb-6">
//         <h1 className="text-xl font-bold text-gray-800">Block List</h1>
//       </div>

//       <div className="mb-4 flex flex-col gap-4 w-full">
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 w-full">
//           <div>
//             <label className="text-sm">State</label>
//             <input type="text" value={loggedInUser?.state || ""} disabled className="w-full px-3 py-2 border rounded bg-gray-200 text-gray-700 cursor-not-allowed" />
//           </div>
//           <div>
//             <label className="text-sm">District</label>
//             <input type="text" value={loggedInUser?.district || ""} disabled className="w-full px-3 py-2 border rounded bg-gray-200 text-gray-700 cursor-not-allowed" />
//           </div>
//           <div>
//             <label className="text-sm">Assembly</label>
//             <input
//               value={loggedInUser?.assembly || ""}
//               disabled
//               className="w-full px-3 py-2 border rounded bg-gray-200 text-gray-700 cursor-not-allowed appearance-none focus:outline-none"
//             />
//           </div>

//           <div>
//             <label className="text-sm">Block</label>
//             <select value={blockNameFilter} onChange={(e) => setBlockNameFilter(e.target.value)} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400">
//               <option value="">Select Block Name</option>
//               {uniqueBlockNames.map((n, i) => (
//                 <option key={n || i} value={n}>{n}</option>
//               ))}
//             </select>
//           </div>

//           <div className="flex items-center gap-2 sm:ml-4">
//             <label htmlFor="showCount" className="font-medium text-gray-700 whitespace-nowrap">
//               Show Result
//             </label>
//             <select
//               id="showCount"
//               value={showCount}
//               onChange={(e) => handleShowCountChange(Number(e.target.value))}
//               className="px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//             >
//               {[25, 50, 75, 100].map((num) => (
//                 <option key={num} value={num}>
//                   {num}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>

//         <div className="mt-2 w-full">
//           <input type="text" placeholder="Search by First Name, Last Name, Email, Phone, Designation" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400" />
//         </div>
//       </div>

//       {/* Block List Table */}
//       <div className="overflow-x-auto w-full">
//         <table className="w-full text-sm text-left rounded-lg shadow-md overflow-hidden bg-white">
//           <thead className="bg-blue-50 text-[13px] sticky top-0 z-10">
//             <tr>
//               <th className="px-4 py-2 font-semibold">SN.</th>
//               <th className="px-4 py-2 font-semibold">Block Name</th>
//               <th className="px-4 py-2 font-semibold">Designation</th>
//               <th className="px-4 py-2 font-semibold">First Name</th>
//               <th className="px-4 py-2 font-semibold">Phone No</th>
//               <th className="px-4 py-2 font-semibold">Email Id</th>
//               <th className="px-4 py-2 font-semibold">Status</th>
//               <th className="px-4 py-2 font-semibold">Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredBlocks.length === 0 ? (
//               <tr>
//                 <td colSpan={8} className="text-center py-8 text-gray-400">
//                   No block users found
//                 </td>
//               </tr>
//             ) : (
//               filteredBlocks.slice(0, showCount).map((block, index) => {
//                 const statusValue = typeof block.status === "string" ? block.status : String(block.status);
//                 const isInactive = ["0", "disabled", "inactive", "false", "null", "", "2"].includes(statusValue);
//                 return (
//                   <tr
//                     key={block.id || index}
//                     className={index % 2 === 0 ? "bg-white hover:bg-blue-50 transition" : "bg-gray-50 hover:bg-blue-50 transition"}
//                   >
//                     <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{index + 1}</td>
//                     <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{block.blockName}</td>
//                     <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{block.designation}</td>
//                     <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{block.firstName}</td>
//                     <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{block.phone}</td>
//                     <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{block.email}</td>
//                     <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
//                       <span
//                         className={`px-2 py-1 rounded-full text-xs font-semibold ${
//                           isInactive ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
//                         }`}
//                       >
//                         {isInactive ? "Inactive" : "Active"}
//                       </span>
//                     </td>
//                     <td className="px-4 py-2 relative">
//                       <ActionDropdown
//                         items={[
//                           {
//                             label: "View",
//                             onClick: () => handleView(index),
//                           },
//                           {
//                             label: "Toggle Status",
//                             onClick: () => handleStatusChange(index),
//                           },
//                         ]}
//                         buttonTitle="Actions"
//                       />
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default BlockPage;

export default function AssemblyBlockPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Block page</h1>
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">Assembly Block members will be displayed here</p>
            </div>
        </div>
    );
}


