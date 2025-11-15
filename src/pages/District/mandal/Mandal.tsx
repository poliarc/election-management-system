// import { useHierarchyData, useSelectedDistrictId } from '../../../hooks/useHierarchyData';
// import HierarchyTable from '../../../components/HierarchyTable';
// import { useEffect, useState } from 'react';
// import type { HierarchyChild } from '../../../types/hierarchy';

// export default function DistrictMandal() {
//     const districtId = useSelectedDistrictId();
//     const [districtInfo, setDistrictInfo] = useState<{ state: string; district: string }>({ state: '', district: '' });
//     const [assemblies, setAssemblies] = useState<HierarchyChild[]>([]);
//     const [blocks, setBlocks] = useState<HierarchyChild[]>([]);
//     const [selectedAssembly, setSelectedAssembly] = useState<string>('');
//     const [selectedBlock, setSelectedBlock] = useState<string>('');

//     // First, fetch assemblies for the district
//     const {
//         data: assemblyData,
//         loading: assemblyLoading,
//     } = useHierarchyData(districtId, 100); // Get all assemblies

//     // Then, fetch blocks for the selected assembly
//     const {
//         data: blockData,
//         loading: blockLoading,
//     } = useHierarchyData(selectedAssembly ? Number(selectedAssembly) : null, 100); // Get all blocks

//     // Finally, fetch mandals for the selected block
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
//     } = useHierarchyData(selectedBlock ? Number(selectedBlock) : null, 10);

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

//     // Store blocks when loaded
//     useEffect(() => {
//         if (blockData && blockData.length > 0) {
//             setBlocks(blockData);
//             // Auto-select first block if none selected
//             if (!selectedBlock) {
//                 setSelectedBlock(blockData[0].location_id.toString());
//             }
//         }
//     }, [blockData, selectedBlock]);

//     const handleAssemblyChange = (assemblyId: string) => {
//         setSelectedAssembly(assemblyId);
//         setSelectedBlock(''); // Reset block selection
//         setBlocks([]); // Clear blocks
//         setPage(1);
//     };

//     const handleBlockChange = (blockId: string) => {
//         setSelectedBlock(blockId);
//         setPage(1);
//     };

//     // Get selected assembly and block names
//     const selectedAssemblyName = assemblies.find(a => a.location_id.toString() === selectedAssembly)?.location_name || '';
//     const selectedBlockName = blocks.find(b => b.location_id.toString() === selectedBlock)?.location_name || '';

//     const handleSort = (sortBy: 'location_name' | 'total_users' | 'active_users', order: 'asc' | 'desc') => {
//         setSortBy(sortBy);
//         setOrder(order);
//     };

//     return (
//         <div className="p-6 bg-gray-50 min-h-screen">
//             <HierarchyTable
//                 data={data}
//                 loading={loading || assemblyLoading || blockLoading}
//                 error={error}
//                 searchInput={searchInput}
//                 onSearchChange={setSearchInput}
//                 onSort={handleSort}
//                 onPageChange={setPage}
//                 currentPage={currentPage}
//                 totalItems={totalChildren}
//                 itemsPerPage={limit}
//                 title="Mandal List"
//                 emptyMessage={selectedBlock ? "No mandals found for this block" : "Please select an assembly and block to view mandals"}
//                 stateName={districtInfo.state}
//                 districtName={districtInfo.district}
//                 parentName={parentName}
//                 assemblies={assemblies}
//                 selectedAssembly={selectedAssembly}
//                 onAssemblyChange={handleAssemblyChange}
//                 blocks={blocks}
//                 selectedBlock={selectedBlock}
//                 onBlockChange={handleBlockChange}
//                 assemblyName={selectedAssemblyName}
//                 blockName={selectedBlockName}
//             />
//         </div>
//     );
// }

export default function DistrictMandal() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Mandal</h1>
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-gray-600">Mandal will be displayed here</p>
            </div>
        </div>
    );
}
