import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { ROLE_DASHBOARD_PATH } from "../constants/routes";
import type { Role } from "../types/roles";
import { roles, RoleLabel } from "../types/roles";

export default function PanelSelect() {
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();

  const adminPanels = useMemo(() => user?.adminPanels ?? [], [user]);
  const userPanels = useMemo(() => user?.userPanels ?? [], [user]);
  const hasAnyAccess = adminPanels.length > 0 || userPanels.length > 0;
  // Exclude Admin role from User Assigned Panels list
  const userPanelRoles = useMemo(() => roles.filter((r) => r !== "Admin"), []);

  const goToUserPanel = (role: Role) => {
    navigate(ROLE_DASHBOARD_PATH[role]);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <h1
            className={[
              "text-2xl font-bold",
              hasAnyAccess
                ? "text-gray-900 dark:text-white"
                : "text-gray-800 dark:text-gray-100",
            ].join(" ")}
          >
            Choose your panel
          </h1>
          {hasAnyAccess && (
            <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200 px-2.5 py-1 text-xs font-medium">
              Access available
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/*
            Admin Panels (temporarily disabled)
            -------------------------------------------------
            The entire Admin Panels section is commented out for now.
            Restore by removing this comment wrapper when needed.
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
              Admin Panels
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roles.map((r) => {
                const hasAccess = adminPanels.includes(r);
                const label = RoleLabel[r];
                return (
                  <button
                    key={`admin-${r}`}
                    onClick={() => hasAccess && goToAdminPanel(r)}
                    className={[
                      "group rounded-xl border p-4 text-left shadow-sm transition",
                      "bg-white dark:bg-gray-800",
                      hasAccess
                        ? "border-gray-200 dark:border-gray-700 hover:shadow"
                        : "border-gray-200 dark:border-gray-800 opacity-60 cursor-not-allowed",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-gray-900 dark:text-white font-semibold capitalize">
                        {label}
                      </div>
                      <span
                        className={[
                          "text-xs px-2 py-0.5 rounded-full",
                          hasAccess
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300",
                        ].join(" ")}
                      >
                        {hasAccess ? "Admin" : "No access"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Admin view
                    </div>
                    {hasAccess && (
                      <div className="mt-3 text-indigo-600 dark:text-indigo-400 text-sm opacity-0 group-hover:opacity-100 transition">
                        Open →
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
          */}

          {/* User Assigned Panels */}
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
              User Assigned Panels
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userPanelRoles.map((r) => {
                const hasAccess = userPanels.includes(r);
                const label = RoleLabel[r];
                return (
                  <button
                    key={`user-${r}`}
                    onClick={() => hasAccess && goToUserPanel(r)}
                    className={[
                      "group rounded-xl border p-4 text-left shadow-sm transition",
                      "bg-white dark:bg-gray-800",
                      hasAccess
                        ? "border-gray-200 dark:border-gray-700 hover:shadow"
                        : "border-gray-200 dark:border-gray-800 opacity-60 cursor-not-allowed",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-gray-900 dark:text-white font-semibold capitalize">
                        {label}
                      </div>
                      <span
                        className={[
                          "text-xs px-2 py-0.5 rounded-full",
                          hasAccess
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300",
                        ].join(" ")}
                      >
                        {hasAccess ? "Assigned" : "No access"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Existing user view
                    </div>
                    {hasAccess && (
                      <div className="mt-3 text-indigo-600 dark:text-indigo-400 text-sm opacity-0 group-hover:opacity-100 transition">
                        Open →
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
