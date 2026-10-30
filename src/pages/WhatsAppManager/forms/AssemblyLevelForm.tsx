import { useState, useEffect, useMemo, type FC, type FormEvent, type ChangeEvent } from "react";
import toast from "react-hot-toast";
import { Send, MapPin, Link as LinkIcon, Building2, Landmark, HeartHandshake, CheckCircle2 } from "lucide-react";
import { useCreateWhatsappLinkMutation } from "../../../store/api/whatsappManagerApi";
import { useAppSelector } from "../../../store/hooks";
import type { StateMasterData } from "../../../store/api/stateMasterApi";

interface AssemblyLevelFormProps {
  stateId: number;
  stateName: string;
  districts: Array<{ id: number; levelName: string }>;
  allStateMasterData: StateMasterData[];
  currentDistrictId?: number | null;
  currentAssemblyId?: number | null;
  onSuccess?: () => void;
}

export const AssemblyLevelForm: FC<AssemblyLevelFormProps> = ({
  stateId,
  stateName,
  districts,
  allStateMasterData,
  currentDistrictId,
  currentAssemblyId,
  onSuccess,
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const [createLink, { isLoading }] = useCreateWhatsappLinkMutation();

  const [selectedDistrictId, setSelectedDistrictId] = useState<number | "">("");
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number | "">("");
  const [groupName, setGroupName] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [description, setDescription] = useState("");

  // Find info about assigned assembly
  const assignedAssemblyInfo = useMemo(() => {
    if (!currentAssemblyId) return null;
    const asm = allStateMasterData.find(
      (item) => item.id === currentAssemblyId && item.levelType?.toLowerCase() === "assembly"
    );
    if (!asm) return null;
    const distId = asm.ParentId || asm.parentId;
    const dist = districts.find((d) => d.id === distId);
    return {
      assemblyId: asm.id,
      assemblyName: asm.levelName,
      districtId: distId,
      districtName: dist?.levelName || "District",
    };
  }, [currentAssemblyId, allStateMasterData, districts]);

  // Auto-select current assembly on initial load
  useEffect(() => {
    if (assignedAssemblyInfo && selectedAssemblyId === "") {
      setSelectedDistrictId(assignedAssemblyInfo.districtId || "");
      setSelectedAssemblyId(assignedAssemblyInfo.assemblyId);
    } else if (districts.length > 0 && selectedDistrictId === "") {
      // Fallback: pick current district or first district
      const targetDistId = currentDistrictId && districts.some((d) => d.id === currentDistrictId)
        ? currentDistrictId
        : districts[0].id;
      setSelectedDistrictId(targetDistId);
    }
  }, [assignedAssemblyInfo, currentDistrictId, districts, selectedAssemblyId, selectedDistrictId]);

  // Cascading assemblies based on chosen district
  const availableAssemblies = useMemo(() => {
    if (!selectedDistrictId) return [];
    const distId = Number(selectedDistrictId);
    return allStateMasterData.filter(
      (item) =>
        item.levelType?.toLowerCase() === "assembly" &&
        (item.ParentId === distId || item.parentId === distId)
    );
  }, [allStateMasterData, selectedDistrictId]);

  // Find active selected assembly details
  const activeSelectedAssembly = useMemo(() => {
    if (!selectedAssemblyId) return null;
    return availableAssemblies.find((a) => a.id === Number(selectedAssemblyId)) || null;
  }, [selectedAssemblyId, availableAssemblies]);

  const handleDistrictChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : "";
    setSelectedDistrictId(val);
    setSelectedAssemblyId(""); // Reset assembly on district change
  };

  const handleResetToCurrent = () => {
    if (assignedAssemblyInfo) {
      setSelectedDistrictId(assignedAssemblyInfo.districtId || "");
      setSelectedAssemblyId(assignedAssemblyInfo.assemblyId);
    }
  };

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
      toast.error("Please select a District first");
      return;
    }

    if (!selectedAssemblyId) {
      toast.error("Please select an Assembly Constituency");
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
        level_type: "Assembly",
        state_id: stateId,
        district_id: Number(selectedDistrictId),
        assembly_id: Number(selectedAssemblyId),
        stateMasterData_id: Number(selectedAssemblyId),
        group_name: groupName.trim(),
        link: whatsappLink.trim(),
        group_type: "Support",
        description: description.trim() || null,
        created_by: user?.id ? Number(user.id) : null,
      }).unwrap();

      toast.success(
        `Assembly Support WhatsApp group for ${activeSelectedAssembly?.levelName || "Assembly"} created successfully!`
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
      {/* Current Assembly & Scope Banner */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Active Level:
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <CheckCircle2 className="h-3 w-3" /> Assembly Level
              </span>
              {assignedAssemblyInfo && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)]">
                  Current Assigned: <strong>{assignedAssemblyInfo.assemblyName}</strong> ({assignedAssemblyInfo.districtName})
                </span>
              )}
            </div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              State: <strong className="text-[var(--text-color)]">{stateName}</strong> • Selected Assembly:{" "}
              <strong className="text-purple-600 dark:text-purple-400">
                {activeSelectedAssembly ? activeSelectedAssembly.levelName : "None Selected"}
              </strong>
            </div>
          </div>
        </div>

        <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-card)] p-2.5 rounded-xl border border-[var(--border-color)] self-start md:self-auto max-w-sm">
          💡 Your assigned assembly is selected by default. Use the district and assembly selectors below to navigate to other assemblies.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        {/* Step 1: District Select */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
            1. Select District <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-secondary)]">
              <Building2 className="h-4 w-4" />
            </div>
            <select
              required
              value={selectedDistrictId}
              onChange={handleDistrictChange}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-color)] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            >
              <option value="">-- Choose District --</option>
              {districts.map((dist) => (
                <option key={dist.id} value={dist.id}>
                  {dist.levelName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Step 2: Assembly Select (Navigate to other assemblies) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              2. Select Assembly <span className="text-red-500">*</span>
            </label>
            {assignedAssemblyInfo && selectedAssemblyId !== assignedAssemblyInfo.assemblyId && (
              <button
                type="button"
                onClick={handleResetToCurrent}
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
              >
                Reset to Current
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-secondary)]">
              <Landmark className="h-4 w-4" />
            </div>
            <select
              required
              disabled={!selectedDistrictId}
              value={selectedAssemblyId}
              onChange={(e) => setSelectedAssemblyId(e.target.value ? Number(e.target.value) : "")}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-color)] text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {selectedDistrictId ? "-- Choose Assembly --" : "Select District First"}
              </option>
              {availableAssemblies.map((asm) => (
                <option key={asm.id} value={asm.id}>
                  {asm.levelName} {asm.id === currentAssemblyId ? "★ (Current Assigned)" : ""}
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
              activeSelectedAssembly
                ? `e.g. ${activeSelectedAssembly.levelName} AC Support Group`
                : "e.g. Assembly Support Group"
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
            placeholder="https://chat.whatsapp.com/AsSemBly12345"
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
                Create Support Group for {activeSelectedAssembly?.levelName || "Assembly"}
              </span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
