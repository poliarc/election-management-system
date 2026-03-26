import { useState, useEffect } from "react";
import { useAppSelector } from "../../../../store/hooks";
import eventApi from "../services/eventApi";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface Event {
  event_id: number;
  event_type: string;
  event_module: string;
  event_action: string;
  event_description: string;
  party_id: number;
  state_id: number;
  user_id: number;
  target_id?: number;
  target_type?: string;
  status: string;
  created_at: string;
  user_full_name: string;
  party_name: string;
  state_name: string;
}

interface EventStats {
  overview: {
    total_events: number;
    success_events: number;
    failed_events: number;
    pending_events: number;
    partial_events: number;
    today_events: number;
    week_events: number;
    month_events: number;
  };
  by_event_type: Array<{ event_type: string; event_count: number }>;
  by_module: Array<{ event_module: string; event_count: number }>;
  top_active_users: Array<{
    user_id: number;
    first_name: string;
    last_name: string;
    user_full_name: string;
    event_count: number;
  }>;
}

export default function EventsStats() {
  const { user } = useAppSelector((state) => state.auth);
  const {t} = useTranslation();
  const [stats, setStats] = useState<EventStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({
    event_type: "",
    event_module: "",
    status: "",
    search: "",
  });
  const [expandedSections, setExpandedSections] = useState({
    eventType: false,
    eventModule: false,
    topUsers: false,
  });

  // Fetch stats
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch events
  useEffect(() => {
    fetchEvents();
  }, [page, filters]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await eventApi.getEventStats({
        party_id: user?.partyId,
        state_id: user?.state_id,
      });

      if (response.success) {
        setStats(response.data);
      } else {
        toast.error(response.message || "Failed to load statistics");
      }
    } catch (error: any) {
      toast.error(error.message || "Error loading statistics");
      console.error("Error:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const queryParams: any = {
        page,
        limit,
        party_id: user?.partyId,
        state_id: user?.state_id,
      };

      if (filters.event_type) queryParams.event_type = filters.event_type;
      if (filters.event_module) queryParams.event_module = filters.event_module;
      if (filters.status) queryParams.status = filters.status;
      if (filters.search) queryParams.search = filters.search;

      const response = await eventApi.getEvents(queryParams);

      if (response.success) {
        setEvents(response.data || []);
        if (response.pagination) {
          setTotal(response.pagination.total);
          setTotalPages(response.pagination.pages);
        }
      } else {
        toast.error(response.message || "Failed to load events");
      }
    } catch (error: any) {
      toast.error(error.message || "Error loading events");
      console.error("Error:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PARTIAL":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const eventTypeColors: Record<string, string> = {
    CREATE: "bg-blue-100 text-blue-800",
    UPDATE: "bg-purple-100 text-purple-800",
    DELETE: "bg-red-100 text-red-800",
    LOGIN: "bg-green-100 text-green-800",
    LOGOUT: "bg-gray-100 text-gray-800",
    UPLOAD: "bg-indigo-100 text-indigo-800",
    DOWNLOAD: "bg-cyan-100 text-cyan-800",
  };

  const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="bg-[var(--bg-color)] rounded-lg shadow p-4 flex-shrink-0">
      <div className="flex flex-col">
        <p className="text-[var(--text-color)] text-xs font-medium">{label}</p>
        <p className={`text-2xl font-bold mt-2 ${color}`}>{value.toLocaleString()}</p>
      </div>
    </div>
  );

  const ToggleSection = ({ title, section }: { title: string; section: 'eventType' | 'eventModule' | 'topUsers' }) => (
    <button
      onClick={() => 
        setExpandedSections(prev => ({
          ...prev,
          [section]: !prev[section]
        }))
      }
      className={`w-full flex items-center justify-between p-4 rounded-lg shadow hover:shadow-md transition ${
        expandedSections[section]
          ? 'bg-[var(--bg-color)] border-2 border-[var(--border-color)]'
          : 'bg-[var(--bg-main)] border-2 border-transparent'
      }`}
    >
      <h2 className={`text-lg font-bold transition ${
        expandedSections[section]
          ? 'text-[var(--text-color)]'
          : 'text-[var(--text-color)]'
      }`}>{title}</h2>
      <svg
        className={`w-6 h-6 transition-transform duration-300 ${
          expandedSections[section] ? 'text-[var(--text-color)] rotate-180' : 'text-[var(--text-color)]'
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </button>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-card)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Header */}
        <div className="mb-1 flex items-start justify-between gap-8">
          <div className="flex-shrink-0">
            <h1 className="text-3xl font-bold text-[var(--text-color)]">
              {t("eventStatus.Title")}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t("eventStatus.Desc")}
            </p>
          </div>
          {!loadingStats && stats && (
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 min-w-max pb-2">
                <div className="flex-shrink-0 w-48">
                  <StatCard
                    label="Total Events"
                    value={stats.overview.total_events}
                    color="text-blue-600"
                  />
                </div>
                <div className="flex-shrink-0 w-48">
                  <StatCard
                    label="Today"
                    value={stats.overview.today_events}
                    color="text-indigo-600"
                  />
                </div>
                <div className="flex-shrink-0 w-48">
                  <StatCard
                    label="This Week"
                    value={stats.overview.week_events}
                    color="text-purple-600"
                  />
                </div>
                <div className="flex-shrink-0 w-48">
                  <StatCard
                    label="This Month"
                    value={stats.overview.month_events}
                    color="text-pink-600"
                  />
                </div>
                <div className="flex-shrink-0 w-48">
                  <StatCard
                    label="Successful"
                    value={stats.overview.success_events}
                    color="text-green-600"
                  />
                </div>
                <div className="flex-shrink-0 w-48">
                  <StatCard
                    label="Failed"
                    value={stats.overview.failed_events}
                    color="text-red-600"
                  />
                </div>
                <div className="flex-shrink-0 w-48">
                  <StatCard
                    label="Pending"
                    value={stats.overview.pending_events}
                    color="text-yellow-600"
                  />
                </div>
                
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Stats Sections */}
        {!loadingStats && stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-1">
            {/* Events by Type */}
            <div>
              <ToggleSection title="Access Report By Type" section="eventType" />
              {expandedSections.eventType && (
                <div className="mt-2 bg-[var(--bg-color)]  rounded-lg shadow p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {stats.by_event_type.map((item) => (
                      <div
                        key={item.event_type}
                        className="flex items-center justify-between p-3 border  border-gray-200 dark:border-gray-700 rounded"
                      >
                        <span className="text-[var(--text-main)] text-sm">{item.event_type}</span>
                        <span className="font-bold text-indigo-600">{item.event_count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Events by Module */}
            <div>
              <ToggleSection title="Access Report By Module" section="eventModule" />
              {expandedSections.eventModule && (
                <div className="mt-2 bg-[var(--bg-color)]  rounded-lg shadow p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {stats.by_module.map((item) => (
                      <div
                        key={item.event_module}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded"
                      >
                        <span className="text-[var(--text-main)] text-sm capitalize">{item.event_module}</span>
                        <span className="font-bold text-indigo-600">{item.event_count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Top Active Users */}
            <div>
              <ToggleSection title="Top Active Users" section="topUsers" />
              {expandedSections.topUsers && (
                <div className="mt-2 bg-[var(--bg-color)] rounded-lg shadow p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {stats.top_active_users.map((userStat, index) => (
                      <div
                        key={userStat.user_id}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-white bg-indigo-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-[var(--text-main)] text-sm">{userStat.user_full_name}</span>
                        </div>
                        <span className="font-bold text-indigo-600">{userStat.event_count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter Section */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow p-6 mb-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                {t("eventStatus.Activity_Type")}
              </label>
              <select
                name="event_type"
                value={filters.event_type}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[var(--text-secondary)]"
              >
                <option value="">{t("eventStatus.All_Types")}</option>
                <option value="CREATE">{t("eventStatus.Create")}</option>
                <option value="UPDATE">{t("eventStatus.Update")}</option>
                <option value="DELETE">{t("eventStatus.Delete")}</option>
                <option value="LOGIN">{t("eventStatus.Login")}</option>
                <option value="LOGOUT">{t("eventStatus.Logout")}</option>
                <option value="UPLOAD">{t("eventStatus.Upload")}</option>
                <option value="DOWNLOAD">{t("eventStatus.Download")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                {t("eventStatus.Activity_Module")}
              </label>
              <input
                type="text"
                name="event_module"
                value={filters.event_module}
                onChange={handleFilterChange}
                placeholder="Search module..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[var(--text-secondary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                {t("eventStatus.Status")}
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[var(--text-secondary)]"
              >
                <option value="">{t("eventStatus.All_Status")}</option>
                <option value="SUCCESS">{t("eventStatus.Success")}</option>
                <option value="FAILED">{t("eventStatus.Failed")}</option>
                <option value="PENDING">{t("eventStatus.Pending")}</option>
                <option value="PARTIAL">{t("eventStatus.Partial")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-main)] mb-2">
                {t("eventStatus.Search")}
              </label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search events..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-[var(--text-secondary)]"
              />
            </div>
          </div>
        </div>

        {/* Events Table */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow overflow-hidden">
          {loadingEvents ? (
            <div className="p-8 text-center">
              <div className="inline-block">
                <svg
                  className="animate-spin h-8 w-8 text-indigo-600"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <p className="mt-2 text-gray-500 dark:text-gray-400">{t("eventStatus.Loading")}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">{t("eventStatus.Desc1")}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-[var(--bg-card)]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t("eventStatus.Activity")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t("eventStatus.Type")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t("eventStatus.Module")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t("eventStatus.User")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t("eventStatus.Status")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                        {t("eventStatus.Date")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--bg-color)] divide-y divide-gray-200 dark:divide-gray-700">
                    {events.map((event) => (
                      <tr
                        key={event.event_id}
                        className="hover:bg-[var(--bg-card)] transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <p className="font-medium text-[var(--text-main)]">
                              {event.event_action}
                            </p>
                            <p className="text-[var(--text-secondary)] text-xs">
                              {event.event_description}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              eventTypeColors[event.event_type] ||
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {event.event_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-main)]">
                          {event.event_module}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                          {event.user_full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(
                              event.status
                            )}`}
                          >
                            {event.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                          {new Date(event.created_at).toLocaleDateString()}{" "}
                          {new Date(event.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-[var(--bg-color)] px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-[var(--text-muted)]">
                  {t("eventStatus.Showing")} {events.length} {t("eventStatus.of")} {total} {t("eventStatus.events")}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("eventStatus.Previous")}
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    {t("eventStatus.Page")} {page} {t("eventStatus.of")} {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("eventStatus.Next")}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
