import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Link, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { RegistrationLinkForm } from "./components/RegistrationLinkForm";
import { RegistrationLinksList } from "./components/RegistrationLinksList";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import {
    useGetRegistrationLinksByPartyQuery,
    useCreateRegistrationLinkMutation,
    useUpdateRegistrationLinkMutation,
    useDeleteRegistrationLinkMutation,
    useToggleRegistrationLinkStatusMutation,
    type RegistrationLink,
    type CreateRegistrationLinkRequest,
    type UpdateRegistrationLinkRequest,
    type RegistrationLinkSearchParams,
} from "../../store/api/registrationLinksApi";
import { useGetPartiesQuery } from "../../store/api/partyUserApi";

export const RegistrationLinksManager: React.FC = () => {
    const { partyId } = useParams<{ partyId: string }>();
    const [showForm, setShowForm] = useState(false);
    const [editingLink, setEditingLink] = useState<RegistrationLink | null>(null);
    const [selectedLinks, setSelectedLinks] = useState<number[]>([]);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        linkId: number | null;
        linkName: string;
        isBulk: boolean;
    }>({
        isOpen: false,
        linkId: null,
        linkName: "",
        isBulk: false,
    });
    const [searchParams, setSearchParams] = useState<Partial<RegistrationLinkSearchParams>>({
        page: 1,
        limit: 10,
        sort_by: 'created_at',
        order: 'desc',
    });

    // API hooks
    const {
        data: linksResponse,
        isLoading: isLoadingLinks,
        refetch,
    } = useGetRegistrationLinksByPartyQuery(
        {
            partyId: Number(partyId),
            params: searchParams,
        },
        {
            skip: !partyId || isNaN(Number(partyId)),
        }
    );

    const { data: partiesResponse } = useGetPartiesQuery();
    const [createLink, { isLoading: isCreating }] = useCreateRegistrationLinkMutation();
    const [updateLink, { isLoading: isUpdating }] = useUpdateRegistrationLinkMutation();
    const [deleteLink, { isLoading: isDeleting }] = useDeleteRegistrationLinkMutation();
    const [toggleStatus, { isLoading: isToggling }] = useToggleRegistrationLinkStatusMutation();

    const links = linksResponse?.data || [];
    const pagination = linksResponse?.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    };

    const parties = partiesResponse || [];
    const currentParty = parties.find((p) => p.party_id === Number(partyId));

    const handleSaveLink = async (linkData: CreateRegistrationLinkRequest | UpdateRegistrationLinkRequest) => {
        if (editingLink) {
            // Update existing link
            try {
                const updateData = linkData as UpdateRegistrationLinkRequest;

                await updateLink({
                    id: editingLink.link_id,
                    data: updateData,
                }).unwrap();

                toast.success("Registration link updated successfully!");
                setShowForm(false);
                setEditingLink(null);
                refetch();
            } catch (error: any) {
                const errorMessage = error?.data?.message || "Failed to update registration link";
                toast.error(errorMessage);
            }
        } else {
            // Create new link
            try {
                const createData = {
                    ...linkData,
                    party_id: Number(partyId),
                    party_name: currentParty?.partyName || (linkData as CreateRegistrationLinkRequest).party_name,
                } as CreateRegistrationLinkRequest;

                const result = await createLink(createData).unwrap();

                toast.success("Registration link created successfully!");
                setShowForm(false);
                refetch();

                // Show the generated URL
                if (result.data?.registration_url) {
                    toast.success(`Link created: ${result.data.registration_url}`, {
                        duration: 8000,
                    });
                }
            } catch (error: any) {
                const errorMessage = error?.data?.message || "Failed to create registration link";
                toast.error(errorMessage);
            }
        }
    };

    const handleEditLink = (link: RegistrationLink) => {
        setEditingLink(link);
        setShowForm(true);
    };

    const handleDeleteLink = async (linkId: number) => {
        const link = links.find(l => l.link_id === linkId);
        const linkName = link?.party_full_name || link?.party_name || `Link #${linkId}`;

        setDeleteModal({
            isOpen: true,
            linkId,
            linkName,
            isBulk: false,
        });
    };

    const confirmDelete = async () => {
        if (!deleteModal.linkId) return;

        try {
            await deleteLink(deleteModal.linkId).unwrap();
            toast.success("Registration link deleted successfully!");
            refetch();
            setDeleteModal({ isOpen: false, linkId: null, linkName: "", isBulk: false });
        } catch (error: any) {
            const errorMessage = error?.data?.message || "Failed to delete registration link";
            toast.error(errorMessage);
        }
    };

    const handleToggleStatus = async (linkId: number, isActive: boolean) => {
        try {
            await toggleStatus({ id: linkId, isActive }).unwrap();
            toast.success(
                `Registration link ${isActive ? "activated" : "deactivated"} successfully!`
            );
            refetch();
        } catch (error: any) {
            const errorMessage = error?.data?.message ||
                `Failed to ${isActive ? "activate" : "deactivate"} registration link`;
            toast.error(errorMessage);
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingLink(null);
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, linkId: null, linkName: "", isBulk: false });
    };

    const handleSearchChange = (newParams: Partial<RegistrationLinkSearchParams>) => {
        setSearchParams(prev => ({
            ...prev,
            ...newParams,
            page: newParams.page || 1, // Reset to page 1 when searching
        }));
    };

    // Bulk actions
    const handleSelectAll = () => {
        if (selectedLinks.length === links.length) {
            setSelectedLinks([]);
        } else {
            setSelectedLinks(links.map(link => link.link_id));
        }
    };

    const handleSelectLink = (linkId: number) => {
        setSelectedLinks(prev =>
            prev.includes(linkId)
                ? prev.filter(id => id !== linkId)
                : [...prev, linkId]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedLinks.length === 0) return;

        setDeleteModal({
            isOpen: true,
            linkId: null,
            linkName: `${selectedLinks.length} registration link(s)`,
            isBulk: true,
        });
    };

    const confirmBulkDelete = async () => {
        if (selectedLinks.length === 0) return;

        try {
            await Promise.all(selectedLinks.map(linkId => deleteLink(linkId).unwrap()));
            toast.success(`${selectedLinks.length} registration link(s) deleted successfully!`);
            setSelectedLinks([]);
            refetch();
            setDeleteModal({ isOpen: false, linkId: null, linkName: "", isBulk: false });
        } catch (error: any) {
            toast.error("Failed to delete some registration links");
        }
    };

    const handleBulkToggleStatus = async (isActive: boolean) => {
        if (selectedLinks.length === 0) return;

        try {
            await Promise.all(selectedLinks.map(linkId =>
                toggleStatus({ id: linkId, isActive }).unwrap()
            ));
            toast.success(`${selectedLinks.length} registration link(s) ${isActive ? 'activated' : 'deactivated'} successfully!`);
            setSelectedLinks([]);
            refetch();
        } catch (error: any) {
            toast.error(`Failed to ${isActive ? 'activate' : 'deactivate'} some registration links`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Link className="text-blue-600" />
                                Registration Links
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Manage registration links for {currentParty?.partyName || "your party"}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Bulk Actions */}
                            {selectedLinks.length > 0 && (
                                <div className="flex items-center gap-2 mr-4">
                                    <span className="text-sm text-gray-600">
                                        {selectedLinks.length} selected:
                                    </span>
                                    <button
                                        onClick={() => handleBulkToggleStatus(true)}
                                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                                    >
                                        Activate
                                    </button>
                                    <button
                                        onClick={() => handleBulkToggleStatus(false)}
                                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors"
                                    >
                                        Deactivate
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => setShowForm(true)}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Create Link
                            </button>
                        </div>
                    </div>
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="mb-6">
                        <RegistrationLinkForm
                            link={editingLink}
                            onSave={handleSaveLink}
                            onCancel={handleCloseForm}
                            isLoading={isCreating || isUpdating}
                            partyId={Number(partyId)}
                            partyName={currentParty?.partyName || ""}
                        />
                    </div>
                )}

                {/* Search and Filters */}
                {!showForm && (
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search by party, state, or district name..."
                                        value={searchParams.search || ""}
                                        onChange={(e) => handleSearchChange({ search: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Filters Row */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Status Filter */}
                                <div className="flex items-center gap-2">
                                    <Filter className="text-gray-400 w-4 h-4" />
                                    <select
                                        value={searchParams.isActive === undefined ? "all" : searchParams.isActive.toString()}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            handleSearchChange({
                                                isActive: value === "all" ? undefined : value === "true"
                                            });
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </div>

                                {/* Sort */}
                                <div className="flex items-center gap-2">
                                    <select
                                        value={`${searchParams.sort_by}_${searchParams.order}`}
                                        onChange={(e) => {
                                            const [sort_by, order] = e.target.value.split('_') as [any, 'asc' | 'desc'];
                                            handleSearchChange({ sort_by, order });
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="created_at_desc">Newest First</option>
                                        <option value="created_at_asc">Oldest First</option>
                                        <option value="expires_at_asc">Expiring Soon</option>
                                        <option value="expires_at_desc">Expiring Later</option>
                                        <option value="party_name_asc">Party A-Z</option>
                                        <option value="state_name_asc">State A-Z</option>
                                    </select>
                                </div>

                                {/* Page Size */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 whitespace-nowrap">Show:</span>
                                    <select
                                        value={searchParams.limit || 10}
                                        onChange={(e) => handleSearchChange({
                                            limit: Number(e.target.value),
                                            page: 1 // Reset to first page when changing page size
                                        })}
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Results count and quick actions */}
                        <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="text-sm text-gray-600">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} registration links
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => refetch()}
                                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Refresh
                                </button>
                                {searchParams.search && (
                                    <button
                                        onClick={() => handleSearchChange({ search: "" })}
                                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                                    >
                                        Clear Search
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Links List */}
                {!showForm && (
                    <RegistrationLinksList
                        links={links}
                        isLoading={isLoadingLinks || isDeleting || isToggling}
                        onEdit={handleEditLink}
                        onDelete={handleDeleteLink}
                        onToggleStatus={handleToggleStatus}
                        selectedLinks={selectedLinks}
                        onSelectLink={handleSelectLink}
                        onSelectAll={handleSelectAll}
                    />
                )}

                {/* Enhanced Pagination */}
                {!showForm && pagination.totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                        <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-md">
                            {/* Previous Button */}
                            <button
                                onClick={() => handleSearchChange({ page: pagination.page - 1 })}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                Previous
                            </button>

                            {/* Page Numbers */}
                            <div className="flex items-center gap-1">
                                {/* First page */}
                                {pagination.page > 3 && (
                                    <>
                                        <button
                                            onClick={() => handleSearchChange({ page: 1 })}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            1
                                        </button>
                                        {pagination.page > 4 && (
                                            <span className="px-2 text-gray-500">...</span>
                                        )}
                                    </>
                                )}

                                {/* Current page and neighbors */}
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (pagination.totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (pagination.page <= 3) {
                                        pageNum = i + 1;
                                    } else if (pagination.page >= pagination.totalPages - 2) {
                                        pageNum = pagination.totalPages - 4 + i;
                                    } else {
                                        pageNum = pagination.page - 2 + i;
                                    }

                                    if (pageNum < 1 || pageNum > pagination.totalPages) return null;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handleSearchChange({ page: pageNum })}
                                            className={`px-3 py-2 border rounded-md transition-colors ${pageNum === pagination.page
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}

                                {/* Last page */}
                                {pagination.page < pagination.totalPages - 2 && (
                                    <>
                                        {pagination.page < pagination.totalPages - 3 && (
                                            <span className="px-2 text-gray-500">...</span>
                                        )}
                                        <button
                                            onClick={() => handleSearchChange({ page: pagination.totalPages })}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            {pagination.totalPages}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={() => handleSearchChange({ page: pagination.page + 1 })}
                                disabled={pagination.page >= pagination.totalPages}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                Next
                            </button>

                            {/* Page Info */}
                            <div className="ml-4 px-4 py-2 text-sm text-gray-600 font-medium border-l border-gray-300">
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {!showForm && isLoadingLinks && searchParams.page === 1 && (
                    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
                        <div className="bg-white rounded-lg p-6 shadow-xl">
                            <div className="flex items-center gap-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="text-gray-700">Loading registration links...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={deleteModal.isBulk ? confirmBulkDelete : confirmDelete}
                title="Delete Registration Link"
                message={
                    deleteModal.isBulk
                        ? `Are you sure you want to delete ${deleteModal.linkName}? This action cannot be undone and will permanently remove the selected registration links.`
                        : `Are you sure you want to delete the registration link for "${deleteModal.linkName}"? This action cannot be undone and users will no longer be able to register using this link.`
                }
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                isLoading={isDeleting}
            />
        </div>
    );
};