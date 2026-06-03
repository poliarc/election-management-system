import React, { useMemo } from "react";
import { useParams } from "react-router-dom"; // 🔥 NEW: Import useParams to read the URL
import type { VoterList } from "../../../types/voter";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useCreateVoterMarkerMutation, useGetVoterMarkersQuery } from "../../../store/api/votersApi"; 
import { useAppSelector } from "../../../store/hooks";

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

    // 🔥 NEW: Grab the levelId directly from the URL route
    const { levelId } = useParams<{ levelId: string }>();

    // 1. Get current logged-in user & assignment from Redux
    const { user, selectedAssignment } = useAppSelector((state: any) => state.auth);
    const currentUserId = user?.user_id || user?.id; 
    
    // Grab the current Assembly ID just like you do in VoterListPage
    const currentAssemblyId = selectedAssignment?.stateMasterData_id;

    // 2. Fetch all markers for this specific user to check for already marked voters
    const { data: markersData } = useGetVoterMarkersQuery(
        { page: 1, limit: 5000, user_id: currentUserId },
        { skip: !currentUserId } 
    );

    // 3. Create a Set of voter_ids that have been marked for fast lookup
    const markedVoterIds = useMemo(() => {
        const markersArray = markersData?.data || [];
        return new Set(markersArray.map((marker: any) => marker.voter_id));
    }, [markersData]);

    // Initialize the RTK Query mutation for adding new markers
    const [createVoterMarker, { isLoading: isMarking }] = useCreateVoterMarkerMutation();

    // Handle the API call
    const handleMarkVoter = async (voter: any) => {
        const toastId = toast.loading("Marking voter...");

        try {
            // 🔥 FIXED PAYLOAD: We now include the after_assembly_id
           const payload = {
                voter_id: voter.id,
                assembly_id: voter.assembly_id || currentAssemblyId,
                state_id: voter.state_id || user?.state_id, 
                district_id: voter.district_id || selectedAssignment?.parentId || user?.district_id,
                after_assembly_id: levelId ? Number(levelId) : undefined // Ensure it is a number
            };

            const response: any = await createVoterMarker(payload).unwrap();
            
            if (response.success) {
                toast.success("Voter marked successfully!", { id: toastId });
            } else {
                toast.error(response.message || "Failed to mark voter.", { id: toastId });
            }
        } catch (error: any) {
            toast.error(error?.data?.message || error?.message || "Voter is already marked.", { id: toastId });
        }
    };

    const getLocalizedValue = (voter: any, field: "name" | "relation" | "address") => {
        if (language === "hi") {
            switch (field) {
                case "name": return voter.voter_full_name_hi || voter.voter_full_name_en || "-";
                case "relation": return voter.relative_full_name_hi || voter.relative_full_name_en || "-";
                case "address": return voter.town_village_name_eng || "-";
                default: return "-";
            }
        }
        switch (field) {
            case "name": return voter.voter_full_name_en || "-";
            case "relation": return voter.relative_full_name_en || "-";
            case "address": return voter.town_village_name_eng || "-";
            default: return "-";
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
                        voters.map((voter: any) => {
                            
                            // 4. CHECK IF THE SET CONTAINS THIS VOTER'S ID
                            const hasThisUserMarked = markedVoterIds.has(voter.id);

                            return (
                                <tr
                                    key={voter.id}
                                    className="border-b border-gray-100 hover:bg-[var(--text-color)]/5 transition"
                                >
                                    <td className="px-4 py-3">{voter.part_no || "-"}</td>
                                    <td
                                        className="px-4 py-3 cursor-pointer hover:text-indigo-800 font-medium"
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
                                    <td className="px-4 py-3">
                                        {/* Action Buttons Directly Visible */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onEdit(voter)}
                                                className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md hover:bg-indigo-600 hover:text-white transition font-medium text-xs whitespace-nowrap"
                                            >
                                                {t("voterListTable.btnEdit", "Edit")}
                                            </button>
                                            
                                            {/* CONDITIONAL RENDER: Hide if markedVoterIds.has(voter.id) is true */}
                                            {!hasThisUserMarked && (
                                                <button
                                                    onClick={() => handleMarkVoter(voter)}
                                                    disabled={isMarking}
                                                    className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-md hover:bg-emerald-600 hover:text-white transition font-medium text-xs whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {t("voterListTable.btnMark", "Mark Voter")}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};