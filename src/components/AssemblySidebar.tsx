// import type { ReactNode } from "react";
// import { NavLink, useLocation, useNavigate } from "react-router-dom";
// import { useState, useMemo } from "react";
// import { useAppDispatch, useAppSelector } from "../store/hooks";
// import { logout, setSelectedAssignment } from "../store/authSlice";
// import { ROLE_DASHBOARD_PATH } from "../constants/routes";
// import { useGetSidebarLevelsQuery } from "../store/api/partyWiseLevelApi";
// import { useGetSidebarModulesQuery } from "../store/api/modulesApi";
// import type { StateAssignment } from "../types/api";

// type NavItem = { to: string; label: string; icon: ReactNode };

// const iconClass = "h-5 w-5 stroke-[1.6]";

// const Icons = {
//   team: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 13c2.761 0 5-2.239 5-5S14.761 3 12 3 7 5.239 7 8s2.239 5 5 5Zm6 1H6a4 4 0 0 0-4 4v3h20v-3a4 4 0 0 0-4-4Z" strokeWidth={1.4} strokeLinejoin="round" /></svg>),
//   dashboard: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-18v6h8V3h-8Z" strokeWidth={1.5} strokeLinejoin="round" /></svg>),
//   block: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 8h18M3 16h18M8 21V3m8 0v18" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   mandal: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3 3 9l9 6 9-6-9-6Zm0 6v12" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   polling: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M7 12h3v8H7v-8Zm7-8h3v16h-3V4Z" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   booths: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 7h16v12H4V7Zm4 0V5h8v2" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   zone: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   sector: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   generic: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m18-5H3" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   campaigns: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v6m0 0c-3.314 0-6 2.686-6 6a6 6 0 1 0 12 0c0-3.314-2.686-6-6-6Zm0 0V3m0 6 4.5-4.5M12 9 7.5 4.5" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   communication: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   market: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>),
//   search: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   visitors: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   supporters: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   vic: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   profile: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 13c2.761 0 5-2.239 5-5S14.761 3 12 3 7 5.239 7 8s2.239 5 5 5Zm6 1H6a4 4 0 0 0-4 4v3h20v-3a4 4 0 0 0-4-4Z" strokeWidth={1.4} strokeLinejoin="round" /></svg>),
//   logout: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 3H6v18h9M10 12h11m0 0-4-4m4 4-4 4" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   report: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   compare: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 7h11m-3-3 3 3-3 3m-6 7H2m3-3-3 3 3 3" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   form20: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
//   eventLog: (<svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>),
// };

// // Base Items
// const assemblyItems: NavItem[] = [
//   { to: "dashboard", label: "Dashboard", icon: Icons.dashboard },
//   { to: "programs", label: "Programs", icon: Icons.eventLog },
// ];

// const staticListItems: NavItem[] = [
//   { to: "block", label: "Block", icon: Icons.block },
//   { to: "mandal", label: "Mandal", icon: Icons.mandal },
//   { to: "polling-center", label: "Polling Center", icon: Icons.polling },
//   { to: "booth", label: "Booth", icon: Icons.booths },
// ];

// const marketItems: NavItem[] = [
//   { to: "market-table", label: "Market List", icon: Icons.generic },
//   { to: "market-discussion", label: "Market Approach", icon: Icons.team },
//   { to: "Social-Media", label: "Social Media", icon: Icons.team },
// ];

// const boothManagementItems: NavItem[] = [
//   { to: "booth-management/dashboard", label: "Dashboard", icon: Icons.dashboard },
//   { to: "booth-management/agents", label: "All Team", icon: Icons.team },
//   { to: "booth-management/inside", label: "Booth Inside Team", icon: Icons.team },
//   { to: "booth-management/outside", label: "Booth Outside Team", icon: Icons.team },
//   { to: "booth-management/polling-support", label: "Polling Center Support Team", icon: Icons.team },
// ];

// const communicationItems: NavItem[] = [
//   { to: "communication/user-communication", label: "User Communication", icon: Icons.team },
//   { to: "communication/voter-communication", label: "Voter Communication", icon: Icons.team },
// ];

// const voterReportsItems: NavItem[] = [
//   { to: "voter-report/alphabetical", label: "Alphabetical List", icon: Icons.report },
//   { to: "voter-report/age-wise", label: "Age Wise List", icon: Icons.report },
//   { to: "voter-report/family", label: "Family Report", icon: Icons.report },
//   { to: "voter-report/family-head", label: "Family Head Report", icon: Icons.report },
//   { to: "voter-report/double-name", label: "Double Name Lists", icon: Icons.report },
//   { to: "voter-report/married-women", label: "Married Women Report", icon: Icons.report },
//   { to: "voter-report/single-voter", label: "Single Voter Report", icon: Icons.report },
//   { to: "voter-report/address-wise", label: "Address Wise List", icon: Icons.report },
//   { to: "voter-report/surname", label: "Surname Report", icon: Icons.report },
//   { to: "voter-report/family-labels", label: "Family Labels", icon: Icons.report },
//   { to: "voter-report/caste-wise", label: "Caste Wise List", icon: Icons.report },
//   { to: "voter-report/party-wise", label: "Party Wise List", icon: Icons.report },
//   { to: "voter-report/dead-alive", label: "Dead/Alive List", icon: Icons.report },
//   { to: "voter-report/birth-wise", label: "Birth Wise List", icon: Icons.report },
//   { to: "voter-report/education-wise", label: "Education Wise List", icon: Icons.report },
//   { to: "voter-report/home-shifted", label: "Home Shifted List", icon: Icons.report },
//   { to: "voter-report/profession-wise", label: "Profession Wise List", icon: Icons.report },
//   { to: "voter-report/outside-location", label: "Outside Location Wise List", icon: Icons.report },
//   { to: "voter-report/labharthi", label: "Labharthi List", icon: Icons.report },
//   { to: "voter-report/approach", label: "Approach List", icon: Icons.report },
//   { to: "voter-report/ssr-form", label: "SSR Form Report", icon: Icons.report },
//   { to: "voter-report/voter-tracking", label: "User Activity Report", icon: Icons.eventLog },
// ];

// const vicItems: NavItem[] = [
//   { to: "vic/send-report", label: "Send Report", icon: Icons.vic },
//   { to: "vic/my-reports", label: "My Reports", icon: Icons.vic },
//   { to: "vic/assigned-reports", label: "Assigned Reports", icon: Icons.vic },
//   { to: "vic/under-hierarchy-reports", label: "Under Hierarchy Reports", icon: Icons.vic },
// ];

// export default function AssemblySidebar({
//   onNavigate,
// }: {
//   onNavigate?: () => void;
// }) {
//   const { user, stateAssignments, selectedAssignment, permissions } = useAppSelector((s) => s.auth);
//   const dispatch = useAppDispatch();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const base = ROLE_DASHBOARD_PATH["Assembly"] || "/assembly";
//   const firstName = user?.firstName || user?.username || "Assembly";
//   const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=6366f1&color=fff&bold=true`;

//   const getPartyAndStateFromStorage = () => {
//     try {
//       const authState = localStorage.getItem('auth_state');
//       if (authState) {
//         const parsed = JSON.parse(authState) as { user?: { partyId?: number; state_id?: number }; selectedAssignment?: { stateMasterData_id?: number } };
//         const partyId = parsed?.user?.partyId || 0;
//         const stateId = parsed?.user?.state_id || parsed?.selectedAssignment?.stateMasterData_id || 0;
//         return { partyId, stateId };
//       }
//     } catch (error) {
//       console.error('Error reading from localStorage:', error);
//     }
//     return { partyId: 0, stateId: 0 };
//   };

//   const { partyId, stateId } = getPartyAndStateFromStorage();
//   const partyLevelId = selectedAssignment?.partyLevelId || 0;

//   const { data: sidebarLevels = [], isLoading: sidebarLoading, error: sidebarError } = useGetSidebarLevelsQuery(
//     { partyId, stateId },
//     { skip: !partyId || !stateId || partyId === 0 || stateId === 0, refetchOnMountOrArgChange: true }
//   );

//   const { data: sidebarModules = [] } = useGetSidebarModulesQuery(
//     { state_id: stateId, party_id: partyId, party_level_id: partyLevelId },
//     { skip: !partyId || !stateId || !partyLevelId }
//   );

//   // --- Dynamic Access Helper Logic ---
//   // This helper checks if an entire category is granted OR if individual items are granted.
//   const getAccessibleItems = (items: NavItem[], categoryKeyword: string) => {
//     const hasCategoryAccess = sidebarModules.some(m => m.moduleName.toLowerCase().includes(categoryKeyword.toLowerCase()));
//     if (hasCategoryAccess) return items;

//     return items.filter(item =>
//       sidebarModules.some(m => {
//         const mName = m.moduleName.toLowerCase();
//         const iLabel = item.label.toLowerCase();
//         // Skip generic labels like 'dashboard' when checking individual items unless exact match
//         return mName === iLabel || (mName.includes(iLabel) && iLabel !== 'dashboard');
//       })
//     );
//   };

//   const accessibleBoothMgmtItems = useMemo(() => getAccessibleItems(boothManagementItems, 'booth management'), [sidebarModules]);
//   const accessibleCommunicationItems = useMemo(() => getAccessibleItems(communicationItems, 'communication'), [sidebarModules]);
//   const accessibleMarketItems = useMemo(() => getAccessibleItems(marketItems, 'market'), [sidebarModules]);
//   const accessibleVoterReportsItems = useMemo(() => getAccessibleItems(voterReportsItems, 'voter report'), [sidebarModules]);
//   const accessibleVicItems = useMemo(() => getAccessibleItems(vicItems, 'vic'), [sidebarModules]);

//   // --- Map Core Modules ---
//   const campaignModules = sidebarModules.filter(m => m.moduleName.toLowerCase().includes('campaign'));
//   const assignedEventModules = sidebarModules.filter(m => m.moduleName.toLowerCase().includes('assigned event'));
//   const compareVotersModules = sidebarModules.filter(m => m.moduleName.toLowerCase().includes('compare voters'));
//   const form20Modules = sidebarModules.filter(m => m.moduleName.toLowerCase().includes('form 20'));
//   const visitorsModules = sidebarModules.filter(m => m.moduleName.toLowerCase().includes('visitors'));
  
//   const hasAssemblyTeamAccess = useMemo(() => {
//     return sidebarModules.some(module =>
//       module.moduleName.toLowerCase().includes('assembly team') ||
//       (module.moduleName.toLowerCase().includes('team') && !module.moduleName.toLowerCase().includes('state') && !module.moduleName.toLowerCase().includes('district'))
//     );
//   }, [sidebarModules]);

//   const hasSupporterAccess = useMemo(() => sidebarModules.some(m => m.moduleName.toLowerCase().includes('supporter')), [sidebarModules]);

//   // Filter out ALL modules that have already been handled inside our static groups or core variables to prevent duplicates
//   const allStaticLabels = [
//     ...boothManagementItems.map(i => i.label.toLowerCase()),
//     ...communicationItems.map(i => i.label.toLowerCase()),
//     ...marketItems.map(i => i.label.toLowerCase()),
//     ...voterReportsItems.map(i => i.label.toLowerCase()),
//     ...vicItems.map(i => i.label.toLowerCase()),
//   ];

//   const otherModules = sidebarModules.filter(m => {
//     const name = m.moduleName.toLowerCase();
//     const isHandledByCategory = 
//       name.includes('team') || name.includes('campaign') || name.includes('compare voters') || 
//       name.includes('form 20') || name.includes('visitors') || name.includes('assigned event') || 
//       name.includes('booth management') || name.includes('communication') || name.includes('market') || 
//       name.includes('voter report') || name.includes('vic') || name.includes('supporter');
//     const isHandledByExactLabel = allStaticLabels.some(label => (name === label || name.includes(label)) && label !== 'dashboard');
    
//     return !isHandledByCategory && !isHandledByExactLabel;
//   });

//   const dynamicListItems: NavItem[] = useMemo(() => {
//     if (!sidebarLevels.length) return staticListItems;
//     const afterAssemblyLevels = sidebarLevels.filter(level => !["State", "District", "Assembly"].includes(level.level_name));
//     return afterAssemblyLevels.map(level => ({
//       to: `dynamic-level/${level.level_name.toLowerCase()}`,
//       label: level.display_level_name,
//       icon: getIconForLevel(level.level_name),
//     }));
//   }, [sidebarLevels]);

//   const listItems = dynamicListItems.length > 0 ? dynamicListItems : staticListItems;

//   function getIconForLevel(levelName: string): ReactNode {
//     const lowerLevelName = levelName.toLowerCase();
//     const iconMap: Record<string, ReactNode> = {
//       'block': Icons.block, 'mandal': Icons.mandal, 'pollingcenter': Icons.polling, 'polling center': Icons.polling,
//       'booth': Icons.booths, 'ward': Icons.block, 'zone': Icons.zone, 'sector': Icons.sector,
//     };
//     const exactMatch = iconMap[lowerLevelName];
//     if (exactMatch) return exactMatch;
//     if (lowerLevelName.includes('block') || lowerLevelName.includes('ward')) return Icons.block;
//     if (lowerLevelName.includes('mandal')) return Icons.mandal;
//     if (lowerLevelName.includes('polling') || lowerLevelName.includes('center')) return Icons.polling;
//     if (lowerLevelName.includes('booth')) return Icons.booths;
//     if (lowerLevelName.includes('zone')) return Icons.zone;
//     if (lowerLevelName.includes('sector')) return Icons.sector;
//     return Icons.generic;
//   }

//   function getIconForModule(moduleName: string): ReactNode {
//     const name = moduleName.toLowerCase();
//     if (name.includes('campaign')) return Icons.campaigns;
//     if (name.includes('user')) return Icons.team;
//     if (name.includes('district') || name.includes('assembly')) return Icons.dashboard;
//     if (name.includes('block')) return Icons.block;
//     if (name.includes('mandal')) return Icons.mandal;
//     if (name.includes('polling') || name.includes('center')) return Icons.polling;
//     if (name.includes('booth')) return Icons.booths;
//     if (name.includes('event')) return Icons.campaigns;
//     if (name.includes('visitor')) return Icons.visitors;
//     if (name.includes('supporter')) return Icons.supporters;
//     if (name.includes('communication')) return Icons.communication;
//     if (name.includes('search')) return Icons.search;
//     return Icons.campaigns;
//   }

//   function getModuleRoute(moduleName: string): string {
//     const name = moduleName.toLowerCase();
//     if (name.includes('campaign')) return 'campaigns';
//     if (name.includes('assigned event') || name.includes('event')) return 'assigned-events';
//     if (name.includes('user management') || name.includes('user')) return 'users';
//     if (name.includes('visitor')) return 'visitors';
//     if (name.includes('supporter')) return 'supporters';
//     if (name.includes('search')) return 'search-voter';
//     if (name.includes('communication')) return 'communication';
//     return moduleName.toLowerCase().replace(/\s+/g, '-');
//   }

//   // --- States ---
//   const [listOpen, setListOpen] = useState(() => listItems.some((li) => location.pathname.startsWith(`${base}/${li.to}`)));
//   const [openBoothMgmt, setOpenBoothMgmt] = useState(() => accessibleBoothMgmtItems.some((bm) => location.pathname.startsWith(`${base}/${bm.to}`)));
//   const [openCommunication, setOpenCommunication] = useState(() => accessibleCommunicationItems.some((comm) => location.pathname.startsWith(`${base}/${comm.to}`)));
//   const [openMarket, setOpenMarket] = useState(() => accessibleMarketItems.some((mk) => location.pathname.startsWith(`${base}/${mk.to}`)));
//   const [openVoterReports, setOpenVoterReports] = useState(() => accessibleVoterReportsItems.some((vr) => location.pathname.startsWith(`${base}/${vr.to}`)));
//   const [campaignOpen, setCampaignOpen] = useState(false);
//   const [supporterDropdownOpen, setSupporterDropdownOpen] = useState(false);
//   const [compareVotersOpen, setCompareVotersOpen] = useState(false);
//   const [vicDropdownOpen, setVicDropdownOpen] = useState(false);
//   const [switchDropdownOpen, setSwitchDropdownOpen] = useState(false);

//   // --- Assignment Switch Logic ---
//   let sameTypeAssignments: StateAssignment[] = [];
//   const assemblyAssignments = stateAssignments.filter((a) => a.levelType === "Assembly");
//   if (permissions?.accessibleAssemblies && permissions.accessibleAssemblies.length > 0) {
//     const permissionAssemblies: StateAssignment[] = permissions.accessibleAssemblies.map((assembly) => ({
//       assignment_id: assembly.assignment_id, stateMasterData_id: assembly.stateMasterData_id || 0,
//       levelName: assembly.displayName || assembly.levelName, levelType: "Assembly" as const,
//       level_id: assembly.level_id, parentId: assembly.parentId, parentLevelName: assembly.parentLevelName || "District",
//       parentLevelType: "District" as const, displayName: assembly.displayName,
//     }));
//     sameTypeAssignments = [...assemblyAssignments, ...permissionAssemblies];
//   } else {
//     sameTypeAssignments = assemblyAssignments;
//   }

//   const seen = new Set<number>();
//   sameTypeAssignments = sameTypeAssignments.filter((a) => {
//     if (seen.has(a.assignment_id)) return false;
//     seen.add(a.assignment_id);
//     return true;
//   });

//   const handleAssignmentSwitch = (assignment: StateAssignment) => {
//     dispatch(setSelectedAssignment(assignment));
//     setSwitchDropdownOpen(false);
//     window.dispatchEvent(new Event("assignmentChanged"));
//   };

//   const onLogout = () => {
//     dispatch(logout());
//     navigate("/login");
//   };

//   return (
//     <aside className="w-68 shrink-0 h-full border-r border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col overflow-y-auto">
//       {/* Header */}
//       <div className="px-5 py-6 border-b border-[var(--border-color)] shrink-0">
//         <div className="flex items-center gap-4">
//           <img src={avatarUrl} alt={firstName} className="h-11 w-11 rounded-full ring-2 ring-indigo-500/25 shadow-sm shrink-0" />
//           <div className="min-w-0 flex-1">
//             <p className="truncate font-semibold text-[var(--text-color)] text-sm">{firstName}</p>
//             <p className="text-xs font-medium tracking-wide text-indigo-600 uppercase">Assembly Level</p>
//           </div>
//         </div>

//         {sameTypeAssignments.length > 1 && selectedAssignment && (
//           <div className="mt-4">
//             <button type="button" onClick={() => setSwitchDropdownOpen(!switchDropdownOpen)} className="w-full flex items-center justify-between rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-sm hover:bg-[var(--bg-color)] transition">
//               <div className="flex items-center gap-2 min-w-0">
//                 <svg className="h-4 w-4 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" strokeLinecap="round" strokeLinejoin="round" /></svg>
//                 <span className="font-medium text-[var(--text-secondary)] truncate">{selectedAssignment.displayName || selectedAssignment.levelName}</span>
//               </div>
//               <svg className={`h-4 w-4 text-[var(--text-secondary)] transition-transform shrink-0 ${switchDropdownOpen ? "rotate-180" : "rotate-0"}`} viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
//             </button>
//             {switchDropdownOpen && (
//               <div className="mt-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-sm shadow-lg max-h-64 overflow-y-auto">
//                 <div className="px-2 py-1.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Switch Assembly</div>
//                 {sameTypeAssignments.map((assignment) => (
//                   <button key={assignment.assignment_id} onClick={() => handleAssignmentSwitch(assignment)} className={["flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors", selectedAssignment.assignment_id === assignment.assignment_id ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-200" : "text-[var(--text-secondary)] hover:bg-[var(--bg-color)] hover:text-[var(--text-color)]"].join(" ")}>
//                     <svg className="h-4 w-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" /></svg>
//                     <div className="flex-1 min-w-0">
//                       <div className="font-medium truncate text-xs">{assignment.displayName || assignment.levelName}</div>
//                       {assignment.parentLevelName && <div className="text-xs text-[var(--text-secondary)] truncate">{assignment.parentLevelName}</div>}
//                     </div>
//                     {selectedAssignment.assignment_id === assignment.assignment_id && <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Nav */}
//       <div className="flex-1">
//         <nav className="px-4 py-5 space-y-2">
//           {assemblyItems.map((item) => (
//             <NavLink key={item.to} to={`${base}/${item.to}`} onClick={() => onNavigate?.()} className={({ isActive }) => ["no-underline group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", isActive ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//               <span className="text-indigo-600 shrink-0">{item.icon}</span>
//               <span className="truncate">{item.label}</span>
//               <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
//               <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 opacity-0 group-[.active]:opacity-100" />
//             </NavLink>
//           ))}

//           {hasAssemblyTeamAccess && (
//             <NavLink to={`${base}/team`} onClick={() => onNavigate?.()} className={({ isActive }) => ["no-underline group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", isActive ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//               <span className="text-indigo-600 shrink-0">{Icons.team}</span>
//               <span className="truncate">Assembly Team</span>
//               <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
//               <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 opacity-0 group-[.active]:opacity-100" />
//             </NavLink>
//           )}

//           <div>
//             <button type="button" aria-expanded={listOpen} onClick={() => setListOpen(!listOpen)} className={["w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", listOpen ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//               <span className="flex items-center gap-3 text-indigo-600">
//                 <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
//                 <span className="text-[var(--text-color)] truncate">List {sidebarLoading && "..."}</span>
//               </span>
//               <svg className={["h-4 w-4 text-indigo-600 transition-transform shrink-0", listOpen ? "rotate-180" : "rotate-0"].join(" ")} viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
//             </button>
//             {listOpen && (
//               <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1">
//                 {listItems.map((li) => (
//                   <NavLink key={li.to} to={`${base}/${li.to}`} onClick={() => onNavigate?.()} className={({ isActive }) => ["no-underline group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", isActive ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                     <span className="text-indigo-600 shrink-0">{li.icon}</span>
//                     <span className="truncate">{li.label}</span>
//                   </NavLink>
//                 ))}
//               </div>
//             )}
//           </div>

//           {accessibleBoothMgmtItems.length > 0 && (
//             <div>
//               <button type="button" aria-expanded={openBoothMgmt} onClick={() => setOpenBoothMgmt(!openBoothMgmt)} className={["w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", openBoothMgmt ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                 <span className="flex items-center gap-3 text-indigo-600">
//                   <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>
//                   <span className="text-[var(--text-color)] truncate">Booth Management</span>
//                 </span>
//                 <svg className={["h-4 w-4 text-indigo-600 transition-transform shrink-0", openBoothMgmt ? "rotate-180" : "rotate-0"].join(" ")} viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
//               </button>
//               {openBoothMgmt && (
//                 <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1">
//                   {accessibleBoothMgmtItems.map((bm) => (
//                     <NavLink key={bm.to} to={`${base}/${bm.to}`} onClick={() => onNavigate?.()} className={({ isActive }) => ["no-underline group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", isActive ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                       <span className="text-indigo-600 shrink-0">{bm.icon}</span>
//                       <span className="truncate">{bm.label}</span>
//                     </NavLink>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           {campaignModules.length > 0 && (
//             <div>
//               <button onClick={() => setCampaignOpen(!campaignOpen)} className={["w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", campaignOpen ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                 <div className="flex items-center gap-3">
//                   <span className="text-indigo-600 shrink-0">{Icons.campaigns}</span>
//                   <span className="text-[var(--text-color)] truncate">Campaign</span>
//                 </div>
//                 <svg className={`h-4 w-4 text-indigo-600 transition-transform shrink-0 ${campaignOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
//               </button>
//               {campaignOpen && (
//                 <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1">
//                   {campaignModules.map((module) => (
//                     <NavLink key={module.module_id} to={`${base}/${getModuleRoute(module.moduleName)}`} onClick={() => onNavigate?.()} className={({ isActive }) => ["no-underline group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", isActive ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                       <span className="text-indigo-600 shrink-0">{getIconForModule(module.moduleName)}</span>
//                       <span className="truncate">{module.displayName}</span>
//                     </NavLink>
//                   ))}
//                   {assignedEventModules.map((module) => (
//                     <NavLink key={module.module_id} to={`${base}/${getModuleRoute(module.moduleName)}`} onClick={() => onNavigate?.()} className={({ isActive }) => ["no-underline group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", isActive ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                       <span className="text-indigo-600 shrink-0">{getIconForModule(module.moduleName)}</span>
//                       <span className="truncate">{module.displayName}</span>
//                     </NavLink>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           {accessibleVoterReportsItems.length > 0 && (
//             <div>
//               <button type="button" aria-expanded={openVoterReports} onClick={() => setOpenVoterReports(!openVoterReports)} className={["w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", openVoterReports ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                 <span className="flex items-center gap-3 text-indigo-600">
//                   <span className="shrink-0">{Icons.report}</span>
//                   <span className="text-[var(--text-color)] truncate">Voter Reports</span>
//                 </span>
//                 <svg className={["h-4 w-4 text-indigo-600 transition-transform shrink-0", openVoterReports ? "rotate-180" : "rotate-0"].join(" ")} viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
//               </button>
//               {openVoterReports && (
//                 <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1 max-h-96 overflow-y-auto">
//                   {accessibleVoterReportsItems.map((vr) => (
//                     <NavLink key={vr.to} to={`${base}/${vr.to}`} onClick={() => onNavigate?.()} className={({ isActive }) => ["no-underline group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", isActive ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                       <span className="text-indigo-600 shrink-0">{vr.icon}</span>
//                       <span className="truncate">{vr.label}</span>
//                     </NavLink>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           {(compareVotersModules.length > 0 || form20Modules.length > 0) && (
//             <div>
//               <button onClick={() => setCompareVotersOpen(!compareVotersOpen)} className={["w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--text-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", compareVotersOpen ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                 <div className="flex items-center gap-3">
//                   <span className="text-indigo-600 shrink-0">{Icons.campaigns}</span>
//                   <span className="text-[var(--text-color)] truncate">Voter Analysis</span>
//                 </div>
//                 <svg className={`h-4 w-4 text-indigo-600 transition-transform shrink-0 ${compareVotersOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
//               </button>
//               {compareVotersOpen && (                        
//                 <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1">
//                   {[...compareVotersModules, ...form20Modules].map((module) => (
//                     <NavLink key={module.module_id} to={`${base}/${getModuleRoute(module.moduleName)}`} onClick={() => onNavigate?.()} className={({ isActive }) => ["no-underline group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", isActive ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                       <span className="text-indigo-600 shrink-0">{getIconForModule(module.moduleName)}</span>
//                       <span className="truncate">{module.displayName}</span>
//                     </NavLink>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           {(visitorsModules.length > 0 || hasSupporterAccess) && (
//             <div>
//               <button onClick={() => setSupporterDropdownOpen(!supporterDropdownOpen)} className={["w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", supporterDropdownOpen ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                 <div className="flex items-center gap-3">
//                   <span className="text-indigo-600 shrink-0">{Icons.supporters}</span>
//                   <span className="text-[var(--text-color)] truncate">Supporter</span>
//                 </div>
//                 <svg className={`h-4 w-4 text-indigo-600 transition-transform shrink-0 ${supporterDropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
//               </button>
//               {supporterDropdownOpen && (
//                 <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1">
//                   {visitorsModules.map((module) => (
//                     <NavLink key={module.module_id} to={`${base}/${getModuleRoute(module.moduleName)}`} onClick={() => onNavigate?.()} className={({ isActive }) => ["no-underline group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", isActive ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                       <span className="text-indigo-600 shrink-0">{Icons.visitors}</span>
//                       <span className="truncate">{module.displayName}</span>
//                     </NavLink>
//                   ))}
//                   {hasSupporterAccess && (
//                     <NavLink to={`${base}/supporters`} onClick={() => onNavigate?.()} className={({ isActive }) => ["no-underline group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", isActive ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                       <span className="text-indigo-600 shrink-0">{Icons.supporters}</span>
//                       <span className="truncate">Supporters</span>
//                     </NavLink>
//                   )}
//                 </div>
//               )}
//             </div>
//           )}

//           {accessibleCommunicationItems.length > 0 && (
//             <div>
//               <button type="button" aria-expanded={openCommunication} onClick={() => setOpenCommunication(!openCommunication)} className={["w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", openCommunication ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                 <span className="flex items-center gap-3 text-indigo-600">
//                   <span className="shrink-0">{Icons.communication}</span>
//                   <span className="text-[var(--text-color)] truncate">Communication</span>
//                 </span>
//                 <svg className={["h-4 w-4 text-indigo-600 transition-transform shrink-0", openCommunication ? "rotate-180" : "rotate-0"].join(" ")} viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
//               </button>
//               {openCommunication && (
//                 <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1">
//                   {accessibleCommunicationItems.map((comm) => (
//                     <NavLink key={comm.to} to={`${base}/${comm.to}`} onClick={() => onNavigate?.()} className={({ isActive }) => ["no-underline group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", isActive ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                       <span className="text-indigo-600 shrink-0">{comm.icon}</span>
//                       <span className="truncate">{comm.label}</span>
//                     </NavLink>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           {accessibleMarketItems.length > 0 && (
//             <div>
//               <button type="button" aria-expanded={openMarket} onClick={() => setOpenMarket(!openMarket)} className={["w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", openMarket ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                 <span className="flex items-center gap-3 text-indigo-600">
//                   <span className="shrink-0">{Icons.market}</span>
//                   <span className="text-[var(--text-color)] truncate">Market</span>
//                 </span>
//                 <svg className={["h-4 w-4 text-indigo-600 transition-transform shrink-0", openMarket ? "rotate-180" : "rotate-0"].join(" ")} viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
//               </button>
//               {openMarket && (
//                 <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1">
//                   {accessibleMarketItems.map((item) => (
//                     <NavLink key={item.to} to={`${base}/${item.to}`} onClick={() => onNavigate?.()} className={({ isActive }) => ["no-underline group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", isActive ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                       <span className="text-indigo-600 shrink-0">{item.icon}</span>
//                       <span className="truncate">{item.label}</span>
//                     </NavLink>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           {accessibleVicItems.length > 0 && (
//             <div>
//               <button type="button" aria-expanded={vicDropdownOpen} onClick={() => setVicDropdownOpen(!vicDropdownOpen)} className={["w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", vicDropdownOpen ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                 <span className="flex items-center gap-3 text-indigo-600">
//                   <span className="shrink-0">{Icons.vic}</span>
//                   <span className="text-[var(--text-color)] truncate">VIC</span>
//                 </span>
//                 <svg className={["h-4 w-4 text-indigo-600 transition-transform shrink-0", vicDropdownOpen ? "rotate-180" : "rotate-0"].join(" ")} viewBox="0 0 20 20" fill="none"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
//               </button>
//               {vicDropdownOpen && (
//                 <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1">
//                   {accessibleVicItems.map((item) => (
//                     <NavLink key={item.to} to={`${base}/${item.to}`} onClick={() => onNavigate?.()} className={({ isActive }) => ["no-underline group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", isActive ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                       <span className="text-indigo-600 shrink-0">{item.icon}</span>
//                       <span className="truncate">{item.label}</span>
//                     </NavLink>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Any remaining unhandled modules map dynamically */}
//           {otherModules.map((module) => (
//             <div key={module.module_id} className="mt-2">
//               <NavLink to={`${base}/${getModuleRoute(module.moduleName)}`} onClick={() => onNavigate?.()} className={({ isActive }) => ["no-underline group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", isActive ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//                 <span className="text-indigo-600 shrink-0">{getIconForModule(module.moduleName)}</span>
//                 <span className="truncate">{module.displayName}</span>
//                 <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
//                 <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 opacity-0 group-[.active]:opacity-100" />
//               </NavLink>
//             </div>
//           ))}
//         </nav>
//       </div>

//       {/* Account section */}
//       <div className="mt-auto pt-3 pb-5">
//         <div className="px-5">
//           <div className="mb-3">
//             <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Account</div>
//           </div>
//         </div>
//         <div className="px-4 space-y-1">
//           <NavLink to={`${base}/profile`} onClick={() => onNavigate?.()} className={({ isActive }) => ["no-underline group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition", "text-[var(--text-color)] hover:bg-[var(--bg-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", isActive ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200" : "border border-transparent hover:border-[var(--border-color)]"].join(" ")}>
//             <span className="text-indigo-600 shrink-0">{Icons.profile}</span>
//             <span className="truncate">Profile</span>
//           </NavLink>
//           <button onClick={onLogout} className="group w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 transition border border-transparent hover:border-red-200">
//             <span className="shrink-0">{Icons.logout}</span>
//             <span className="truncate">Logout</span>
//           </button>
//         </div>
//       </div>
//     </aside>
//   );
// }

///////////////////////////////////////////////////////////////////

import type { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout, setSelectedAssignment } from "../store/authSlice";
import { ROLE_DASHBOARD_PATH } from "../constants/routes";
import { useGetSidebarLevelsQuery } from "../store/api/partyWiseLevelApi";
import { useGetSidebarModulesQuery } from "../store/api/modulesApi";
import type { StateAssignment } from "../types/api";
import { getCanonicalFixedLevelType, normalizeFixedLevelAssignment } from "../utils/panelHelpers";

type NavItem = { to: string; label: string; icon: ReactNode };

const iconClass = "h-5 w-5 stroke-[1.6]";

const Icons = {
  team: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M12 13c2.761 0 5-2.239 5-5S14.761 3 12 3 7 5.239 7 8s2.239 5 5 5Zm6 1H6a4 4 0 0 0-4 4v3h20v-3a4 4 0 0 0-4-4Z"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  ),
  dashboard: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M3 13h8V3H3v10Zm10 8h8V11h-8v10ZM3 21h8v-6H3v6Zm10-18v6h8V3h-8Z"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  ),
  block: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M3 8h18M3 16h18M8 21V3m8 0v18"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  mandal: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M12 3 3 9l9 6 9-6-9-6Zm0 6v12"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  polling: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M7 12h3v8H7v-8Zm7-8h3v16h-3V4Z"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  booths: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M4 7h16v12H4V7Zm4 0V5h8v2"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  zone: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  sector: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  generic: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m18-5H3"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  campaigns: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M12 3v6m0 0c-3.314 0-6 2.686-6 6a6 6 0 1 0 12 0c0-3.314-2.686-6-6-6Zm0 0V3m0 6 4.5-4.5M12 9 7.5 4.5"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  communication: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  market: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
      />
    </svg>
  ),
  search: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  visitors: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  supporters: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  vic: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  profile: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M12 13c2.761 0 5-2.239 5-5S14.761 3 12 3 7 5.239 7 8s2.239 5 5 5Zm6 1H6a4 4 0 0 0-4 4v3h20v-3a4 4 0 0 0-4-4Z"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  ),
  logout: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M15 3H6v18h9M10 12h11m0 0-4-4m4 4-4 4"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  report: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  compare: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M8 7h11m-3-3 3 3-3 3m-6 7H2m3-3-3 3 3 3"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  form20: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  eventLog: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  eventStats: (
    <svg
      className={iconClass}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        d="M3 3v18a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2-2zm9 4v10m-4-6v6m8-8v12"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

// Top-level items (excluding team - will be dynamic)
const assemblyItems: NavItem[] = [
  { to: "dashboard", label: "Dashboard", icon: Icons.dashboard },
];

const programItems: NavItem[] = [
  { to: "programs", label: "Programs", icon: Icons.eventLog },
];

// New Voters Dropdown Items
const votersDropdownItems: NavItem[] = [
  { to: "search-voter", label: "Search Voter", icon: Icons.search },
  { to: "marked-voters", label: "Marked Voters", icon: Icons.team },
  { to: "marked-users", label: "Marked Users", icon: Icons.supporters },
];

// Dropdown items under "List" - These will be replaced by dynamic levels from API
const staticListItems: NavItem[] = [
  { to: "block", label: "Block", icon: Icons.block },
  { to: "mandal", label: "Mandal", icon: Icons.mandal },
  { to: "polling-center", label: "Polling Center", icon: Icons.polling },
  { to: "booth", label: "Booth", icon: Icons.booths },

];

// Market dropdown items
// const marketItems: NavItem[] = [
//   { to: "market-table", label: "Market List", icon: Icons.generic },
//   { to: "market-discussion", label: "Market Approach", icon: Icons.team },
//   { to: "Social-Media", label: "Social Media", icon: Icons.team },

// ];


// Booth Management dropdown items
const boothManagementItems: NavItem[] = [
  {
    to: "booth-management/dashboard",
    label: "Dashboard",
    icon: Icons.dashboard,
  },
  { to: "booth-management/agents", label: "All Team", icon: Icons.team },
  {
    to: "booth-management/inside",
    label: "Booth Inside Team",
    icon: Icons.team,
  },
  {
    to: "booth-management/outside",
    label: "Booth Outside Team",
    icon: Icons.team,
  },
  {
    to: "booth-management/polling-support",
    label: "Polling Center Support Team",
    icon: Icons.team,
  },
];

// Communication dropdown items
const communicationItems: NavItem[] = [
  {
    to: "communication/user-communication",
    label: "User Communication",
    icon: Icons.team,
  },
  {
    to: "communication/voter-communication",
    label: "Voter Communication",
    icon: Icons.team,
  },
];

// Voter Reports dropdown items
const voterReportsItems: NavItem[] = [
  {
    to: "voter-report/alphabetical",
    label: "Alphabetical List",
    icon: Icons.report,
  },
  { to: "voter-report/age-wise", label: "Age Wise List", icon: Icons.report },
  { to: "voter-report/family", label: "Family Report", icon: Icons.report },
  {
    to: "voter-report/family-head",
    label: "Family Head Report",
    icon: Icons.report,
  },
  {
    to: "voter-report/double-name",
    label: "Double Name Lists",
    icon: Icons.report,
  },
  {
    to: "voter-report/married-women",
    label: "Married Women Report",
    icon: Icons.report,
  },
  {
    to: "voter-report/single-voter",
    label: "Single Voter Report",
    icon: Icons.report,
  },
  {
    to: "voter-report/address-wise",
    label: "Address Wise List",
    icon: Icons.report,
  },
  { to: "voter-report/surname", label: "Surname Report", icon: Icons.report },
  {
    to: "voter-report/family-labels",
    label: "Family Labels",
    icon: Icons.report,
  },
  {
    to: "voter-report/caste-wise",
    label: "Caste Wise List",
    icon: Icons.report,
  },
  {
    to: "voter-report/party-wise",
    label: "Party Wise List",
    icon: Icons.report,
  },
  {
    to: "voter-report/dead-alive",
    label: "Dead/Alive List",
    icon: Icons.report,
  },
  {
    to: "voter-report/birth-wise",
    label: "Birth Wise List",
    icon: Icons.report,
  },
  {
    to: "voter-report/education-wise",
    label: "Education Wise List",
    icon: Icons.report,
  },
  {
    to: "voter-report/home-shifted",
    label: "Home Shifted List",
    icon: Icons.report,
  },
  {
    to: "voter-report/profession-wise",
    label: "Profession Wise List",
    icon: Icons.report,
  },
  {
    to: "voter-report/outside-location",
    label: "Outside Location Wise List",
    icon: Icons.report,
  },
  { to: "voter-report/labharthi", label: "Labharthi List", icon: Icons.report },
  { to: "voter-report/approach", label: "Approach List", icon: Icons.report },
  { to: "voter-report/ssr-form", label: "SSR Form Report", icon: Icons.report },
  { to: "voter-report/voter-tracking", label: "User Activity Report", icon: Icons.eventLog },
];

export default function AssemblySidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { user, stateAssignments, selectedAssignment, permissions, levelAdminPanels } =
    useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const base = ROLE_DASHBOARD_PATH["Assembly"] || "/assembly";
  const firstName = user?.firstName || user?.username || "Assembly";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    firstName
  )}&background=6366f1&color=fff&bold=true`;

  // Get party and state info from localStorage
  const getPartyAndStateFromStorage = () => {
    try {
      const authState = localStorage.getItem('auth_state');
      if (authState) {
        const parsed = JSON.parse(authState) as { user?: { partyId?: number; state_id?: number }; selectedAssignment?: { stateMasterData_id?: number } };
        const partyId = parsed?.user?.partyId || 0;
        const stateId = parsed?.user?.state_id || parsed?.selectedAssignment?.stateMasterData_id || 0;
        return { partyId, stateId };
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
    }
    return { partyId: 0, stateId: 0 };
  };
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [supporterDropdownOpen, setSupporterDropdownOpen] = useState(false);
  const [compareVotersOpen, setcompareVotersOpen] = useState(false);
  const { partyId, stateId } = getPartyAndStateFromStorage();
  const partyLevelId = selectedAssignment?.partyLevelId || 0;

  // Fetch dynamic sidebar levels from API
  const { data: sidebarLevels = [], isLoading: sidebarLoading, error: sidebarError } = useGetSidebarLevelsQuery(
    { partyId, stateId },
    {
      skip: !partyId || !stateId || partyId === 0 || stateId === 0,
      refetchOnMountOrArgChange: true
    }
  );

  // Fetch dynamic sidebar modules from API
  const { data: sidebarModules = [] } = useGetSidebarModulesQuery(
    {
      state_id: stateId,
      party_id: partyId,
      party_level_id: partyLevelId
    },
    { skip: !partyId || !stateId || !partyLevelId }
  );

  const campaignModules = sidebarModules.filter(m =>
    m.moduleName.toLowerCase().includes('campaign')
  );

  const assignedEventModules = sidebarModules.filter(m =>
    m.moduleName.toLowerCase().includes('assigned event')
  );

  const compareVotersModules = sidebarModules.filter(m =>
    m.moduleName.toLowerCase().includes('compare voters')
  );

  const form20Modules = sidebarModules.filter(m =>
    m.moduleName.toLowerCase().includes('form 20')
  );

  const visitorsModules = sidebarModules.filter(m =>
    m.moduleName.toLowerCase().includes('visitors')
  );

  const otherModules = sidebarModules.filter(m =>
    !m.moduleName.toLowerCase().includes('team') &&
    !m.moduleName.toLowerCase().includes('campaign') &&
    !m.moduleName.toLowerCase().includes('compare voters') &&
    !m.moduleName.toLowerCase().includes('form 20') &&
    !m.moduleName.toLowerCase().includes('visitors') &&
    !m.moduleName.toLowerCase().includes('search') &&
    !m.moduleName.toLowerCase().includes('assigned event')
  );

  // Check if Assembly Team module is accessible
  const hasAssemblyTeamAccess = useMemo(() => {
    return sidebarModules.some(module =>
      module.moduleName.toLowerCase().includes('assembly team') ||
      (module.moduleName.toLowerCase().includes('team') &&
        !module.moduleName.toLowerCase().includes('state') &&
        !module.moduleName.toLowerCase().includes('district'))
    );
  }, [sidebarModules]);

  // Create dynamic list items from API response
  const dynamicListItems: NavItem[] = useMemo(() => {
    if (!sidebarLevels.length) return staticListItems;

    // Filter levels that come after Assembly
    const afterAssemblyLevels = sidebarLevels.filter(level =>
      !["State", "District", "Assembly"].includes(level.level_name)
    );

    return afterAssemblyLevels.map(level => ({
      to: `dynamic-level/${level.level_name.toLowerCase()}`,
      label: level.display_level_name,
      icon: getIconForLevel(level.level_name),
    }));
  }, [sidebarLevels]);

  // Use dynamic levels if available, otherwise fall back to static
  const listItems = dynamicListItems.length > 0 ? dynamicListItems : staticListItems;

  // Helper function to get appropriate icon for level
  function getIconForLevel(levelName: string): ReactNode {
    const lowerLevelName = levelName.toLowerCase();

    // Exact matches first - comprehensive mapping
    const iconMap: Record<string, ReactNode> = {
      'block': Icons.block,
      'mandal': Icons.mandal,
      'pollingCenter': Icons.polling,
      'polling center': Icons.polling,
      'booth': Icons.booths,
      'ward': Icons.block,
      'zone': Icons.zone,
      'sector': Icons.sector,
    };

    // Check for exact match (case-insensitive)
    const exactMatch = iconMap[lowerLevelName];
    if (exactMatch) return exactMatch;

    // Check for partial matches with specific icons
    if (lowerLevelName.includes('block')) return Icons.block;
    if (lowerLevelName.includes('mandal')) return Icons.mandal;
    if (lowerLevelName.includes('polling') || lowerLevelName.includes('center')) return Icons.polling;
    if (lowerLevelName.includes('booth')) return Icons.booths;
    if (lowerLevelName.includes('ward')) return Icons.block;
    if (lowerLevelName.includes('zone')) return Icons.zone;
    if (lowerLevelName.includes('sector')) return Icons.sector;

    // Default icon for unknown levels - use generic icon
    return Icons.generic;
  }

  // Helper function to get appropriate icon for module
  function getIconForModule(moduleName: string): ReactNode {
    const lowerModuleName = moduleName.toLowerCase();

    if (lowerModuleName.includes('campaign')) return Icons.campaigns;
    if (lowerModuleName.includes('user')) return Icons.team;
    if (lowerModuleName.includes('district')) return Icons.dashboard;
    if (lowerModuleName.includes('assembly')) return Icons.dashboard;
    if (lowerModuleName.includes('block')) return Icons.block;
    if (lowerModuleName.includes('mandal')) return Icons.mandal;
    if (lowerModuleName.includes('polling') || lowerModuleName.includes('center')) return Icons.polling;
    if (lowerModuleName.includes('booth')) return Icons.booths;
    if (lowerModuleName.includes('event')) return Icons.campaigns;
    if (lowerModuleName.includes('visitor')) return Icons.visitors;
    if (lowerModuleName.includes('supporter')) return Icons.supporters;
    if (lowerModuleName.includes('communication')) return Icons.communication;
    if (lowerModuleName.includes('search')) return Icons.search;

    // Default icon for unknown modules
    return Icons.campaigns;
  }

  // Helper function to get appropriate route for module
  function getModuleRoute(moduleName: string): string {
    const lowerModuleName = moduleName.toLowerCase();

    // Map specific module names to their correct routes for Assembly level
    if (lowerModuleName.includes('campaign')) return 'campaigns';
    if (lowerModuleName.includes('assigned event') || lowerModuleName.includes('event')) return 'assigned-events';
    if (lowerModuleName.includes('user management') || lowerModuleName.includes('user')) return 'users';
    if (lowerModuleName.includes('visitor')) return 'visitors';
    if (lowerModuleName.includes('supporter')) return 'supporters';
    if (lowerModuleName.includes('search')) return 'search-voter';
    if (lowerModuleName.includes('communication')) return 'communication';

    // Default: convert module name to kebab-case
    return moduleName.toLowerCase().replace(/\s+/g, '-');
  }

  const onLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Determine if any list item is active to default-open the dropdown
  const isListPathActive = useMemo(
    () =>
      listItems.some((li) => location.pathname.startsWith(`${base}/${li.to}`)),
    [location.pathname, base, listItems]
  );
  const [listOpen, setListOpen] = useState<boolean>(isListPathActive);

  // Determine if any voters item is active to default-open the dropdown
  const isVotersPathActive = useMemo(
    () =>
      votersDropdownItems.some((vi) => location.pathname.startsWith(`${base}/${vi.to}`)),
    [location.pathname, base]
  );
  const [openVoters, setOpenVoters] = useState<boolean>(isVotersPathActive);

  // Determine if any booth management item is active to default-open the dropdown
  const isBoothMgmtPathActive = useMemo(
    () =>
      boothManagementItems.some((bm) =>
        location.pathname.startsWith(`${base}/${bm.to}`)
      ),
    [location.pathname, base]
  );
  const [openBoothMgmt, setOpenBoothMgmt] = useState<boolean>(
    isBoothMgmtPathActive
  );

  // Determine if any communication item is active to default-open the dropdown
  const isCommunicationPathActive = useMemo(
    () =>
      communicationItems.some((comm) =>
        location.pathname.startsWith(`${base}/${comm.to}`)
      ),
    [location.pathname, base]
  );
  const [openCommunication, setOpenCommunication] = useState<boolean>(
    isCommunicationPathActive
  );

  // Determine if any voter report item is active to default-open the dropdown
  const isVoterReportPathActive = useMemo(
    () =>
      voterReportsItems.some((vr) =>
        location.pathname.startsWith(`${base}/${vr.to}`)
      ),
    [location.pathname, base]
  );
  const [openVoterReports, setOpenVoterReports] = useState<boolean>(
    isVoterReportPathActive
  );
  const [switchDropdownOpen, setSwitchDropdownOpen] = useState(false);
  const [vicDropdownOpen, setVicDropdownOpen] = useState(false);

  // Get all Assembly assignments
  let sameTypeAssignments: StateAssignment[] = [];

  // Get assemblies from stateAssignments
  const assemblyAssignments = stateAssignments.filter(
    (a) => getCanonicalFixedLevelType(a, levelAdminPanels) === "Assembly"
  );

  // Get assemblies from permissions
  if (
    permissions?.accessibleAssemblies &&
    permissions.accessibleAssemblies.length > 0
  ) {
    const permissionAssemblies: StateAssignment[] =
      permissions.accessibleAssemblies.map((assembly) => ({
        assignment_id: assembly.assignment_id,
        stateMasterData_id: assembly.stateMasterData_id || 0,
        levelName: assembly.displayName || assembly.levelName,
        levelType: "Assembly" as const,
        level_id: assembly.level_id,
        parentId: assembly.parentId,
        parentLevelName: assembly.parentLevelName || "District",
        parentLevelType: "District" as const,
        displayName: assembly.displayName,
      }));
    sameTypeAssignments = [...assemblyAssignments, ...permissionAssemblies];
  } else {
    sameTypeAssignments = assemblyAssignments;
  }

  // Remove duplicates by assignment_id
  const seen = new Set<number>();
  sameTypeAssignments = sameTypeAssignments.filter((a) => {
    if (seen.has(a.assignment_id)) return false;
    seen.add(a.assignment_id);
    return true;
  });

  const hasMultipleAssignments = sameTypeAssignments.length > 1;

  const handleAssignmentSwitch = (assignment: StateAssignment) => {
    dispatch(setSelectedAssignment(normalizeFixedLevelAssignment(assignment, levelAdminPanels)));
    setSwitchDropdownOpen(false);

    // Dispatch custom event to trigger data refresh
    window.dispatchEvent(new Event("assignmentChanged"));
  };

  return (
    <aside className="w-68 shrink-0 h-full border-r border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col overflow-y-auto">
      {/* User header */}
      <div className="px-5 py-6 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl}
            alt={firstName}
            className="h-11 w-11 rounded-full ring-2 ring-indigo-500/25 shadow-sm"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--text-color)] text-sm">
              {firstName}
            </p>
            <p className="text-xs font-medium tracking-wide text-indigo-600 uppercase">
              {sidebarLevels.find(({ level_name }) => level_name === "Assembly")
                ?.display_level_name ?? "Assembly"}{" "} Level
            </p>
          </div>
        </div>

        {/* Switch Dropdown - Show when user has multiple Assembly assignments */}
        {hasMultipleAssignments && selectedAssignment && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setSwitchDropdownOpen(!switchDropdownOpen)}
              className="w-full flex items-center justify-between rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-sm hover:bg-[var(--text-color)]/5 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <svg
                  className="h-4 w-4 text-indigo-600 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-medium text-[var(--text-secondary)] truncate">
                  {selectedAssignment.displayName ||
                    selectedAssignment.levelName}
                </span>
              </div>
              <svg
                className={`h-4 w-4 text-[var(--text-secondary)] transition-transform shrink-0 ${switchDropdownOpen ? "rotate-180" : "rotate-0"
                  }`}
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M6 8l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {switchDropdownOpen && (
              <div className="mt-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-sm shadow-lg max-h-64 overflow-y-auto">
                <div className="px-2 py-1.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                  Switch Assembly
                </div>
                {sameTypeAssignments.map((assignment) => (
                  <button
                    key={assignment.assignment_id}
                    onClick={() => handleAssignmentSwitch(assignment)}
                    className={[
                      "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                      selectedAssignment.assignment_id ===
                        assignment.assignment_id
                        ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-200"
                        : "text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 hover:text-[var(--text-color)]",
                    ].join(" ")}
                  >
                    <svg
                      className="h-4 w-4 mt-0.5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-xs">
                        {assignment.displayName || assignment.levelName}
                      </div>
                      {assignment.parentLevelName && (
                        <div className="text-xs text-[var(--text-secondary)] truncate">
                          {assignment.parentLevelName}
                        </div>
                      )}
                    </div>
                    {selectedAssignment.assignment_id ===
                      assignment.assignment_id && (
                        <svg
                          className="h-4 w-4 shrink-0"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-5 space-y-2">
        {/* Dashboard */}
        {assemblyItems.map((item) => (
          <NavLink
            key={item.to}
            to={`${base}/${item.to}`}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              [
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm no-underline",
                "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                isActive
                  ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                  : "border border-transparent hover:border-[var(--border-color)]",
              ].join(" ")
            }
          >
            <span className="text-indigo-600 shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
            <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
            <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 opacity-0 group-[.active]:opacity-100" />
          </NavLink>
        ))}

        {/* Assembly Team - Dynamic based on module access */}
        {hasAssemblyTeamAccess && (
          <NavLink
            to={`${base}/team`}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              [
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm no-underline",
                "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                isActive
                  ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                  : "border border-transparent hover:border-[var(--border-color)]",
              ].join(" ")
            }
          >
            <span className="text-indigo-600 shrink-0">{Icons.team}</span>
            <span className="truncate">Assembly Team</span>
            <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
            <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 opacity-0 group-[.active]:opacity-100" />
          </NavLink>
        )}

        {/* List dropdown */}
        <div>
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={listOpen}
            onClick={() => setListOpen((v) => !v)}
            className={[
              "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
              "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              listOpen
                ? "bg-indigo-500/10 ring-1 ring-indigo-400/40"
                : "border border-transparent hover:border-[var(--border-color)]",
            ].join(" ")}
          >
            <span className="flex items-center gap-3 text-indigo-600">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[var(--text-color)]">
                List {sidebarLoading && "(Loading...)"}
                {sidebarError && "(Error)"}
              </span>
            </span>
            <svg
              className={[
                "h-4 w-4 text-indigo-600 transition-transform",
                listOpen ? "rotate-180" : "rotate-0",
              ].join(" ")}
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M6 8l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {listOpen && (
            <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1">
              {sidebarLoading ? (
                <div className="px-3 py-2 text-sm text-[var(--text-secondary)]">Loading levels...</div>
              ) : sidebarError ? (
                <div className="px-3 py-2 text-sm text-red-500">Error loading levels</div>
              ) : listItems.length === 0 ? (
                <div className="px-3 py-2 text-sm text-[var(--text-secondary)]">No levels available</div>
              ) : (
                listItems.map((li) => (
                  <NavLink
                    key={li.to}
                    to={`${base}/${li.to}`}
                    onClick={() => onNavigate?.()}
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition no-underline",
                        "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                        isActive
                          ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                          : "border border-transparent hover:border-[var(--border-color)]",
                      ].join(" ")
                    }
                  >
                    <span className="text-indigo-600">{li.icon}</span>
                    <span className="truncate">{li.label}</span>
                  </NavLink>
                ))
              )}
            </div>
          )}
        </div>

        {/* Booth Management dropdown */}
        <div>
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={openBoothMgmt}
            onClick={() => setOpenBoothMgmt((v) => !v)}
            className={[
              "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
              "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              openBoothMgmt
                ? "bg-indigo-500/10 ring-1 ring-indigo-400/40"
                : "border border-transparent hover:border-[var(--border-color)]",
            ].join(" ")}
          >
            <span className="flex items-center gap-3 text-indigo-600">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-[var(--text-color)]">Booth Management</span>
            </span>
            <svg
              className={[
                "h-4 w-4 text-indigo-600 transition-transform",
                openBoothMgmt ? "rotate-180" : "rotate-0",
              ].join(" ")}
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M6 8l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {openBoothMgmt && (
            <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1">
              {boothManagementItems.map((bm) => (
                <NavLink
                  key={bm.to}
                  to={`${base}/${bm.to}`}
                  onClick={() => onNavigate?.()}
                  className={({ isActive }) =>
                    [
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition no-underline",
                      "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                      isActive
                        ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                        : "border border-transparent hover:border-[var(--border-color)]",
                    ].join(" ")
                  }
                >
                  <span className="text-indigo-600">{bm.icon}</span>
                  <span className="truncate">{bm.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Communication dropdown */}
        <div>
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={openCommunication}
            onClick={() => setOpenCommunication((v) => !v)}
            className={[
              "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
              "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              openCommunication
                ? "bg-indigo-500/10 ring-1 ring-indigo-400/40"
                : "border border-transparent hover:border-[var(--border-color)]",
            ].join(" ")}
          >
            <span className="flex items-center gap-3 text-indigo-600">
              {Icons.communication}
              <span className="text-[var(--text-color)]">Communication</span>
            </span>
            <svg
              className={[
                "h-4 w-4 text-indigo-600 transition-transform",
                openCommunication ? "rotate-180" : "rotate-0",
              ].join(" ")}
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M6 8l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {openCommunication && (
            <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1">
              {communicationItems.map((comm) => (
                <NavLink
                  key={comm.to}
                  to={`${base}/${comm.to}`}
                  onClick={() => onNavigate?.()}
                  className={({ isActive }) =>
                    [
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition no-underline",
                      "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                      isActive
                        ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                        : "border border-transparent hover:border-[var(--border-color)]",
                    ].join(" ")
                  }
                >
                  <span className="text-indigo-600">{comm.icon}</span>
                  <span className="truncate">{comm.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Campaign Dropdown */}
        {campaignModules.length > 0 && (
          <div>
            <button
              onClick={() => setCampaignOpen(!campaignOpen)}
              className={[
                "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                campaignOpen
                  ? "bg-indigo-500/10 ring-1 ring-indigo-400/40"
                  : "border border-transparent hover:border-[var(--border-color)]",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <span className="text-indigo-600">{Icons.campaigns}</span>
                <span>Campaigns</span>
              </div>
              <svg
                className={`h-4 w-4 text-blue-600 transition-transform ${campaignOpen ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="none"
              >
                <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>

            {campaignOpen && (
              <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1">
                {campaignModules.map((module) => (
                  <NavLink
                    key={module.module_id}
                    to={`${base}/${getModuleRoute(module.moduleName)}`}
                    onClick={() => onNavigate?.()}
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition no-underline",
                        "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                        isActive
                          ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                          : "border border-transparent hover:border-[var(--border-color)]",
                      ].join(" ")
                    }
                  >
                    <span className="text-indigo-600">{getIconForModule(module.moduleName)}</span>
                    <span className="truncate">{module.displayName}</span>
                  </NavLink>
                ))}
                {assignedEventModules.map((module) => (
                  <NavLink
                    key={module.module_id}
                    to={`${base}/${getModuleRoute(module.moduleName)}`}
                    onClick={() => onNavigate?.()}
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition no-underline",
                        "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                        isActive
                          ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                          : "border border-transparent hover:border-[var(--border-color)]",
                      ].join(" ")
                    }
                  >
                    <span className="text-indigo-600">{getIconForModule(module.moduleName)}</span>
                    <span className="truncate">{module.displayName}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Supporters Dropdown */}
        {(visitorsModules.length > 0 || sidebarModules.some(m => m.moduleName.toLowerCase().includes('supporter'))) && (
          <div>
            <button
              onClick={() => setSupporterDropdownOpen(!supporterDropdownOpen)}
              className={[
                "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                supporterDropdownOpen
                  ? "bg-indigo-500/10 ring-1 ring-indigo-400/40"
                  : "border border-transparent hover:border-[var(--border-color)]",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <span className="text-indigo-600">{Icons.supporters}</span>
                <span>Supporter</span>
              </div>
              <svg
                className={`h-4 w-4 text-blue-600 transition-transform ${supporterDropdownOpen ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="none"
              >
                <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>

            {supporterDropdownOpen && (
              <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1">
                {/* Visitors */}
                {visitorsModules.map((module) => (
                  <NavLink
                    key={module.module_id}
                    to={`${base}/${getModuleRoute(module.moduleName)}`}
                    onClick={() => onNavigate?.()}
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition no-underline",
                        "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                        isActive
                          ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                          : "border border-transparent hover:border-[var(--border-color)]",
                      ].join(" ")
                    }
                  >
                    <span className="text-indigo-600">{Icons.visitors}</span>
                    <span className="truncate">{module.displayName}</span>
                  </NavLink>
                ))}
                {/* Supporters */}
                <NavLink
                  to={`${base}/supporters`}
                  onClick={() => onNavigate?.()}
                  className={({ isActive }) =>
                    [
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition no-underline",
                      "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                      isActive
                        ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                        : "border border-transparent hover:border-[var(--border-color)]",
                    ].join(" ")
                  }
                >
                  <span className="text-indigo-600">{Icons.supporters}</span>
                  <span className="truncate">Supporters</span>
                </NavLink>

                {/* Program */}
        {programItems.map((item) => (
          <NavLink
            key={item.to}
            to={`${base}/${item.to}`}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              [
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm no-underline",
                "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                isActive
                  ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                  : "border border-transparent hover:border-[var(--border-color)]",
              ].join(" ")
            }
          >
            <span className="text-indigo-600 shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
            <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
            <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 opacity-0 group-[.active]:opacity-100" />
          </NavLink>
        ))}
              </div>
            )}
          </div>
        )}

        

        {/* --- NEW VOTERS DROPDOWN --- */}
        <div>
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={openVoters}
            onClick={() => setOpenVoters((v) => !v)}
            className={[
              "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
              "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              openVoters
                ? "bg-indigo-500/10 ring-1 ring-indigo-400/40"
                : "border border-transparent hover:border-[var(--border-color)]",
            ].join(" ")}
          >
            <span className="flex items-center gap-3 text-indigo-600">
              <svg className="h-5 w-5 stroke-[1.6]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
              </svg>
              <span className="text-[var(--text-color)]">Voter</span>
            </span>
            <svg
              className={[
                "h-4 w-4 text-indigo-600 transition-transform",
                openVoters ? "rotate-180" : "rotate-0",
              ].join(" ")}
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M6 8l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {openVoters && (
            <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1">
              {votersDropdownItems.map((vi) => (
                <NavLink
                  key={vi.to}
                  to={`${base}/${vi.to}`}
                  onClick={() => onNavigate?.()}
                  className={({ isActive }) =>
                    [
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition no-underline",
                      "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                      isActive
                        ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                        : "border border-transparent hover:border-[var(--border-color)]",
                    ].join(" ")
                  }
                >
                  <span className="text-indigo-600">{vi.icon}</span>
                  <span className="truncate">{vi.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Voter Reports dropdown */}
        <div>
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={openVoterReports}
            onClick={() => setOpenVoterReports((v) => !v)}
            className={[
              "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
              "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              openVoterReports
                ? "bg-indigo-500/10 ring-1 ring-indigo-400/40"
                : "border border-transparent hover:border-[var(--border-color)]",
            ].join(" ")}
          >
            <span className="flex items-center gap-3 text-indigo-600">
              {Icons.report}
              <span className="text-[var(--text-color)]">Voter Reports</span>
            </span>
            <svg
              className={[
                "h-4 w-4 text-indigo-600 transition-transform",
                openVoterReports ? "rotate-180" : "rotate-0",
              ].join(" ")}
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M6 8l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {openVoterReports && (
            <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1 max-h-96 overflow-y-auto">
              {voterReportsItems.map((vr) => (
                <NavLink
                  key={vr.to}
                  to={`${base}/${vr.to}`}
                  onClick={() => onNavigate?.()}
                  className={({ isActive }) =>
                    [
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition no-underline",
                      "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                      isActive
                        ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                        : "border border-transparent hover:border-[var(--border-color)]",
                    ].join(" ")
                  }
                >
                  <span className="text-indigo-600">{vr.icon}</span>
                  <span className="truncate">{vr.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Voter Analysis Dropdown */}
        {(compareVotersModules.length > 0 || form20Modules.length > 0) && (
          <div>
            <button
              onClick={() => setcompareVotersOpen(!compareVotersOpen)}
              className={[
                "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                compareVotersOpen                          
                  ? "bg-indigo-500/10 ring-1 ring-indigo-400/40"
                  : "border border-transparent hover:border-[var(--border-color)]",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <span className="text-indigo-600">{Icons.campaigns}</span>
                <span>Voter Analysis</span>
              </div>
              <svg
                className={`h-4 w-4 text-blue-600 transition-transform ${compareVotersOpen ? "rotate-180" : ""}`}  
                viewBox="0 0 20 20"
                fill="none"
              >
                <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>

            {compareVotersOpen && (                        
              <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1">
                {compareVotersModules.map((module) => (
                  <NavLink
                    key={module.module_id}
                    to={`${base}/${getModuleRoute(module.moduleName)}`}
                    onClick={() => onNavigate?.()}
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition no-underline",
                        "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                        isActive
                          ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                          : "border border-transparent hover:border-[var(--border-color)]",
                      ].join(" ")
                    }
                  >
                    <span className="text-indigo-600">{getIconForModule(module.moduleName)}</span>
                    <span className="truncate">{module.displayName}</span>
                  </NavLink>
                ))}
                {form20Modules.map((module) => (
                  <NavLink
                    key={module.module_id}
                    to={`${base}/${getModuleRoute(module.moduleName)}`}
                    onClick={() => onNavigate?.()}
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition no-underline",
                        "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                        isActive
                          ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                          : "border border-transparent hover:border-[var(--border-color)]",
                      ].join(" ")
                    }
                  >
                    <span className="text-indigo-600">{getIconForModule(module.moduleName)}</span>
                    <span className="truncate">{module.displayName}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Social Media Link */}
        <NavLink
          to={`${base}/Social-Media`}
          onClick={() => onNavigate?.()}
          className={({ isActive }) =>
            [
              "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm no-underline",
              "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              isActive
                ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                : "border border-transparent hover:border-[var(--border-color)]",
            ].join(" ")
          }
        >
          <span className="text-indigo-600 shrink-0">{Icons.team}</span>
          <span className="truncate">Social Media</span>
          <span className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-indigo-500/0 group-hover:bg-indigo-500/30" />
          <span className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-xl bg-indigo-500/70 opacity-0 group-[.active]:opacity-100" />
        </NavLink>

        {/* VIC Dropdown */}
        <div>
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={vicDropdownOpen}
            onClick={() => setVicDropdownOpen(!vicDropdownOpen)}
            className={[
              "w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
              "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              vicDropdownOpen
                ? "bg-indigo-500/10 ring-1 ring-indigo-400/40"
                : "border border-transparent hover:border-[var(--border-color)]",
            ].join(" ")}
          >
            <span className="flex items-center gap-3 text-indigo-600">
              {Icons.vic}
              <span className="text-[var(--text-color)]">VIC</span>
            </span>
            <svg
              className={[
                "h-4 w-4 text-indigo-600 transition-transform",
                vicDropdownOpen ? "rotate-180" : "rotate-0",
              ].join(" ")}
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M6 8l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {vicDropdownOpen && (
            <div className="mt-2 ml-2 pl-2 border-l border-[var(--border-color)] space-y-1">
              <NavLink
                to={`${base}/vic/send-report`}
                onClick={() => onNavigate?.()}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition no-underline",
                    "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                    isActive
                      ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                      : "border border-transparent hover:border-[var(--border-color)]",
                  ].join(" ")
                }
              >
                <span className="text-indigo-600">{Icons.vic}</span>
                <span className="truncate">Send Report</span>
              </NavLink>
              <NavLink
                to={`${base}/vic/my-reports`}
                onClick={() => onNavigate?.()}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition no-underline",
                    "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                    isActive
                      ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                      : "border border-transparent hover:border-[var(--border-color)]",
                  ].join(" ")
                }
              >
                <span className="text-indigo-600">{Icons.vic}</span>
                <span className="truncate">My Reports</span>
              </NavLink>
              <NavLink
                to={`${base}/vic/assigned-reports`}
                onClick={() => onNavigate?.()}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition no-underline",
                    "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                    isActive
                      ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                      : "border border-transparent hover:border-[var(--border-color)]",
                  ].join(" ")
                }
              >
                <span className="text-indigo-600">{Icons.vic}</span>
                <span className="truncate">Assigned Reports</span>
              </NavLink>
              <NavLink
                to={`${base}/vic/under-hierarchy-reports`}
                onClick={() => onNavigate?.()}
                className={({ isActive }) =>
                  [
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition no-underline",
                    "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                    isActive
                      ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                      : "border border-transparent hover:border-[var(--border-color)]",
                  ].join(" ")
                }
              >
                <span className="text-indigo-600">{Icons.vic}</span>
                <span className="truncate">Under Hierarchy Reports</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Dynamic Modules (Catch-all for unhandled modules) */}
        {otherModules.map((module) => (
          <NavLink
            key={module.module_id}
            to={`${base}/${getModuleRoute(module.moduleName)}`}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              [
                "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition shadow-sm no-underline",
                "text-[var(--text-color)] hover:bg-[var(--text-color)]/5",
                isActive
                  ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700"
                  : "border border-transparent hover:border-[var(--border-color)]",
              ].join(" ")
            }
          >
            <span className="text-indigo-600 shrink-0">
              {getIconForModule(module.moduleName)}
            </span>
            <span className="truncate">{module.displayName}</span>
          </NavLink>
        ))}
      </nav>

      {/* Account section */}
      <div className="mt-auto pt-3 pb-5">
        <div className="px-5 mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          Account
        </div>
        <div className="px-4 space-y-2">
          <NavLink
            to={`${base}/profile`}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              [
                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition no-underline",
                "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                isActive
                  ? "bg-indigo-500/10 ring-1 ring-indigo-400/40 text-indigo-700 dark:text-indigo-200"
                  : "border border-transparent hover:border-[var(--border-color)]",
              ].join(" ")
            }
          >
            <span className="text-indigo-600">{Icons.profile}</span>
            <span>Profile</span>
          </NavLink>
          <button
            onClick={onLogout}
            className="group w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 transition"
          >
            <span>{Icons.logout}</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
