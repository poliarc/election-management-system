import { useLocation } from "react-router-dom";

interface HierarchyDetailsLocationState {
  stateId?: number;
  districtId?: number;
  assemblyId?: number;
}

export default function HierarchyDetails() {
  const location = useLocation();
  const state = (location.state as HierarchyDetailsLocationState | null) ?? null;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--text-color)]">
              Hierarchy Details
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Selected hierarchy identifiers are ready for the next API integration step.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                State ID
              </div>
              <div className="mt-2 text-lg font-semibold text-[var(--text-color)]">
                {state?.stateId ?? "-"}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                District ID
              </div>
              <div className="mt-2 text-lg font-semibold text-[var(--text-color)]">
                {state?.districtId ?? "-"}
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
                Assembly ID
              </div>
              <div className="mt-2 text-lg font-semibold text-[var(--text-color)]">
                {state?.assemblyId ?? "-"}
              </div>
            </div>
          </div>

          {!state && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
              No hierarchy data was provided in navigation state.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
