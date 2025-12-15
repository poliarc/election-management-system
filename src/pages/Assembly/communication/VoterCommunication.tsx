import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../../../store/hooks";
import { useGetVotersByAssemblyPaginatedQuery } from "../../../store/api/votersApi";
import type { VoterList } from "../../../types/voter";
import { useDebounce } from "../../../hooks/useDebounce";

type MessageType = "SMS" | "WhatsApp";

interface SelectedContact {
  key: string;
  voterId: number;
  contact: string;
  name: string;
  partNo?: string;
  epic?: string;
}

export default function VoterCommunication() {
  const { selectedAssignment } = useAppSelector((s) => s.auth);
  const assemblyId = selectedAssignment?.stateMasterData_id;

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
        });
      }
      return next;
    });
  };

  const toggleAllOnPage = () => {
    const pageKeys: SelectedContact[] = voters.flatMap((voter) => {
      const contacts = getContacts(voter);
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
      getContacts(v).map((c) => `${v.id}-${c}`)
    );
    return (
      pageKeys.length > 0 && pageKeys.every((key) => selectedContacts.has(key))
    );
  }, [voters, selectedContacts]);

  const handleSendMessage = async () => {
    if (!messageType || !message.trim() || selectedContacts.size === 0) return;

    try {
      setSending(true);
      setSendError(null);

      const recipients = Array.from(selectedContacts.values()).map((item) => ({
        id: item.voterId,
        contact_no: item.contact,
        name: item.name,
        part_no: item.partNo,
        epic_no: item.epic,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/communication/send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "auth_access_token"
            )}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: messageType.toLowerCase(),
            message: message.trim(),
            recipients,
          }),
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
            <div className="hidden sm:block text-gray-500">
              {pagination.total.toLocaleString()} total voters
            </div>
          </div>
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
                    const contacts = getContacts(voter);
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
                          {contacts.length === 0 ? (
                            <span className="text-gray-500">No contacts</span>
                          ) : (
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
                          )}
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
          <div className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700 order-2 sm:order-1">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, pagination.total)} of {pagination.total}{" "}
              results
              {isFetching && (
                <span className="ml-2 text-gray-500">(updating...)</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 order-1 sm:order-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    let pageNumber = i + 1;
                    if (pagination.totalPages > 5) {
                      const start = Math.max(1, page - 2);
                      pageNumber = start + i;
                      if (pageNumber > pagination.totalPages) {
                        pageNumber = pagination.totalPages - (4 - i);
                      }
                    }
                    if (pageNumber < 1 || pageNumber > pagination.totalPages)
                      return null;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          pageNumber === page
                            ? "bg-indigo-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  }
                )}
              </div>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
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
