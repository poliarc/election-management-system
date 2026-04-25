import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetAssemblyUsersQuery } from "../../../store/api/visitorsApi";
import { useAppSelector } from "../../../store/hooks";
import { createProgramLink } from "../../../services/programApi";
import toast from "react-hot-toast";

interface Props {
  onClose: () => void;
  onLinkCreated: (url: string) => void;
}

export default function CreateProgramLinkModal({ onClose, onLinkCreated }: Props) {
  const { t } = useTranslation();
  const { user, selectedAssignment } = useAppSelector((s) => s.auth);
  const assemblyId = selectedAssignment?.stateMasterData_id || 0;

  const { data: usersData, isLoading } = useGetAssemblyUsersQuery(assemblyId, {
    skip: !assemblyId,
  });
  const assemblyUsers = usersData?.data?.users || [];

  const [candidateId, setCandidateId] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!candidateId) { toast.error('Please select a candidate'); return; }
    setSaving(true);

    // Get names from Redux auth state
    const stateName = (user as any)?.stateName || selectedAssignment?.stateName || '';
    const districtName = (user as any)?.districtName || selectedAssignment?.districtName || '';
    const assemblyName = selectedAssignment?.displayName || selectedAssignment?.levelName || '';

    // Safely get numeric IDs — fallback chain to avoid undefined/NaN
    const stateId = Number((user as any)?.state_id) || 0;
    const districtId = Number((user as any)?.district_id)
      || Number(selectedAssignment?.parentId)
      || 0;

    const payload = {
      party_id: Number((user as any)?.partyId) || 0,
      state_id: stateId,
      district_id: districtId,
      assembly_id: assemblyId,
      candidate_id: candidateId,
      creator_id: Number(user?.id) || 0,
    };
    try {
      const res = await createProgramLink(payload);
      if (res.success) {
        const selectedUser = assemblyUsers.find((u: any) => u.user_id === candidateId);
        const candidateName = selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}`.trim() : '';
        const d = res.data;
        const p = new URLSearchParams({
          link_id: String(d?.id || ''),
          state_id: String(payload.state_id || ''),
          district_id: String(payload.district_id || ''),
          assembly_id: String(payload.assembly_id || ''),
          candidate_id: String(payload.candidate_id || ''),
          creator_id: String(payload.creator_id || ''),
          party_id: String(payload.party_id || ''),
          candidate_name: candidateName,
          state_name: d?.state?.name || stateName,
          district_name: d?.district?.name || districtName,
          assembly_name: d?.assembly?.name || assemblyName,
        });
        onLinkCreated(`${window.location.origin}/program/add?${p.toString()}`);
      } else {
        toast.error(res.message || 'Failed to create link');
      }
    } catch {
      toast.error('Failed to create link');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-400 transition";
  const labelCls = "block text-xs font-medium text-[var(--text-secondary)] mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[var(--text-color)]">{t("CreateProgramLinkModal.Title")}</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-color)] transition">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>{t("CreateProgramLinkModal.Select_Candidate")}</label>
            <select
              className={inputCls}
              value={candidateId}
              onChange={e => setCandidateId(Number(e.target.value))}
              disabled={isLoading}
            >
              <option value={0}>{isLoading ? t("CreateProgramLinkModal.Loading_Users") : t("CreateProgramLinkModal.Select_Candidate_Option")}</option>
              {assemblyUsers.map((u: any) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.first_name} {u.last_name}
                  {u.contact_no ? ` · ${u.contact_no}` : ''}
                </option>
              ))}
            </select>
            {!isLoading && assemblyUsers.length === 0 && (
              <p className="text-xs text-yellow-600 mt-1">{t("CreateProgramLinkModal.No_Users")}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 transition">
              {t("CreateProgramLinkModal.Cancel")}
            </button>
            <button onClick={handleCreate} disabled={saving || !candidateId}
              className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition">
              {saving ? t("CreateProgramLinkModal.Creating") : t("CreateProgramLinkModal.Create_Copy")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
