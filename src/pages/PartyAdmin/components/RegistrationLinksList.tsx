import React, { useState } from "react";
import {
    Edit,
    Trash2,
    Copy,
    ExternalLink,
    CheckCircle,
    Calendar,
    MapPin,
    Users,
    ToggleLeft,
    ToggleRight,
    AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import type { RegistrationLink } from "../../../store/api/registrationLinksApi";

interface RegistrationLinksListProps {
    links: RegistrationLink[];
    isLoading: boolean;
    onEdit: (link: RegistrationLink) => void;
    onDelete: (linkId: number) => void;
    onToggleStatus: (linkId: number, isActive: boolean) => void;
    selectedLinks?: number[];
    onSelectLink?: (linkId: number) => void;
    onSelectAll?: () => void;
}

export const RegistrationLinksList: React.FC<RegistrationLinksListProps> = ({
    links,
    isLoading,
    onEdit,
    onDelete,
    onToggleStatus,
    selectedLinks = [],
    onSelectLink,
    onSelectAll,
}) => {
    const [copiedLink, setCopiedLink] = useState<string>("");

    const copyToClipboard = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopiedLink(url);
            toast.success("Link copied to clipboard!");

            // Reset copied state after 3 seconds
            setTimeout(() => {
                setCopiedLink("");
            }, 3000);
        } catch (error) {
            toast.error("Failed to copy link");
        }
    };

    const openInNewTab = (url: string) => {
        window.open(url, "_blank");
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Never";
        return new Date(dateString).toLocaleString();
    };

    const isExpired = (expiresAt: string | null) => {
        if (!expiresAt) return false;
        return new Date(expiresAt) < new Date();
    };

    const getStatusBadge = (link: RegistrationLink) => {
        if (link.isActive === 0) {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Inactive
                </span>
            );
        }

        if (isExpired(link.expires_at)) {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Expired
                </span>
            );
        }

        return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading registration links...</span>
                </div>
            </div>
        );
    }

    if (links.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Registration Links</h3>
                <p className="text-gray-600 mb-4">
                    You haven't created any registration links yet. Create your first link to start onboarding users.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Bulk Selection Header */}
            {onSelectAll && onSelectLink && (
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={selectedLinks.length === links.length && links.length > 0}
                                onChange={onSelectAll}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                {selectedLinks.length > 0
                                    ? `${selectedLinks.length} selected`
                                    : "Select all"
                                }
                            </span>
                        </div>

                        {selectedLinks.length > 0 && (
                            <div className="text-sm text-gray-600">
                                Use bulk actions in the header to manage selected links
                            </div>
                        )}
                    </div>
                </div>
            )}

            {links.map((link) => (
                <div
                    key={link.link_id}
                    className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                >
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3">
                                {/* Selection Checkbox */}
                                {onSelectLink && (
                                    <input
                                        type="checkbox"
                                        checked={selectedLinks.includes(link.link_id)}
                                        onChange={() => onSelectLink(link.link_id)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                                    />
                                )}

                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {link.party_full_name || link.party_name}
                                        </h3>
                                        {getStatusBadge(link)}
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            <span>
                                                {link.state_full_name || link.state_name}
                                                {link.district_name && ` → ${link.district_full_name || link.district_name}`}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                {link.expires_at ? (
                                                    <>
                                                        Expires: {formatDate(link.expires_at)}
                                                        {isExpired(link.expires_at) && (
                                                            <AlertTriangle className="inline w-4 h-4 text-red-500 ml-1" />
                                                        )}
                                                    </>
                                                ) : (
                                                    "No expiration"
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onToggleStatus(link.link_id, link.isActive === 0)}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                    title={link.isActive === 1 ? "Deactivate link" : "Activate link"}
                                >
                                    {link.isActive === 1 ? (
                                        <ToggleRight className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <ToggleLeft className="w-5 h-5" />
                                    )}
                                </button>

                                <button
                                    onClick={() => onEdit(link)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Edit link"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => onDelete(link.link_id)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Delete link"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Registration URL */}
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                        Registration URL:
                                    </p>
                                    <p className="text-sm text-gray-600 break-all font-mono">
                                        {link.registration_url}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copyToClipboard(link.registration_url)}
                                        className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                                        title="Copy to clipboard"
                                    >
                                        {copiedLink === link.registration_url ? (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => openInNewTab(link.registration_url)}
                                        className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                                        title="Open in new tab"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Preview
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                                <span className="font-medium">Created by:</span>{" "}
                                {link.first_name && link.last_name
                                    ? `${link.first_name} ${link.last_name}`
                                    : link.created_by_email || `User ${link.created_by}`}
                            </div>

                            <div>
                                <span className="font-medium">Created:</span>{" "}
                                {formatDate(link.created_at)}
                            </div>

                            <div>
                                <span className="font-medium">Last updated:</span>{" "}
                                {formatDate(link.updated_at)}
                            </div>
                        </div>

                        {/* Token (for debugging - can be removed in production) */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-2 text-xs text-gray-500">
                                <span className="font-medium">Token:</span> {link.link_token}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};