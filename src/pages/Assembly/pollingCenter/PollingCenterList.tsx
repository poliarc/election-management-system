// import React, { useState, useEffect } from "react";
// import type { PollingCenterCandidate } from "../../../types/pollingCenter";
// import { ChevronUp, ChevronDown } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import ActionDropdown from "../../../components/common/ActionDropdown";

// type Props = {
//   pollingCenters: PollingCenterCandidate[];
//   onEdit: (index: number) => void;
//   onDelete: (index: number) => void;
//   onStatusChange: (index: number, pollingCenter: PollingCenterCandidate) => void;
// };

// type SortConfig = {
//   key: keyof PollingCenterCandidate | null;
//   direction: "asc" | "desc";
// };

// export const PollingCenterList: React.FC<Props> = ({
//   pollingCenters,
//   onEdit,
//   onDelete,
//   onStatusChange,
// }) => {
//   const [sortedCenters, setSortedCenters] = useState<PollingCenterCandidate[]>([
//     ...pollingCenters,
//   ]);
//   const [sortConfig, setSortConfig] = useState<SortConfig>({
//     key: null,
//     direction: "asc",
//   });

//   const navigate = useNavigate();

//   // Sync props with sorted state
//   useEffect(() => {
//     setSortedCenters([...pollingCenters]);
//   }, [pollingCenters]);

//   // Sorting function
//   const handleSort = (key: keyof PollingCenterCandidate) => {
//     let direction: "asc" | "desc" = "asc";
//     if (sortConfig.key === key && sortConfig.direction === "asc") {
//       direction = "desc";
//     }

//     const sorted = [...sortedCenters].sort((a, b) => {
//       const aVal = a[key] ?? "";
//       const bVal = b[key] ?? "";

//       if (typeof aVal === "number" && typeof bVal === "number") {
//         return direction === "asc" ? aVal - bVal : bVal - aVal;
//       }

//       return direction === "asc"
//         ? String(aVal).localeCompare(String(bVal))
//         : String(bVal).localeCompare(String(aVal));
//     });

//     setSortedCenters(sorted);
//     setSortConfig({ key, direction });
//   };

//   const getSortIcon = (key: keyof PollingCenterCandidate) => {
//     if (sortConfig.key !== key) return "↕";
//     return sortConfig.direction === "asc" ? (
//       <ChevronUp className="w-3 h-3 inline ml-1" />
//     ) : (
//       <ChevronDown className="w-3 h-3 inline ml-1" />
//     );
//   };

//   const handleViewProfile = (pollingCenter: PollingCenterCandidate) => {
//     navigate("/dashboard/profile", { state: { candidate: pollingCenter } });
//   };

//   const getStatusLabel = (status: number | string | undefined) => {
//     if (status === 1 || status === "1" || status === "active") return "Active";
//     return "Inactive";
//   };

//   return (
//     <div className="overflow-x-auto w-full">
//       <table className="w-full text-sm text-left rounded-lg shadow-md overflow-hidden bg-white">
//         <thead className="bg-blue-50 text-[13px] sticky top-0 z-10">
//           <tr>
//             <th className="px-4 py-2 font-semibold cursor-pointer">No</th>
//             <th
//               className="px-4 py-2 font-semibold cursor-pointer"
//               onClick={() => handleSort("pollingCenterName")}
//             >
//               Polling Center {getSortIcon("pollingCenterName")}
//             </th>
//             <th
//               className="px-4 py-2 font-semibold cursor-pointer"
//               onClick={() => handleSort("Designation")}
//             >
//               Designation {getSortIcon("Designation")}
//             </th>
//             <th
//               className="px-4 py-2 font-semibold cursor-pointer"
//               onClick={() => handleSort("firstName")}
//             >
//               First Name {getSortIcon("firstName")}
//             </th>
//             <th
//               className="px-4 py-2 font-semibold cursor-pointer"
//               onClick={() => handleSort("lastName")}
//             >
//               Last Name {getSortIcon("lastName")}
//             </th>
//             <th
//               className="px-4 py-2 font-semibold cursor-pointer"
//               onClick={() => handleSort("phone")}
//             >
//               Phone {getSortIcon("phone")}
//             </th>
//             <th
//               className="px-4 py-2 font-semibold cursor-pointer"
//               onClick={() => handleSort("email")}
//             >
//               Email {getSortIcon("email")}
//             </th>
//             <th
//               className="px-4 py-2 font-semibold cursor-pointer"
//               onClick={() => handleSort("status")}
//             >
//               Status {getSortIcon("status")}
//             </th>
//             <th className="px-4 py-2 font-semibold">Action</th>
//           </tr>
//         </thead>
//         <tbody>
//           {sortedCenters.length === 0 ? (
//             <tr>
//               <td colSpan={9} className="text-center py-8 text-gray-400">
//                 No polling centers found
//               </td>
//             </tr>
//           ) : (
//             sortedCenters.map((s, index) => {
//               const statusValue =
//                 typeof s.status === "string" ? s.status : String(s.status);
//               const isInactive =
//                 statusValue === "0" ||
//                 statusValue === "disabled" ||
//                 statusValue === "inactive" ||
//                 statusValue === "false" ||
//                 statusValue === "null" ||
//                 statusValue === "" ||
//                 statusValue === "2";
//               return (
//                 <tr
//                   key={s.id || index}
//                   className={
//                     index % 2 === 0
//                       ? "bg-white hover:bg-blue-50 transition"
//                       : "bg-gray-50 hover:bg-blue-50 transition"
//                   }
//                 >
//                   <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
//                     {index + 1}
//                   </td>
//                   <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
//                     {s.pollingCenterName || s.pollingCenter}
//                   </td>
//                   <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
//                     {s.Designation}
//                   </td>
//                   <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
//                     {s.firstName}
//                   </td>
//                   <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
//                     {s.lastName}
//                   </td>
//                   <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
//                     {s.phone}
//                   </td>
//                   <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
//                     {s.email}
//                   </td>
//                   <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
//                     <span
//                       className={`px-2 py-1 rounded-full text-xs font-semibold ${
//                         isInactive
//                           ? "bg-red-100 text-red-700"
//                           : "bg-green-100 text-green-700"
//                       }`}
//                     >
//                       {getStatusLabel(s.status)}
//                     </span>
//                   </td>
//                   <td className="px-4 py-2 relative">
//                     <ActionDropdown
//                       items={[
//                         {
//                           label: "View Profile",
//                           onClick: () => handleViewProfile(s),
//                         },
//                         {
//                           label: "Edit",
//                           onClick: () => onEdit(index),
//                         },
//                         {
//                           label: isInactive ? "Enable" : "Disable",
//                           onClick: () => onStatusChange(index, s),
//                         },
//                         {
//                           label: "Delete",
//                           onClick: () => onDelete(index),
//                           destructive: true,
//                         },
//                       ]}
//                       buttonTitle="Actions"
//                     />
//                   </td>
//                 </tr>
//               );
//             })
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// };
