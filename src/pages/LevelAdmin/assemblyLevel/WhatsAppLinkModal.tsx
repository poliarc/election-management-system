import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  createWhatsAppLink,
  fetchUsersByPartyAndState,
  updateWhatsAppLink,
  type AssemblyOption,
  type AssemblyUserOption,
  type WhatsAppGeneratePayload,
  type WhatsAppLinkData,
} from "../../../services/levelAdminApi";
import { useAppSelector } from "../../../store/hooks";

interface WhatsAppLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: WhatsAppLinkData | null;
  row: AssemblyOption | null;
  // NEW: Prop to hide user selection for Mandal level
  hideUserSelection?: boolean; 
}

const GROUP_TYPES: Array<WhatsAppGeneratePayload["groupType"]> = [
  "Party Team",
  "Social Group",
];

export default function WhatsAppLinkModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  row,
  hideUserSelection = false, // Defaults to false so Assembly page stays exactly the same
}: WhatsAppLinkModalProps) {
  const { levelAdminPanels, user } = useAppSelector((state) => state.auth);

  const [groupType, setGroupType] = useState<WhatsAppGeneratePayload["groupType"]>("Party Team");
  const [groupName, setGroupName] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<AssemblyUserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<Record<number, AssemblyUserOption>>({});
  
  const skipSearchEffectRef = useRef(true);
  const LIMIT = 50;
  const isUpdateMode = Boolean(initialData?.id);

  const assemblyPanel = levelAdminPanels.find((p) => p.name?.toLowerCase() === "assembly");
  const partyId = assemblyPanel?.metadata?.partyId ?? levelAdminPanels[0]?.metadata?.partyId ?? user?.partyId ?? null;
  const stateId = assemblyPanel?.metadata?.stateId ?? levelAdminPanels[0]?.metadata?.stateId ?? user?.state_id ?? null;

  const loadUsers = async (page: number, search: string = "", isInitial = false) => {
    // If we are hiding user selection, don't even bother fetching users!
    if (hideUserSelection) return;

    if (!partyId || !stateId) {
      setError("Missing party or state configuration.");
      return;
    }
    try {
      if (isInitial) setLoadingUsers(true);
      else setPageLoading(true);
      setError(null);

      const response = await fetchUsersByPartyAndState(partyId, stateId, page, LIMIT, search);

      const fetched: AssemblyUserOption[] = (response?.data ?? []).map((u: any) => ({
        userId: u.user_id ?? u.id,
        userName: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.username || "Unknown",
        email: u.email ?? "",
        mobileNumber: u.contact_no ?? u.mobile_number ?? "",
      }));

      setUsers(fetched);
      setSelectedUserDetails((prev) => {
        const next = { ...prev };
        fetched.forEach((user) => { next[user.userId] = user; });
        return next;
      });
      setTotalUsers(response?.pagination?.total ?? fetched.length);
      setTotalPages(response?.pagination?.totalPages ?? 1);
      setCurrentPage(page);
    } catch (err) {
      setUsers([]);
      setTotalUsers(0);
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoadingUsers(false);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !row || hideUserSelection) return;
    skipSearchEffectRef.current = true;
    void loadUsers(1, "", true);
  }, [isOpen, row, hideUserSelection]);

  useEffect(() => {
    if (!isOpen || !row || hideUserSelection) return;

    if (skipSearchEffectRef.current) {
      skipSearchEffectRef.current = false;
      return;
    }
    const timeoutId = window.setTimeout(() => { void loadUsers(1, userSearch); }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen, row, userSearch, hideUserSelection]);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const mappedUsers = initialData.users.reduce<Record<number, AssemblyUserOption>>(
        (acc, user) => {
          acc[user.user_id] = {
            userId: user.user_id,
            userName: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
            email: user.email ?? "",
            mobileNumber: user.contact_no ?? "",
          };
          return acc;
        },
        {}
      );

      setGroupType(initialData.group_type === "Social Group" ? "Social Group" : "Party Team");
      setGroupName(initialData.group_name ?? "");
      setWhatsappLink(initialData.link ?? "");
      setSelectedUsers(initialData.users.map((user) => user.user_id));
      setSelectedUserDetails(mappedUsers);
      return;
    }

    setGroupType("Party Team");
    setGroupName("");
    setWhatsappLink("");
    setSelectedUsers([]);
    setSelectedUserDetails({});
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      skipSearchEffectRef.current = true;
      setGroupType("Party Team");
      setGroupName("");
      setWhatsappLink("");
      setUserSearch("");
      setUsers([]);
      setSelectedUsers([]);
      setTotalUsers(0);
      setTotalPages(1);
      setCurrentPage(1);
      setError(null);
      setSubmitting(false);
      setSelectedUserDetails({});
    }
  }, [isOpen]);

  const selectedUserObjects = useMemo(() =>
      selectedUsers.map((userId) => selectedUserDetails[userId]).filter((user): user is AssemblyUserOption => Boolean(user)),
    [selectedUserDetails, selectedUsers]
  );

  const toggleUser = (userId: number) => {
    setSelectedUsers((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  };

  const toggleAll = () => {
    const allVisibleIds = users.map((u) => u.userId);
    const allSelected = allVisibleIds.every((id) => selectedUsers.includes(id));
    if (allSelected) {
      setSelectedUsers((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
    } else {
      setSelectedUsers((prev) => [...prev, ...allVisibleIds.filter((id) => !prev.includes(id))]);
    }
  };

  const handleSubmit = async () => {
    if (!row) return;

    const payload = {
      afterAssemblyData_id: row.assemblyId,
      group_type: groupType,
      group_name: groupName.trim() || null,
      link: whatsappLink.trim(),
      // If we hid the user selection, explicitly send an empty array
      user_ids: hideUserSelection ? [] : selectedUsers, 
    };

    try {
      setSubmitting(true);

      if (isUpdateMode && initialData) {
        const usersToDelete = hideUserSelection ? [] : initialData.users
          .map((user) => user.user_id)
          .filter((userId) => !selectedUsers.includes(userId));

        await updateWhatsAppLink(initialData.id, {
          ...payload,
          users_to_delete: usersToDelete,
        });
        toast.success("WhatsApp link updated successfully");
      } else {
        await createWhatsAppLink(payload);
        toast.success("WhatsApp link created successfully");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save WhatsApp link");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !row) return null;

  const allVisibleSelected = users.length > 0 && users.every((u) => selectedUsers.includes(u.userId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-3xl flex-col rounded-2xl bg-[var(--bg-card)] shadow-2xl" style={{ maxHeight: "90vh" }}>
        
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-color)]">
              {isUpdateMode ? "Update WhatsApp Link" : "WhatsApp Link Setup"}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {row.assemblyName} • {row.districtName}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-main)]">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-5 px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-color)]">Group Type</label>
                <select value={groupType} onChange={(e) => setGroupType(e.target.value as WhatsAppGeneratePayload["groupType"])} className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3 text-sm text-[var(--text-color)] outline-none focus:border-blue-500">
                  {GROUP_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text-color)]">Group Name</label>
                <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="e.g., Youth Wing Assam" className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3 text-sm text-[var(--text-color)] outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-color)]">WhatsApp Link</label>
              <input type="text" value={whatsappLink} onChange={(e) => setWhatsappLink(e.target.value)} placeholder="Enter WhatsApp group link" className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3 text-sm text-[var(--text-color)] outline-none focus:border-blue-500" />
            </div>

            {/* ONLY SHOW THIS SECTION IF NOT HIDING USER SELECTION */}
            {!hideUserSelection && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-[var(--text-color)]">
                    Users {!loadingUsers && <span className="text-[var(--text-secondary)]">({totalUsers} total)</span>}
                  </label>
                  {selectedUsers.length > 0 && <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">{selectedUsers.length} selected</span>}
                </div>

                <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search by name, email or phone..." className="mb-3 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-3 text-sm text-[var(--text-color)] outline-none focus:border-blue-500" />

                {selectedUserObjects.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedUserObjects.map((u) => (
                      <span key={u.userId} className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {u.userName}
                        <button type="button" onClick={() => toggleUser(u.userId)} className="text-blue-500 hover:text-blue-800">×</button>
                      </span>
                    ))}
                    <button type="button" onClick={() => setSelectedUsers([])} className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50">Clear all</button>
                  </div>
                )}

                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]">
                  {loadingUsers ? (
                    <div className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">Loading users...</div>
                  ) : error ? (
                    <div className="px-4 py-8 text-center text-sm text-red-600">{error}</div>
                  ) : users.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">No users found.</div>
                  ) : (
                    <>
                      <label className="flex cursor-pointer items-center gap-3 border-b border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2.5">
                        <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Select all on this page</span>
                      </label>
                      <div className="max-h-64 overflow-y-auto">
                        {users.map((u) => {
                          const checked = selectedUsers.includes(u.userId);
                          return (
                            <label key={u.userId} className={`flex cursor-pointer items-start gap-3 border-b border-[var(--border-color)] px-4 py-3 last:border-b-0 hover:bg-white/40 ${checked ? "bg-blue-50/60" : ""}`}>
                              <input type="checkbox" checked={checked} onChange={() => toggleUser(u.userId)} className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-[var(--text-color)]">{u.userName}</div>
                                <div className="text-xs text-[var(--text-secondary)]">{u.email || u.mobileNumber || "No contact info"}</div>
                              </div>
                              {checked && <span className="mt-1 flex-shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">✓</span>}
                            </label>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
                
                {/* Pagination */}
                {!loadingUsers && totalPages > 1 && (
                  <div className="mt-3 flex items-center justify-between">
                    <button type="button" onClick={() => loadUsers(currentPage - 1, userSearch)} disabled={currentPage === 1 || pageLoading} className="rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium text-[var(--text-color)] hover:bg-[var(--bg-main)] disabled:cursor-not-allowed disabled:opacity-40">← Previous</button>
                    <span className="text-xs text-[var(--text-secondary)]">{pageLoading ? "Loading..." : `Page ${currentPage} of ${totalPages} · ${totalUsers} users`}</span>
                    <button type="button" onClick={() => loadUsers(currentPage + 1, userSearch)} disabled={currentPage === totalPages || pageLoading} className="rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium text-[var(--text-color)] hover:bg-[var(--bg-main)] disabled:cursor-not-allowed disabled:opacity-40">Next →</button>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border-color)] px-6 py-4">
          {/* Hide user count if user selection is hidden */}
          {hideUserSelection ? <div></div> : (
            <span className="text-sm text-[var(--text-secondary)]">
              {selectedUsers.length > 0 ? `${selectedUsers.length} user${selectedUsers.length !== 1 ? "s" : ""} selected` : "No users selected"}
            </span>
          )}
          
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--text-color)] hover:bg-[var(--bg-main)]">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              // THE FIX: If hideUserSelection is true, we ONLY check if whatsappLink exists!
              disabled={(hideUserSelection ? false : selectedUsers.length === 0) || !whatsappLink.trim() || submitting}
              className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? isUpdateMode ? "Updating..." : "Generating..."
                : hideUserSelection 
                    ? (isUpdateMode ? "Update Link" : "Generate Link") 
                    : `${isUpdateMode ? "Update Link" : "Generate Link"} (${selectedUsers.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}