// import React, { useEffect, useMemo, useState } from "react";
// import type { Booth, BoothCandidate } from "../../../types/booth";
// import { BoothForm } from "./BoothForm";
// import { BoothList } from "./BoothList";
// import { BulkUpload } from "../../../components/BulkUpload";
// import { BulkUploadResults } from "../../../components/BulkUploadResults";
// import { ArrowLeft, Upload } from "lucide-react";

// const BOOTHS_KEY = "booths";

// const loadBooths = (): Booth[] => {
//   try {
//     const raw = localStorage.getItem(BOOTHS_KEY);
//     return raw ? JSON.parse(raw) : [];
//   } catch {
//     return [];
//   }
// };

// export const BoothPage: React.FC = () => {
//   const [loggedInUser, setLoggedInUser] = useState<any | null>(null);
//   const [selectedAssemblyId, setSelectedAssemblyId] = useState<number | "">("");
//   const [selectedBlock, setSelectedBlock] = useState<string>("");
//   const [selectedMandal, setSelectedMandal] = useState<string>("");
//   const [selectedBoothNo, setSelectedBoothNo] = useState<string>("");
//   const [searchText, setSearchText] = useState<string>("");
//   const [showForm, setShowForm] = useState(false);
//   const [showBulkUpload, setShowBulkUpload] = useState(false);
//   const [showUploadResults, setShowUploadResults] = useState(false);
//   const [uploadResults, setUploadResults] = useState<any>(null);
//   const [isBulkUploading, setIsBulkUploading] = useState(false);
//   const [editingIndex, setEditingIndex] = useState<number | null>(null);

//   const [showCount, setShowCount] = useState(25);
//   const handleShowCountChange = (count: number) => {
//     setShowCount(count);
//   };

//   const [booths, setBooths] = useState<Booth[]>(() => loadBooths());

//   useEffect(() => {
//     const userStr = localStorage.getItem("user");
//     if (userStr) {
//       try {
//         const parsedUser = JSON.parse(userStr);
//         setLoggedInUser(parsedUser);
//         setSelectedAssemblyId(parsedUser.assembly_id ?? "");
//       } catch {
//         setLoggedInUser(null);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     try {
//       localStorage.setItem(BOOTHS_KEY, JSON.stringify(booths));
//     } catch {}
//   }, [booths]);

//   const assemblyFilteredBooths = useMemo(() => {
//     if (!loggedInUser || selectedAssemblyId === "") return [];
//     return booths.filter((b) => b.assembly_id === selectedAssemblyId);
//   }, [booths, loggedInUser, selectedAssemblyId]);

//   const blockOptions = useMemo(() => {
//     return [
//       ...new Set(
//         assemblyFilteredBooths
//           .map((b) => (b.block || "").trim())
//           .filter((val) => val !== "")
//       ),
//     ].sort((a, b) => a.localeCompare(b));
//   }, [assemblyFilteredBooths]);

//   const mandalOptions = useMemo(() => {
//     if (!selectedBlock) return [];
//     return [
//       ...new Set(
//         assemblyFilteredBooths
//           .filter((b) => (b.block || "").trim() === selectedBlock.trim())
//           .map((b) => (b.mandal || "").trim())
//           .filter((val) => val !== "")
//       ),
//     ].sort((a, b) => a.localeCompare(b));
//   }, [assemblyFilteredBooths, selectedBlock]);

//   const boothOptions = useMemo(() => {
//     if (!selectedAssemblyId) return [];
//     return [
//       ...new Set(
//         assemblyFilteredBooths
//           .filter((b) => b.assembly_id === selectedAssemblyId)
//           .map((b) => b.boothNo)
//       ),
//     ].sort((a, b) => {
//       const numA = parseInt(a, 10);
//       const numB = parseInt(b, 10);
//       if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
//       return a.localeCompare(b);
//     });
//   }, [assemblyFilteredBooths, selectedAssemblyId]);

//   useEffect(() => {
//     if (selectedBoothNo) {
//       const booth = assemblyFilteredBooths.find(
//         (b) => b.boothNo === selectedBoothNo
//       );
//       if (booth) {
//         setSelectedBlock(booth.block || "");
//         setSelectedMandal(booth.mandal || "");
//       }
//     } else {
//       setSelectedBlock("");
//       setSelectedMandal("");
//     }
//   }, [selectedBoothNo, assemblyFilteredBooths]);

//   const [filteredBooths, setFilteredBooths] = useState<Booth[]>([]);

//   useEffect(() => {
//     let filtered = assemblyFilteredBooths;

//     if (selectedBlock)
//       filtered = filtered.filter((b) => b.block === selectedBlock);
//     if (selectedMandal)
//       filtered = filtered.filter((b) => b.mandal === selectedMandal);
//     if (selectedBoothNo)
//       filtered = filtered.filter((b) => b.boothNo === selectedBoothNo);

//     if (searchText.trim() !== "") {
//       const lower = searchText.toLowerCase();
//       filtered = filtered.filter(
//         (b) =>
//           b.firstName.toLowerCase().includes(lower) ||
//           b.lastName.toLowerCase().includes(lower) ||
//           b.email.toLowerCase().includes(lower) ||
//           b.phone.includes(lower) ||
//           b.boothNo.includes(lower)
//       );
//     }

//     filtered.sort((a, b) => {
//       const numA = parseInt(String(a.boothNo), 10);
//       const numB = parseInt(String(b.boothNo), 10);
//       if (!isNaN(numA) && !isNaN(numB)) {
//         return numA - numB;
//       }
//       return String(a.boothNo).localeCompare(String(b.boothNo));
//     });

//     setFilteredBooths(filtered);
//   }, [
//     assemblyFilteredBooths,
//     selectedBlock,
//     selectedMandal,
//     selectedBoothNo,
//     searchText,
//   ]);

//   const toBoothCandidate = (booth: Booth): BoothCandidate => ({
//     boothNo: booth.boothNo,
//     firstName: booth.firstName,
//     lastName: booth.lastName,
//     email: booth.email,
//     phone: booth.phone,
//     state: booth.state,
//     district: booth.district,
//     block: booth.block,
//     mandal: booth.mandal,
//     assembly: booth.assembly,
//     acNo: booth.acNo,
//     distNo: booth.distNo,
//     designation: booth.designation,
//     profileImage: null,
//     password: "",
//     district_id: booth.district_id,
//     assembly_id: booth.assembly_id,
//     polling_center_id: booth.polling_center_id,
//     pollingCenter: booth.pollingCenter,
//     pollingCenterNo: booth.pollingCenterNo,
//   });

//   const handleAdd = (data: BoothCandidate) => {
//     const newBooth: Booth = {
//       id: Date.now(),
//       boothNo: data.boothNo,
//       firstName: data.firstName,
//       lastName: data.lastName,
//       email: data.email,
//       phone: data.phone,
//       state: data.state,
//       district: data.district,
//       assembly: data.assembly,
//       block: data.block,
//       mandal: data.mandal,
//       acNo: data.acNo,
//       distNo: data.distNo,
//       designation: data.designation,
//       status: 1,
//       district_id: data.district_id,
//       assembly_id: data.assembly_id,
//       polling_center_id: data.polling_center_id,
//       pollingCenter: data.pollingCenter,
//       pollingCenterNo: data.pollingCenterNo,
//     };
//     setBooths((prev) => [newBooth, ...prev]);
//     setShowForm(false);
//     setEditingIndex(null);
//   };

//   const handleEdit = (data: BoothCandidate) => {
//     if (editingIndex !== null) {
//       const target = filteredBooths.slice(0, showCount)[editingIndex];
//       if (!target) return;

//       setBooths((prev) =>
//         prev.map((b) =>
//           b.id === target.id
//             ? {
//                 ...b,
//                 boothNo: data.boothNo,
//                 firstName: data.firstName,
//                 lastName: data.lastName,
//                 email: data.email,
//                 phone: data.phone,
//                 state: data.state,
//                 district: data.district,
//                 assembly: data.assembly,
//                 block: data.block,
//                 mandal: data.mandal,
//                 acNo: data.acNo,
//                 distNo: data.distNo,
//                 designation: data.designation,
//                 district_id: data.district_id,
//                 assembly_id: data.assembly_id,
//                 polling_center_id: data.polling_center_id,
//                 pollingCenter: data.pollingCenter,
//                 pollingCenterNo: data.pollingCenterNo,
//               }
//             : b
//         )
//       );
//       setEditingIndex(null);
//       setShowForm(false);
//     }
//   };

//   const handleDelete = (idx: number) => {
//     const target = filteredBooths.slice(0, showCount)[idx];
//     if (!target) return;
//     setBooths((prev) => prev.filter((b) => b.id !== target.id));
//   };

//   const handleStatusChange = (idx: number) => {
//     const target = filteredBooths.slice(0, showCount)[idx];
//     if (!target) return;
//     setBooths((prev) =>
//       prev.map((b) =>
//         b.id === target.id
//           ? { ...b, status: b.status === 1 || b.status === "1" ? 0 : 1 }
//           : b
//       )
//     );
//   };

//   const handleEditClick = (idx: number) => {
//     setEditingIndex(idx);
//     setShowForm(true);
//   };

//   const handleCancel = () => {
//     setShowForm(false);
//     setEditingIndex(null);
//   };

//   const handleBulkUpload = async (file: File) => {
//     setIsBulkUploading(true);

//     try {
//       await new Promise((resolve) => setTimeout(resolve, 1500));

//       console.log("Bulk upload file:", file.name);

//       setUploadResults({
//         success: true,
//         message: `File "${file.name}" uploaded successfully (demo mode - no actual processing)`,
//         data: {
//           total: 0,
//           successful: 0,
//           failed: 0,
//         },
//       });
//       setShowBulkUpload(false);
//       setShowUploadResults(true);
//     } catch (error) {
//       console.error("Bulk upload error:", error);
//       setUploadResults({
//         success: false,
//         message: "Failed to upload file. Please try again.",
//         data: null,
//       });
//       setShowBulkUpload(false);
//       setShowUploadResults(true);
//     } finally {
//       setIsBulkUploading(false);
//     }
//   };

//   return (
//     <div className="p-6 rounded-2xl shadow-md bg-gray-50 w-full">
//       {!showForm ? (
//         <>
//           <div className="flex items-center justify-between mb-6">
//             <h1 className="text-xl font-bold text-gray-800">Booth List</h1>
//             <div className="flex gap-3">
//               <button
//                 onClick={() => setShowBulkUpload(true)}
//                 className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-md shadow-md transition flex items-center gap-2"
//               >
//                 <Upload className="w-4 h-4" />
//                 Upload Booth Users
//               </button>
//               <button
//                 onClick={() => {
//                   setShowForm(true);
//                   setEditingIndex(null);
//                 }}
//                 className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-6 py-2 rounded-md shadow-md transition"
//               >
//                 Add Booth User
//               </button>
//             </div>
//           </div>

//           <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center w-full">
//             <div className="w-full sm:w-1/2 md:w-1/4 lg:w-1/6">
//               <label className="text-sm">State</label>
//               <input
//                 type="text"
//                 value={loggedInUser?.state || ""}
//                 disabled
//                 className="w-full px-4 py-2 border rounded bg-gray-100 text-gray-600 placeholder-gray-400"
//                 placeholder="State"
//               />
//             </div>

//             <div className="w-full sm:w-1/2 md:w-1/4 lg:w-1/6">
//               <label className="text-sm">District</label>
//               <input
//                 type="text"
//                 value={loggedInUser?.district || ""}
//                 disabled
//                 className="w-full px-4 py-2 border rounded bg-gray-100 text-gray-600 placeholder-gray-400"
//                 placeholder="District"
//               />
//             </div>

//             <div className="w-full sm:w-1/2 md:w-1/4 lg:w-1/6">
//               <label className="text-sm">Assembly</label>
//               <select
//                 value={selectedAssemblyId}
//                 disabled
//                 className="w-full px-4 py-2 border rounded bg-gray-200 text-black appearance-none"
//               >
//                 <option value={selectedAssemblyId}>
//                   {loggedInUser?.assembly}
//                 </option>
//               </select>
//             </div>

//             <div className="w-full sm:w-1/2 md:w-1/4 lg:w-1/6">
//               <label className="text-sm">Block</label>
//               <select
//                 value={selectedBlock}
//                 onChange={(e) => {
//                   setSelectedBlock(e.target.value);
//                   setSelectedMandal("");
//                 }}
//                 className="w-full px-4 py-2 border rounded hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//               >
//                 <option value="">Block List</option>
//                 {blockOptions.map((block) => (
//                   <option key={block} value={block}>
//                     {block}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="w-full sm:w-1/2 md:w-1/4 lg:w-1/6">
//               <label className="text-sm">Mandal</label>
//               <select
//                 value={selectedMandal}
//                 onChange={(e) => setSelectedMandal(e.target.value)}
//                 className="w-full px-4 py-2 border rounded hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//               >
//                 <option value="">Mandal List</option>
//                 {mandalOptions.map((mandal) => (
//                   <option key={mandal} value={mandal}>
//                     {mandal}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="w-full sm:w-1/2 md:w-1/4 lg:w-1/6">
//               <label className="text-sm">Booth No.</label>
//               <select
//                 value={selectedBoothNo}
//                 onChange={(e) => setSelectedBoothNo(e.target.value)}
//                 className="w-full px-4 py-2 border rounded hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//               >
//                 <option value="">Booth No</option>
//                 {boothOptions.map((boothNo) => (
//                   <option key={boothNo} value={boothNo}>
//                     {boothNo}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div className="w-full sm:w-1/2 md:w-1/4 lg:w-1/6">
//               <label className="text-sm">Search</label>
//               <input
//                 type="text"
//                 placeholder="Search by Name or Phone"
//                 value={searchText}
//                 onChange={(e) => setSearchText(e.target.value)}
//                 className="w-full px-4 py-2 border rounded hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//               />
//             </div>

//             <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
//               <label
//                 htmlFor="showCount"
//                 className="font-medium text-gray-700 whitespace-nowrap"
//               >
//                 Show Result
//               </label>
//               <select
//                 id="showCount"
//                 value={showCount}
//                 onChange={(e) => handleShowCountChange(Number(e.target.value))}
//                 className="px-3 py-2 border rounded hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
//               >
//                 {[25, 50, 75, 100].map((num) => (
//                   <option key={num} value={num}>
//                     {num}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <BoothList
//             booths={filteredBooths.slice(0, showCount)}
//             onEdit={handleEditClick}
//             onDelete={handleDelete}
//             onStatusChange={handleStatusChange}
//           />
//         </>
//       ) : (
//         <>
//           <div className="mb-6 flex items-center justify-between">
//             <h2 className="text-2xl font-bold text-gray-800">
//               {editingIndex !== null ? "Edit" : "Create New"} Booth User
//             </h2>

//             <button
//               type="button"
//               onClick={handleCancel}
//               className="flex items-center text-gray-600 hover:text-gray-900"
//             >
//               <ArrowLeft className="w-5 h-5 mr-2" />
//               Back
//             </button>
//           </div>

//           <BoothForm
//             initialValues={
//               editingIndex !== null && filteredBooths.slice(0, showCount)[editingIndex]
//                 ? toBoothCandidate(filteredBooths.slice(0, showCount)[editingIndex])
//                 : undefined
//             }
//             onSubmit={editingIndex !== null ? handleEdit : handleAdd}
//             onCancel={handleCancel}
//           />
//         </>
//       )}

//       <BulkUpload
//         isOpen={showBulkUpload}
//         onClose={() => setShowBulkUpload(false)}
//         onUpload={handleBulkUpload}
//         title="Upload Booth Users"
//         description="Upload multiple booth users at once using an Excel file. Make sure your file follows the required format."
//         sampleFileName="booth_users_template.xlsx"
//         isLoading={isBulkUploading}
//       />

//       <BulkUploadResults
//         isOpen={showUploadResults}
//         onClose={() => setShowUploadResults(false)}
//         results={uploadResults}
//       />
//     </div>
//   );
// };

// export default BoothPage;


import BoothList from "./BoothList";

export default function AssemblyBoothPage() {
    return <BoothList />;
} 
