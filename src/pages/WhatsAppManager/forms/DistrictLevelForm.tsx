import { useState, useEffect, useMemo, type FC, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Send, MapPin, Link as LinkIcon, Building2, HeartHandshake, CheckCircle2 } from "lucide-react";
import { useCreateWhatsappLinkMutation } from "../../../store/api/whatsappManagerApi";

interface DistrictLevelFormProps {
  stateId: number;
  stateName: string;
  districts: Array<{ id: number; levelName: string }>;
  currentDistrictId?: number | null;
  onSuccess?: () => void;
}

export const DistrictLevelForm: FC<DistrictLevelFormProps> = ({
  stateId,
  stateName,
  districts,
  currentDistrictId,
  onSuccess,
}) => {
  const [createLink, { isLoading }] = useCreateWhatsappLinkMutation();

  const [selectedDistrictId, setSelectedDistrictId] = useState<number | "">("");
  const [groupName, setGroupName] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [description, setDescription] = useState("");

  // Auto-select current district on mount or when currentDistrictId / districts are ready
  useEffect(() => {
    if (currentDistrictId && districts.some((d) => d.id === currentDistrictId)) {
      setSelectedDistrictId(currentDistrictId);
    } else if (districts.length > 0 && selectedDistrictId === "") {
      setSelectedDistrictId(districts[0].id);
    }
  }, [currentDistrictId, districts]);

  // Find info about current assigned district and currently selected district
  const assignedDistrict = useMemo(() => {
    if (!currentDistrictId) return null;
    return districts.find((d) => d.id === currentDistrictId) || null;
  }, [currentDistrictId, districts]);

  const activeSelectedDistrict = useMemo(() => {
    if (!selectedDistrictId) return null;
    return districts.find((d) => d.id === Number(selectedDistrictId)) || null;
  }, [selectedDistrictId, districts]);

  const isValidUrl = (url: string) => {
    return (
      url.startsWith("https://chat.whatsapp.com/") ||
      url.startsWith("http://chat.whatsapp.com/") ||
      url.includes("wa.me/")
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedDistrictId) {
      toast.error("Please select a District");
      return;
    }

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
        level_type: "District",
        state_id: stateId,
        district_id: Number(selectedDistrictId),
        assembly_id: null,
        group_name: groupName.trim(),
        link: whatsappLink.trim(),
        group_type: "Support",
        description: description.trim() || null,
      }).unwrap();

      toast.success(
        `District Support WhatsApp group for ${activeSelectedDistrict?.levelName || "District"} created successfully!`
      );
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
      {/* Current District & Scope Banner */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Active Level:
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <CheckCircle2 className="h-3 w-3" /> District Level
              </span>
              {assignedDistrict && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                  Current Assigned: <strong>{assignedDistrict.levelName}</strong>
                </span>
              )}
            </div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              State: <strong className="text-[var(--text-color)]">{stateName}</strong> • Selected District:{" "}
              <strong className="text-blue-600 dark:text-blue-400">
                {activeSelectedDistrict ? activeSelectedDistrict.levelName : "None"}
              </strong>
            </div>
          </div>
        </div>

        <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] self-start md:self-auto max-w-sm">
          💡 You can create a group for your current district or choose any other district using the selector below.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State Display (Locked) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            State (Auto-Locked)
          </label>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-color)] text-sm opacity-90">
            <MapPin className="h-4 w-4 text-[var(--text-secondary)]" />
            <span>{stateName || `State #${stateId}`}</span>
          </div>
        </div>

        {/* District Selector (With navigation to other districts) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Choose District <span className="text-red-500">*</span>
            </label>
            {assignedDistrict && selectedDistrictId !== assignedDistrict.id && (
              <button
                type="button"
                onClick={() => setSelectedDistrictId(assignedDistrict.id)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Reset to Current ({assignedDistrict.levelName})
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-secondary)]">
              <Building2 className="h-4 w-4" />
            </div>
            <select
              required
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(e.target.value ? Number(e.target.value) : "")}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-color)] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            >
              <option value="">-- Choose Any District --</option>
              {districts.map((dist) => (
                <option key={dist.id} value={dist.id}>
                  {dist.levelName} {dist.id === currentDistrictId ? "★ (Current Assigned)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            Group Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder={
              activeSelectedDistrict
                ? `e.g. ${activeSelectedDistrict.levelName} District Support Group`
                : "e.g. District Support Group"
            }
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
          Paste the official invite link copied from WhatsApp group settings.
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
              <span>
                Create Support Group for {activeSelectedDistrict?.levelName || "District"}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
