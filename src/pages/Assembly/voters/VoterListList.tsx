import React, { useState, useRef } from "react";
import type { VoterList } from "../../../types/voter";
import { EllipsisVertical } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
    voters: VoterList[];
    onEdit: (voter: VoterList) => void;
    language: "en" | "hi";
};

export const VoterListTable: React.FC<Props> = ({
    voters,
    onEdit,
    language,
}) => {
    const { t } = useTranslation();
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                openDropdown !== null &&
                dropdownRefs.current[openDropdown] &&
                !dropdownRefs.current[openDropdown]?.contains(event.target as Node)
            ) {
                setOpenDropdown(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openDropdown]);

    const handleDropdown = (idx: number) => {
        setOpenDropdown((prev) => (prev === idx ? null : idx));
    };

    const getLocalizedValue = (voter: VoterList, field: "name" | "relation" | "address") => {
        if (language === "hi") {
            switch (field) {
                case "name":
                    return voter.voter_full_name_hi || voter.voter_full_name_en || "-";
                case "relation":
                    return voter.relative_full_name_hi || voter.relative_full_name_en || "-";
                case "address":
                    return voter.town_village_name_eng || "-";
                default:
                    return "-";
            }
        }
        switch (field) {
            case "name":
                return voter.voter_full_name_en || "-";
            case "relation":
                return voter.relative_full_name_en || "-";
            case "address":
                return voter.town_village_name_eng || "-";
            default:
                return "-";
        }
    };

    return (
        <div className="overflow-x-auto w-full rounded-lg border border-[var(--border-color)]">
            <table className="w-full text-sm text-left bg-[var(--bg-card)]">
                <thead className="bg-indigo-50 text-[var(--text-secondary)] bg-[var(--bg-card)] text-xs uppercase sticky top-0 z-10">
                    <tr>
                        <th className="px-4 py-3 font-semibold bg-[var(--bg-color)]">{t("voterListTable.thPart")}</th>
                        <th className="px-4 py-3 font-semibold bg-[var(--bg-color)]">{t("voterListTable.thName")}</th>
                        <th className="px-4 py-3 font-semibold bg-[var(--bg-color)]">{t("voterListTable.thFatherHusband")}</th>
                        <th className="px-4 py-3 font-semibold bg-[var(--bg-color)]">{t("voterListTable.thGender")}</th>
                        <th className="px-4 py-3 font-semibold bg-[var(--bg-color)]">{t("voterListTable.thAge")}</th>
                        <th className="px-4 py-3 font-semibold bg-[var(--bg-color)]">{t("voterListTable.thMobile")}</th>
                        <th className="px-4 py-3 font-semibold bg-[var(--bg-color)]">{t("voterListTable.thVoterId")}</th>
                        <th className="px-4 py-3 font-semibold bg-[var(--bg-color)]">{t("voterListTable.thAddress")}</th>
                        <th className="px-4 py-3 font-semibold bg-[var(--bg-color)]">{t("voterListTable.thAction")}</th>
                    </tr>
                </thead>
                <tbody>
                    {voters.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="text-center py-12 text-[var(--text-secondary)]">
                                {language === "en" ? t("voterListTable.emptyNoVotersFound") : "कोई मतदाता नहीं मिला"}
                            </td>
                        </tr>
                    ) : (
                        voters.map((voter, index) => (
                            <tr
                                key={voter.id}
                                className="border-b border-gray-100 hover:bg-[var(--text-color)]/5 transition"
                            >
                                <td className="px-4 py-3">{voter.part_no || "-"}</td>
                                <td
                                    className="px-4 py-3 cursor-pointer text-grey-600 hover:text-indigo-800 font-medium"
                                    onClick={() => onEdit(voter)}
                                >
                                    {getLocalizedValue(voter, "name")}
                                </td>
                                <td className="px-4 py-3">
                                    {getLocalizedValue(voter, "relation")}
                                </td>
                                <td className="px-4 py-3">{voter.gender || "-"}</td>
                                <td className="px-4 py-3">{voter.age || "-"}</td>
                                <td className="px-4 py-3">{voter.contact_number1 || "-"}</td>
                                <td className="px-4 py-3">{voter.voter_id_epic_no || "-"}</td>
                                <td className="px-4 py-3">
                                    {getLocalizedValue(voter, "address")}
                                </td>
                                <td
                                    className="px-4 py-3 relative"
                                    ref={(el) => {
                                        dropdownRefs.current[index] = el;
                                    }}
                                >
                                    <button
                                        onClick={() => handleDropdown(index)}
                                        className="bg-indigo-100 text-indigo-700 rounded-full p-2 hover:bg-indigo-600 hover:text-white transition"
                                        title={t("voterListTable.titleActions")}
                                    >
                                        <EllipsisVertical className="w-4 h-4" />
                                    </button>
                                    {openDropdown === index && (
                                        <div className="absolute right-0 mt-2 w-40 bg-[var(--bg-card)]  rounded-lg shadow-lg border border-[var(--border-color)] z-20">
                                            <button
                                                onClick={() => {
                                                    onEdit(voter);
                                                    setOpenDropdown(null);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--text-color)]/5 rounded-t-lg transition"
                                            >
                                                {t("voterListTable.btnEdit")}
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};


