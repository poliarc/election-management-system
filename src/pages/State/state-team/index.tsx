import { useEffect, useMemo, useState } from "react";
import type { HierarchyUser } from "../../../types/hierarchy";
import { API_CONFIG } from "../../../config/api";
import { getSelectedState } from "../../../services/hierarchyApi";
import toast from "react-hot-toast";

interface StateTeamResponse {
  success: boolean;
  message: string;
  data: {
    location: {
      location_id: number;
      location_name: string;
      location_type: string;
      parent_id: number | null;
    };
    total_users: number;
    active_users: number;
    inactive_users: number;
    users: HierarchyUser[];
  };
}

export default function StateTeamListing() {
  const [stateId, setStateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateData, setStateData] = useState<StateTeamResponse["data"] | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);

  // Get selected state id from localStorage (mirrors DistrictTeam pattern)
  useEffect(() => {
    const updateState = () => {
      const selected = getSelectedState();
      setStateId(selected?.id || null);
    };
    updateState();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth_state" || e.key === null) updateState();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("stateChanged", updateState as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("stateChanged", updateState as EventListener);
    };
  }, []);

  useEffect(() => {
    const fetchStateTeam = async () => {
      if (!stateId) {
        setLoading(false);
        setError("No state selected");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const authState = localStorage.getItem("auth_state");
        const token = authState ? JSON.parse(authState).accessToken : null;
        if (!token) throw new Error("Authentication required");

        const response = await fetch(
          `${API_CONFIG.BASE_URL}/api/user-state-hierarchies/location/${stateId}/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data: StateTeamResponse = await response.json();
        if (data.success) {
          setStateData(data.data);
        } else {
          setError(data.message || "Failed to fetch state team");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchStateTeam();
  }, [stateId]);

  const filteredUsers = useMemo(() => {
    const list = stateData?.users || [];
    const q = searchTerm.trim().toLowerCase();
    return list.filter((user) => {
      const matchesSearch =
        q === "" ||
        user.first_name.toLowerCase().includes(q) ||
        user.last_name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.mobile_number.includes(searchTerm);

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && user.is_active) ||
        (filterStatus === "inactive" && !user.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [stateData?.users, searchTerm, filterStatus]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  // Toggle user status function
  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    setToggleLoading(userId);
    setOpenDropdown(null);

    try {
      const authState = localStorage.getItem("auth_state");
      const token = authState ? JSON.parse(authState).accessToken : null;
      if (!token) throw new Error("Authentication required");

      // Use the same API pattern as InlineUserDisplay component
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/users/${userId}/toggle-status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: !currentStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Update the user status in local state
        setStateData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            users: prev.users.map(user => 
              user.user_id === userId 
                ? { ...user, is_active: !currentStatus }
                : user
            ),
            active_users: currentStatus ? prev.active_users - 1 : prev.active_users + 1,
            inactive_users: currentStatus ? prev.inactive_users + 1 : prev.inactive_users - 1,
          };
        });
        
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        throw new Error(result.message || "Failed to toggle user status");
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to toggle user status");
    } finally {
      setToggleLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading state team...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
          <div className="flex items-center">
            <svg
              className="w-6 h-6 text-red-500 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-red-800 font-semibold">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stateData) {
    return (
      <div className="p-1">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">No state data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 bg-gray-50 min-h-screen">
      {/* Header with Stats Cards */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-3 sm:p-3 text-white mb-1">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold">State Team</h1>
            <p className="text-blue-100 mt-1 text-xs sm:text-sm">{stateData.location.location_name}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            <div className="bg-white text-gray-900 rounded-md shadow-md p-4 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl sm:text-3xl font-semibold mt-1">{stateData.total_users}</p>
              </div>
              <div className="bg-blue-50 rounded-full p-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>

            <div className="bg-white text-gray-900 rounded-md shadow-md p-4 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl sm:text-3xl font-semibold text-green-600 mt-1">{stateData.active_users}</p>
              </div>
              <div className="bg-green-50 rounded-full p-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="bg-white text-gray-900 rounded-md shadow-md p-4 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Inactive Users</p>
                <p className="text-2xl sm:text-3xl font-semibold text-red-600 mt-1">{stateData.inactive_users}</p>
              </div>
              <div className="bg-red-50 rounded-full p-2">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-3 mb-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <p className="text-xs sm:text-sm text-gray-600 whitespace-nowrap sm:ml-auto">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">S.No</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">State</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Designation</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Name</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Email</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Phone Number</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Status</th>
                <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="mt-2 text-gray-500 font-medium">No users found</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => (
                  <tr key={user.assignment_id || index} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 whitespace-nowrap">{startIndex + index + 1}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 whitespace-nowrap">{stateData.location.location_name}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 whitespace-nowrap">{user.user_role||user.role_name || user.role || user.designation || "N/A"}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 whitespace-nowrap">{user.email}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-600 whitespace-nowrap">{user.mobile_number}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm whitespace-nowrap">
                      <div className="relative dropdown-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === user.user_id ? null : user.user_id);
                          }}
                          disabled={toggleLoading === user.user_id}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {toggleLoading === user.user_id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          )}
                        </button>
                        
                        {openDropdown === user.user_id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleUserStatus(user.user_id, user.is_active);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              {user.is_active ? (
                                <>
                                  <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Inactive 
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Active
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} ({filteredUsers.length} users)
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
