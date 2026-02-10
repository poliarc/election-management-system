import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
    Calendar,
    Filter,
    CheckCircle,
    XCircle,
    AlertOctagon,
    Shield,
    Globe,
    Smartphone,
    User as UserIcon,
    BarChart3,
    Table as TableIcon,
    Users,
    Search
} from "lucide-react";
import { useGetLoginSessionsByPartyQuery, useGetUserLoginReportQuery } from "../../../store/api/loginSessionApi";
import { useGetUsersByPartyQuery } from "../../../store/api/partyUserApi";
import { useGetAllStateMasterDataQuery } from "../../../store/api/stateMasterApi";
import { format } from "date-fns";
import SearchableSelect from "../../../components/SearchableSelect";

export const LoginReportPage: React.FC = () => {
    const { partyId } = useParams<{ partyId: string }>();

    // Mode: 'sessions' or 'user-report'
    const [mode, setMode] = useState<"sessions" | "user-report">("sessions");

    // --- State for Sessions Log ---
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<"SUCCESS" | "FAILED" | "BLOCKED" | "">("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [selectedStateId, setSelectedStateId] = useState<number | null>(null);

    // --- State for User Report ---
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
    const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
    const [userPage, setUserPage] = useState(1);
    const [userSearch, setUserSearch] = useState("");
    const [preservedUser, setPreservedUser] = useState<any>(null);

    // Data Fetching
    const { data: stateMasterData = [] } = useGetAllStateMasterDataQuery();

    // Filter states
    const states = stateMasterData.filter(
        (item) => item.levelType === "State" && item.isActive === 1
    );

    const stateOptions = states.map(s => ({ value: s.id, label: s.levelName }));

    // Sessions Query
    const { data: sessionsData, isLoading: isSessionsLoading, isFetching: isSessionsFetching } = useGetLoginSessionsByPartyQuery(
        {
            partyId: Number(partyId),
            params: {
                page,
                limit: 50,
                ...(statusFilter && { login_status: statusFilter }),
                ...(dateFrom && { date_from: dateFrom }),
                ...(dateTo && { date_to: `${dateTo} 23:59:59` }),
                ...(selectedStateId && { state_id: selectedStateId }),
            },
        },
        { skip: !partyId || mode !== "sessions" }
    );

    // Users Query (for user list view)
    const { data: usersResponse, isLoading: isUsersLoading } = useGetUsersByPartyQuery(
        {
            partyId: Number(partyId),
            params: {
                page: userPage,
                limit: 50,
                ...(userSearch && { search: userSearch })
            },
        },
        {
            skip: !partyId || mode === "sessions",
            refetchOnMountOrArgChange: true
        }
    );

    const userOptions = useMemo(() => {
        const currentOptions = usersResponse?.data?.map(u => ({
            value: u.user_id,
            label: `${u.first_name} ${u.last_name || ''} (${u.role || 'User'})`,
            subtitle: u.email
        })) || [];

        if (preservedUser && !currentOptions.find(o => o.value === preservedUser.value)) {
            currentOptions.push(preservedUser);
        }
        return currentOptions;
    }, [usersResponse, preservedUser]);

    // User Report Query
    const { data: userReportData, isLoading: isReportLoading } = useGetUserLoginReportQuery(
        {
            userId: selectedUserId!,
            reportType,
            date: reportDate
        },
        { skip: !selectedUserId || mode !== "user-report" }
    );

    const sessions = useMemo(() => {
        const data = sessionsData?.data || [];
        if (!userSearch) return data;
        const lowerSearch = userSearch.toLowerCase();
        return data.filter(s =>
            (s.first_name && s.first_name.toLowerCase().includes(lowerSearch)) ||
            (s.last_name && s.last_name.toLowerCase().includes(lowerSearch)) ||
            (s.username && s.username.toLowerCase().includes(lowerSearch)) ||
            (s.user_email && s.user_email.toLowerCase().includes(lowerSearch))
        );
    }, [sessionsData, userSearch]);

    const pagination = sessionsData?.pagination;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "SUCCESS":
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Success
                    </span>
                );
            case "FAILED":
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                    </span>
                );
            case "BLOCKED":
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <AlertOctagon className="w-3 h-3 mr-1" />
                        Blocked
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Login Activity Report</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Monitor login sessions and security events for your party members.
                    </p>
                </div>
                <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    <button
                        onClick={() => setMode("sessions")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === "sessions" ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-gray-900"}`}
                    >
                        <TableIcon className="w-4 h-4 inline-block mr-2" />
                        Session Logs
                    </button>
                    <button
                        onClick={() => setMode("user-report")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === "user-report" ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-gray-900"}`}
                    >
                        <BarChart3 className="w-4 h-4 inline-block mr-2" />
                        User Analytics
                    </button>
                </div>
            </div>

            {mode === "sessions" ? (
                // --- SESSIONS LOG VIEW ---
                <>
                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            {/* State Filter */}
                            <div className="w-full">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Filter by State
                                </label>
                                <SearchableSelect
                                    options={stateOptions}
                                    value={selectedStateId}
                                    onChange={(val) => {
                                        setSelectedStateId(val as number);
                                        setPage(1);
                                    }}
                                    placeholder="Select State"
                                />
                            </div>

                            <div className="w-full">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <div className="relative">
                                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value as any);
                                            setPage(1);
                                        }}
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="SUCCESS">Success</option>
                                        <option value="FAILED">Failed</option>
                                        <option value="BLOCKED">Blocked</option>
                                    </select>
                                </div>
                            </div>

                            <div className="w-full">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    From Date
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => {
                                            setDateFrom(e.target.value);
                                            setPage(1);
                                        }}
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="w-full">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    To Date
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => {
                                            setDateTo(e.target.value);
                                            setPage(1);
                                        }}
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="w-full">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Name, Username, Email"
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Content */}
                    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-opacity duration-200 ${isSessionsFetching ? 'opacity-70 pointer-events-none' : ''}`}>
                        {isSessionsLoading ? (
                            <div className="p-8 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                                <p className="mt-2 text-sm text-gray-500">Loading sessions...</p>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                    <Shield className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900">No login sessions found</h3>
                                <p className="mt-1 text-gray-500 max-w-sm mx-auto">
                                    No login activity matches your current filters. Try adjusting criteria.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Device / IP
                                            </th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Location
                                            </th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Time
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {sessions.map((session) => (
                                            <tr
                                                key={session.id}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs ring-2 ring-white">
                                                            {(session.first_name?.[0] || session.username?.[0] || "U").toUpperCase()}
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {session.first_name ? `${session.first_name} ${session.last_name || ''}` : session.username}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate max-w-[150px]">
                                                                {session.username}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        {getStatusBadge(session.login_status)}
                                                        {session.failure_reason && (
                                                            <span className="text-xs text-red-500 font-medium">
                                                                {session.failure_reason.replace(/_/g, " ")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center text-xs text-gray-900 font-medium">
                                                            <Globe className="w-3 h-3 mr-1.5 text-gray-400" />
                                                            {session.ip_address}
                                                        </div>
                                                        <div className="flex items-center text-xs text-gray-500" title={session.user_agent}>
                                                            <Smartphone className="w-3 h-3 mr-1.5 text-gray-400" />
                                                            <span className="truncate max-w-[200px]">
                                                                {session.user_agent}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-600">
                                                            {session.country_code || "Unknown"}
                                                        </span>
                                                        {session.stateName && <span className="text-xs text-gray-400">{session.stateName}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-900">
                                                        {format(new Date(session.created_at), "MMM d, yyyy")}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {format(new Date(session.created_at), "h:mm a")}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Showing <span className="font-medium">{(page - 1) * 50 + 1}</span> to{" "}
                                    <span className="font-medium">
                                        {Math.min(page * 50, pagination.total)}
                                    </span>{" "}
                                    of <span className="font-medium">{pagination.total}</span> results
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                        disabled={page === pagination.totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                // --- USER REPORT VIEW ---
                <div className="space-y-6">
                    {/* View Switcher: List or Details */}
                    {!selectedUserId ? (
                        <>
                            {/* User List Controls */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                                <div className="max-w-md">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Search User
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <UserIcon className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={userSearch}
                                            onChange={(e) => {
                                                setUserSearch(e.target.value);
                                                setUserPage(1);
                                            }}
                                            placeholder="Search by name, email or mobile..."
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* User Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {isUsersLoading ? (
                                    <div className="p-8 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                                        <p className="mt-2 text-sm text-gray-500">Loading users...</p>
                                    </div>
                                ) : (usersResponse?.data || []).length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                            <Users className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">No users found</h3>
                                        <p className="mt-1 text-gray-500">
                                            Try adjusting your search terms.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            User Name
                                                        </th>
                                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Role
                                                        </th>
                                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Email / Contact
                                                        </th>
                                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                                                            Action
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {(usersResponse?.data || []).map((user) => (
                                                        <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center">
                                                                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                                        {(user.first_name?.[0] || "U").toUpperCase()}
                                                                    </div>
                                                                    <div className="ml-3">
                                                                        <p className="text-sm font-medium text-gray-900">
                                                                            {user.first_name} {user.last_name}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                                    {user.role || "User"}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-gray-900">{user.email}</div>
                                                                <div className="text-xs text-gray-500">{user.contact_no}</div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button
                                                                    onClick={() => setSelectedUserId(user.user_id)}
                                                                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium hover:underline"
                                                                >
                                                                    View Report
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        {usersResponse?.pagination && usersResponse.pagination.totalPages > 1 && (
                                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                                <div className="text-sm text-gray-500">
                                                    Page <span className="font-medium">{userPage}</span> of <span className="font-medium">{usersResponse.pagination.totalPages}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                                                        disabled={userPage === 1}
                                                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        Previous
                                                    </button>
                                                    <button
                                                        onClick={() => setUserPage((p) => Math.min(usersResponse.pagination!.totalPages, p + 1))}
                                                        disabled={userPage === usersResponse.pagination!.totalPages}
                                                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        Next
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        // Detailed Report View
                        <>
                            <div className="mb-4">
                                <button
                                    onClick={() => setSelectedUserId(null)}
                                    className="text-sm text-gray-500 hover:text-gray-900 flex items-center transition-colors"
                                >
                                    ← Back to Users List
                                </button>
                            </div>

                            {/* Controls */}
                            {/* Controls */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="w-full md:w-72">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Select User to View
                                        </label>
                                        <SearchableSelect
                                            options={userOptions}
                                            value={selectedUserId}
                                            onChange={(val) => {
                                                const selected = userOptions.find(u => u.value === val);
                                                if (selected) setPreservedUser(selected);
                                                else setPreservedUser(null);
                                                setSelectedUserId(val as number);
                                            }}
                                            onSearch={setUserSearch}
                                            placeholder="Search User by Name/Email..."
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto md:justify-end">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Report Type:</span>
                                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                                {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setReportType(type)}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${reportType === type ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                    >
                                                        {type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Date:</span>
                                            <input
                                                type="date"
                                                value={reportDate}
                                                onChange={(e) => setReportDate(e.target.value)}
                                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Report Display */}
                            {isReportLoading ? (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                                    <p className="mt-2 text-sm text-gray-500">Generating report...</p>
                                </div>
                            ) : userReportData ? (
                                <div className="space-y-6">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Logins</p>
                                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                                {userReportData.data.reduce((acc, curr) => acc + Number(curr.total_logins), 0)}
                                            </p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Successful</p>
                                            <p className="text-2xl font-bold text-green-600 mt-1">
                                                {userReportData.data.reduce((acc, curr) => acc + Number(curr.successful_logins), 0)}
                                            </p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Failed</p>
                                            <p className="text-2xl font-bold text-red-600 mt-1">
                                                {userReportData.data.reduce((acc, curr) => acc + Number(curr.failed_logins), 0)}
                                            </p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unique IPs</p>
                                            <p className="text-2xl font-bold text-purple-600 mt-1">
                                                {userReportData.data.reduce((acc, curr) => acc + Number(curr.unique_ips), 0)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Detailed Table */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                            <h3 className="font-medium text-gray-900">
                                                Detailed Breakdown ({reportType})
                                            </h3>
                                            <span className="text-sm text-gray-500">
                                                {userReportData.user.first_name} {userReportData.user.last_name}
                                            </span>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Time Period
                                                        </th>
                                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                                                            Total
                                                        </th>
                                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                                                            Success
                                                        </th>
                                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                                                            Failed
                                                        </th>
                                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                                                            Unique IPs
                                                        </th>
                                                        <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Visual
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {userReportData.data.map((row, idx) => {
                                                        const label = reportType === 'daily'
                                                            ? `${row.hour}:00 - ${row.hour}:59`
                                                            : reportType === 'weekly'
                                                                ? `${row.day_name} (${row.report_date})`
                                                                : `Day ${row.day} (${row.report_date})`;

                                                        const maxLogins = Math.max(...userReportData.data.map(d => d.total_logins), 1);
                                                        const percentage = (row.total_logins / maxLogins) * 100;

                                                        return (
                                                            <tr key={idx} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                                    {label}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-600 text-right">
                                                                    {row.total_logins}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-green-600 text-right font-medium">
                                                                    {row.successful_logins}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-red-600 text-right font-medium">
                                                                    {row.failed_logins}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-gray-600 text-right">
                                                                    {row.unique_ips}
                                                                </td>
                                                                <td className="px-6 py-4 w-48">
                                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-indigo-500 rounded-full"
                                                                            style={{ width: `${percentage}%` }}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
                                        <AlertOctagon className="w-8 h-8 text-red-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">Failed to load report</h3>
                                    <p className="mt-1 text-gray-500">
                                        Please try again later or select a different user.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

