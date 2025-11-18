import React from "react";
import { UserCheck, Users } from "lucide-react";
import type { Party } from "../types/party";

interface AdminAssignmentCellProps {
    party: Party;
    onAssignClick: (party: Party) => void;
}

export const AdminAssignmentCell: React.FC<AdminAssignmentCellProps> = ({
    party,
    onAssignClick,
}) => {
    if (party.admin_name) {
        return (
            <div
                onClick={() => onAssignClick(party)}
                className="cursor-pointer hover:bg-blue-50 p-2 rounded-md transition-colors"
            >
                <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <div>
                        <div className="text-sm font-medium text-gray-900">{party.admin_name}</div>
                        <div className="text-xs text-gray-500">{party.admin_email}</div>
                    </div>
                </div>
                <div className="text-xs text-blue-600 mt-1">Click to change</div>
            </div>
        );
    }

    return (
        <button
            onClick={() => onAssignClick(party)}
            className="flex items-center gap-2 text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
        >
            <Users className="w-3 h-3" />
            Assign Admin
        </button>
    );
};
