import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { useHierarchyData, useSelectedDistrictId } from '../../hooks/useHierarchyData';
import { API_CONFIG } from '../../config/api';

const CARD_THEMES = [
    {
        bg: "bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50",
        ring: "focus-visible:ring-blue-500/60",
        accent: "text-blue-600",
        button: "from-blue-500 to-indigo-600",
        hoverShadow: "hover:shadow-blue-100",
    },
    {
        bg: "bg-linear-to-br from-emerald-50 via-green-50 to-teal-50",
        ring: "focus-visible:ring-emerald-500/60",
        accent: "text-emerald-600",
        button: "from-emerald-500 to-green-600",
        hoverShadow: "hover:shadow-emerald-100",
    },
    {
        bg: "bg-linear-to-br from-amber-50 via-orange-50 to-yellow-50",
        ring: "focus-visible:ring-amber-500/60",
        accent: "text-amber-600",
        button: "from-orange-500 to-amber-500",
        hoverShadow: "hover:shadow-amber-100",
    },
    {
        bg: "bg-linear-to-br from-rose-50 via-pink-50 to-red-50",
        ring: "focus-visible:ring-rose-500/60",
        accent: "text-rose-600",
        button: "from-rose-500 to-pink-600",
        hoverShadow: "hover:shadow-rose-100",
    },
    {
        bg: "bg-linear-to-br from-violet-50 via-purple-50 to-fuchsia-50",
        ring: "focus-visible:ring-violet-500/60",
        accent: "text-violet-600",
        button: "from-violet-500 to-purple-600",
        hoverShadow: "hover:shadow-violet-100",
    },
];

type NavCard = {
    key: string;
    title: string;
    subtitle: string;
    path: string;
    stats?: { label: string; value: string | number; colorClass?: string }[];
};

export default function DistrictDashboard() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const districtId = useSelectedDistrictId();
    const [districtName, setDistrictName] = useState("");
    const [totalBlocks, setTotalBlocks] = useState(0);
    const [totalMandals, setTotalMandals] = useState(0);

    // Fetch assemblies count
    const { data: assemblies, totalChildren: totalAssemblies } = useHierarchyData(districtId, 1000);

    // Calculate total users across all assemblies
    const totalUsers = useMemo(() => {
        return assemblies.reduce((sum, assembly) => sum + (assembly.total_users || 0), 0);
    }, [assemblies]);

    const activeUsers = useMemo(() => {
        return assemblies.reduce((sum, assembly) => sum + (assembly.active_users || 0), 0);
    }, [assemblies]);

    // Get district name from localStorage and update when districtId changes
    useEffect(() => {
        try {
            const authState = localStorage.getItem('auth_state');
            if (authState) {
                const parsed = JSON.parse(authState);
                const selectedAssignment = parsed.selectedAssignment;
                if (selectedAssignment) {
                    setDistrictName(selectedAssignment.levelName || 'District');
                }
            }
        } catch (err) {
            console.error('Error reading district info:', err);
        }
    }, [districtId]); // Re-run when districtId changes

    // Fetch blocks and mandals count when assemblies change
    useEffect(() => {
        const fetchBlocksAndMandals = async () => {
            if (!assemblies || assemblies.length === 0) {
                setTotalBlocks(0);
                setTotalMandals(0);
                return;
            }

            try {
                const authState = localStorage.getItem('auth_state');
                const token = authState ? JSON.parse(authState).accessToken : null;
                if (!token) return;

                // Fetch blocks for all assemblies using the after-assembly-data API
                const blockPromises = assemblies.map(async (assembly) => {
                    try {
                        const response = await fetch(
                            `${API_CONFIG.BASE_URL}/api/after-assembly-data/assembly/${assembly.location_id}`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                },
                            }
                        );
                        const data = await response.json();
                        const blocks = data.data || [];
                        return {
                            blocks: blocks,
                            total: blocks.length,
                        };
                    } catch {
                        return { blocks: [], total: 0 };
                    }
                });

                const blockResults = await Promise.all(blockPromises);
                const allBlocks = blockResults.flatMap(r => r.blocks);
                const blocksCount = blockResults.reduce((sum, r) => sum + r.total, 0);
                setTotalBlocks(blocksCount);

                // Fetch mandals/users for all blocks
                if (allBlocks.length > 0) {
                    const mandalPromises = allBlocks.map(async (block: any) => {
                        try {
                            const response = await fetch(
                                `${API_CONFIG.BASE_URL}/api/user-after-assembly-hierarchy/after-assembly/${block.id}`,
                                {
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                    },
                                }
                            );
                            const data = await response.json();
                            return data.data?.total_users || data.data?.users?.length || 0;
                        } catch {
                            return 0;
                        }
                    });

                    const mandalResults = await Promise.all(mandalPromises);
                    const mandalsCount = mandalResults.reduce((sum, count) => sum + count, 0);
                    setTotalMandals(mandalsCount);
                } else {
                    setTotalMandals(0);
                }
            } catch (error) {
                console.error('Error fetching blocks and mandals:', error);
                setTotalBlocks(0);
                setTotalMandals(0);
            }
        };

        fetchBlocksAndMandals();
    }, [assemblies]);

    const navCards: NavCard[] = useMemo(
        () => [
            {
                key: "assembly",
                title: "Assemblies",
                subtitle: "Assembly constituencies",
                path: "/district/assembly",
                stats: [
                    { label: "Total", value: totalAssemblies || 0 },
                    { label: "Active Users", value: activeUsers || 0, colorClass: "text-green-600" },
                ],
            },
            {
                key: "block",
                title: "Blocks",
                subtitle: "Block administration",
                path: "/district/block",
                stats: [
                    { label: "Total", value: totalBlocks || 0 },
                    { label: "Assemblies", value: totalAssemblies || 0 },
                ],
            },
            {
                key: "mandal",
                title: "Mandals",
                subtitle: "Mandal operations",
                path: "/district/mandal",
                stats: [
                    { label: "Total", value: totalMandals || 0 },
                    { label: "Blocks", value: totalBlocks || 0 },
                ],
            },
            {
                key: "polling-centers",
                title: "Polling Centers",
                subtitle: "Polling center data",
                path: "/district/polling-center",
                stats: [
                    { label: "View", value: "→" },
                    { label: "Manage", value: "→" },
                ],
            },
            {
                key: "booth",
                title: "Booths",
                subtitle: "Booth level data",
                path: "/district/booth",
                stats: [
                    { label: "View", value: "→" },
                    { label: "Manage", value: "→" },
                ],
            },
            {
                key: "karyakarta",
                title: "Karyakarta",
                subtitle: "Grassroot workers",
                path: "/district/karyakarta",
                stats: [
                    { label: "Total Users", value: totalUsers || 0 },
                    { label: "Active", value: activeUsers || 0, colorClass: "text-green-600" },
                ],
            },
        ],
        [totalAssemblies, totalUsers, activeUsers, totalBlocks, totalMandals]
    );

    const filteredCards = useMemo(() => {
        if (!searchTerm.trim()) return navCards;
        const q = searchTerm.toLowerCase();
        return navCards.filter(
            (c) =>
                c.title.toLowerCase().includes(q) ||
                c.subtitle.toLowerCase().includes(q)
        );
    }, [searchTerm, navCards]);

    const goTo = (path: string) => navigate(path);

    const handleKeyActivate = (e: KeyboardEvent<HTMLLIElement>, path: string) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goTo(path);
        }
    };

    return (
        <div className="w-full py-8 min-h-screen box-border rounded-2xl shadow-md bg-gray-50 transition-all mx-auto px-4">
            {/* Header & Search */}
            <header className="mb-8 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                            {districtName} District Dashboard
                        </h1>
                        <p className="text-sm text-gray-600">
                            Navigate to administrative & organizational sections.
                        </p>
                    </div>
                    <div className="relative max-w-md w-full lg:w-80 group">
                        <label htmlFor="dashboard-search" className="sr-only">
                            Search sections
                        </label>
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-gray-500 transition-colors">
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </span>
                        <input
                            id="dashboard-search"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search..."
                            className="peer block w-full rounded-xl border border-gray-300 bg-white/70 backdrop-blur-sm pl-10 pr-10 py-2.5 text-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded"
                                aria-label="Clear search"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
                {searchTerm && (
                    <div className="flex items-center gap-2 text-sm">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                            {filteredCards.length === 0
                                ? "No results"
                                : `${filteredCards.length} result${filteredCards.length > 1 ? "s" : ""
                                }`}
                        </span>
                        <span className="text-gray-500">for "{searchTerm}"</span>
                    </div>
                )}
            </header>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Assemblies</p>
                            <p className="text-3xl font-bold mt-2">{totalAssemblies || 0}</p>
                        </div>
                        <div className="bg-white/20 rounded-full p-3">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Total Users</p>
                            <p className="text-3xl font-bold mt-2">{totalUsers || 0}</p>
                        </div>
                        <div className="bg-white/20 rounded-full p-3">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-100 text-sm font-medium">Active Users</p>
                            <p className="text-3xl font-bold mt-2">{activeUsers || 0}</p>
                        </div>
                        <div className="bg-white/20 rounded-full p-3">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards */}
            {filteredCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-gray-300 rounded-2xl bg-white/50">
                    <svg
                        className="h-14 w-14 text-gray-300 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.25}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <p className="text-sm text-gray-600">
                        No sections match your search.
                    </p>
                    <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="mt-4 text-xs font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded"
                    >
                        Reset search
                    </button>
                </div>
            ) : (
                <ul
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                    role="list"
                >
                    {filteredCards.map((card, index) => {
                        const theme = CARD_THEMES[index % CARD_THEMES.length];
                        return (
                            <li
                                key={card.key}
                                role="button"
                                tabIndex={0}
                                aria-label={`Open ${card.title}`}
                                onClick={() => goTo(card.path)}
                                onKeyDown={(e) => handleKeyActivate(e, card.path)}
                                className={`group relative isolate rounded-2xl border border-gray-200 bg-white shadow-sm ${theme.hoverShadow} transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 ${theme.ring} cursor-pointer`}
                            >
                                <div
                                    className={`absolute inset-0 -z-10 opacity-80 group-hover:opacity-95 transition ${theme.bg} rounded-2xl`}
                                />
                                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-t from-white/0 via-white/0 to-white/40 opacity-0 group-hover:opacity-100 transition" />
                                <div className="p-5 flex flex-col h-full">
                                    <div className="flex-1 space-y-2">
                                        <h3
                                            className={`text-base font-semibold leading-tight text-gray-800 group-hover:${theme.accent} transition-colors`}
                                        >
                                            {card.title}
                                        </h3>
                                        <p className="text-[11px] font-medium text-gray-500 tracking-wide uppercase">
                                            {card.subtitle}
                                        </p>
                                        {card.stats && (
                                            <div className="mt-3 space-y-1.5 text-[11px] font-medium">
                                                {card.stats.map((s) => (
                                                    <div
                                                        key={s.label}
                                                        className="flex justify-between text-gray-600"
                                                    >
                                                        <span>{s.label}</span>
                                                        <span className={s.colorClass ?? "text-gray-700 font-semibold"}>
                                                            {s.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-5">
                                        <span
                                            className={`inline-flex items-center justify-center w-full rounded-lg bg-linear-to-r ${theme.button} text-white text-xs font-medium py-2 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition`}
                                        >
                                            Open →
                                        </span>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
