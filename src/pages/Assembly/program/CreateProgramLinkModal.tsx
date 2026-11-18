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
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [candidateName, setCandidateName] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const handleCreate = async () => {
    if (!candidateId) { toast.error('Please select a candidate'); return; }
    setSaving(true);

    // Safely get numeric IDs
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
        const cName = selectedUser ? `${selectedUser.first_name} ${selectedUser.last_name}`.trim() : '';
        setCandidateName(cName);

        const code = res.data?.code;
        const shortUrl = code
          ? `${window.location.origin}/program/add?code=${code}`
          : `${window.location.origin}/program/add?link_id=${res.data?.id}`;

        setGeneratedLink(shortUrl);
        onLinkCreated(shortUrl);
        toast.success(code ? 'Short link generated!' : 'Link created!');
      } else {
        toast.error(res.message || 'Failed to create link');
      }
    } catch {
      toast.error('Failed to create link');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!generatedLink) return;
    const assemblyName = selectedAssignment?.displayName || selectedAssignment?.levelName || '';
    const msg = `Namaste! Please submit your upcoming event/program${candidateName ? ` for Candidate ${candidateName}` : ''}${assemblyName ? ` (${assemblyName})` : ''}:\n${generatedLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const inputCls = "w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-indigo-400 transition";
  const labelCls = "block text-xs font-medium text-[var(--text-secondary)] mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl p-5 sm:p-6" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-[var(--text-color)]">
            {generatedLink ? "Short Registration Link" : t("CreateProgramLinkModal.Title")}
          </h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-color)] transition p-1 rounded-lg">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* View 2: Generated Link Ready */}
        {generatedLink ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50 p-3.5 flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/60 text-green-600 dark:text-green-300">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div className="text-xs text-green-800 dark:text-green-300">
                <p className="font-semibold text-sm">Link Generated Successfully!</p>
                <p className="mt-0.5 opacity-90">
                  Share this short link with supporters to submit programs{candidateName ? ` for ${candidateName}` : ''}.
                </p>
              </div>
            </div>

            <div>
              <label className={labelCls}>Short Program Link</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={generatedLink}
                  className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-xs sm:text-sm font-mono text-[var(--text-color)] select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0 transition ${
                    isCopied
                      ? 'bg-green-600 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-green-600 text-white text-xs sm:text-sm font-semibold hover:bg-green-700 transition shadow-sm"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z" />
                </svg>
                Share on WhatsApp
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-lg border border-[var(--border-color)] text-xs sm:text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 transition text-center"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* View 1: Select Candidate & Generate */
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
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 transition"
              >
                {t("CreateProgramLinkModal.Cancel")}
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving || !candidateId}
                className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition shadow-sm"
              >
                {saving ? "Generating..." : "Generate Short Link"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
