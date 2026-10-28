import { useState, type FC, type MouseEvent } from "react";
import toast from "react-hot-toast";
import {
  ExternalLink,
  Copy,
  Check,
  Share2,
  MapPin,
} from "lucide-react";
import type { WhatsAppGroupItem } from "../../../store/api/whatsappManagerApi";

interface GroupCardProps {
  group: WhatsAppGroupItem;
}

export const GroupCard: FC<GroupCardProps> = ({ group }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(group.link);
    setCopied(true);
    toast.success("WhatsApp link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: group.group_name,
          text: `Join the official WhatsApp group for ${group.group_name}:`,
          url: group.link,
        });
      } catch {
        // User dismissed share dialog
      }
    } else {
      handleCopy(e);
    }
  };

  const getLevelBadge = () => {
    switch (group.level_type) {
      case "State":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            State Level
          </span>
        );
      case "District":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            District Level
          </span>
        );
      case "Assembly":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            Assembly Level
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            {group.level_type}
          </span>
        );
    }
  };

  // Build clean location breadcrumb string
  const locationHierarchy = [
    group.state_name,
    group.level_type !== "State" ? group.district_name : null,
    group.level_type === "Assembly" ? group.assembly_name : null,
    group.sub_level_name,
  ]
    .filter(Boolean)
    .join(" › ");

  return (
    <div className="flex flex-col justify-between rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all group">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {getLevelBadge()}
          {group.group_type && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              {group.group_type}
            </span>
          )}
        </div>

        {/* Group Title */}
        <h3 className="text-base font-bold text-[var(--text-color)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
          {group.group_name}
        </h3>

        {/* Location Breadcrumb */}
        {locationHierarchy && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mt-2 font-medium">
            <MapPin className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
            <span className="truncate">{locationHierarchy}</span>
          </div>
        )}

        {/* Description */}
        {group.description && (
          <p className="text-xs text-[var(--text-secondary)] mt-2.5 line-clamp-2">
            {group.description}
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-[var(--border-color)] flex items-center gap-2">
        <a
          href={group.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm"
        >
          {/* WhatsApp SVG Icon */}
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12 0 2.15.57 4.168 1.564 5.914l-1.656 6.05 6.224-1.633c1.7 1.002 3.684 1.579 5.868 1.579 6.627 0 12-5.373 12-12s-5.373-12-12-12z" />
          </svg>
          <span>Join Group</span>
          <ExternalLink className="h-3.5 w-3.5 opacity-80" />
        </a>

        <button
          onClick={handleCopy}
          title="Copy WhatsApp Link"
          className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-color)] transition-colors"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>

        <button
          onClick={handleShare}
          title="Share WhatsApp Group"
          className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-color)] transition-colors hidden sm:inline-flex"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
