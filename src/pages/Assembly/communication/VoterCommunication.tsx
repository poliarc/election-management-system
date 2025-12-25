import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import { useGetVotersByAssemblyPaginatedQuery } from "../../../store/api/votersApi";
import type { VoterList } from "../../../types/voter";
import { useDebounce } from "../../../hooks/useDebounce";

type MessageType = "SMS" | "WhatsApp";
type ContactField =
  | "contact_number1"
  | "contact_number2"
  | "contact_number3"
  | "contact_number4";

interface SelectedContact {
  key: string;
  voterId: number;
  contact: string;
  name: string;
  partNo?: string;
  epic?: string;
  contactField: ContactField;
}

type ContactTab = "all" | "contact1" | "contact2" | "contact3" | "contact4";

export default function VoterCommunication() {
  const { selectedAssignment } = useAppSelector((s) => s.auth);
  const assemblyId = selectedAssignment?.stateMasterData_id;

  // Read state id from stored auth user for API payloads
  const storedStateId = useMemo(() => {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed?.state_id ?? null;
    } catch (err) {
      console.error("Failed to parse auth_user from localStorage", err);
      return null;
    }
  }, []);

  const [messageType, setMessageType] = useState<MessageType | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [selectedContacts, setSelectedContacts] = useState<
    Map<string, SelectedContact>
  >(new Map());

  const [activeContactTab, setActiveContactTab] = useState<ContactTab>("all");
  const [allVotersData, setAllVotersData] = useState<VoterList[]>([]);

  const {
    data,
    isLoading,
    isFetching,
    error: fetchError,
  } = useGetVotersByAssemblyPaginatedQuery(
    {
      assembly_id: assemblyId!,
      page,
      limit,
      search: debouncedSearch || undefined,
    },
    { skip: !assemblyId }
  );

  const voters = data?.data || [];
  const pagination = data?.pagination || {
    page: 1,
    limit,
    total: 0,
    totalPages: 1,
  };

  // Fetch all voters data for "Select All Contacts" functionality
  const fetchAllVoters = async () => {
    if (!assemblyId) return;
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/voters/assembly/${assemblyId}?limit=10000${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setAllVotersData(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching all voters:', error);
    }
  };

  useEffect(() => {
    fetchAllVoters();
  }, [assemblyId, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const getContacts = (voter: VoterList) => {
    const contacts = [
      voter.contact_number1,
      voter.contact_number2,
      voter.contact_number3,
      voter.contact_number4,
    ].filter((c): c is string => Boolean(c && c.trim()));
    return Array.from(new Set(contacts));
  };

  const getContactsByField = (voter: VoterList, contactField: ContactField) => {
    const contact = voter[contactField];
    return contact && contact.trim() ? [contact.trim()] : [];
  };

  const getFilteredContacts = (voter: VoterList) => {
    switch (activeContactTab) {
      case "contact1":
        return getContactsByField(voter, "contact_number1");
      case "contact2":
        return getContactsByField(voter, "contact_number2");
      case "contact3":
        return getContactsByField(voter, "contact_number3");
      case "contact4":
        return getContactsByField(voter, "contact_number4");
      default:
        return getContacts(voter);
    }
  };

  const resolveContactField = (
    voter: VoterList,
    contact: string
  ): ContactField => {
    if (voter.contact_number1 === contact) return "contact_number1";
    if (voter.contact_number2 === contact) return "contact_number2";
    if (voter.contact_number3 === contact) return "contact_number3";
    if (voter.contact_number4 === contact) return "contact_number4";
    return "contact_number1";
  };

  const isContactSelected = (voterId: number, contact: string) => {
    const key = `${voterId}-${contact}`;
    return selectedContacts.has(key);
  };

  const toggleContact = (voter: VoterList, contact: string) => {
    const key = `${voter.id}-${contact}`;
    setSelectedContacts((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, {
          key,
          voterId: voter.id,
          contact,
          name:
            `${voter.voter_first_name_en || ""} ${
              voter.voter_last_name_en || ""
            }`.trim() || "Voter",
          partNo: voter.part_no,
          epic: voter.voter_id_epic_no,
          contactField: resolveContactField(voter, contact),
        });
      }
      return next;
    });
  };

  const toggleAllContacts = () => {
    // Use all voters data instead of just current page
    const allContactsData: SelectedContact[] = allVotersData.flatMap((voter) => {
      const contacts = getFilteredContacts(voter);
      return contacts.map((contact) => ({
        key: `${voter.id}-${contact}`,
        voterId: voter.id,
        contact,
        name:
          `${voter.voter_first_name_en || ""} ${
            voter.voter_last_name_en || ""
          }`.trim() || "Voter",
        partNo: voter.part_no,
        epic: voter.voter_id_epic_no,
        contactField: resolveContactField(voter, contact),
      }));
    });

    const allSelected =
      allContactsData.length > 0 &&
      allContactsData.every(({ key }) => selectedContacts.has(key));

    setSelectedContacts((prev) => {
      const next = new Map(prev);
      if (allSelected) {
        // Deselect all contacts from current filter
        allContactsData.forEach(({ key }) => next.delete(key));
      } else {
        // Select all contacts from current filter
        allContactsData.forEach((item) => next.set(item.key, item));
      }
      return next;
    });
  };

  const toggleAllOnPage = () => {
    const pageKeys: SelectedContact[] = voters.flatMap((voter) => {
      const contacts = getFilteredContacts(voter);
      return contacts.map((contact) => ({
        key: `${voter.id}-${contact}`,
        voterId: voter.id,
        contact,
        name:
          `${voter.voter_first_name_en || ""} ${
            voter.voter_last_name_en || ""
          }`.trim() || "Voter",
        partNo: voter.part_no,
        epic: voter.voter_id_epic_no,
        contactField: resolveContactField(voter, contact),
      }));
    });

    const allSelected =
      pageKeys.length > 0 &&
      pageKeys.every(({ key }) => selectedContacts.has(key));

    setSelectedContacts((prev) => {
      const next = new Map(prev);
      if (allSelected) {
        pageKeys.forEach(({ key }) => next.delete(key));
      } else {
        pageKeys.forEach((item) => next.set(item.key, item));
      }
      return next;
    });
  };

  const totalSelectedContacts = selectedContacts.size;
  const allPageContactsSelected = useMemo(() => {
    if (!voters.length) return false;
    const pageKeys = voters.flatMap((v) =>
      getFilteredContacts(v).map((c) => `${v.id}-${c}`)
    );
    return (
      pageKeys.length > 0 && pageKeys.every((key) => selectedContacts.has(key))
    );
  }, [voters, selectedContacts, activeContactTab]);

  const allContactsSelected = useMemo(() => {
    if (!allVotersData.length) return false;
    const allKeys = allVotersData.flatMap((v) =>
      getFilteredContacts(v).map((c) => `${v.id}-${c}`)
    );
    return (
      allKeys.length > 0 && allKeys.every((key) => selectedContacts.has(key))
    );
  }, [allVotersData, selectedContacts, activeContactTab]);

  // Count contacts by tab for display
  const contactCounts = useMemo(() => {
    const counts = {
      all: 0,
      contact1: 0,
      contact2: 0,
      contact3: 0,
      contact4: 0,
    };

    allVotersData.forEach((voter) => {
      const allContacts = getContacts(voter);
      counts.all += allContacts.length;
      
      if (voter.contact_number1?.trim()) counts.contact1++;
      if (voter.contact_number2?.trim()) counts.contact2++;
      if (voter.contact_number3?.trim()) counts.contact3++;
      if (voter.contact_number4?.trim()) counts.contact4++;
    });

    return counts;
  }, [allVotersData]);

  const handleSendMessage = async () => {
    if (!messageType || !message.trim() || selectedContacts.size === 0) return;

    try {
      setSending(true);
      setSendError(null);

      const trimmedMessage = message.trim();

      if (trimmedMessage.length === 0 || trimmedMessage.length > 1600) {
        setSendError("Message must be between 1 and 1600 characters");
        setSending(false);
        return;
      }

      const recipients = Array.from(selectedContacts.values()).map((item) => ({
        voter_id: item.voterId,
        contact_no: item.contact,
        name: item.name,
        part_no: item.partNo,
        epic_no: item.epic,
        contact_field: item.contactField,
      }));

      const contactFields = Array.from(
        new Set(
          Array.from(selectedContacts.values()).map((c) => c.contactField)
        )
      );

      const payload = {
        message_type: messageType === "WhatsApp" ? "WHATSAPP" : "SMS",
        message_content: trimmedMessage,
        contact_field: contactFields[0] || "contact_number1",
        filter_criteria: storedStateId
          ? { state_id: storedStateId }
          : { state_id: null },
        recipients,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/voter-communication/send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "auth_access_token"
            )}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const result = await response.json();

      if (result.success) {
        setMessage("");
        setSelectedContacts(new Map());
        setMessageType(null);
        alert("Message sent successfully!");
      } else {
        setSendError(result.message || "Failed to send message");
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSending(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > (pagination?.totalPages || 1)) return;
    setPage(newPage);
  };

  if (!assemblyId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          Please select an assembly to view voters.
        </div>
      </div>
    );
  }

  const hasFetchError = Boolean(fetchError);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Voter Communication
          </h1>
          <p className="text-gray-600 mt-1">
            Send SMS or WhatsApp messages to voters
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Search filters query the full voter list, not just the current page.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMessageType("SMS")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              messageType === "SMS"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            SMS
          </button>
          <button
            onClick={() => setMessageType("WhatsApp")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              messageType === "WhatsApp"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            WhatsApp
          </button>
        </div>
      </div>

      {(sendError || hasFetchError) && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {sendError || "Failed to load voters."}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message Content
          </label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            placeholder={
              messageType
                ? `Type your ${messageType} message here...`
                : "Pick SMS or WhatsApp to start typing"
            }
            maxLength={1000}
          />
          <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
            <span>{message.length}/1000 characters</span>
            <span>
              {totalSelectedContacts} contact
              {totalSelectedContacts !== 1 ? "s" : ""} selected
            </span>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search voters by name, EPIC, mobile, part number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <button
              onClick={toggleAllOnPage}
              className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              {allPageContactsSelected
                ? "Deselect page contacts"
                : "Select page contacts"}
            </button>
            <button
              onClick={toggleAllContacts}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium"
            >
              {allContactsSelected
                ? "Deselect all contacts"
                : "Select all contacts"}
            </button>
            <div className="hidden sm:block text-gray-500">
              {pagination.total.toLocaleString()} total voters
            </div>
          </div>
        </div>

        {/* Contact Tabs */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveContactTab("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeContactTab === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              All Contacts ({contactCounts.all})
            </button>
            <button
              onClick={() => setActiveContactTab("contact1")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeContactTab === "contact1"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              Contact 1 ({contactCounts.contact1})
            </button>
            <button
              onClick={() => setActiveContactTab("contact2")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeContactTab === "contact2"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              Contact 2 ({contactCounts.contact2})
            </button>
            <button
              onClick={() => setActiveContactTab("contact3")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeContactTab === "contact3"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              Contact 3 ({contactCounts.contact3})
            </button>
            <button
              onClick={() => setActiveContactTab("contact4")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeContactTab === "contact4"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
            >
              Contact 4 ({contactCounts.contact4})
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {activeContactTab === "all" 
              ? "Showing all available contact numbers for each voter"
              : `Showing only ${activeContactTab.replace('contact', 'Contact ')} for voters who have this contact number`
            }
          </p>
        </div>

        <div className="p-0">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="mt-2 text-gray-600">Loading voters...</p>
            </div>
          ) : hasFetchError ? (
            <div className="py-12 text-center text-red-600">
              Failed to load voters.
            </div>
          ) : voters.length === 0 ? (
            <div className="py-12 text-center text-gray-600">
              No voters found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Part No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Gender
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      EPIC
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact Numbers
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {voters.map((voter) => {
                    return (
                      <tr key={voter.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {voter.part_no || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="font-medium">
                            {`${voter.voter_first_name_en || ""} ${
                              voter.voter_last_name_en || ""
                            }`.trim() || "-"}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {voter.voter_full_name_hi ||
                              voter.relative_full_name_hi ||
                              ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {voter.gender || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {voter.voter_id_epic_no || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {(() => {
                            const contacts = getFilteredContacts(voter);
                            if (contacts.length === 0) {
                              return (
                                <span className="text-gray-500">
                                  {activeContactTab === "all" ? "No contacts" : `No ${activeContactTab.replace('contact', 'Contact ')}`}
                                </span>
                              );
                            }
                            return (
                              <div className="flex flex-wrap gap-2">
                                {contacts.map((contact) => {
                                  const checked = isContactSelected(
                                    voter.id,
                                    contact
                                  );
                                  return (
                                    <label
                                      key={`${voter.id}-${contact}`}
                                      className="inline-flex items-center gap-2 px-2 py-1 border rounded-lg text-sm bg-gray-50 hover:bg-gray-100"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                          toggleContact(voter, contact)
                                        }
                                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                      />
                                      <span className="font-mono text-gray-800">
                                        {contact}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200">
            <div className="text-sm text-gray-700 order-2 sm:order-1">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, pagination.total)} of {pagination.total}{" "}
              results
              {isFetching && (
                <span className="ml-2 text-gray-500">(updating...)</span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 order-1 sm:order-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-2 sm:px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">‹</span>
              </button>

              {/* Mobile: Show only current page and total */}
              <div className="sm:hidden px-3 py-1 text-sm text-gray-600">
                {page} / {pagination.totalPages}
              </div>

              {/* Desktop: Show page numbers */}
              <div className="hidden sm:flex gap-1">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }

                    if (pageNum < 1 || pageNum > pagination.totalPages)
                      return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 text-sm border rounded-md ${
                          page === pageNum
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                )}
              </div>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.totalPages}
                className="px-2 sm:px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">›</span>
              </button>
            </div>
          </div>
        )}

        {messageType && message.trim() && totalSelectedContacts > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-700">
              Ready to send {messageType} to {totalSelectedContacts} contact
              {totalSelectedContacts !== 1 ? "s" : ""}
            </div>
            <button
              onClick={handleSendMessage}
              disabled={sending}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                messageType === "SMS"
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-green-600 hover:bg-green-700"
              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {sending ? "Sending..." : `Send ${messageType}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
