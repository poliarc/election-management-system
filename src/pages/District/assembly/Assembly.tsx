import { useHierarchyData, useSelectedDistrictId } from '../../../hooks/useHierarchyData';
import HierarchyTable from '../../../components/HierarchyTable';
import { useEffect, useState } from 'react';

export default function DistrictAssembly() {
    const districtId = useSelectedDistrictId();
    const [districtInfo, setDistrictInfo] = useState<{ state: string; district: string }>({ state: '', district: '' });

    const {
        data,
        loading,
        error,
        totalChildren,
        parentName,
        setPage,
        setSearchInput,
        searchInput,
        setSortBy,
        setOrder,
        currentPage,
        limit,
    } = useHierarchyData(districtId, 10);

    // Get district and state info from localStorage
    useEffect(() => {
        try {
            const authState = localStorage.getItem('auth_state');
            if (authState) {
                const parsed = JSON.parse(authState);
                const selectedAssignment = parsed.selectedAssignment;
                if (selectedAssignment) {
                    setDistrictInfo({
                        state: selectedAssignment.parentLevelName || 'N/A',
                        district: selectedAssignment.levelName || 'N/A',
                    });
                }
            }
        } catch (err) {
            console.error('Error reading district info:', err);
        }
    }, []);

    const handleSort = (sortBy: 'location_name' | 'total_users' | 'active_users', order: 'asc' | 'desc') => {
        setSortBy(sortBy);
        setOrder(order);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <HierarchyTable
                data={data}
                loading={loading}
                error={error}
                searchInput={searchInput}
                onSearchChange={setSearchInput}
                onSort={handleSort}
                onPageChange={setPage}
                currentPage={currentPage}
                totalItems={totalChildren}
                itemsPerPage={limit}
                title="Assembly List"
                emptyMessage="No assemblies found for this district"
                stateName={districtInfo.state}
                districtName={districtInfo.district}
                parentName={parentName}
            />
        </div>
    );
}
