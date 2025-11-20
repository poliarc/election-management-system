// import React, { useEffect, useState, useMemo } from "react";
// import ActionDropdown from "../../../components/common/ActionDropdown";
// import type { Mandal, MandalCandidate } from "../../../types/mandal";
// import { useNavigate } from "react-router-dom";

// // ApiError type removed (no network calls in local-only version)

// export const MandalPage: React.FC = () => {
//   const [mandals, setMandals] = useState<Mandal[]>(() => {
//     try {
//       const raw = localStorage.getItem("mandals");
//       return raw ? JSON.parse(raw) : [];
//     } catch {
//       return [];
//     }
//   });
//   const isLoading = false;

//   // persist mandals to localStorage when changed
//   useEffect(() => {
//     try {
//       localStorage.setItem("mandals", JSON.stringify(mandals));
//     } catch {
//       // ignore
//     }
//   }, [mandals]);



//   const [mandalFilter, setMandalFilter] = useState("");
//   const [blockFilter, setBlockFilter] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");

//   const PAGE_KEY = "mandalShowCount";
//   const [showCount, setShowCount] = useState<number>(() => {
//     const saved = localStorage.getItem(PAGE_KEY);
//     return saved ? Number(saved) : 25;
//   });
//   const [filteredMandals, setFilteredMandals] = useState<Mandal[]>([]);

//   const handleShowCountChange = (value: number) => {
//     setShowCount(value);
//     localStorage.setItem(PAGE_KEY, String(value));
//   };

//   const navigate = useNavigate();

//   // Logged-in user
//   const loggedInUser = useMemo(() => {
//     try {
//       const user = localStorage.getItem("user");
//       return user ? JSON.parse(user) : null;
//     } catch {
//       return null;
//     }
//   }, []);

//   // Fixed assembly for logged-in user
//   const loggedInAssembly = useMemo(() => {
//     if (!loggedInUser) return null;
//     return loggedInUser.assembly || loggedInUser.assembly_id || null;
//   }, [loggedInUser]);

//   // Filter mandals by logged-in assembly
//   const mandalsInAssembly = useMemo(() => {
//     if (!loggedInAssembly) return [];
//     return mandals.filter((m) => {
//       if (typeof loggedInAssembly === "string")
//         return m.assembly === loggedInAssembly;
//       if (typeof loggedInAssembly === "number")
//         return m.assembly_id === loggedInAssembly;
//       return false;
//     });
//   }, [mandals, loggedInAssembly]);

//   // Unique dropdown options
//   const [uniqueBlocks, setUniqueBlocks] = useState<string[]>([]);
//   const [uniqueMandals, setUniqueMandals] = useState<string[]>([]);

//   // Update blocks whenever mandalsInAssembly changes (sorted ascending)
//   useEffect(() => {
//     const blocks = Array.from(
//       new Set(
//         mandalsInAssembly
//           .map((m) => (m.block || "").trim()) // ensure string
//           .filter((b) => b !== "")
//       )
//     );
//     blocks.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
//     setUniqueBlocks(blocks);
//   }, [mandalsInAssembly]);

//   // Update mandals whenever blockFilter changes (sorted ascending)
//   useEffect(() => {
//     const mandalsForBlock = mandalsInAssembly
//       .filter((m) => !blockFilter || m.block === blockFilter)
//       .map((m) => (m.mandal || "").trim())
//       .filter((m) => m !== "");
//     const uniqueMandalList = Array.from(new Set(mandalsForBlock));
//     uniqueMandalList.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
//     setUniqueMandals(uniqueMandalList);
//   }, [mandalsInAssembly, blockFilter]);

//   // Filter mandals based on all filters and search
//   useEffect(() => {
//     const filtered = mandalsInAssembly.filter((mandal) => {
//       return (
//         (blockFilter === "" || mandal.block === blockFilter) &&
//         (mandalFilter === "" || mandal.mandal === mandalFilter) &&
//         (searchTerm === "" ||
//           mandal.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           mandal.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           mandal.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           mandal.phone?.toString().includes(searchTerm))
//       );
//     });

//     filtered.sort((a, b) => b.id - a.id);
//     setFilteredMandals(filtered);
//   }, [mandalsInAssembly, blockFilter, mandalFilter, searchTerm]);

//   // visible rows controlled by showCount
//   const visibleData = filteredMandals.slice(0, showCount);

//   const toMandalCandidate = (mandal: Mandal): MandalCandidate => ({
//     block_id: mandal.block_id,
//     mandal: mandal.mandal,
//     firstName: mandal.firstName,
//     lastName: mandal.lastName,
//     email: mandal.email,
//     phone: mandal.phone,
//     state: mandal.state,
//     district: mandal.district,
//     profileImage: null,
//     password: "",
//     assembly: mandal.assembly,
//     block: mandal.block,
//     acNo: mandal.acNo,
//     distNo: mandal.distNo,
//     designation: mandal.designation,
//   });


//   const handleStatusChange = (index: number) => {
//     const mandal = visibleData[index];
//     if (!mandal) return;
//     setMandals((prev) => prev.map((m) => (m.id === mandal.id ? { ...m, status: m.status === "1" ? "0" : "1" } : m)));
//   };

//   const handleView = (index: number) => {
//     const mandal = visibleData[index];
//     if (!mandal) return;
//     navigate("/assembly/mandal/profile", { state: { candidate: toMandalCandidate(mandal) } });
//   };

//   return (
//     <div className="p-6 rounded-2xl shadow-md bg-gray-50 w-full">
//       <div className="flex items-center justify-between mb-6">
//         <h1 className="text-xl font-bold text-gray-800">Mandal List</h1>
//       </div>

//           {/* Filters */}
//           <div className="mb-4 flex flex-col gap-4 w-full">
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 w-full">
//               {/* State */}
//               <div>
//                 <label htmlFor="" className="text-sm">
//                   State
//                 </label>
//                 <input
//                   type="text"
//                   value={loggedInUser?.state || ""}
//                   disabled
//                   className="w-full px-3 py-2 border rounded bg-gray-200 text-gray-700 cursor-not-allowed"
//                 />
//               </div>

//               {/* District */}
//               <div>
//                 <label htmlFor="" className="text-sm">
//                   District
//                 </label>
//                 <input
//                   type="text"
//                   value={loggedInUser?.district || ""}
//                   disabled
//                   className="w-full px-3 py-2 border rounded bg-gray-200 text-gray-700 cursor-not-allowed"
//                 />
//               </div>

//               {/* Assembly (Disabled) */}
//               <div>
//                 <label htmlFor="" className="text-sm">
//                   Assembly
//                 </label>
//                 <input
//                   value={loggedInAssembly ?? ""}
//                   disabled
//                   placeholder={loggedInAssembly}
//                   className="w-full px-3 py-2 border rounded bg-gray-200 text-gray-700 cursor-not-allowed appearance-none focus:outline-none"
//                 />
//               </div>

//               {/* Block filtered by assembly */}
//               <div>
//                 <label htmlFor="" className="text-sm">
//                   Block
//                 </label>
//                 <select
//                   value={blockFilter}
//                   onChange={(e) => {
//                     setBlockFilter(e.target.value);
//                     setMandalFilter(""); // reset mandal filter when block changes
//                   }}
//                   className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//                 >
//                   <option value="">Select Block</option>
//                   {uniqueBlocks.map((block, i) => (
//                     <option key={i} value={block}>
//                       {block}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Mandal filtered by block */}
//               <div>
//                 <label htmlFor="" className="text-sm">
//                   Mandal
//                 </label>
//                 <select
//                   value={mandalFilter}
//                   onChange={(e) => setMandalFilter(e.target.value)}
//                   className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//                 >
//                   <option value="">Select Mandal</option>
//                   {uniqueMandals.map((mandal, i) => (
//                     <option key={i} value={mandal}>
//                       {mandal}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             {/* Search Box */}
//             <div className="mt-2 w-full">
//               <input
//                 type="text"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 placeholder="Search by name, email or phone..."
//                 className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//               />
//             </div>

//             {/* Show Result */}
//             <div className="flex items-center gap-2 sm:ml-4 mt-2">
//               <label className="font-medium text-gray-700 whitespace-nowrap">
//                 Show Result
//               </label>
//               <select
//                 value={showCount}
//                 onChange={(e) => handleShowCountChange(Number(e.target.value))}
//                 className="px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
//               >
//                 {[25, 50, 75, 100].map((num) => (
//                   <option key={num} value={num}>
//                     {num}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//       {/* Mandal List Table */}
//       <div className="overflow-x-auto w-full">
//         <table className="w-full text-sm text-left rounded-lg shadow-md overflow-hidden bg-white">
//           <thead className="bg-blue-50 text-[13px] sticky top-0 z-10">
//             <tr>
//               <th className="px-4 py-2 font-semibold">SN.</th>
//               <th className="px-4 py-2 font-semibold">Mandal Name</th>
//               <th className="px-4 py-2 font-semibold">Designation</th>
//               <th className="px-4 py-2 font-semibold">First Name</th>
//               <th className="px-4 py-2 font-semibold">Phone No</th>
//               <th className="px-4 py-2 font-semibold">Email Id</th>
//               <th className="px-4 py-2 font-semibold">Status</th>
//               <th className="px-4 py-2 font-semibold">Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {visibleData.length === 0 ? (
//               <tr>
//                 <td colSpan={8} className="text-center py-8 text-gray-400">
//                   No mandal users found
//                 </td>
//               </tr>
//             ) : (
//               visibleData.map((mandal: Mandal, index: number) => {
//                 const statusValue = typeof mandal.status === "string" ? mandal.status : String(mandal.status);
//                 const isInactive = ["0", "disabled", "inactive", "false", "null", "", "2"].includes(statusValue);
//                 return (
//                   <tr
//                     key={mandal.id || index}
//                     className={index % 2 === 0 ? "bg-white hover:bg-blue-50 transition" : "bg-gray-50 hover:bg-blue-50 transition"}
//                   >
//                     <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{index + 1}</td>
//                     <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{mandal.mandal}</td>
//                     <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{mandal.designation}</td>
//                     <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{mandal.firstName}</td>
//                     <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{mandal.phone}</td>
//                     <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{mandal.email}</td>
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

//       {isLoading && <p>Loading mandal users...</p>}
//     </div>
//   );
// };

// export default MandalPage;


import MandalList from "./MandalList";

export default function AssemblyMandalPage() {
    return <MandalList />;
}