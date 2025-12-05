import { useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { useHierarchyData } from "../../hooks/useHierarchyData";

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
];

type NavCard = {
  key: string;
  title: string;
  subtitle: string;
  path: string;
  stats?: { label: string; value: string | number; colorClass?: string }[];
};

export default function StateOverview() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [stateId, setStateId] = useState<number | null>(null);
  const [stateName, setStateName] = useState("");
  const [totalAssemblies, setTotalAssemblies] = useState(0);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [totalMandals, setTotalMandals] = useState(0);
  const [totalPollingCenters, setTotalPollingCenters] = useState(0);
  const [totalBooths, setTotalBooths] = useState(0);

  // Get state info from localStorage
  useEffect(() => {
    const loadStateInfo = () => {
      try {
        const authState = localStorage.getItem("auth_state");
        if (authState) {
          const parsed = JSON.parse(authState);
          const selectedAssignment = parsed.selectedAssignment;

          if (selectedAssignment && selectedAssignment.levelType === "State") {
            const id = selectedAssignment.stateMasterData_id;
            const name = selectedAssignment.levelName;
            setStateId(id);
            setStateName(name);
          }
        }
      } catch (err) {
        console.error("Error reading state info:", err);
      }
    };

    loadStateInfo();

    // Listen for storage changes (when state is changed from topbar)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "auth_state") {
        loadStateInfo();
      }
    };

    // Listen for custom event (for same-tab changes)
    const handleAuthStateChange = () => {
      loadStateInfo();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth_state_changed", handleAuthStateChange);
    window.addEventListener("assignmentChanged", handleAuthStateChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth_state_changed", handleAuthStateChange);
      window.removeEventListener("assignmentChanged", handleAuthStateChange);
    };
  }, []);

  // Fetch districts for this state
  const { data: districts, totalChildren: totalDistricts } = useHierarchyData(
    stateId,
    1000
  );

  // Calculate total users across all districts
  const totalUsers = useMemo(() => {
    return districts.reduce(
      (sum, district) => sum + (district.total_users || 0),
      0
    );
  }, [districts]);

  const activeUsers = useMemo(() => {
    return districts.reduce(
      (sum, district) => sum + (district.active_users || 0),
      0
    );
  }, [districts]);

  // Fetch assemblies, blocks, mandals, polling centers, and booths
  useEffect(() => {
    const fetchHierarchyCounts = async () => {
      if (!districts || districts.length === 0) {
        setTotalAssemblies(0);
        setTotalBlocks(0);
        setTotalMandals(0);
        setTotalPollingCenters(0);
        setTotalBooths(0);
        return;
      }

      try {
        const authState = localStorage.getItem('auth_state');
        const token = authState ? JSON.parse(authState).accessToken : null;
        if (!token) return;

        let assembliesCount = 0;
        let blocksCount = 0;
        let mandalsCount = 0;
        let pollingCentersCount = 0;
        let boothsCount = 0;

        // Fetch assemblies for each district
        for (const district of districts) {
          try {
            const assembliesResponse = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/api/user-state-hierarchies/hierarchy/children/${district.location_id}?page=1&limit=1000`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              }
            );
            const assembliesData = await assembliesResponse.json();
            const assemblies = assembliesData.data?.children || [];
            assembliesCount += assemblies.length;

            // Fetch blocks for each assembly
            for (const assembly of assemblies) {
              try {
                const blocksResponse = await fetch(
                  `${import.meta.env.VITE_API_BASE_URL}/api/after-assembly-data/assembly/${assembly.location_id}`,
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    },
                  }
                );
                const blocksData = await blocksResponse.json();
                const blocks = blocksData.data || [];
                blocksCount += blocks.length;

                // Fetch mandals for each block
                for (const block of blocks) {
                  try {
                    const blockHierarchyResponse = await fetch(
                      `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${block.id}`,
                      {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                        },
                      }
                    );
                    const blockHierarchyData = await blockHierarchyResponse.json();
                    const mandals = blockHierarchyData.children || [];
                    mandalsCount += mandals.length;

                    // Fetch polling centers for each mandal
                    for (const mandal of mandals) {
                      try {
                        const mandalHierarchyResponse = await fetch(
                          `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${mandal.id}`,
                          {
                            headers: {
                              'Authorization': `Bearer ${token}`,
                            },
                          }
                        );
                        const mandalHierarchyData = await mandalHierarchyResponse.json();
                        const pollingCenters = mandalHierarchyData.children || [];
                        pollingCentersCount += pollingCenters.length;

                        // Fetch booths for each polling center
                        for (const pc of pollingCenters) {
                          try {
                            const pcHierarchyResponse = await fetch(
                              `${import.meta.env.VITE_API_BASE_URL}/api/user-after-assembly-hierarchy/hierarchy/children/${pc.id}`,
                              {
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                },
                              }
                            );
                            const pcHierarchyData = await pcHierarchyResponse.json();
                            const booths = pcHierarchyData.children || [];
                            boothsCount += booths.length;
                          } catch (error) {
                            console.error(`Error fetching booths for polling center ${pc.id}:`, error);
                          }
                        }
                      } catch (error) {
                        console.error(`Error fetching polling centers for mandal ${mandal.id}:`, error);
                      }
                    }
                  } catch (error) {
                    console.error(`Error fetching mandals for block ${block.id}:`, error);
                  }
                }
              } catch (error) {
                console.error(`Error fetching blocks for assembly ${assembly.location_id}:`, error);
              }
            }
          } catch (error) {
            console.error(`Error fetching assemblies for district ${district.location_id}:`, error);
          }
        }

        setTotalAssemblies(assembliesCount);
        setTotalBlocks(blocksCount);
        setTotalMandals(mandalsCount);
        setTotalPollingCenters(pollingCentersCount);
        setTotalBooths(boothsCount);
      } catch (error) {
        console.error('Error fetching hierarchy counts:', error);
      }
    };

    fetchHierarchyCounts();
  }, [districts]);

  // Static cards; adjust paths if needed
  const navCards: NavCard[] = useMemo(
    () => [
      {
        key: "district",
        title: "Districts",
        subtitle: "Manage district level overview",
        path: "/state/districts",
        stats: [
          { label: "Total", value: totalDistricts || 0 },
          {
            label: "Active Users",
            value: activeUsers || 0,
            colorClass: "text-green-600",
          },
        ],
      },
      {
        key: "assembly",
        title: "Assemblies",
        subtitle: "Assembly constituencies",
        path: "/state/assembly",
        stats: [
          { label: "Total", value: totalAssemblies || 0 },
          { label: "Districts", value: totalDistricts || 0 },
        ],
      },
      {
        key: "block",
        title: "Blocks",
        subtitle: "Block administration",
        path: "/state/block",
        stats: [
          { label: "Total", value: totalBlocks || 0 },
          { label: "Assemblies", value: totalAssemblies || 0 },
        ],
      },
      {
        key: "mandal",
        title: "Mandals",
        subtitle: "Mandal operations",
        path: "/state/mandal",
        stats: [
          { label: "Total", value: totalMandals || 0 },
          { label: "Blocks", value: totalBlocks || 0 },
        ],
      },
      {
        key: "booth",
        title: "Booths",
        subtitle: "Booth level data",
        path: "/state/booth",
        stats: [
          { label: "Total", value: totalBooths || 0 },
          { label: "Polling Centers", value: totalPollingCenters || 0 },
        ],
      },
      // {
      //   key: "karyakarta",
      //   title: "Karyakarta",
      //   subtitle: "Grassroot workers",
      //   path: "/state/karyakarta",
      //   stats: [
      //     { label: "Total", value: totalUsers || 0 },
      //     {
      //       label: "Active",
      //       value: activeUsers || 0,
      //       colorClass: "text-green-600",
      //     },
      //   ],
      // },
    ],
    [totalDistricts, totalAssemblies, totalBlocks, totalMandals, totalPollingCenters, totalBooths, totalUsers, activeUsers]
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
    <div className="w-full py-1 min-h-screen box-border rounded-2xl shadow-md bg-gray-50 transition-all mx-auto px-4">
      {/* Header & Search */}
      <header className="mb-3 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              {stateName} State Dashboard
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
            {searchTerm && (
              <span className="absolute -bottom-5 left-0 text-[11px] text-gray-500">
                Press Esc to clear
              </span>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-3">
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs font-medium">Districts</p>
              <p className="text-2xl font-bold mt-1">{totalDistricts || 0}</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-xs font-medium">Assemblies</p>
              <p className="text-2xl font-bold mt-1">{totalAssemblies || 0}</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-violet-500 to-violet-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-100 text-xs font-medium">Blocks</p>
              <p className="text-2xl font-bold mt-1">{totalBlocks || 0}</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs font-medium">Mandals</p>
              <p className="text-2xl font-bold mt-1">{totalMandals || 0}</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs font-medium">Polling Centers</p>
              <p className="text-2xl font-bold mt-1">{totalPollingCenters || 0}</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-xs font-medium">Booths</p>
              <p className="text-2xl font-bold mt-1">{totalBooths || 0}</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs font-medium">Active Users</p>
              <p className="text-2xl font-bold mt-1">{activeUsers || 0}</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
                className={`group relative isolate rounded-2xl border border-gray-200 bg-white shadow-sm ${theme.hoverShadow} transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 ${theme.ring}`}
              >
                {/* Subtle animated gradient overlay */}
                <div
                  className={`absolute inset-0 -z-10 opacity-80 group-hover:opacity-95 transition ${theme.bg}`}
                />
                {/* Soft sheen on hover */}
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
                            <span className={s.colorClass ?? "text-gray-700"}>
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
