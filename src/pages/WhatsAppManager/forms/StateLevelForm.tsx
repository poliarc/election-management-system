import { useState, type FC, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Send, MapPin, Link as LinkIcon, HeartHandshake, CheckCircle2 } from "lucide-react";
import { useCreateWhatsappLinkMutation } from "../../../store/api/whatsappManagerApi";
import { useAppSelector } from "../../../store/hooks";

interface StateLevelFormProps {
  stateId: number;
  stateName: string;
  onSuccess?: () => void;
}

export const StateLevelForm: FC<StateLevelFormProps> = ({
  stateId,
  stateName,
  onSuccess,
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [createLink, { isLoading }] = useCreateWhatsappLinkMutation();

  const [groupName, setGroupName] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [description, setDescription] = useState("");

  const isValidUrl = (url: string) => {
    return (
      url.startsWith("https://chat.whatsapp.com/") ||
      url.startsWith("http://chat.whatsapp.com/") ||
      url.includes("wa.me/")
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      toast.error("Please enter a WhatsApp group name");
      return;
    }

    if (!whatsappLink.trim()) {
      toast.error("Please enter a WhatsApp invite link");
      return;
    }

    if (!isValidUrl(whatsappLink.trim())) {
      toast.error("Please enter a valid WhatsApp invite link (https://chat.whatsapp.com/...)");
      return;
    }

    try {
      await createLink({
        level_type: "State",
        state_id: stateId,
        district_id: null,
        assembly_id: null,
        group_name: groupName.trim(),
        link: whatsappLink.trim(),
        group_type: "Support",
        description: description.trim() || null,
        created_by: user?.id ? Number(user.id) : null,
      }).unwrap();

      toast.success("State-level Support WhatsApp group created successfully!");
      setGroupName("");
      setWhatsappLink("");
      setDescription("");
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create WhatsApp group");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* State Scope Card */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Active Level:
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" /> State Level
              </span>
            </div>
            <div className="text-base font-bold text-[var(--text-color)] mt-0.5">
              Target State: {stateName || `State #${stateId}`}
            </div>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] font-medium self-start sm:self-auto">
          Statewide Support Scope
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Group Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder={`e.g. ${stateName || "State"} Official Support Group`}
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-color)] text-sm placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Group Type
          </label>
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-color)] text-sm font-semibold">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Support</span>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              Support Only
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
          WhatsApp Group Invite Link <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-secondary)]">
            <LinkIcon className="h-4 w-4" />
          </div>
          <input
            type="url"
            required
            placeholder="https://chat.whatsapp.com/AbCdEfGhIjK12345"
            value={whatsappLink}
            onChange={(e) => setWhatsappLink(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-color)] text-sm placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5">
          Paste the official invite link copied from WhatsApp group settings (e.g. https://chat.whatsapp.com/...).
        </p>
      </div>



      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Create State Support Group</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
