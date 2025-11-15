// import { useHierarchyData, useSelectedDistrictId } from '../../../hooks/useHierarchyData';
// import HierarchyTable from '../../../components/HierarchyTable';
// import { useEffect, useState } from 'react';
// import type { HierarchyChild } from '../../../types/hierarchy';

// export default function DistrictBlock() {
//     const districtId = useSelectedDistrictId();
//     const [districtInfo, setDistrictInfo] = useState<{ state: string; district: string }>({ state: '', district: '' });
//     const [assemblies, setAssemblies] = useState<HierarchyChild[]>([]);
//     const [selectedAssembly, setSelectedAssembly] = useState<string>('');

//     // First, fetch assemblies for the district
//     const {
//         data: assemblyData,
//         loading: assemblyLoading,
//     } = useHierarchyData(districtId, 100); // Get all assemblies

//     // Then, fetch blocks for the selected assembly
//     const {
//         data,
//         loading,
//         error,
//         totalChildren,
//         parentName,
//         setPage,
//         setSearchInput,
//         searchInput,
//         setSortBy,
//         setOrder,
//         currentPage,
//         limit,
//     } = useHierarchyData(selectedAssembly ? Number(selectedAssembly) : null, 10);

//     // Get district and state info from localStorage
//     useEffect(() => {
//         try {
//             const authState = localStorage.getItem('auth_state');
//             if (authState) {
//                 const parsed = JSON.parse(authState);
//                 const selectedAssignment = parsed.selectedAssignment;
//                 if (selectedAssignment) {
//                     setDistrictInfo({
//                         state: selectedAssignment.parentLevelName || 'N/A',
//                         district: selectedAssignment.levelName || 'N/A',
//                     });
//                 }
//             }
//         } catch (err) {
//             console.error('Error reading district info:', err);
//         }
//     }, []);

//     // Store assemblies when loaded
//     useEffect(() => {
//         if (assemblyData && assemblyData.length > 0) {
//             setAssemblies(assemblyData);
//             // Auto-select first assembly if none selected
//             if (!selectedAssembly) {
//                 setSelectedAssembly(assemblyData[0].location_id.toString());
//             }
//         }
//     }, [assemblyData, selectedAssembly]);

//     const handleAssemblyChange = (assemblyId: string) => {
//         setSelectedAssembly(assemblyId);
//         setPage(1); // Reset to first page
//     };

//     // Get selected assembly name
//     const selectedAssemblyName = assemblies.find(a => a.location_id.toString() === selectedAssembly)?.location_name || '';

//     const handleSort = (sortBy: 'location_name' | 'total_users' | 'active_users', order: 'asc' | 'desc') => {
//         setSortBy(sortBy);
//         setOrder(order);
//     };

//     return (
//         <div className="p-6 bg-gray-50 min-h-screen">
//             <HierarchyTable
//                 data={data}
//                 loading={loading || assemblyLoading}
//                 error={error}
//                 searchInput={searchInput}
//                 onSearchChange={setSearchInput}
//                 onSort={handleSort}
//                 onPageChange={setPage}
//                 currentPage={currentPage}
//                 totalItems={totalChildren}
//                 itemsPerPage={limit}
//                 title="Block List"
//                 emptyMessage={selectedAssembly ? "No blocks found for this assembly" : "Please select an assembly to view blocks"}
//                 stateName={districtInfo.state}
//                 districtName={districtInfo.district}
//                 parentName={parentName}
//                 assemblies={assemblies}
//                 selectedAssembly={selectedAssembly}
//                 onAssemblyChange={handleAssemblyChange}
//                 assemblyName={selectedAssemblyName}
//             />
//         </div>
//     );
// }


export default function DistrictBlock() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Block</h1>
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">Block will be displayed here</p>
            </div>
        </div>
    );
}
