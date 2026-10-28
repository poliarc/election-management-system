import { useState } from "react";
import type { FC } from "react";
import toast from "react-hot-toast";
import {
  ExternalLink,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  HeartHandshake,
} from "lucide-react";
import type { WhatsAppGroupItem } from "../../../store/api/whatsappManagerApi";
import { useDeleteWhatsappLinkMutation } from "../../../store/api/whatsappManagerApi";

interface WhatsAppLinksTableProps {
  groups: WhatsAppGroupItem[];
  isLoading: boolean;
  activeLevel: "State" | "District" | "Assembly";
}

export const WhatsAppLinksTable: FC<WhatsAppLinksTableProps> = ({
  groups,
  isLoading,
  activeLevel,
}) => {
  const [deleteLink, { isLoading: isDeleting }] = useDeleteWhatsappLinkMutation();
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (id: number, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    toast.success("WhatsApp link copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to remove the group "${name}"?`)) {
      try {
        await deleteLink(id).unwrap();
        toast.success("Group link removed successfully");
      } catch (err: any) {
        toast.error(err?.data?.message || "Failed to remove group link");
      }
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case "State":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            State Level
          </span>
        );
      case "District":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            District Level
          </span>
        );
      case "Assembly":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            Assembly Level
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--bg-main)] text-[var(--text-secondary)] border border-[var(--border-color)]">
            {level}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-[var(--text-secondary)]">Loading WhatsApp groups...</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="p-12 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
        <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-[var(--text-color)] mb-1">
          No {activeLevel} Level Groups Created Yet
        </h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          Create the first official WhatsApp support group for this level using the form above. Once created, it will be published to the public directory immediately.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border-color)] text-left text-sm">
          <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)]">
            <tr>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">Group Details</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">Level & Scope</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">Location Jurisdiction</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">Invite Link</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider">Created</th>
              <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-color)]">
            {groups.map((group) => {
              const locationDisplay =
                group.level_type === "State"
                  ? group.state_name || "All Districts"
                  : group.level_type === "District"
                    ? `${group.district_name || "District"}, ${group.state_name || ""}`
                    : `${group.assembly_name || "Assembly"}, ${group.district_name || ""}`;

              return (
                <tr
                  key={group.id}
                  className="hover:bg-[var(--bg-main)]/60 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold text-[var(--text-color)] flex items-center gap-2">
                      <span>{group.group_name}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        <HeartHandshake className="h-3 w-3" />
                        {group.group_type || "Support"}
                      </span>
                    </div>
                    {group.description && (
                      <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-1">
                        {group.description}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">{getLevelBadge(group.level_type)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-color)] font-medium">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                      <span>{locationDisplay}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <a
                        href={group.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-color)] hover:bg-[var(--bg-hover)] text-xs font-medium transition-colors"
                        title="Test & open WhatsApp group in new tab"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Test Link</span>
                      </a>
                      <button
                        onClick={() => handleCopy(group.id, group.link)}
                        className="p-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-color)] hover:bg-[var(--bg-hover)] transition-colors"
                        title="Copy invite link"
                      >
                        {copiedId === group.id ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(group.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleDelete(group.id, group.group_name)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-medium transition-colors"
                      title="Delete group"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
