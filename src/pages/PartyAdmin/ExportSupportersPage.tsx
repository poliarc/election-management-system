import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Download, MapPin, Loader2 } from "lucide-react";
import { useGetAllStateMasterDataQuery } from "../../store/api/stateMasterApi";
import toast from "react-hot-toast";
import type { Supporter } from "../../types/supporter";

export const ExportSupportersPage: React.FC = () => {
    const { partyId } = useParams<{ partyId: string }>();
    const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const { data: stateMasterData = [], isLoading } = useGetAllStateMasterDataQuery();

    // Filter only active states
    const states = stateMasterData.filter(
        (item) => item.levelType === "State" && item.isActive === 1
    );

    const handleExport = async (stateId: number) => {
        if (!partyId) {
            toast.error('Party ID not found. Please try again.');
            return;
        }

        setSelectedStateId(stateId);
        setIsExporting(true);

        try {
            toast.loading('Starting export...', { id: 'export-toast' });

            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            if (!apiBaseUrl) {
                toast.error('API base URL is not configured. Please contact support.', { id: 'export-toast' });
                return;
            }

            const token = localStorage.getItem('auth_access_token');
            if (!token) {
                toast.error('Authentication token not found. Please login again.', { id: 'export-toast' });
                return;
            }

            const exportEndpoint = `${apiBaseUrl}/api/supporters/party/${partyId}/state/${stateId}`;
            console.log('Exporting supporters from:', exportEndpoint);

            let allSupporters: Supporter[] = [];
            let currentPage = 1;
            const pageSize = 100;
            let totalPages = 1;

            // Fetch all supporters using pagination
            do {
                console.log(`Fetching page ${currentPage} of supporters...`);

                const params = new URLSearchParams({
                    page: currentPage.toString(),
                    limit: pageSize.toString(),
                });

                const exportResponse = await fetch(
                    `${exportEndpoint}?${params.toString()}`,
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

                if (exportData.pagination) {
                    totalPages = exportData.pagination.pages || 1;
                    console.log(`Page ${currentPage}/${totalPages} completed. Total supporters so far: ${allSupporters.length}`);

                    if (totalPages > 1) {
                        toast.loading(`Fetching page ${currentPage}/${totalPages} (${allSupporters.length} records)...`, { id: 'export-toast' });
                    }
                } else {
                    break;
                }

                currentPage++;

            } while (currentPage <= totalPages);

            console.log('All pages fetched. Total supporters to export:', allSupporters.length);

            if (allSupporters.length === 0) {
                toast.error('No supporters found to export.', { id: 'export-toast' });
                return;
            }

            // Create CSV content
            const headers = [
                'Serial No', 'Created By', 'Assembly', 'Initials', 'First Name', 'Last Name', 'Father Name', 'Age', 'Gender',
                'Phone', 'WhatsApp', 'EPIC ID', 'Languages', 'Religion', 'Category', 'Caste',
                 'Block', 'Mandal', 'Booth', 'Created At', 'Address',
            ];

            const csvRows = allSupporters.map((supporter: Supporter, index: number) => {
                const escapeCSV = (value: any, isNumeric: boolean = false) => {
                    if (value === null || value === undefined) return '';
                    const str = String(value);

                    if (isNumeric && str.length > 0) {
                        return `"${str}"`;
                    }

                    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                };

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
                    escapeCSV(index + 1),
                    escapeCSV(supporter.created_by_name || 'Unknown'),
                    escapeCSV(supporter.assembly_name),
                    escapeCSV(supporter.initials),
                    escapeCSV(supporter.first_name),
                    escapeCSV(supporter.last_name),
                    escapeCSV(supporter.father_name),
                    escapeCSV(supporter.age),
                    escapeCSV(supporter.gender),
                    escapeCSV(supporter.phone_no, true),
                    escapeCSV(supporter.whatsapp_no, true),
                    escapeCSV(supporter.voter_epic_id, true),
                    escapeCSV(languageStr),
                    escapeCSV(supporter.religion),
                    escapeCSV(supporter.category),
                    escapeCSV(supporter.caste),
                    escapeCSV(supporter.block_name),
                    escapeCSV(supporter.mandal_name),
                    escapeCSV(supporter.booth_name),
                    escapeCSV(supporter.created_at ? new Date(supporter.created_at).toLocaleDateString() : ''),
                     escapeCSV(supporter.address),
                ].join(',');
            });

            const csvContent = [headers.join(','), ...csvRows].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

            if (blob.size === 0) {
                throw new Error('Failed to create export file - no data to export');
            }

            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            const stateName = states.find(s => s.id === stateId)?.levelName || stateId;
            const filename = `supporters_${stateName}_${new Date().toISOString().split('T')[0]}.csv`;

            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            console.log('Export completed successfully');
            toast.success(`Successfully exported ${allSupporters.length} supporters to ${filename}`, { id: 'export-toast' });

        } catch (error) {
            console.error('Export failed:', error);

            let userMessage = 'Failed to export data. ';

            if (error instanceof Error) {
                const errorMsg = error.message.toLowerCase();

                if (errorMsg.includes('authentication') || errorMsg.includes('token') || errorMsg.includes('401')) {
                    userMessage += 'Please login again and try again.';
                } else if (errorMsg.includes('403') || errorMsg.includes('forbidden')) {
                    userMessage += 'You do not have permission to export data.';
                } else if (errorMsg.includes('404') || errorMsg.includes('not found')) {
                    userMessage += 'Data not found. Please try again later.';
                } else if (errorMsg.includes('500') || errorMsg.includes('server error')) {
                    userMessage += 'Server error occurred. Please try again later.';
                } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
                    userMessage += 'Network error. Please check your internet connection and try again.';
                } else {
                    userMessage += `Error: ${error.message}`;
                }
            } else {
                userMessage += 'An unknown error occurred. Please try again.';
            }

            toast.error(userMessage, { id: 'export-toast' });
        } finally {
            setIsExporting(false);
            setSelectedStateId(null);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Export</h1>
                <p className="text-gray-600 mt-2">
                    Select a state to export all supporters data
                </p>
            </div>  

            {/* States Grid */}
            <div className="bg-white rounded-lg shadow-md p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                        <span className="ml-3 text-gray-600">Loading states...</span>
                    </div>
                ) : states.length === 0 ? (
                    <div className="text-center py-12">
                        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No states available.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {states.map((state) => (
                            <div
                                key={state.id}
                                className="p-5 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                            <MapPin className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 text-lg">
                                                {state.levelName}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                State ID: {state.id}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleExport(state.id)}
                                    disabled={isExporting}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    {isExporting && selectedStateId === state.id ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Exporting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            <span>Export</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
