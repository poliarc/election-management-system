import { useState, useEffect, type ChangeEvent } from "react";
import { useAppSelector } from "../../../store/hooks";
import { useGetUsersByPartyAndStateQuery } from "../../../store/api/assemblyApi";
import { useGetProfileQuery } from "../../../store/api/profileApi";
import { useGetAllStateMasterDataQuery } from "../../../store/api/stateMasterApi";

type MessageType = "SMS" | "WHATSAPP";
type CommunicationStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

type CommunicationRecord = {
  communication_id: number;
  message_type: MessageType;
  message_content: string;
  recipient_type: "SINGLE" | "MULTIPLE";
  recipient_users: (number | string)[];
  total_recipients: number;
  successful_sends: number;
  failed_sends: number;
  status: CommunicationStatus;
  sent_by: number;
  sent_by_name: string;
  sent_by_lastname: string;
  sent_by_email: string;
  created_on: string;
  updated_on: string;
  delivery_report: Array<{
    recipient: string;
    user_id?: number;
    status: "SUCCESS" | "FAILED";
    timestamp: string;
    error?: string;
  }>;
  error_details: string | null;
};

export default function UserCommunication() {
  const { user } = useAppSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState<"send" | "history">("send");
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [messageType, setMessageType] = useState<MessageType | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [userStateId, setUserStateId] = useState<number | null>(null);
  const [userPartyId, setUserPartyId] = useState<number | null>(null);

  // Communication history state
  const [communications, setCommunications] = useState<CommunicationRecord[]>(
    []
  );
  const [communicationsLoading, setCommunicationsLoading] = useState(false);
  const [communicationsError, setCommunicationsError] = useState<string | null>(
    null
  );
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit] = useState(10);
  const [historyFilters, setHistoryFilters] = useState({
    message_type: "" as "" | MessageType,
    status: "" as "" | CommunicationStatus,
    date_from: "",
    date_to: "",
  });
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Get user profile to extract state name and party_id
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery();

  // Get all state master data to map state name to state_id
  const { data: stateMasterData, isLoading: stateLoading } =
    useGetAllStateMasterDataQuery();

  // Get party_id and state_id from user profile and state master data
  useEffect(() => {
    // Get party_id from auth user
    const partyId = user?.partyId;

    if (partyId) {
      setUserPartyId(partyId);
    }

    // Try to get state_id from localStorage auth_user first
    const authUser = localStorage.getItem("auth_user");
    if (authUser) {
      try {
        const parsedUser = JSON.parse(authUser);

        // Check multiple possible state_id fields
        const possibleStateId =
          parsedUser.state_id || parsedUser.stateId || parsedUser.user_state_id;
        if (possibleStateId) {
          setUserStateId(possibleStateId);
          return; // Exit early if we found state_id
        }

        // Fallback for party_id if not available from auth selector
        const fallbackPartyId = parsedUser.party_id || parsedUser.partyId;
        if (fallbackPartyId && !partyId) {
          setUserPartyId(fallbackPartyId);
        }
      } catch (error) {
        console.error("Failed to parse auth_user from localStorage:", error);
      }
    }

    // Get state_id from profile + state master data
    if (profileData && stateMasterData) {
      // Find state_id by matching state name from profile with state master data
      const userStateName = profileData.state;
      if (userStateName && userStateName.trim()) {
        // Try multiple matching strategies
        let matchingState = stateMasterData.find(
          (state) =>
            state.levelName.toLowerCase().trim() ===
            userStateName.toLowerCase().trim()
        );

        // If exact match not found, try partial matches
        if (!matchingState) {
          matchingState = stateMasterData.find(
            (state) =>
              state.levelName
                .toLowerCase()
                .includes(userStateName.toLowerCase().trim()) ||
              userStateName
                .toLowerCase()
                .includes(state.levelName.toLowerCase().trim())
          );
        }

        // If still not found, try removing common words and matching
        if (!matchingState) {
          const cleanUserState = userStateName
            .toLowerCase()
            .replace(/\b(state|pradesh)\b/g, "")
            .trim();
          matchingState = stateMasterData.find((state) => {
            const cleanStateName = state.levelName
              .toLowerCase()
              .replace(/\b(state|pradesh)\b/g, "")
              .trim();
            return (
              cleanStateName === cleanUserState ||
              cleanStateName.includes(cleanUserState) ||
              cleanUserState.includes(cleanStateName)
            );
          });
        }

        if (matchingState) {
          const stateId = matchingState.stateMasterData_id || matchingState.id;
          setUserStateId(stateId);
        } else if (stateMasterData.length > 0) {
          // Fallback: use the first available state if no match found
          const fallbackStateId =
            stateMasterData[0].stateMasterData_id || stateMasterData[0].id;
          setUserStateId(fallbackStateId);
        }
      }
    }
  }, [user, profileData, stateMasterData]);

  // Fetch communication history
  const fetchCommunications = async () => {
    setCommunicationsLoading(true);
    setCommunicationsError(null);

    try {
      const queryParams = new URLSearchParams({
        page: historyPage.toString(),
        limit: historyLimit.toString(),
      });

      if (historyFilters.message_type) {
        queryParams.append("message_type", historyFilters.message_type);
      }
      if (historyFilters.status) {
        queryParams.append("status", historyFilters.status);
      }
      if (historyFilters.date_from) {
        queryParams.append("date_from", historyFilters.date_from);
      }
      if (historyFilters.date_to) {
        queryParams.append("date_to", historyFilters.date_to);
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/user-communication/my-communications?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem(
              "auth_access_token"
            )}`,
          },
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load communications");
      }

      setCommunications(result.data || []);
      setHistoryPagination(
        result.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
      );
    } catch (err) {
      setCommunicationsError(
        err instanceof Error ? err.message : "Failed to load communications"
      );
    } finally {
      setCommunicationsLoading(false);
    }
  };

  // Load communications when tab changes or filters change
  useEffect(() => {
    if (activeTab === "history") {
      fetchCommunications();
    }
  }, [activeTab, historyPage, historyFilters]);

  // Fetch users with pagination and search - can search all users or filter by party+state
  const {
    data: partyStateUsersData,
    isLoading: partyStateLoading,
    error: partyStateError,
  } = useGetUsersByPartyAndStateQuery(
    {
      partyId: userPartyId || undefined,
      stateId: userStateId || undefined,
      page: currentPage,
      limit: pageSize,
      search: searchTerm,
    },
    {
      skip: profileLoading || stateLoading,
    }
  );

  // Use party state users data
  const usersData = partyStateUsersData;
  const isLoading = partyStateLoading;
  const apiError = partyStateError;

  const users = usersData?.users || [];
  const pagination = usersData?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Clear selected users when users data changes
  useEffect(() => {
    setSelectedUsers(new Set());
  }, [usersData]);

  const handleUserSelect = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((user) => user.user_id)));
    }
  };

  const handleSendMessage = async () => {
    if (!messageType || !message.trim() || selectedUsers.size === 0) return;

    try {
      setSending(true);
      setError(null);

      const trimmed = message.trim();
      if (trimmed.length === 0 || trimmed.length > 1600) {
        setError("Message must be between 1 and 1600 characters");
        setSending(false);
        return;
      }

      const selectedUsersList = users.filter((user) =>
        selectedUsers.has(user.user_id)
      );

      const payload = {
        message_type: messageType,
        message_content: trimmed,
        recipient_type: selectedUsersList.length > 1 ? "MULTIPLE" : "SINGLE",
        recipient_users: selectedUsersList.map((user) => user.user_id),
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/user-communication/send`,
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
        // Reset form
        setMessage("");
        setSelectedUsers(new Set());
        setMessageType(null);
        alert("Message sent successfully!");
      } else {
        setError(result.message || "Failed to send message");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSending(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleHistoryFilterChange = (
    key: keyof typeof historyFilters,
    value: string
  ) => {
    setHistoryFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHistoryPage(1); // Reset to first page when filters change
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: CommunicationStatus) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "PENDING":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (profileLoading || stateLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="ml-3 text-gray-600">
          Loading {profileLoading ? "user profile" : "state data"}...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Communication</h1>
        <p className="text-gray-600 mt-1">
          Send SMS or WhatsApp messages to users and view your communication
          history
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("send")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "send"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Send Message
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "history"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My Communications
            </button>
          </nav>
        </div>
      </div>

      {/* Missing Data Warning - Only show if critical data is missing */}
      {!userPartyId && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                Party information not found. Some features may be limited.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* API Error */}
      {(error ||
        (activeTab === "send" && apiError) ||
        (activeTab === "history" && communicationsError)) && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                {error ||
                  (activeTab === "send" && apiError && "data" in apiError
                    ? (apiError.data as { message?: string })?.message
                    : activeTab === "history" && communicationsError) ||
                  "An error occurred"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Tab */}
      {activeTab === "send" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Message Type Buttons */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setMessageType("SMS")}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-lg font-medium transition-colors ${
                  messageType === "SMS"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  SMS
                </div>
              </button>
              <button
                onClick={() => setMessageType("WHATSAPP")}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-lg font-medium transition-colors ${
                  messageType === "WHATSAPP"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                  </svg>
                  WhatsApp
                </div>
              </button>
            </div>
          </div>

          {/* Message Textarea */}
          {messageType && (
            <div className="p-6 border-b border-gray-200">
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Message Content
              </label>
              <textarea
                id="message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                placeholder={`Type your ${messageType} message here...`}
                maxLength={1600}
              />
              <div className="mt-2 text-sm text-gray-500">
                {message.length}/1600 characters
              </div>
            </div>
          )}

          {/* Search and Users List */}
          <div className="p-6">
            {/* Search Bar */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search users by name, email, or contact number..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Users Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Select Users ({pagination.total} total)
              </h3>
              {users.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {selectedUsers.size === users.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No users found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? `No users match "${searchTerm}"`
                    : "No users available."}
                </p>
              </div>
            ) : (
              <>
                {/* Users Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={
                                users.length > 0 &&
                                selectedUsers.size === users.length
                              }
                              onChange={handleSelectAll}
                              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            State
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            District
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Designation
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone Number
                          </th>
                          
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr
                            key={user.user_id}
                            className={`hover:bg-indigo-50 cursor-pointer transition-colors ${
                              selectedUsers.has(user.user_id)
                                ? "bg-indigo-50"
                                : ""
                            }`}
                            onClick={() => handleUserSelect(user.user_id)}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedUsers.has(user.user_id)}
                                onChange={() => handleUserSelect(user.user_id)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                              />
                            </td>
                             <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {user.stateName}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {user.districtName}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {user.role}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {user.contact_no}
                              </div>
                            </td>
                           
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Responsive Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-sm text-gray-700 order-2 sm:order-1">
                      Showing {(currentPage - 1) * pageSize + 1} to{" "}
                      {Math.min(currentPage * pageSize, pagination.total)} of{" "}
                      {pagination.total} results
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 order-1 sm:order-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-2 sm:px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">‹</span>
                      </button>

                      {/* Mobile: Show only current page and total */}
                      <div className="sm:hidden px-3 py-1 text-sm text-gray-600">
                        {currentPage} / {pagination.totalPages}
                      </div>

                      {/* Desktop: Show page numbers */}
                      <div className="hidden sm:flex gap-1">
                        {Array.from(
                          { length: Math.min(5, pagination.totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (pagination.totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (
                              currentPage >=
                              pagination.totalPages - 2
                            ) {
                              pageNum = pagination.totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            if (pageNum < 1 || pageNum > pagination.totalPages)
                              return null;

                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-1 text-sm border rounded-md ${
                                  currentPage === pageNum
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
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                        className="px-2 sm:px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <span className="sm:hidden">›</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Send Button */}
          {messageType && message.trim() && selectedUsers.size > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedUsers.size} user{selectedUsers.size !== 1 ? "s" : ""}{" "}
                  selected
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={sending}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    messageType === "SMS"
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {sending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </div>
                  ) : (
                    `Send ${messageType}`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Communication History Tab */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message Type
                </label>
                <select
                  value={historyFilters.message_type}
                  onChange={(e) =>
                    handleHistoryFilterChange("message_type", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Types</option>
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPP">WhatsApp</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={historyFilters.status}
                  onChange={(e) =>
                    handleHistoryFilterChange("status", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={historyFilters.date_from}
                  onChange={(e) =>
                    handleHistoryFilterChange("date_from", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={historyFilters.date_to}
                  onChange={(e) =>
                    handleHistoryFilterChange("date_to", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setHistoryFilters({
                      message_type: "",
                      status: "",
                      date_from: "",
                      date_to: "",
                    });
                    setHistoryPage(1);
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Communications List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                My Communications ({historyPagination.total || 0} total)
              </h3>
            </div>

            {/* Loading State */}
            {communicationsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="mt-2 text-gray-600">Loading communications...</p>
              </div>
            ) : communicationsError ? (
              <div className="text-center py-8">
                <p className="text-red-600 font-medium">
                  {communicationsError}
                </p>
              </div>
            ) : communications.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No communications found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't sent any messages yet, or no messages match your
                  filters.
                </p>
              </div>
            ) : (
              <>
                {/* Communications Cards */}
                <div className="p-4 space-y-4">
                  {communications.map((comm) => (
                    <div
                      key={comm.communication_id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                comm.message_type === "SMS"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {comm.message_type}
                            </span>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                comm.status
                              )}`}
                            >
                              {comm.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {comm.recipient_type} • {comm.total_recipients}{" "}
                            recipient{comm.total_recipients !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(comm.created_on)}
                        </div>
                      </div>

                      {/* Message Content */}
                      <div className="mb-3">
                        <p className="text-gray-900 text-sm">
                          {comm.message_content}
                        </p>
                      </div>

                      {/* Delivery Stats */}
                      <div className="flex items-center space-x-4 mb-3 text-sm">
                        <div className="flex items-center space-x-1">
                          <span className="text-green-600 font-semibold">
                            {comm.successful_sends}
                          </span>
                          <span className="text-gray-500">successful</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-red-600 font-semibold">
                            {comm.failed_sends}
                          </span>
                          <span className="text-gray-500">failed</span>
                        </div>
                      </div>

                      {/* Delivery Report */}
                      {comm.delivery_report &&
                        comm.delivery_report.length > 0 && (
                          <div className="mt-3">
                            <details className="group">
                              <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                                <svg
                                  className="h-4 w-4 transition-transform group-open:rotate-90"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                                View Delivery Report (
                                {comm.delivery_report.length} recipients)
                              </summary>
                              <div className="mt-2 max-h-48 overflow-auto">
                                <div className="space-y-2">
                                  {comm.delivery_report.map((report, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <span className="font-medium">
                                          {report.recipient}
                                        </span>
                                        {report.user_id && (
                                          <span className="text-gray-500">
                                            (ID: {report.user_id})
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span
                                          className={`inline-flex px-1 py-0.5 rounded text-xs font-semibold ${
                                            report.status === "SUCCESS"
                                              ? "bg-green-100 text-green-700"
                                              : "bg-red-100 text-red-700"
                                          }`}
                                        >
                                          {report.status}
                                        </span>
                                        <span className="text-gray-500">
                                          {formatDate(report.timestamp)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </details>
                          </div>
                        )}

                      {/* Error Details */}
                      {comm.error_details && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
                          <strong className="text-red-700">Error:</strong>{" "}
                          <span className="text-red-600">
                            {comm.error_details}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {historyPagination.totalPages > 1 && (
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing page {historyPagination.page} of{" "}
                        {historyPagination.totalPages}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setHistoryPage(historyPage - 1)}
                          disabled={historyPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-600">
                          {historyPage} / {historyPagination.totalPages}
                        </span>
                        <button
                          onClick={() => setHistoryPage(historyPage + 1)}
                          disabled={
                            historyPage === historyPagination.totalPages
                          }
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
