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
import { useTranslation } from "react-i18next";

interface RegistrationLinksListProps {
    links: RegistrationLink[];
    isLoading: boolean;
    onEdit: (link: RegistrationLink) => void;
    onDelete: (linkId: number) => void;
    onToggleStatus: (linkId: number, isActive: boolean) => void;
    selectedLinks?: number[];
    onSelectLink?: (linkId: number) => void;
    onSelectAll?: () => void;
    onBulkDelete?: () => void;
    onBulkToggleStatus?: (isActive: boolean) => void;
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
    onBulkDelete,
    onBulkToggleStatus,
}) => {
    const {t} = useTranslation();
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
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-[var(--text-color)]">
                    {t("RegistrationLinksList.Inactive")}
                </span>
            );
        }

        if (isExpired(link.expires_at)) {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {t("RegistrationLinksList.Expired")}
                </span>
            );
        }

        return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {t("RegistrationLinksList.Active")}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="bg-[var(--bg-card)] rounded-lg shadow-md p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-[var(--text-secondary)]">{t("RegistrationLinksList.Loading")}</span>
                </div>
            </div>
        );
    }

    if (links.length === 0) {
        return (
            <div className="bg-[var(--bg-card)] rounded-lg shadow-md p-8 text-center">
                <Users className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">{t("RegistrationLinksList.Desc")}</h3>
                <p className="text-[var(--text-secondary)] mb-4">
                    {t("RegistrationLinksList.Desc1")}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Bulk Selection Header */}
            {onSelectAll && onSelectLink && (
                <div className="bg-[var(--bg-card)] rounded-lg shadow-md border border-[var(--border-color)] p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={selectedLinks.length === links.length && links.length > 0}
                                onChange={onSelectAll}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-[var(--text-secondary)]">
                                {selectedLinks.length > 0
                                    ? `${selectedLinks.length} selected`
                                    : "Select all"
                                }
                            </span>
                        </div>

                        {/* Bulk Actions */}
                        {selectedLinks.length > 0 && onBulkToggleStatus && onBulkDelete && (
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => onBulkToggleStatus(true)}
                                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                                >
                                    {t("RegistrationLinksList.Activate")}
                                </button>
                                <button
                                    onClick={() => onBulkToggleStatus(false)}
                                    className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors"
                                >
                                    {t("RegistrationLinksList.Deactivate")}
                                </button>
                                <button
                                    onClick={onBulkDelete}
                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                                >
                                    {t("RegistrationLinksList.Delete")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {links.map((link) => (
                <div
                    key={link.link_id}
                    className="bg-[var(--bg-card)] rounded-lg shadow-md border border-[var(--border-color)] overflow-hidden"
                >
                    <div className="p-4 sm:p-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                            <div className="flex items-start gap-3 flex-1">
                                {/* Selection Checkbox */}
                                {onSelectLink && (
                                    <input
                                        type="checkbox"
                                        checked={selectedLinks.includes(link.link_id)}
                                        onChange={() => onSelectLink(link.link_id)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                                    />
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-[var(--text-color)] truncate">
                                            {link.party_full_name || link.party_name}
                                        </h3>
                                        {getStatusBadge(link)}
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-[var(--text-secondary)]">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">
                                                {link.state_full_name || link.state_name}
                                                {link.district_name && ` → ${link.district_full_name || link.district_name}`}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4 flex-shrink-0" />
                                            <span className="truncate">
                                                {link.expires_at ? (
                                                    <>
                                                        {t("RegistrationLinksList.Expires")}: {formatDate(link.expires_at)}
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
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => onToggleStatus(link.link_id, link.isActive === 0)}
                                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 rounded-md transition-colors"
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
                                    className="p-2 text-[var(--text-secondary)] hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Edit link"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => onDelete(link.link_id)}
                                    className="p-2 text-[var(--text-secondary)] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Delete link"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Registration URL */}
                        <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-md p-4">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">
                                        {t("RegistrationLinksList.Registration_URL")}
                                    </p>
                                    <p className="text-sm text-[var(--text-secondary)] break-all font-mono">
                                        {link.registration_url}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => copyToClipboard(link.registration_url)}
                                        className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                                        title="Copy to clipboard"
                                    >
                                        {copiedLink === link.registration_url ? (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                {t("RegistrationLinksList.Copied")}
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4" />
                                                {t("RegistrationLinksList.Copy")}
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => openInNewTab(link.registration_url)}
                                        className="flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                                        title="Open in new tab"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        {t("RegistrationLinksList.Preview")}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-[var(--text-secondary)]">
                            <div className="truncate">
                                <span className="font-medium">{t("RegistrationLinksList.Created_by")}</span>{" "}
                                {link.first_name && link.last_name
                                    ? `${link.first_name} ${link.last_name}`
                                    : link.created_by_email || `User ${link.created_by}`}
                            </div>

                            <div className="truncate">
                                <span className="font-medium">{t("RegistrationLinksList.Created")}</span>{" "}
                                {formatDate(link.created_at)}
                            </div>

                            <div className="truncate">
                                <span className="font-medium">{t("RegistrationLinksList.Last_updated")}</span>{" "}
                                {formatDate(link.updated_at)}
                            </div>
                        </div>

                        {/* Token (for debugging - can be removed in production) */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="mt-2 text-xs text-[var(--text-secondary)] break-all">
                                <span className="font-medium">{t("RegistrationLinksList.Token")}</span> {link.link_token}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};


