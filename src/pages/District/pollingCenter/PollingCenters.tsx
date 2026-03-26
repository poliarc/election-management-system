import { useTranslation } from "react-i18next";

export default function DistrictPollingCenters() {
    const {t}=useTranslation();
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-[var(--text-color)] mb-4">{t("districtPolling.Polling_Centers")}</h1>
            <div className="bg-[var(--bg-card)] rounded-lg shadow p-6">
                <p className="text-[var(--text-secondary)]">{t("districtPolling.Desc3")}</p>
            </div>
        </div>
    );
}

