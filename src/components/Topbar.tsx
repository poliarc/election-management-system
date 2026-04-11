import { useEffect, useRef, useState, useMemo } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logout, setSelectedAssignment, clearSelectedAssignment } from "../store/authSlice";
import type { StateAssignment } from "../types/api";
import type { PanelAssignment } from "../types/auth";
import { getAllDynamicLevelAssignments, getAllDynamicLevelTypes } from "../utils/panelHelpers";
import GoogleTranslate from "./GoogleTranslate";
import { fetchWhatsAppLinks, fetchWhatsAppLinksByUser, type WhatsAppLinkData } from "../services/levelAdminApi";

export function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const user = useAppSelector((s) => s.auth.user);
  const { stateAssignments, selectedAssignment, permissions, partyAdminPanels, levelAdminPanels } = useAppSelector(
    (s) => s.auth
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const savedTheme = window.localStorage.getItem("theme");
    if (savedTheme === "dark") return true;
    if (savedTheme === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [whatsAppLinks, setWhatsAppLinks] = useState<WhatsAppLinkData[]>([]);
  const [activeWhatsAppCategory, setActiveWhatsAppCategory] = useState<string | null>(null);

  const [partyPanelsOpen, setPartyPanelsOpen] = useState(false);
  const [whatsappMenuOpen, setWhatsappMenuOpen] = useState(false);
  const whatsappMenuRef = useRef<HTMLDivElement | null>(null);
  const [levelAdminPanelsOpen, setLevelAdminPanelsOpen] = useState(false);
  const [levelAccessOpen, setLevelAccessOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const partyPanelsRef = useRef<HTMLDivElement | null>(null);
  const levelAdminPanelsRef = useRef<HTMLDivElement | null>(null);
  const levelAccessRef = useRef<HTMLDivElement | null>(null);

  const currentAdminPanel = useMemo(() => {
    const allPanels = [...(levelAdminPanels || []), ...(partyAdminPanels || [])];
    return allPanels.find(p => p.redirectUrl && location.pathname.startsWith(p.redirectUrl));
  }, [location.pathname, levelAdminPanels, partyAdminPanels]);

  useEffect(() => {
    window.document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem("theme", darkMode ? "dark" : "light");
    window.localStorage.setItem("darkMode", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
      if (partyPanelsRef.current && !partyPanelsRef.current.contains(e.target as Node)) setPartyPanelsOpen(false);
      if (levelAdminPanelsRef.current && !levelAdminPanelsRef.current.contains(e.target as Node)) setLevelAdminPanelsOpen(false);
      if (levelAccessRef.current && !levelAccessRef.current.contains(e.target as Node)) setLevelAccessOpen(false);
      if (whatsappMenuRef.current && !whatsappMenuRef.current.contains(e.target as Node)) {
        setWhatsappMenuOpen(false);
      }
    };
    
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setPartyPanelsOpen(false);
        setLevelAdminPanelsOpen(false);
        setLevelAccessOpen(false);
        setWhatsappMenuOpen(false); 
      }
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []); 

  useEffect(() => {
    if (!whatsappMenuOpen) {
      setActiveWhatsAppCategory(null);
    }
  }, [whatsappMenuOpen]);

  const groupedWhatsAppLinks = useMemo(() => {
    return whatsAppLinks.reduce((acc, link) => {
      const type = link.group_type || "Other Groups";
      if (!acc[type]) acc[type] = [];
      acc[type].push(link);
      return acc;
    }, {} as Record<string, WhatsAppLinkData[]>);
  }, [whatsAppLinks]);

  const allAssignments = useMemo(() => {
    const arr: StateAssignment[] = [];
    if (stateAssignments && stateAssignments.length > 0) arr.push(...stateAssignments);
    if (permissions) {
      arr.push(...getAllDynamicLevelAssignments(permissions));
    }
    const seen = new Set<number>();
    return arr.filter((a) => {
      if (!a || a.assignment_id == null) return false;
      if (seen.has(a.assignment_id)) return false;
      seen.add(a.assignment_id);
      return true;
    });
  }, [stateAssignments, permissions]);

  // 🌟 THE BULLETPROOF CONTEXT ISOLATOR & TREE CLIMBER 🌟
  // 🌟 UPDATE THIS LINE (Add 'as any') 🌟
  useEffect(() => {
    const currentUserId = user?.id ?? (user as any)?.user_id ?? null;
    if (!currentUserId) {
      setWhatsAppLinks([]); 
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const fetchPromises: Promise<any>[] = [];

        // 1. Establish the known Frontend Family Tree
        const assignmentMap = new Map<number, any>();
        allAssignments.forEach(a => {
            const id = a.afterAssemblyData_id || a.assignment_id || a.level_id;
            if (id) assignmentMap.set(Number(id), a);
        });

        const hierarchyIds = new Set<number>();
        const currentLocId = selectedAssignment?.afterAssemblyData_id || selectedAssignment?.assignment_id || selectedAssignment?.level_id;
        
        if (currentLocId) hierarchyIds.add(Number(currentLocId));
        if (selectedAssignment?.parentId) hierarchyIds.add(Number(selectedAssignment.parentId));

        let currNode = assignmentMap.get(Number(currentLocId)) || assignmentMap.get(Number(selectedAssignment?.parentId));
        
        for (let i = 0; i < 5; i++) { 
            if (currNode && currNode.parentId) {
                hierarchyIds.add(Number(currNode.parentId));
                currNode = assignmentMap.get(Number(currNode.parentId));
            } else { break; }
        }

        // 2. Fetch Explicit User Links AND Backend Family Tree Links
        if (typeof fetchWhatsAppLinksByUser === 'function') {
          // 🌟 THE FIX: Booth IDs aren't in the afterAssemblyData table, so the backend SQL fails to climb.
          // But the frontend knows the Polling Center ID (parentId). We pass THAT to the backend! 🌟
          const backendSearchId = selectedAssignment?.levelType === 'Booth' ? selectedAssignment?.parentId : currentLocId;

          const fetchApi: any = fetchWhatsAppLinksByUser;
          const userFetchPromise = fetchApi(currentUserId, backendSearchId)
            .then((res: any) => {
              if (!Array.isArray(res)) return [];
              
              // 🌟 MAGIC FIX: Add any discovered ancestors into the frontend hierarchy! 🌟
              res.forEach((link: any) => {
                  if (link.afterAssemblyData_id) {
                      hierarchyIds.add(Number(link.afterAssemblyData_id));
                  }
              });

              return res.map((link: any) => ({
                ...link,
                users: link.users && link.users.length > 0 ? link.users : [{ user_id: currentUserId }]
              }));
            })
            .catch(() => []);
            
          fetchPromises.push(userFetchPromise);
        }

        // 3. Fetch all known parent/grandparent links
        hierarchyIds.forEach(id => {
            fetchPromises.push(fetchWhatsAppLinks({ afterAssemblyData_id: id }).catch(() => []));
        });

        const currentLevelType = selectedAssignment?.levelType || '';
        const isAssemblyDash = currentLevelType === 'Assembly';
        const currentDashId = selectedAssignment?.afterAssemblyData_id || selectedAssignment?.stateMasterData_id || selectedAssignment?.assignment_id || selectedAssignment?.level_id || 0;

        // Fetch Assembly specific links if currently on an Assembly dashboard
        if (isAssemblyDash && currentDashId) {
          fetchPromises.push(fetchWhatsAppLinks({ stateMasterData_id: Number(currentDashId) }).catch(() => []));
        }

        const results = await Promise.all(fetchPromises);
        if (cancelled) return;

        const allLinks: WhatsAppLinkData[] = [];
        results.forEach(res => {
          if (Array.isArray(res)) allLinks.push(...res);
        });

        // 4. Merge & Deduplicate (Prevent data loss on user arrays)
        const uniqueLinksMap = new Map<number, WhatsAppLinkData>();
        allLinks.forEach(link => {
          if (link && link.id) {
             if (!uniqueLinksMap.has(link.id)) {
                 uniqueLinksMap.set(link.id, { ...link });
             } else {
                 const existing = uniqueLinksMap.get(link.id)!;
                 const existingUsers = existing.users || [];
                 const newUsers = link.users || [];
                 
                 const combinedUsersMap = new Map();
                 existingUsers.forEach((u: any) => combinedUsersMap.set(Number(u.user_id), u));
                 newUsers.forEach((u: any) => combinedUsersMap.set(Number(u.user_id), u));
                 
                 existing.users = Array.from(combinedUsersMap.values());
             }
          }
        });

        const mergedLinks = Array.from(uniqueLinksMap.values());

        // 🌟 IDENTIFY KNOWN ASSEMBLIES 🌟
        const knownAssemblyIds = new Set(
            allAssignments
                .filter(a => a.levelType === 'Assembly')
                .map(a => Number(a.afterAssemblyData_id || a.stateMasterData_id || a.assignment_id || a.level_id || 0))
        );

        // 🌟 THE FINAL SMART FILTER 🌟
        const finalLinks = mergedLinks.filter(link => {
          const isHighLevelDash = ['State', 'District'].includes(currentLevelType);
          const isSubLevelDash = !isAssemblyDash && !isHighLevelDash;
          const linkLocationId = Number(link.afterAssemblyData_id || link.stateMasterData_id || 0);

          // RULE 1: ASSEMBLY DASHBOARD
          if (isAssemblyDash) {
              if (linkLocationId === Number(currentDashId)) {
                  return true;
              }
              return false; 
          }

          // RULE 2: SUB-LEVEL DASHBOARDS (Mandal, Polling Center, Booth)
          if (isSubLevelDash) {
              const inHierarchy = hierarchyIds.has(linkLocationId);
              const isKnownAssemblyLink = knownAssemblyIds.has(linkLocationId);
              
              if (inHierarchy && !isKnownAssemblyLink) {
                  return true;
              }
              return false; 
          }

          // RULE 3: STATE / DISTRICT DASHBOARDS
          return false;
        });

        setWhatsAppLinks(finalLinks);
      } catch (err) {
        console.error("WhatsApp Fetch Error:", err);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [user, selectedAssignment, allAssignments]); 

  {/*const isAfterAssemblyPanel = location.pathname.startsWith('/afterassembly/');
  const isSubLevelPanel = location.pathname.startsWith('/sublevel/'); */}
  const isAdminPanel = location.pathname.startsWith('/admin');
  const isLevelAdminPanel = location.pathname.startsWith('/leveladmin');
  const isPartyAdminPanel = location.pathname.startsWith('/partyadmin');
  const shouldHideProfile = isAdminPanel || isLevelAdminPanel || isPartyAdminPanel;
  const currentLevelType = selectedAssignment?.levelType;

{/**  const currentLevelType = selectedAssignment?.levelType;
  let sameTypeAssignments: StateAssignment[] = [];

  if (isAfterAssemblyPanel || isSubLevelPanel) {
    const currentLevelName = selectedAssignment?.levelType;
    if (isAfterAssemblyPanel) {
      const allAfterAssemblyAssignments = getAllDynamicLevelAssignments(permissions);
      if (currentLevelName) {
        sameTypeAssignments = allAfterAssemblyAssignments.filter((a: StateAssignment) => a.levelName === currentLevelName || a.levelType === currentLevelName);
      }
    } else if (isSubLevelPanel) {
      const allSubLevelAssignments = getAllDynamicLevelAssignments(permissions);
      if (currentLevelName) {
        sameTypeAssignments = allSubLevelAssignments.filter((a: StateAssignment) => a.levelName === currentLevelName || a.levelType === currentLevelName);
      }
    }
  } else {
    if (currentLevelType) {
      if (currentLevelType === 'Block' && permissions?.accessibleBlocks) {
        sameTypeAssignments = permissions.accessibleBlocks.map((block: any) => ({
          ...block,
          levelType: 'Block',
          stateMasterData_id: block.afterAssemblyData_id || 0,
          displayName: block.displayName,
          partyLevelName: block.partyLevelName,
        }));
      } else {
        sameTypeAssignments = stateAssignments.filter((a) => a.levelType === currentLevelType);
      }
    }
  }
     */}

  const hasAnyAssignments = allAssignments.length > 0;
  const hasAnyAdminPanels = (partyAdminPanels && partyAdminPanels.length > 0) || (levelAdminPanels && levelAdminPanels.length > 0);

  const handleAssignmentSwitch = (assignment: StateAssignment) => {
    dispatch(setSelectedAssignment(assignment));
    setPartyPanelsOpen(false);
    setLevelAdminPanelsOpen(false);
    setLevelAccessOpen(false);
    window.dispatchEvent(new Event('districtChanged'));
    window.dispatchEvent(new Event('assignmentChanged'));

    if (assignment.afterAssemblyData_id) {
      if (assignment.parentId === null || assignment.parentLevelType === 'Assembly') {
        navigate(`/afterassembly/${assignment.afterAssemblyData_id || assignment.stateMasterData_id}/dashboard`);
      } else {
        navigate(`/sublevel/${assignment.afterAssemblyData_id || assignment.stateMasterData_id}/dashboard`);
      }
      return;
    }

    const levelTypeRoutes: Record<string, string> = {
      State: "/state",
      District: "/district",
      Assembly: "/assembly",
    };

    const route = levelTypeRoutes[assignment.levelType];
    if (route) {
      navigate(route);
    } else {
      const dynamicRoute = `/${assignment.levelType.toLowerCase()}`;
      navigate(dynamicRoute);
    }
  };

  const handleAdminPanelNavigate = (panel: PanelAssignment) => {
    setPartyPanelsOpen(false);
    setLevelAdminPanelsOpen(false);
    setLevelAccessOpen(false);
    dispatch(clearSelectedAssignment());
    navigate(panel.redirectUrl);
  };

  const firstName = user?.firstName || user?.username || "User";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=ffffff&color=111827&bold=true`;

  const getProfileRoute = () => {
    if (!currentLevelType) return "/profile";
    if (selectedAssignment?.afterAssemblyData_id) {
      const levelId = selectedAssignment.afterAssemblyData_id;
      if (selectedAssignment.parentId === null || selectedAssignment.parentLevelType === 'Assembly') {
        return `/afterassembly/${levelId}/profile`;
      } else {
        return `/sublevel/${levelId}/profile`;
      }
    }

    const profileRoutes: Record<string, string> = {
      State: "/state/profile",
      District: "/district/profile",
      Assembly: "/assembly/profile",
    };

    const route = profileRoutes[currentLevelType];
    if (route) {
      return route;
    } else {
      return `/${currentLevelType.toLowerCase()}/profile`;
    }
  };

  const getUpdatePasswordRoute = () => {
    if (location.pathname.startsWith("/state")) return "/state/update-password";
    if (location.pathname.startsWith("/district")) return "/district/update-password";
    if (location.pathname.startsWith("/assembly")) return "/assembly/update-password";
    if (location.pathname.startsWith("/block")) return "/block/update-password";
    if (location.pathname.startsWith("/afterassembly/")) {
      const levelId = selectedAssignment?.afterAssemblyData_id || location.pathname.split("/")[2];
      if (levelId) return `/afterassembly/${levelId}/update-password`;
    }
    if (location.pathname.startsWith("/sublevel/")) {
      const levelId = selectedAssignment?.afterAssemblyData_id || location.pathname.split("/")[2];
      if (levelId) return `/sublevel/${levelId}/update-password`;
    }
    if (location.pathname.startsWith("/partyadmin/")) {
      const parts = location.pathname.split("/");
      const partyId = parts[2];
      if (partyId) return `/partyadmin/${partyId}/update-password`;
    }
    if (location.pathname.startsWith("/leveladmin/")) {
      const parts = location.pathname.split("/");
      const levelId = parts[2];
      if (levelId) return `/leveladmin/${levelId}/update-password`;
    }
    if (location.pathname.startsWith("/admin")) return "/admin/update-password";
    const profileRoute = getProfileRoute();
    return profileRoute.replace("/profile", "/update-password");
  };

  const mapPermissionToAssignment = (item: any, source?: string): StateAssignment => {
    if (!item) return {} as StateAssignment;
    const isFixed = source === 'District' || source === 'Assembly';
    const isDirectChildOfAssembly = item.parentId == null || item.parentLevelId == null;
    return {
      assignment_id: item.assignment_id || item.booth_assignment_id,
      stateMasterData_id: item.stateMasterData_id || 0,
      afterAssemblyData_id: isFixed ? undefined : (item.afterAssemblyData_id || item.booth_assignment_id),
      levelName: item.displayName || item.levelName || source,
      levelType: source || item.levelName || item.partyLevelName || 'Unknown',
      level_id: item.level_id || item.booth_assignment_id,
      parentId: item.parentId || item.parentLevelId || null,
      parentLevelName: item.parentLevelName || item.assemblyName || (isDirectChildOfAssembly ? 'Assembly' : 'Unknown'),
      parentLevelType: item.parentLevelType || (isDirectChildOfAssembly ? 'Assembly' : 'Unknown'),
      displayName: item.partyLevelDisplayName || item.displayName || item.levelName || item.name,
      assemblyName: item.assemblyName,
      partyLevelName: item.partyLevelName,
      partyLevelDisplayName: item.partyLevelDisplayName,
      partyLevelId: item.partyLevelId,
    } as StateAssignment;
  };

  return (
    <header className="topbar-surface sticky top-0 z-50 border-b border-[var(--border-color)]/50 bg-[var(--bg-card)] backdrop-blur-md text-[var(--text-color)] transition-all duration-300 ease-in-out [will-change:background-color,color]">
      
      <div className="container-page flex flex-wrap items-center justify-between py-2 sm:py-3 px-3 sm:px-4 gap-3 sm:gap-4 overflow-visible">
        
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onToggleSidebar?.()}
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-[var(--text-color)]/5 transition-colors duration-300 ease-in-out shrink-0"
            aria-label="Open sidebar"
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--text-color)]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => navigate("/panels")}
            className="group inline-flex items-center justify-center p-2 rounded-md hover:bg-[var(--text-color)]/5 transition-colors duration-300 ease-in-out shrink-0 relative"
            aria-label="Go to assigned panels"
            title="Assigned Panels"
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--text-color)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>

          {(hasAnyAssignments || hasAnyAdminPanels) && user && (
            <div className="flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2 border-l border-[var(--border-color)] pl-2 sm:pl-3">
              {hasAnyAssignments && (
                <div className="relative shrink-0" ref={levelAccessRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setLevelAccessOpen((s) => !s);
                      setPartyPanelsOpen(false);
                      setLevelAdminPanelsOpen(false);
                    }}
                    className="topbar-control flex items-center cursor-pointer gap-1.5 sm:gap-2 rounded-lg border border-[var(--border-color)] px-2 sm:px-3 py-1.5 text-xs sm:text-sm hover:bg-[var(--text-color)]/5 transition-colors duration-300 ease-in-out"
                    title="Team Levels"
                  >
                    <svg className="h-4 w-4 text-[var(--text-secondary)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="hidden sm:inline text-xs text-[var(--text-color)] ">Team Levels</span>
                    <svg className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--text-secondary)] transition-transform shrink-0 ${levelAccessOpen ? "rotate-180" : "rotate-0"}`} viewBox="0 0 20 20" fill="none">
                      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {levelAccessOpen && (
                    <div className="topbar-menu-surface absolute left-0 right-0 sm:right-auto mt-2 w-55 sm:w-55 rounded-2xl border border-[var(--border-color)] p-2 text-sm shadow-xl max-h-80 overflow-y-auto z-50">
                      <div className="px-3 py-2 text-xs font-semibold text-var(--text-secondary) uppercase tracking-wide">Team Levels</div>

                      {allAssignments.length > 0 && (() => {
                        const FIXED = [
                          { type: 'State', route: '/state' },
                          { type: 'District', route: '/district' },
                          { type: 'Assembly', route: '/assembly' },
                        ];

                        const available = FIXED.filter(f => {
                          const inState = allAssignments.some(a => a.levelType === f.type);
                          const inPermissions = (
                            (f.type === 'District' && permissions?.accessibleDistricts && permissions.accessibleDistricts.length > 0) ||
                            (f.type === 'Assembly' && permissions?.accessibleAssemblies && permissions.accessibleAssemblies.length > 0) ||
                            (f.type === 'State' && allAssignments.some(a => a.levelType === 'State'))
                          );
                          return inState || inPermissions;
                        });

                        return (
                          <div>
                            {available.map(f => {
                              let repr = allAssignments.find(a => a.levelType === f.type);
                              if (!repr) {
                                if (f.type === 'District' && permissions?.accessibleDistricts && permissions.accessibleDistricts.length > 0) {
                                  repr = mapPermissionToAssignment(permissions.accessibleDistricts[0], 'District');
                                } else if (f.type === 'Assembly' && permissions?.accessibleAssemblies && permissions.accessibleAssemblies.length > 0) {
                                  repr = mapPermissionToAssignment(permissions.accessibleAssemblies[0], 'Assembly');
                                }
                              }

                              return (
                                <button
                                  key={`fixed-${f.type}`}
                                  onClick={() => {
                                    if (repr) {
                                      dispatch(setSelectedAssignment(repr));
                                      navigate(f.route);
                                      setLevelAccessOpen(false);
                                    }
                                  }}
                                  className={[
                                    "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors duration-300 ease-in-out",
                                    selectedAssignment?.levelType === f.type
                                      ? "bg-[var(--text-color)]/5 text-[var(--text-color)] dark:bg-blue-900/30 dark:text-blue-400"
                                      : "topbar-menu-item group text-[var(--text-color)] hover:bg-[var(--text-color)]/5 hover:text-[var(--text-color)]",
                                  ].join(' ')}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate text-xs sm:text-sm group-hover:text-[var(--text-color)]">{f.type}</div>
                                  </div>
                                  {selectedAssignment?.levelType === f.type && (
                                    <svg className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}

                      <div className="my-1 border-t border-gray-100" />

                      {(() => {
                        const dynamicLevelTypes = getAllDynamicLevelTypes(permissions);
                        const allDynamicAssignments = getAllDynamicLevelAssignments(permissions);
                        
                        const groupedByType = dynamicLevelTypes.map(levelType => {
                          const assignments = allDynamicAssignments.filter(a => 
                            a.levelType === levelType || a.levelName === levelType
                          );
                          return {
                            type: levelType,
                            items: assignments
                          };
                        }).filter(group => group.items.length > 0);

                        return (
                          <div>
                            {groupedByType.map((g) => (
                              <button
                                key={`dyn-${g.type}`}
                                onClick={() => handleAssignmentSwitch(g.items[0])}
                                className={[
                                  "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors duration-300 ease-in-out",
                                  selectedAssignment?.levelType === g.type || selectedAssignment?.levelName === g.type
                                    ? "bg-[var(--text-color)]/5 text-[var(--text-color)] dark:bg-blue-900/30 dark:text-blue-400"
                                    : "topbar-menu-item group text-[var(--text-color)] hover:bg-[var(--text-color)]/5 hover:text-[var(--text-color)]",
                                ].join(' ')}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate text-xs sm:text-sm group-hover:text-[var(--text-color)]">{g.type}</div>
                                  <div className="text-xs text-[var(--text-secondary)] group-hover:text-[var(--text-color)]">{g.items.length} Assigned</div>
                                </div>
                                {(selectedAssignment?.levelType === g.type || selectedAssignment?.levelName === g.type) && (
                                  <svg className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {levelAdminPanels && levelAdminPanels.length > 0 && (
                <div className="relative shrink-0" ref={levelAdminPanelsRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setLevelAdminPanelsOpen((s) => !s);
                      setPartyPanelsOpen(false);
                      setLevelAccessOpen(false);
                    }}
                    className="topbar-control flex items-center gap-1.5 sm:gap-2 rounded-lg border border-[var(--border-color)] px-2 sm:px-3 py-1.5 text-xs sm:text-sm hover:bg-[var(--text-color)]/5 transition-colors duration-300 ease-in-out"
                    title="Role Assign"
                  >
                    <svg className="h-4 w-4 text-[var(--text-secondary)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="hidden sm:inline text-xs text-[var(--text-color)] ">Role Assign</span>
                    <svg className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--text-secondary)] transition-transform shrink-0 ${levelAdminPanelsOpen ? "rotate-180" : "rotate-0"}`} viewBox="0 0 20 20" fill="none">
                      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {levelAdminPanelsOpen && (
                    <div className="topbar-menu-surface absolute left-0 right-0 sm:right-auto mt-2 w-45 sm:w-45 rounded-2xl border border-[var(--border-color)] p-2 text-sm shadow-xl max-h-80 overflow-y-auto z-50">
                      <div className="px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Role Assign</div>
                      {levelAdminPanels.map((panel: PanelAssignment) => (
                        <button
                          key={`levelpanel-${panel.id}`}
                          onClick={() => { setLevelAdminPanelsOpen(false); handleAdminPanelNavigate(panel); }}
                          className="topbar-menu-item group flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[var(--text-color)] hover:bg-[var(--text-color)]/5 hover:text-[var(--text-color)]"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-xs sm:text-sm group-hover:text-[var(--text-color)]">{panel.displayName || panel.name}</div>
                          </div>
                          {currentAdminPanel?.id === panel.id && (
                            <svg className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {partyAdminPanels && partyAdminPanels.length > 0 && (
                <div className="relative shrink-0" ref={partyPanelsRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setPartyPanelsOpen((s) => !s);
                      setLevelAdminPanelsOpen(false);
                      setLevelAccessOpen(false);
                    }}
                    className="topbar-control flex items-center gap-1.5 sm:gap-2 rounded-lg border border-[var(--border-color)] px-2 sm:px-3 py-1.5 text-xs sm:text-sm hover:bg-[var(--text-color)]/5 transition-colors duration-300 ease-in-out"
                    title="National Levels"
                  >
                    <svg className="h-4 w-4 text-[var(--text-secondary)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="hidden sm:inline text-xs text-[var(--text-color)]">National Levels</span>
                    <svg className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--text-secondary)] transition-transform shrink-0 ${partyPanelsOpen ? "rotate-180" : "rotate-0"}`} viewBox="0 0 20 20" fill="none">
                      <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {partyPanelsOpen && (
                    <div className="topbar-menu-surface absolute left-0 right-0 sm:right-auto mt-2 w-45 sm:w-45 rounded-2xl border border-[var(--border-color)] p-2 text-sm shadow-xl max-h-80 overflow-y-auto z-50">
                      <div className="px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">National Levels</div>
                      {partyAdminPanels.map((panel: PanelAssignment) => (
                        <button
                          key={`party-${panel.id}`}
                          onClick={() => { setPartyPanelsOpen(false); handleAdminPanelNavigate(panel); }}
                          className="topbar-menu-item group flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[var(--text-color)] hover:bg-[var(--text-color)]/5 hover:text-[var(--text-color)]"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-xs sm:text-sm group-hover:text-[var(--text-color)]">{panel.displayName || panel.name}</div>
                            {panel.metadata?.partyCode && (
                              <div className="text-xs text-[var(--text-secondary)] truncate group-hover:text-[var(--text-color)]">Code: {panel.metadata.partyCode}</div>
                            )}
                          </div>
                          {currentAdminPanel?.id === panel.id && (
                            <svg className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          
          <div className="hidden md:block">
            <GoogleTranslate />
          </div>

          {whatsAppLinks.length > 0 && (
            <div className="relative shrink-0 mr-1" ref={whatsappMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setWhatsappMenuOpen((s) => !s);
                  setOpen(false);
                  setPartyPanelsOpen(false);
                  setLevelAdminPanelsOpen(false);
                  setLevelAccessOpen(false);
                }}
                className="topbar-control flex items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400 transition-colors duration-300 ease-in-out relative"
                aria-label="WhatsApp Groups"
                title="WhatsApp Groups"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741 1.001 1.011-3.762-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                
                {whatsAppLinks.length > 1 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--bg-card)]">
                    {whatsAppLinks.length}
                  </span>
                )}
              </button>

              {whatsappMenuOpen && (
                <div className="topbar-menu-surface absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl border border-[var(--border-color)] p-2 text-sm shadow-xl z-50 animate-in fade-in zoom-in duration-150">
                  <div className="px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                    Join WhatsApp Groups
                  </div>
                  
                  <div className="space-y-1">
                    {Object.entries(groupedWhatsAppLinks).map(([type, links]) => (
                      <div key={type} className="flex flex-col">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveWhatsAppCategory(activeWhatsAppCategory === type ? null : type);
                          }}
                          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-colors duration-200 ${
                            activeWhatsAppCategory === type 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                            : "text-[var(--text-color)] hover:bg-[var(--bg-main)]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="font-medium text-sm">{type}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-[var(--bg-main)] text-[10px] font-bold text-[var(--text-secondary)]">
                              {links.length}
                            </span>
                            <svg 
                              className={`h-4 w-4 text-[var(--text-secondary)] transition-transform duration-200 ${activeWhatsAppCategory === type ? "rotate-180" : "rotate-0"}`} 
                              viewBox="0 0 20 20" 
                              fill="none" 
                              stroke="currentColor"
                            >
                              <path d="M6 8l4 4 4-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </button>

                        {activeWhatsAppCategory === type && (
                          <div className="mt-1 ml-4 pl-3 border-l-2 border-[var(--border-color)] space-y-1 py-1">
                            {links.map((link) => (
                              <a
                                key={link.id}
                                href={link.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setWhatsappMenuOpen(false)}
                                className="group flex items-center justify-between w-full px-3 py-2 rounded-lg text-[var(--text-color)] hover:bg-[var(--bg-main)] transition-colors duration-200"
                              >
                                <span className="text-xs sm:text-sm font-medium truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                  {link.group_name || "Join Group"}
                                </span>
                                <svg className="h-3 w-3 shrink-0 ml-2 opacity-40 group-hover:opacity-100 group-hover:text-emerald-500 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                  <polyline points="15 3 21 3 21 9"></polyline>
                                  <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="topbar-control inline-flex items-center justify-center rounded-xl border border-[var(--border-color)] p-2 text-[var(--text-color)] hover:bg-[var(--text-color)]/5 transition-colors duration-300 ease-in-out"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Light Mode" : "Dark Mode"}
          >
            {darkMode ? (
              <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 3v2m0 14v2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42M3 12h2m14 0h2M5.64 18.36l1.42-1.42m9.88-9.88 1.42-1.42" strokeLinecap="round" />
                <circle cx="12" cy="12" r="4.5" />
              </svg>
            ) : (
              <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 12.79A9 9 0 1 1 11.21 3c.12 0 .24 0 .36.01A7 7 0 0 0 21 12.79Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          {user && (
            <div className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((s) => !s)}
                className="topbar-control flex items-center gap-1.5 sm:gap-3 rounded-2xl border border-[var(--border-color)] px-2 sm:px-3 py-1.5 shadow-sm hover:bg-[var(--text-color)]/5 hover:shadow transition-colors duration-300 ease-in-out text-xs sm:text-sm"
              >
                <span className="text-[var(--text-color)] hidden sm:inline">
                  Hello, <span className="font-medium">{firstName}</span>
                </span>
                <svg
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-[var(--text-secondary)]  transition-transform hidden sm:block ${open ? "rotate-180" : "rotate-0"
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
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="h-7 w-7 sm:h-9 sm:w-9 rounded-full ring-1 ring-[var(--text-color)]/10 object-cover"
                />
              </button>
              {open && (
                <div
                  role="menu"
                  className="topbar-menu-surface absolute right-0 mt-2 w-64 sm:w-64 rounded-2xl border border-[var(--border-color)] p-2 text-sm shadow-xl z-50"
                >
                  {!shouldHideProfile && (
                    <NavLink
                      to={`${getProfileRoute()}`}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-2 sm:gap-3 rounded-xl px-2 sm:px-3 py-2 transition-colors duration-300 ease-in-out",
                          isActive
                            ? "bg-[var(--text-color)]/5 text-[var(--text-color)] dark:bg-blue-900/30 dark:text-blue-400"
                            : "topbar-menu-item group text-[var(--text-color)] hover:bg-[var(--text-color)]/5 hover:text-[var(--text-color)]",
                        ].join(" ")
                      }
                    >
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--text-secondary)] shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm-7 9a7 7 0 0 1 14 0"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-xs sm:text-sm group-hover:text-[var(--text-color)]">My Profile</span>
                    </NavLink>
                  )}

                  <NavLink
                    to={getUpdatePasswordRoute()}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-2 sm:gap-3 rounded-xl px-2 sm:px-3 py-2 transition-colors",
                        isActive
                          ? "bg-[var(--text-color)]/5 text-[var(--text-color)] dark:bg-blue-900/30 dark:text-blue-400"
                          : "text-[var(--text-color)] hover:bg-[var(--text-color)]/5 hover:text-[var(--text-color)]",
                      ].join(" ")
                    }
                  >
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        d="M8 11V7a4 4 0 1 1 8 0v4m-9 0h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-xs sm:text-sm">Update Password</span>
                  </NavLink>
                  
                  <div className="my-2 border-t border-[var(--border-color)]" />

                  <button
                    onClick={() => {
                      setOpen(false);
                      dispatch(logout());
                    }}
                    className="flex w-full items-center gap-2 sm:gap-3 rounded-xl px-2 sm:px-3 py-2 text-left text-red-600 hover:bg-red-50"
                  >
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        d="M9 12h10m0 0-3-3m3 3-3 3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M13 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-xs sm:text-sm">Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}