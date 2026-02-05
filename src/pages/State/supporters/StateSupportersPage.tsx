import { useState, useEffect } from 'react';
import { useAppSelector } from '../../../store/hooks';
import { useGetAssemblyByStateQuery } from '../../../store/api/assemblyApi';
import { useGetSupportersByAssemblyQuery } from '../../../store/api/supportersApi';
import type { Supporter } from '../../../types/supporter';
import toast from 'react-hot-toast';

interface AssemblyOption {
  id: number;
  levelName: string;
  displayName: string;
  stateMasterData_id?: number;
}

export default function StateSupportersPage() {
  const { user, selectedAssignment } = useAppSelector((s) => s.auth);
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingSupporter, setViewingSupporter] = useState<Supporter | null>(null);

  const stateId = user?.state_id || selectedAssignment?.stateMasterData_id || 0;
  const partyId = user?.partyId || 0;

  // Get assemblies for the state
  const { data: assembliesData, isLoading: assembliesLoading, error: assembliesError } = useGetAssemblyByStateQuery({
    state_id: stateId,
    party_id: partyId,
  }, {
    skip: !stateId || !partyId,
  });

  // Get supporters for selected assembly
  const { data: supportersData, isLoading: supportersLoading, refetch } = useGetSupportersByAssemblyQuery({
    assemblyId: selectedAssemblyId,
    page: currentPage,
    limit: 10,
    search: searchTerm,
  }, {
    skip: !selectedAssemblyId,
  });

  const assemblies: AssemblyOption[] = assembliesData?.data?.stateHierarchy?.filter(
    (item: any) => item.levelType === 'Assembly'
  ).map((item: any) => ({
    id: item.stateMasterData_id || item.id,
    levelName: item.levelName,
    displayName: item.levelName,
    stateMasterData_id: item.stateMasterData_id || item.id
  })) || [];

  const supporters = supportersData?.data || [];
  const pagination = supportersData?.pagination;

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedAssemblyId) {
        setCurrentPage(1);
        refetch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedAssemblyId, refetch]);

  const handleAssemblyChange = (assemblyId: number) => {
    setSelectedAssemblyId(assemblyId);
    setCurrentPage(1);
    setSearchTerm('');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleExportExcel = async () => {
    if (!selectedAssemblyId) {
      toast.error('Please select an assembly first before exporting.');
      return;
    }

    const exportButton = document.querySelector('[data-export-button]') as HTMLButtonElement;
    
    try {
      // Show loading state
      if (exportButton) {
        exportButton.disabled = true;
        exportButton.innerHTML = `
          <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Exporting...
        `;
      }

      // Check if we have a valid API base URL
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      if (!apiBaseUrl) {
        toast.error('API base URL is not configured. Please contact support.');
        return;
      }

      // Check if we have a valid token
      const token = localStorage.getItem('auth_access_token');
      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      console.log('Exporting supporters for assembly:', selectedAssemblyId);

      let allSupporters: Supporter[] = [];
      let currentPage = 1;
      const pageSize = 100; // Maximum allowed by API
      let totalPages = 1;

      // Fetch all supporters using pagination
      do {
        console.log(`Fetching page ${currentPage} of supporters...`);
        
        const exportResponse = await fetch(
          `${apiBaseUrl}/api/supporters/assembly/${selectedAssemblyId}?page=${currentPage}&limit=${pageSize}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log(`Page ${currentPage} response status:`, exportResponse.status);

        if (!exportResponse.ok) {
          let errorMessage = `HTTP ${exportResponse.status}`;
          try {
            const errorData = await exportResponse.json();
            errorMessage = errorData.message || errorMessage;
            console.error('API Error Details:', errorData);
          } catch {
            try {
              const errorText = await exportResponse.text();
              errorMessage = errorText || errorMessage;
            } catch {
              // Keep the HTTP status message
            }
          }
          throw new Error(`API Error on page ${currentPage}: ${errorMessage}`);
        }

        const exportData = await exportResponse.json();
        console.log(`Page ${currentPage} data received:`, {
          success: exportData.success,
          dataCount: exportData.data?.length || 0,
          pagination: exportData.pagination
        });
        
        if (!exportData.success) {
          throw new Error(exportData.message || `API returned unsuccessful response on page ${currentPage}`);
        }

        const pageData = exportData.data || [];
        allSupporters = [...allSupporters, ...pageData];

        // Update pagination info
        if (exportData.pagination) {
          totalPages = exportData.pagination.pages || 1;
          console.log(`Page ${currentPage}/${totalPages} completed. Total supporters so far: ${allSupporters.length}`);
        } else {
          // If no pagination info, assume this is the last page
          break;
        }

        currentPage++;

        // Update button text to show progress
        if (exportButton && totalPages > 1) {
          exportButton.innerHTML = `
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Page ${currentPage-1}/${totalPages} (${allSupporters.length} records)
          `;
        }

      } while (currentPage <= totalPages);

      console.log('All pages fetched. Total supporters to export:', allSupporters.length);

      if (allSupporters.length === 0) {
        toast.error('No supporters found to export for this assembly.');
        return;
      }

      // Create CSV content with proper escaping
      const headers = [
        'Serial No', 'Initials', 'First Name', 'Last Name', 'Father Name', 'Age', 'Gender',
        'Phone', 'WhatsApp', 'EPIC ID', 'Address', 'Languages', 'Religion', 'Category', 'Caste',
        'Assembly', 'Block', 'Mandal', 'Booth', 'Created At'
      ];

      const csvRows = allSupporters.map((supporter: Supporter, index: number) => {
        // Helper function to escape CSV values and prevent scientific notation
        const escapeCSV = (value: any, isNumeric: boolean = false) => {
          if (value === null || value === undefined) return '';
          const str = String(value);
          
          // For numeric fields like phone numbers, add a tab character to force text format
          if (isNumeric && str.length > 0) {
            return `"${str}"`;
          }
          
          if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        // Handle language field properly
        let languageStr = '';
        if (Array.isArray(supporter.language)) {
          languageStr = supporter.language.join('; ');
        } else if (typeof supporter.language === 'object' && supporter.language !== null) {
          const langObj = supporter.language as any;
          languageStr = langObj.primary || '';
          if (langObj.secondary && Array.isArray(langObj.secondary)) {
            languageStr += langObj.secondary.length > 0 ? `; ${langObj.secondary.join('; ')}` : '';
          }
        } else {
          languageStr = supporter.language || '';
        }

        return [
          escapeCSV(index + 1), // Serial number
          escapeCSV(supporter.initials),
          escapeCSV(supporter.first_name),
          escapeCSV(supporter.last_name),
          escapeCSV(supporter.father_name),
          escapeCSV(supporter.age),
          escapeCSV(supporter.gender),
          escapeCSV(supporter.phone_no, true), // Force text format for phone
          escapeCSV(supporter.whatsapp_no, true), // Force text format for WhatsApp
          escapeCSV(supporter.voter_epic_id, true), // Force text format for EPIC ID
          escapeCSV(supporter.address),
          escapeCSV(languageStr),
          escapeCSV(supporter.religion),
          escapeCSV(supporter.category),
          escapeCSV(supporter.caste),
          escapeCSV(supporter.assembly_name),
          escapeCSV(supporter.block_name),
          escapeCSV(supporter.mandal_name),
          escapeCSV(supporter.booth_name),
          escapeCSV(supporter.created_at ? new Date(supporter.created_at).toLocaleDateString() : '')
        ].join(',');
      });

      const csvContent = [headers.join(','), ...csvRows].join('\n');

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Check if blob was created successfully
      if (blob.size === 0) {
        throw new Error('Failed to create export file - no data to export');
      }

      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Get assembly name for filename
      const selectedAssembly = assemblies.find(a => a.id === selectedAssemblyId);
      const assemblyName = selectedAssembly?.levelName || `Assembly_${selectedAssemblyId}`;
      const sanitizedAssemblyName = assemblyName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `supporters_${sanitizedAssemblyName}_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('Export completed successfully');
      // Show success toast
      toast.success(`Successfully exported ${allSupporters.length} supporters to ${filename}`);

    } catch (error) {
      console.error('Export failed:', error);
      
      // Provide more specific error messages based on the error type
      let userMessage = 'Failed to export data. ';
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('authentication') || errorMsg.includes('token') || errorMsg.includes('401')) {
          userMessage += 'Please login again and try again.';
        } else if (errorMsg.includes('403') || errorMsg.includes('forbidden')) {
          userMessage += 'You do not have permission to export data for this assembly.';
        } else if (errorMsg.includes('404') || errorMsg.includes('not found')) {
          userMessage += 'The assembly or data was not found. Please try selecting a different assembly.';
        } else if (errorMsg.includes('500') || errorMsg.includes('server error')) {
          userMessage += 'Server error occurred. Please try again later.';
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          userMessage += 'Network error. Please check your internet connection and try again.';
        } else if (errorMsg.includes('validation') || errorMsg.includes('too big') || errorMsg.includes('limit')) {
          userMessage += 'API validation error. The system is now using pagination to handle large datasets.';
        } else {
          userMessage += `Error: ${error.message}`;
        }
      } else {
        userMessage += 'An unknown error occurred. Please try again.';
      }
      
      toast.error(userMessage);
    } finally {
      // Reset button state
      if (exportButton) {
        exportButton.disabled = false;
        exportButton.innerHTML = `
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <polyline points="7,10 12,15 17,10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <line x1="12" y1="15" x2="12" y2="3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Export Excel
        `;
      }
    }
  };

  const getFullName = (supporter: Supporter) => {
    return `${supporter.initials || ''} ${supporter.first_name || ''} ${supporter.last_name || ''}`.trim();
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Supporters Management</h1>
          <p className="text-gray-600">View and manage supporters across assemblies</p>
        </div>

        {/* Assembly Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between">
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Assembly *
              </label>
              <select
                value={selectedAssemblyId}
                onChange={(e) => handleAssemblyChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={assembliesLoading}
              >
                <option value={0}>
                  {assembliesLoading 
                    ? 'Loading assemblies...' 
                    : assembliesError 
                      ? 'Error loading assemblies' 
                      : assemblies.length === 0 
                        ? 'No assemblies found' 
                        : 'Select an assembly'}
                </option>
                {assemblies.map((assembly) => (
                  <option key={assembly.id} value={assembly.id}>
                    {assembly.displayName || assembly.levelName}
                  </option>
                ))}
              </select>
              {assembliesError && (
                <p className="text-red-500 text-xs mt-1">
                  Error: {(assembliesError as any)?.message || 'Failed to load assemblies'}
                </p>
              )}
              {!assembliesLoading && !assembliesError && assemblies.length === 0 && (
                <p className="text-gray-500 text-xs mt-1">
                  No assemblies found for this state. Please check your permissions.
                </p>
              )}
            </div>

            {/* Search Supporters - Same Row */}
            {selectedAssemblyId > 0 && (
              <div className="flex-1 max-w-md">
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
            )}

            {/* Export Button */}
            {selectedAssemblyId > 0 && (
              <div className="flex gap-3">
                <button
                  data-export-button
                  onClick={handleExportExcel}
                  disabled={supportersLoading || supporters.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  title={supporters.length === 0 ? "No supporters available to export" : "Export supporters to CSV file"}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="7,10 12,15 17,10" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="15" x2="12" y2="3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Export Excel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Supporters List */}
        {selectedAssemblyId > 0 && (
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
        )}

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