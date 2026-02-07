import { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { useGetAssemblyByStateQuery } from '../../../store/api/assemblyApi';
import { useGetSupportersByStateQuery, useGetSupportersByDistrictQuery, useGetSupportersByAssemblyQuery } from '../../../store/api/supportersApi';
import type { Supporter } from '../../../types/supporter';

interface AssemblyOption {
  id: number;
  levelName: string;
  displayName: string;
  stateMasterData_id?: number;
  parentId?: number;
}

interface DistrictOption {
  id: number;
  levelName: string;
  displayName: string;
}

interface BlockOption {
  id: number;
  levelName: string;
  displayName: string;
  parentAssemblyId?: number;
}

interface UserOption {
  id: number;
  name: string;
  supporterCount: number;
}

export default function StateSupportersPage() {
  const { user, selectedAssignment } = useAppSelector((s) => s.auth);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number>(0);
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number>(0);
  const [selectedBlockId, setSelectedBlockId] = useState<number>(0);
  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingSupporter, setViewingSupporter] = useState<Supporter | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);

  const stateId = user?.state_id || selectedAssignment?.stateMasterData_id || 0;
  const partyId = user?.partyId || 0;

  // Get hierarchy data for the state
  const { data: hierarchyData, isLoading: hierarchyLoading, error: hierarchyError } = useGetAssemblyByStateQuery({
    state_id: stateId,
    party_id: partyId,
  }, {
    skip: !stateId || !partyId,
  });

  // Get supporters for state, district or assembly with filters
  const { data: stateSupportersData, isLoading: stateSupportersLoading, refetch: refetchState } = useGetSupportersByStateQuery({
    stateId: stateId,
    page: currentPage,
    limit: 10,
    search: searchTerm,
    districtId: selectedDistrictId || undefined,
    assemblyId: selectedAssemblyId || undefined,
    blockId: selectedBlockId || undefined,
    userId: selectedUserId || undefined,
  }, {
    skip: !stateId || selectedDistrictId > 0 || selectedAssemblyId > 0,
  });

  // Get unfiltered data for user list (without userId filter)
  const { data: stateUsersData } = useGetSupportersByStateQuery({
    stateId: stateId,
    page: 1,
    limit: 100,
    districtId: selectedDistrictId || undefined,
    assemblyId: selectedAssemblyId || undefined,
    blockId: selectedBlockId || undefined,
  }, {
    skip: !stateId || selectedDistrictId > 0 || selectedAssemblyId > 0,
  });

  const { data: districtSupportersData, isLoading: districtSupportersLoading, refetch: refetchDistrict } = useGetSupportersByDistrictQuery({
    districtId: selectedDistrictId,
    page: currentPage,
    limit: 10,
    search: searchTerm,
    assemblyId: selectedAssemblyId || undefined,
    blockId: selectedBlockId || undefined,
    userId: selectedUserId || undefined,
  }, {
    skip: !selectedDistrictId || selectedAssemblyId > 0,
  });

  // Get unfiltered data for user list (without userId filter)
  const { data: districtUsersData } = useGetSupportersByDistrictQuery({
    districtId: selectedDistrictId,
    page: 1,
    limit: 100,
    assemblyId: selectedAssemblyId || undefined,
    blockId: selectedBlockId || undefined,
  }, {
    skip: !selectedDistrictId || selectedAssemblyId > 0,
  });

  const { data: assemblySupportersData, isLoading: assemblySupportersLoading, refetch: refetchAssembly } = useGetSupportersByAssemblyQuery({
    assemblyId: selectedAssemblyId,
    page: currentPage,
    limit: 10,
    search: searchTerm,
    blockId: selectedBlockId || undefined,
    userId: selectedUserId || undefined,
  }, {
    skip: !selectedAssemblyId,
  });

  // Get unfiltered data for user list (without userId filter)
  const { data: assemblyUsersData } = useGetSupportersByAssemblyQuery({
    assemblyId: selectedAssemblyId,
    page: 1,
    limit: 100,
    blockId: selectedBlockId || undefined,
  }, {
    skip: !selectedAssemblyId,
  });

  // Use state, district or assembly data based on selection
  const supportersData = selectedAssemblyId > 0 
    ? assemblySupportersData 
    : selectedDistrictId > 0 
      ? districtSupportersData 
      : stateSupportersData;
  
  const supportersLoading = selectedAssemblyId > 0 
    ? assemblySupportersLoading 
    : selectedDistrictId > 0 
      ? districtSupportersLoading 
      : stateSupportersLoading;
  
  const refetch = selectedAssemblyId > 0 
    ? refetchAssembly 
    : selectedDistrictId > 0 
      ? refetchDistrict 
      : refetchState;

  // Extract districts from hierarchy
  const districts: DistrictOption[] = hierarchyData?.data?.stateHierarchy?.filter(
    (item: any) => item.levelType === 'District'
  ).map((item: any) => ({
    id: item.id,
    levelName: item.levelName,
    displayName: item.levelName,
  })) || [];

  // Extract assemblies filtered by selected district
  const assemblies: AssemblyOption[] = hierarchyData?.data?.stateHierarchy?.filter(
    (item: any) => item.levelType === 'Assembly' && (!selectedDistrictId || item.ParentId === selectedDistrictId)
  ).map((item: any) => ({
    id: item.stateMasterData_id || item.id,
    levelName: item.levelName,
    displayName: item.levelName,
    stateMasterData_id: item.stateMasterData_id || item.id,
    parentId: item.ParentId
  })) || [];

  // Extract blocks - show all blocks or filter by assembly/district
  const blocks: BlockOption[] = hierarchyData?.data?.afterAssemblyHierarchy?.filter(
    (item: any) => {
      if (item.levelName !== 'Block') return false;
      
      // If assembly is selected, show only blocks from that assembly
      if (selectedAssemblyId > 0) {
        return item.parentAssemblyId === selectedAssemblyId;
      }
      
      // If district is selected (but no assembly), show blocks from assemblies in that district
      if (selectedDistrictId > 0) {
        const assembly = assemblies.find(a => a.id === item.parentAssemblyId);
        return assembly && assembly.parentId === selectedDistrictId;
      }
      
      // Otherwise show all blocks
      return true;
    }
  ).map((item: any) => ({
    id: item.id,
    levelName: item.levelName,
    displayName: item.displayName || item.levelName,
    parentAssemblyId: item.parentAssemblyId
  })) || [];

  // Extract unique users from supporters data (without user filter applied)
  // We need to get users from unfiltered data to show all available users
  useEffect(() => {
    const usersDataSource = selectedAssemblyId > 0 
      ? assemblyUsersData 
      : selectedDistrictId > 0 
        ? districtUsersData 
        : stateUsersData;
    
    if (usersDataSource?.data) {
      const userMap = new Map<number, { name: string; count: number }>();
      usersDataSource.data.forEach((supporter: Supporter) => {
        if (supporter.created_by && supporter.created_by_name) {
          const existing = userMap.get(supporter.created_by);
          if (existing) {
            existing.count++;
          } else {
            userMap.set(supporter.created_by, {
              name: supporter.created_by_name,
              count: 1
            });
          }
        }
      });
      
      const usersList: UserOption[] = [];
      userMap.forEach((value, key) => {
        usersList.push({
          id: key,
          name: value.name,
          supporterCount: value.count
        });
      });
      usersList.sort((a, b) => b.supporterCount - a.supporterCount);
      setAvailableUsers(usersList);
    }
  }, [selectedAssemblyId, selectedDistrictId, selectedBlockId, assemblyUsersData, districtUsersData, stateUsersData]);

  const supporters = supportersData?.data || [];
  const pagination = supportersData?.pagination;

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stateId || selectedDistrictId || selectedAssemblyId) {
        setCurrentPage(1);
        refetch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, stateId, selectedDistrictId, selectedAssemblyId, refetch]);

  const handleDistrictChange = (districtId: number) => {
    setSelectedDistrictId(districtId);
    setSelectedAssemblyId(0);
    setSelectedBlockId(0);
    setSelectedUserId(0);
    setCurrentPage(1);
    setSearchTerm('');
  };

  const handleAssemblyChange = (assemblyId: number) => {
    setSelectedAssemblyId(assemblyId);
    setSelectedBlockId(0);
    setSelectedUserId(0);
    setCurrentPage(1);
    setSearchTerm('');
  };

  const handleBlockChange = (blockId: number) => {
    setSelectedBlockId(blockId);
    setSelectedUserId(0);
    setCurrentPage(1);
  };

  const handleUserChange = (userId: number) => {
    setSelectedUserId(userId);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getFullName = (supporter: Supporter) => {
    return `${supporter.initials || ''} ${supporter.first_name || ''} ${supporter.last_name || ''}`.trim();
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Supporters Dashboard</h1>
          <p className="text-gray-600">View and manage supporters across assemblies</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {/* Total Supporters Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium">Total Supporters</p>
                <p className="text-2xl font-bold mt-1">{pagination?.total || 0}</p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* District Count Card */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium">
                  {selectedDistrictId ? 'District(Supp)' : 'Districts'}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {selectedDistrictId ? (pagination?.total || 0) : districts.length}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Assembly Count Card */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-medium">
                  {selectedAssemblyId ? 'Assembly(Supp)' : 'Assemblies'}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {selectedAssemblyId ? (pagination?.total || 0) : assemblies.length}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Block Count Card */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs font-medium">
                  {selectedBlockId ? 'Block(Supp)' : 'Blocks'}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {selectedBlockId ? (pagination?.total || 0) : blocks.length}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* User Count Card */}
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow-md p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-xs font-medium">
                  {selectedUserId ? 'User(Supp)' : 'Users'}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {selectedUserId ? (pagination?.total || 0) : availableUsers.length}
                </p>
              </div>
              <div className="bg-white/20 rounded-full p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Hierarchy Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Supporters</h2>
          
          {/* First Row: State, District, Assembly, Block, and User */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            {/* State Dropdown (Disabled) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <select
                value={stateId}
                disabled={true}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              >
                <option value={stateId}>
                  {hierarchyData?.data?.stateHierarchy?.find((item: any) => item.id === stateId)?.levelName || 'Current State'}
                </option>
              </select>
            </div>

            {/* District Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select District
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => handleDistrictChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={hierarchyLoading}
              >
                <option value={0}>
                  {hierarchyLoading 
                    ? 'Loading districts...' 
                    : hierarchyError 
                      ? 'Error loading districts' 
                      : districts.length === 0 
                        ? 'No districts found' 
                        : 'All Districts'}
                </option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.displayName || district.levelName}
                  </option>
                ))}
              </select>
            </div>

            {/* Assembly Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Assembly
              </label>
              <select
                value={selectedAssemblyId}
                onChange={(e) => handleAssemblyChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={hierarchyLoading}
              >
                <option value={0}>
                  {hierarchyLoading 
                    ? 'Loading assemblies...' 
                    : hierarchyError 
                      ? 'Error loading assemblies' 
                      : assemblies.length === 0 
                        ? selectedDistrictId ? 'No assemblies in district' : 'All Assemblies'
                        : 'All Assemblies'}
                </option>
                {assemblies.map((assembly) => (
                  <option key={assembly.id} value={assembly.id}>
                    {assembly.displayName || assembly.levelName}
                  </option>
                ))}
              </select>
              {hierarchyError && (
                <p className="text-red-500 text-xs mt-1">
                  Error: {(hierarchyError as any)?.message || 'Failed to load hierarchy'}
                </p>
              )}
            </div>

            {/* Block Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Block
              </label>
              <select
                value={selectedBlockId}
                onChange={(e) => handleBlockChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={blocks.length === 0}
              >
                <option value={0}>
                  {blocks.length === 0 
                    ? 'No blocks available' 
                    : 'All Blocks'}
                </option>
                {blocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.displayName || block.levelName}
                  </option>
                ))}
              </select>
            </div>

            {/* User Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by User
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => handleUserChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={supportersLoading || availableUsers.length === 0}
              >
                <option value={0}>
                  {availableUsers.length === 0 ? 'No users available' : 'All Users'}
                </option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.supporterCount})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Second Row: Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            {/* Search Supporters */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Supporters
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone, or EPIC ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Supporters List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Supporters List
                {pagination && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({pagination.total} total)
                  </span>
                )}
              </h2>
            </div>
          </div>

            {/* Loading State */}
            {supportersLoading && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading supporters...</p>
              </div>
            )}

            {/* Empty State */}
            {!supportersLoading && supporters.length === 0 && (
              <div className="p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No supporters found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search criteria.' : 'No supporters have been added for this assembly yet.'}
                </p>
              </div>
            )}

            {/* Supporters Table */}
            {!supportersLoading && supporters.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Supporter
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Demographics
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {supporters.map((supporter) => (
                        <tr key={supporter.supporter_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {getFullName(supporter)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Father: {supporter.father_name}
                              </div>
                              {supporter.voter_epic_id && (
                                <div className="text-xs text-gray-400">
                                  EPIC: {supporter.voter_epic_id}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{supporter.phone_no}</div>
                            {supporter.whatsapp_no && (
                              <div className="text-sm text-gray-500">WA: {supporter.whatsapp_no}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {supporter.gender}, Age {supporter.age}
                            </div>
                            <div className="text-sm text-gray-500">
                              {supporter.religion} - {supporter.category}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{supporter.assembly_name}</div>
                            {supporter.block_name && (
                              <div className="text-sm text-gray-500">{supporter.block_name}</div>
                            )}
                            {supporter.mandal_name && (
                              <div className="text-xs text-gray-400">{supporter.mandal_name}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(supporter.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => setViewingSupporter(supporter)}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} results
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1 text-sm border rounded-md ${
                                page === pagination.page
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.pages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        {/* Supporter Details Modal */}
        {viewingSupporter && (
          <div className="fixed inset-0 bg-black/50 backgrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Supporter Details</h3>
                <button
                  onClick={() => setViewingSupporter(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="px-6 py-4 space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-sm text-gray-900">{getFullName(viewingSupporter)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Father's Name</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.father_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Age</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.age} years</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Gender</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.gender}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                      <p className="text-sm text-gray-900">
                        {new Date(viewingSupporter.date_of_birth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.phone_no}</p>
                    </div>
                    {viewingSupporter.whatsapp_no && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">WhatsApp Number</label>
                        <p className="text-sm text-gray-900">{viewingSupporter.whatsapp_no}</p>
                      </div>
                    )}
                    {viewingSupporter.voter_epic_id && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">EPIC ID</label>
                        <p className="text-sm text-gray-900">{viewingSupporter.voter_epic_id}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Demographics */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Demographics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Religion</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.religion}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Category</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.category}</p>
                    </div>
                    {viewingSupporter.caste && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Caste</label>
                        <p className="text-sm text-gray-900">{viewingSupporter.caste}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Languages</label>
                      <p className="text-sm text-gray-900">
                        {Array.isArray(viewingSupporter.language) 
                          ? viewingSupporter.language.join(', ') 
                          : typeof viewingSupporter.language === 'object' && viewingSupporter.language !== null
                            ? `${(viewingSupporter.language as any).primary}${(viewingSupporter.language as any).secondary ? `, ${(viewingSupporter.language as any).secondary.join(', ')}` : ''}`
                            : viewingSupporter.language || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Location Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">State</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.state_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">District</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.district_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Assembly</label>
                      <p className="text-sm text-gray-900">{viewingSupporter.assembly_name}</p>
                    </div>
                    {viewingSupporter.block_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Block</label>
                        <p className="text-sm text-gray-900">{viewingSupporter.block_name}</p>
                      </div>
                    )}
                    {viewingSupporter.mandal_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Mandal</label>
                        <p className="text-sm text-gray-900">{viewingSupporter.mandal_name}</p>
                      </div>
                    )}
                    {viewingSupporter.booth_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Booth</label>
                        <p className="text-sm text-gray-900">{viewingSupporter.booth_name}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Address</h4>
                  <p className="text-sm text-gray-900">{viewingSupporter.address}</p>
                </div>

                {/* Additional Information */}
                {viewingSupporter.remarks && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Remarks</h4>
                    <p className="text-sm text-gray-900">{viewingSupporter.remarks}</p>
                  </div>
                )}

                {/* Created Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Record Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Created At</label>
                      <p className="text-sm text-gray-900">
                        {new Date(viewingSupporter.created_at).toLocaleString()}
                      </p>
                    </div>
                    {viewingSupporter.created_by_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Created By</label>
                        <p className="text-sm text-gray-900">{viewingSupporter.created_by_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setViewingSupporter(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}