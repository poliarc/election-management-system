import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { logout, setSelectedAssignment } from "../store/authSlice";
import { ThemeToggle } from "./ThemeToggle";
import type { StateAssignment } from "../types/api";

export function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const user = useAppSelector((s) => s.auth.user);
  const { stateAssignments, selectedAssignment, permissions } = useAppSelector(
    (s) => s.auth
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [assignmentMenuOpen, setAssignmentMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const assignmentMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (
        assignmentMenuRef.current &&
        !assignmentMenuRef.current.contains(e.target as Node)
      ) {
        setAssignmentMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setAssignmentMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Get assignments of the same type as currently selected
  const currentLevelType = selectedAssignment?.levelType;
  let sameTypeAssignments: StateAssignment[] = [];

  if (currentLevelType) {
    if (currentLevelType === 'Block' && permissions?.accessibleBlocks) {
      // For Block level, use permissions.accessibleBlocks
      sameTypeAssignments = permissions.accessibleBlocks.map((block) => ({
        ...block,
        levelType: 'Block',
        stateMasterData_id: block.afterAssemblyData_id || 0,
        // displayName comes from API (e.g., "Badli Block")
      }));
    } else {
      sameTypeAssignments = stateAssignments.filter((a) => a.levelType === currentLevelType);
    }
  }

  const hasMultipleAssignments = sameTypeAssignments.length > 1;

  const handleAssignmentSwitch = (assignment: StateAssignment) => {
    dispatch(setSelectedAssignment(assignment));
    setAssignmentMenuOpen(false);

    // Navigate to the appropriate route based on level type
    const levelTypeRoutes: Record<string, string> = {
      State: "/state",
      District: "/district",
      Assembly: "/assembly",
      Block: "/block",
      Mandal: "/mandal",
      PollingCenter: "/polling-center",
      Booth: "/booth",
    };

    const route = levelTypeRoutes[assignment.levelType];
    if (route) {
      navigate(route);
    }
  };

  const firstName = user?.firstName || user?.username || "User";
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    firstName
  )}&background=ffffff&color=111827&bold=true`;

  // Get profile route based on current level type
  const getProfileRoute = () => {
    if (!currentLevelType) return "/profile";

    const profileRoutes: Record<string, string> = {
      State: "/state/profile",
      District: "/district/profile",
      Assembly: "/assembly/profile",
      Block: "/block/profile",
      Mandal: "/mandal/profile",
      PollingCenter: "/polling-center/profile",
      Booth: "/booth/profile",
    };

    return profileRoutes[currentLevelType] || "/profile";
  };

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100">
      <div className="container-page flex items-center justify-between py-2 sm:py-3 px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          {/* Mobile hamburger to open sidebar */}
          <button
            type="button"
            onClick={() => onToggleSidebar?.()}
            className="lg:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100 transition flex-shrink-0"
            aria-label="Open sidebar"
          >
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="font-semibold text-sm sm:text-base truncate" aria-label="Current level">
            {user?.role || "Dashboard"}
          </div>

          {/* Assignment Switcher - Show when user has multiple assignments of same type */}
          {hasMultipleAssignments && selectedAssignment && (
            <div className="relative hidden md:block" ref={assignmentMenuRef}>
              <button
                type="button"
                onClick={() => setAssignmentMenuOpen((s) => !s)}
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 sm:px-3 py-1.5 text-xs sm:text-sm hover:bg-gray-100 transition dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 max-w-[200px]"
              >
                <svg
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0"
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
                <span className="font-medium text-gray-700 dark:text-gray-200 truncate">
                  {selectedAssignment.displayName || selectedAssignment.levelName}
                </span>
                <svg
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 transition-transform flex-shrink-0 ${assignmentMenuOpen ? "rotate-180" : "rotate-0"
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

              {assignmentMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 sm:w-64 rounded-2xl border border-gray-200 bg-white p-2 text-sm shadow-xl dark:border-gray-700 dark:bg-gray-800 max-h-80 overflow-y-auto z-50">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Switch {currentLevelType}
                  </div>
                  {sameTypeAssignments.map((assignment) => (
                    <button
                      key={assignment.assignment_id}
                      onClick={() => handleAssignmentSwitch(assignment)}
                      className={[
                        "flex w-full items-start gap-2 sm:gap-3 rounded-xl px-2 sm:px-3 py-2 text-left transition-colors",
                        selectedAssignment.assignment_id ===
                          assignment.assignment_id
                          ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700",
                      ].join(" ")}
                    >
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 shrink-0"
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
                        <div className="font-medium truncate text-xs sm:text-sm">
                          {assignment.displayName || assignment.levelName}
                        </div>
                        {assignment.parentLevelName && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {assignment.parentLevelName}
                          </div>
                        )}
                      </div>
                      {selectedAssignment.assignment_id ===
                        assignment.assignment_id && (
                          <svg
                            className="h-4 w-4 sm:h-5 sm:w-5 shrink-0"
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
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0" ref={menuRef}>
          <ThemeToggle />
          {user && (
            <div className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((s) => !s)}
                className="flex items-center gap-1.5 sm:gap-3 rounded-2xl border border-gray-200 bg-white px-2 sm:px-3 py-1.5 shadow-sm hover:shadow transition text-xs sm:text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <span className="text-gray-700 dark:text-gray-200 hidden sm:inline">
                  Hello, <span className="font-medium">{firstName}</span>
                </span>
                <svg
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 transition-transform ${open ? "rotate-180" : "rotate-0"
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
                  className="h-7 w-7 sm:h-9 sm:w-9 rounded-full ring-1 ring-gray-200 object-cover"
                />
              </button>
              {open && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 sm:w-64 rounded-2xl border border-gray-200 bg-white p-2 text-sm shadow-xl dark:border-gray-700 dark:bg-gray-800 z-50"
                >
                  <NavLink
                    to={`${getProfileRoute()}`}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-2 sm:gap-3 rounded-xl px-2 sm:px-3 py-2 transition-colors",
                        isActive
                          ? "bg-gray-50 text-gray-900 dark:bg-gray-700 dark:text-white"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700",
                      ].join(" ")
                    }
                  >
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0"
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
                    <span className="text-xs sm:text-sm">My Profile</span>
                  </NavLink>

                  {/* Assignment Switcher in Profile Menu - Mobile Only */}
                  {hasMultipleAssignments && selectedAssignment && (
                    <>
                      <div className="my-2 border-t border-gray-200 dark:border-gray-700 md:hidden" />
                      <div className="px-2 sm:px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide md:hidden">
                        Switch {currentLevelType}
                      </div>
                      <div className="max-h-48 overflow-y-auto md:hidden">
                        {sameTypeAssignments.map((assignment) => (
                          <button
                            key={assignment.assignment_id}
                            onClick={() => {
                              handleAssignmentSwitch(assignment);
                              setOpen(false);
                            }}
                            className={[
                              "flex w-full items-start gap-2 rounded-xl px-2 sm:px-3 py-2 text-left transition-colors",
                              selectedAssignment.assignment_id === assignment.assignment_id
                                ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200"
                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700",
                            ].join(" ")}
                          >
                            <svg className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate text-xs sm:text-sm">{assignment.displayName || assignment.levelName}</div>
                              {assignment.parentLevelName && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {assignment.parentLevelName}
                                </div>
                              )}
                            </div>
                            {selectedAssignment.assignment_id === assignment.assignment_id && (
                              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="my-2 border-t border-gray-200 dark:border-gray-700 md:hidden" />
                    </>
                  )}

                  <button
                    onClick={() => {
                      setOpen(false);
                      dispatch(logout());
                    }}
                    className="flex w-full items-center gap-2 sm:gap-3 rounded-xl px-2 sm:px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <svg
                      className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"
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
