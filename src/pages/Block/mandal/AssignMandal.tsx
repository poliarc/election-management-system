import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    useGetUsersByPartyQuery,
    useCreateBlockAssignmentMutation,
    useGetBlockAssignmentsQuery,
} from "../../../store/api/blockApi";
import toast from "react-hot-toast";

export default function AssignMandal() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const mandalId = searchParams.get("mandalId");
    const mandalName = searchParams.get("mandalName");

    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [partyId, setPartyId] = useState<number | null>(null);

    useEffect(() => {
        const authUser = localStorage.getItem("auth_user");
        if (authUser) {
            try {
                const user = JSON.parse(authUser);
                setPartyId(user.partyId);
            } catch (error) {
                console.error("Error parsing auth_user:", error);
            }
        }
    }, []);

    const { data: users = [], isLoading: loadingUsers } = useGetUsersByPartyQuery(
        partyId!,
        { skip: !partyId }
    );

    // Fetch already assigned users
    const { data: assignedData } = useGetBlockAssignmentsQuery(
        Number(mandalId),
        { skip: !mandalId }
    );

    // Set assigned user IDs when data is loaded
    useEffect(() => {
        if (assignedData?.users) {
            const assignedIds = assignedData.users.map((user: any) => user.user_id);
            setAssignedUserIds(assignedIds);
            setSelectedUsers(assignedIds);
        }
    }, [assignedData]);

    const [createAssignment, { isLoading: isAssigning }] =
        useCreateBlockAssignmentMutation();

    const filteredUsers = users.filter(
        (user) =>
            user.isActive === 1 &&
            user.isSuperAdmin !== 1 &&
            (user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleUserToggle = (userId: number) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleAssign = async () => {
        if (selectedUsers.length === 0) {
            toast.error("Please select at least one user");
            return;
        }

        if (!mandalId) {
            toast.error("Mandal ID not found");
            return;
        }

        try {
            const promises = selectedUsers.map((userId) =>
                createAssignment({
                    user_id: userId,
                    afterAssemblyData_id: Number(mandalId),
                }).unwrap()
            );

            await Promise.all(promises);
            toast.success(
                `Successfully assigned ${selectedUsers.length} user(s) to mandal`
            );
            navigate("/block/mandal");
            window.location.reload();
        } catch (error: any) {
            console.error(error?.data?.message);
            navigate("/block/mandal");
            window.location.reload();
        }
    };

    if (!mandalId || !mandalName) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
                    <p className="text-red-600">Invalid mandal information</p>
                    <button
                        onClick={() => navigate("/block/mandal")}
                        className="mt-4 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                    >
                        Back to Mandal List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Assign Users to Mandal
                        </h1>
                        <p className="text-sm text-gray-600 mt-2">
                            Mandal: <span className="font-medium">{mandalName}</span>
                        </p>
                    </div>

                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {loadingUsers ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600">Loading users...</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 text-sm text-gray-600">
                                {selectedUsers.length} user(s) selected
                            </div>

                            <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                                {filteredUsers.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        No users found
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200">
                                        {filteredUsers.map((user) => {
                                            const isSelected = selectedUsers.includes(user.user_id);
                                            const isAlreadyAssigned = assignedUserIds.includes(user.user_id);

                                            return (
                                                <div
                                                    key={user.user_id}
                                                    className={`p-4 hover:bg-blue-50 ${isAlreadyAssigned ? 'bg-blue-50' : ''}`}
                                                >
                                                    <label className="flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleUserToggle(user.user_id)}
                                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                        />
                                                        <div className="ml-3 flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="font-medium text-gray-900">
                                                                            {user.first_name} {user.last_name}
                                                                        </p>
                                                                        {isAlreadyAssigned && (
                                                                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                                Already Assigned
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-gray-600">
                                                                        {user.email}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {user.role} | {user.contact_no}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={handleAssign}
                                    disabled={isAssigning || selectedUsers.length === 0}
                                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
                                >
                                    {isAssigning ? "Assigning..." : "Assign Selected Users"}
                                </button>
                                <button
                                    onClick={() => navigate("/block/mandal")}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
