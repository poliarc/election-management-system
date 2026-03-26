import { useNavigate, useParams } from "react-router-dom";
import { AssignedEventsPage } from "../../modules/initative/AssignedEventsPage";
import { useTranslation } from "react-i18next";

export default function AfterAssemblyAssignedEvents() {
  const {t} = useTranslation();
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const resolvedLevelId = Number(levelId) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br bg-[var(--bg-color)] p-1">
      <div className="max-w-5xl mx-auto">
        <div className="bg-[var(--bg-card)] rounded-xl shadow-lg p-3">
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() =>
                navigate(`/afterassembly/${resolvedLevelId}/dashboard`)
              }
              className="p-2 hover:bg-[var(--text-color)]/5 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <svg
                className="w-5 h-5 text-[var(--text-secondary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-color)]">
                {t("AfterAssemblyAssignedEvents.Title")}
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                {t("AfterAssemblyAssignedEvents.Desc")}
              </p>
            </div>
          </div>

          <AssignedEventsPage
            userLevelType="AFTER_ASSEMBLY"
            userLevelId={resolvedLevelId}
          />
        </div>
      </div>
    </div>
  );
}



