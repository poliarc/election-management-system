import { useState, useEffect, useRef, useMemo } from "react";
import { useGetPartyUsersQuery, useGetDirectConversationQuery, useSendDirectMessageMutation, useCreateGroupMutation, useGetUserGroupsQuery, useGetGroupConversationQuery, useSendGroupMessageMutation, useGetGroupMembersQuery, useMarkDirectMessageAsReadMutation, useMarkGroupMessageAsReadMutation, useGetRecentChatsQuery, useGetUnreadCountQuery, useLeaveGroupMutation, useAddGroupMembersMutation } from "../../services/chatApi";
import { useAppSelector } from "../../store/hooks";
import { socketService } from "../../services/socketService";
import toast from "react-hot-toast";
import ConfirmationModal from "../ConfirmationModal";

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

interface MessageBubbleProps {
    message: any;
    isOwn: boolean;
    showSender?: boolean;
}

function MessageBubble({ message, isOwn, showSender = false }: MessageBubbleProps) {
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    };

    const isRead = message.read_at !== null;

    return (
        <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[70%]`}>
                {showSender && !isOwn && (
                    <div className="text-xs text-gray-600 mb-1 ml-2 font-medium">
                        {message.sender_name || "Unknown"}
                    </div>
                )}
                <div className={`px-3 py-2 rounded-lg ${isOwn ? "bg-gray-600 text-white rounded-br-none" : "bg-white text-gray-900 rounded-bl-none"}`}>
                    <div className="text-sm break-words">{message.message}</div>
                    {message.files && message.files.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {message.files.map((file: any, idx: number) => (
                                <a
                                    key={idx}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-2 rounded text-xs ${isOwn ? "bg-gray-700" : "bg-gray-100"}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                    <span className="truncate">{file.name}</span>
                                </a>
                            ))}
                        </div>
                    )}
                    <div className={`text-xs mt-1 flex items-center gap-1 ${isOwn ? "text-gray-200" : "text-gray-500"}`}>
                        <span>{formatTime(message.created_at)}</span>
                        {isOwn && (
                            <svg className={`w-4 h-4 ${isRead ? "text-green-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                <path d="M12.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-1-1a1 1 0 011.414-1.414l.293.293 7.293-7.293a1 1 0 011.414 0z" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// GROUP INFO MODAL
// ============================================================================

interface GroupInfoModalProps {
    group: any;
    onClose: () => void;
}

function GroupInfoModal({ group, onClose }: GroupInfoModalProps) {
    const { data: members = [] } = useGetGroupMembersQuery(group.Id);
    const [leaveGroup, { isLoading: isLeaving }] = useLeaveGroupMutation();
    const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
    const [showAddMembers, setShowAddMembers] = useState(false);

    const { user } = useAppSelector((state) => state.auth);
    const currentUserId = user?.id || parseInt(localStorage.getItem("userId") || "0");

    // Convert both to numbers for comparison
    const groupCreatorId = typeof group.created_by === 'string' ? parseInt(group.created_by) : group.created_by;
    const isCreator = groupCreatorId === currentUserId;

    console.log('GroupInfoModal Debug:', {
        currentUserId,
        groupCreatorId,
        'group.created_by': group.created_by,
        isCreator,
        'typeof group.created_by': typeof group.created_by,
        'typeof currentUserId': typeof currentUserId
    });

    const handleLeaveGroupClick = () => {
        if (isCreator) {
            toast.error("Group creator cannot leave. Delete the group instead.");
            return;
        }
        setShowLeaveConfirmation(true);
    };

    const handleConfirmLeave = async () => {
        try {
            await leaveGroup(group.Id).unwrap();
            toast.success("Left group successfully");
            setShowLeaveConfirmation(false);
            onClose();
        } catch (error) {
            toast.error("Failed to leave group");
            setShowLeaveConfirmation(false);
        }
    };

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg w-full max-w-md p-6 m-4 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Group Info</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg mb-4">
                        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0">
                            {group.Name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{group.Name}</h3>
                            <p className="text-sm text-gray-600">{members.length} members</p>
                            <p className="text-xs text-gray-500 mt-1">Created by {members[0]?.added_by_name || 'Unknown'}</p>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Members ({members.length})
                        </h4>
                        {isCreator ? (
                            <button
                                onClick={() => setShowAddMembers(true)}
                                className="text-sm px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add
                            </button>
                        ) : (
                            <div className="text-xs text-gray-500 italic">Only admin can add members</div>
                        )}
                    </div>
                    <div className="space-y-2">
                        {members.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">No members found</div>
                        ) : (
                            members.map((member: any) => {
                                const fullName = member.user_name || 'Unknown User';
                                const initial = fullName.charAt(0).toUpperCase() || 'U';
                                const isActive = member.is_active?.data?.[0] === 1 || member.is_active === 1;
                                const isCreator = member.UserId === group.created_by;

                                return (
                                    <div key={member.Id} className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors ${isCreator ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'}`}>
                                        <div className="relative flex-shrink-0">
                                            {member.user_image ? (
                                                <img src={member.user_image} alt={fullName} className="w-12 h-12 rounded-full object-cover" />
                                            ) : (
                                                <div className={`w-12 h-12 rounded-full ${isCreator ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'} flex items-center justify-center text-white text-sm font-semibold shadow-sm`}>
                                                    {initial}
                                                </div>
                                            )}
                                            {isActive && (
                                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                                            )}
                                            {isCreator && (
                                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center" title="Group Admin">
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="text-sm font-medium text-gray-900 truncate">{fullName}</div>
                                                {isCreator && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">{member.user_email}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">
                                                {isCreator ? 'Created' : 'Added'} {new Date(member.Added_on).toLocaleDateString()}
                                            </div>
                                        </div>
                                        {!isActive && (
                                            <span className="text-xs text-red-500 font-medium">Inactive</span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    {!isCreator && (
                        <button
                            onClick={handleLeaveGroupClick}
                            disabled={isLeaving}
                            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Leave Group
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className={`${isCreator ? 'w-full' : 'flex-1'} px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors`}
                    >
                        Close
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showLeaveConfirmation}
                onClose={() => setShowLeaveConfirmation(false)}
                onConfirm={handleConfirmLeave}
                title="Leave Group"
                message={`Are you sure you want to leave "${group.Name}"? You will no longer receive messages from this group.`}
                confirmText="Leave Group"
                cancelText="Cancel"
                isLoading={isLeaving}
            />

            {showAddMembers && (
                <AddMembersModal
                    group={group}
                    existingMembers={members}
                    onClose={() => setShowAddMembers(false)}
                />
            )}
        </div>
    );
}

// ============================================================================
// CREATE GROUP MODAL
// ============================================================================

interface CreateGroupModalProps {
    users: any[];
    onClose: () => void;
}

function CreateGroupModal({ users, onClose }: CreateGroupModalProps) {
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [createGroup, { isLoading }] = useCreateGroupMutation();

    const toggleUser = (userId: number) => {
        setSelectedUsers((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
    };

    const handleCreate = async () => {
        if (!groupName.trim()) {
            toast.error("Please enter a group name");
            return;
        }
        if (selectedUsers.length === 0) {
            toast.error("Please select at least one member");
            return;
        }

        try {
            await createGroup({ name: groupName.trim(), member_ids: selectedUsers }).unwrap();
            toast.success("Group created successfully");
            onClose();
        } catch (error) {
            toast.error("Failed to create group");
        }
    };

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg w-full max-w-md p-6 m-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Create Group</h2>
                <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Group Name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />
                <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Select Members ({selectedUsers.length})</div>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                        {users.map((user) => {
                            const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
                            const initial = fullName.charAt(0).toUpperCase() || 'U';
                            return (
                                <label key={user.user_id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                                    <input type="checkbox" checked={selectedUsers.includes(user.user_id)} onChange={() => toggleUser(user.user_id)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                    <div className="flex items-center gap-2 flex-1">
                                        {user.profileImage ? (
                                            <img src={user.profileImage} alt={fullName} className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">{initial}</div>
                                        )}
                                        <div className="text-sm font-medium text-gray-900 truncate">{fullName}</div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button onClick={handleCreate} disabled={isLoading} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
                        {isLoading ? "Creating..." : "Create"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// ADD MEMBERS MODAL
// ============================================================================

interface AddMembersModalProps {
    group: any;
    existingMembers: any[];
    onClose: () => void;
}

function AddMembersModal({ group, existingMembers, onClose }: AddMembersModalProps) {
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [addGroupMembers, { isLoading }] = useAddGroupMembersMutation();

    const { user } = useAppSelector((state) => state.auth);
    const partyId = user?.partyId;

    const { data: partyUsers = [] } = useGetPartyUsersQuery(
        { party_id: partyId, state_id: undefined, page: 1, limit: 100 },
        { skip: !partyId }
    );

    // Filter out existing members and current user
    const existingMemberIds = existingMembers.map(m => m.UserId);
    const availableUsers = partyUsers.filter((u) => {
        if ((u as any).isSuperAdmin === 1) return false;
        if (existingMemberIds.includes(u.user_id)) return false;
        const fullName = u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim();
        return fullName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const toggleUser = (userId: number) => {
        setSelectedUsers((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
    };

    const handleAdd = async () => {
        if (selectedUsers.length === 0) {
            toast.error("Please select at least one member");
            return;
        }

        try {
            await addGroupMembers({ groupId: group.Id, member_ids: selectedUsers }).unwrap();
            toast.success(`Added ${selectedUsers.length} member(s) successfully`);
            onClose();
        } catch (error) {
            toast.error("Failed to add members");
        }
    };

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-[60]" onClick={onClose}>
            <div className="bg-white rounded-lg w-full max-w-md p-6 m-4 shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Add Members to {group.Name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />

                <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                        Select Members ({selectedUsers.length} selected)
                    </div>
                    <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                        {availableUsers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                {searchQuery ? "No users found" : "All party members are already in this group"}
                            </div>
                        ) : (
                            availableUsers.map((user) => {
                                const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
                                const initial = fullName.charAt(0).toUpperCase() || 'U';
                                return (
                                    <label key={user.user_id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(user.user_id)}
                                            onChange={() => toggleUser(user.user_id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <div className="flex items-center gap-2 flex-1">
                                            {user.profileImage ? (
                                                <img src={user.profileImage} alt={fullName} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">{initial}</div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate">{fullName}</div>
                                                <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                            </div>
                                        </div>
                                    </label>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        disabled={isLoading || selectedUsers.length === 0}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Adding..." : `Add ${selectedUsers.length > 0 ? `(${selectedUsers.length})` : ""}`}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// CHAT POPUP WINDOW
// ============================================================================

interface ChatPopupProps {
    chat: any;
    onClose: () => void;
    position: number;
}

function ChatPopup({ chat, onClose, position }: ChatPopupProps) {
    const [message, setMessage] = useState("");
    const [isMinimized, setIsMinimized] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const markedAsReadRef = useRef<Set<number | string>>(new Set());

    const isGroup = chat.type === "group";

    // Get current user ID early so it can be used in effects
    const currentUserId = useMemo(() => {
        // Try direct userId first
        let userId = localStorage.getItem("userId");
        if (userId) return parseInt(userId);

        // Try from auth_state
        try {
            const authState = localStorage.getItem("auth_state");
            if (authState) {
                const parsed = JSON.parse(authState);
                if (parsed.user?.id) return parseInt(parsed.user.id);
                if (parsed.userId) return parseInt(parsed.userId);
                if (parsed.id) return parseInt(parsed.id);
            }
        } catch (e) {
            console.error("Error parsing auth_state:", e);
        }

        return 0;
    }, []);

    const { data: directMessages = [] } = useGetDirectConversationQuery(
        { other_user_id: chat.id },
        {
            skip: isGroup || !chat.id,
            pollingInterval: 3000, // Poll every 3 seconds as backup
            refetchOnMountOrArgChange: true
        }
    );

    const { data: groupMessages = [] } = useGetGroupConversationQuery(
        { group_id: chat.id },
        {
            skip: !isGroup || !chat.id,
            pollingInterval: 3000, // Poll every 3 seconds as backup
            refetchOnMountOrArgChange: true
        }
    );

    const [sendDirectMessage] = useSendDirectMessageMutation();
    const [sendGroupMessage] = useSendGroupMessageMutation();
    const [markDirectMessageAsRead] = useMarkDirectMessageAsReadMutation();
    const [markGroupMessageAsRead] = useMarkGroupMessageAsReadMutation();
    const [localMessages, setLocalMessages] = useState<any[]>([]);

    useEffect(() => {
        setLocalMessages([]);
        markedAsReadRef.current.clear(); // Clear marked messages when chat changes
    }, [chat.id, chat.type]);

    const messages = useMemo(() => {
        const apiMessages = isGroup ? groupMessages : directMessages;
        const allMessages = [...apiMessages, ...localMessages];

        // Remove duplicates based on message ID
        const uniqueMessages = allMessages.filter((msg, index, self) => {
            const msgId = msg.chat_id || msg.Id;
            return index === self.findIndex((m) => (m.chat_id || m.Id) === msgId);
        });

        // Sort by created_at timestamp
        return uniqueMessages.sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
    }, [directMessages, groupMessages, localMessages, isGroup]);

    useEffect(() => {
        console.log('[ChatPopup] Socket connected:', socketService.isConnected());

        const handleNewMessage = (newMessage: any) => {
            console.log('[ChatPopup] Received socket message:', newMessage, 'for chat:', chat.id);
            const currentUserId = parseInt(localStorage.getItem("userId") || "0");

            if (isGroup) {
                // Group message
                if (newMessage.GroupId === chat.id) {
                    console.log('[ChatPopup] Adding group message to local state');
                    setLocalMessages((prev) => {
                        const msgId = newMessage.chat_id || newMessage.Id;
                        const exists = prev.some((msg) => (msg.chat_id || msg.Id) === msgId);
                        if (exists) {
                            console.log('[ChatPopup] Message already exists, skipping');
                            return prev;
                        }
                        console.log('[ChatPopup] Adding new message');
                        return [...prev, newMessage];
                    });
                }
            } else {
                // Direct message
                if ((newMessage.sender_id === chat.id && newMessage.receiver_id === currentUserId) || (newMessage.sender_id === currentUserId && newMessage.receiver_id === chat.id)) {
                    console.log('[ChatPopup] Adding direct message to local state');
                    setLocalMessages((prev) => {
                        const msgId = newMessage.chat_id || newMessage.Id;
                        const exists = prev.some((msg) => (msg.chat_id || msg.Id) === msgId);
                        if (exists) {
                            console.log('[ChatPopup] Message already exists, skipping');
                            return prev;
                        }
                        console.log('[ChatPopup] Adding new message');
                        return [...prev, newMessage];
                    });
                }
            }
        };

        const handleMessageRead = (data: any) => {
            // Update message read status in real-time
            if (isGroup) {
                if (data.message_id) {
                    setLocalMessages((prev) =>
                        prev.map((msg) =>
                            (msg.Id === data.message_id)
                                ? { ...msg, read_at: data.read_at }
                                : msg
                        )
                    );
                }
            } else {
                if (data.chat_id) {
                    setLocalMessages((prev) =>
                        prev.map((msg) =>
                            (msg.chat_id === data.chat_id)
                                ? { ...msg, read_at: data.read_at }
                                : msg
                        )
                    );
                }
            }
        };

        const handleLeftGroup = (data: any) => {
            // If current user left this group, close the chat
            if (isGroup && data.group_id === chat.id) {
                toast(`You left ${chat.name}`);
                onClose();
            }
        };

        const handleMemberLeftGroup = (data: any) => {
            // If someone else left the group, show notification
            if (isGroup && data.group_id === chat.id && data.user_id !== currentUserId) {
                // Optionally show a notification that someone left
                // toast.info(`A member left ${chat.name}`);
            }
        };

        const eventName = isGroup ? "new_group_message" : "new_direct_message";
        const sentEventName = "message_sent"; // For messages you send
        const readEventName = isGroup ? "group_message_read" : "message_read";

        socketService.on(eventName, handleNewMessage);
        socketService.on(sentEventName, handleNewMessage); // Also listen for your own sent messages
        socketService.on(readEventName, handleMessageRead);
        socketService.on("left_group", handleLeftGroup);
        socketService.on("member_left_group", handleMemberLeftGroup);

        return () => {
            socketService.off(eventName, handleNewMessage);
            socketService.off(sentEventName, handleNewMessage);
            socketService.off(readEventName, handleMessageRead);
            socketService.off("left_group", handleLeftGroup);
            socketService.off("member_left_group", handleMemberLeftGroup);
        };
    }, [chat.id, chat.type, isGroup, chat.name, onClose, currentUserId]);

    useEffect(() => {
        if (!isMinimized) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isMinimized]);

    // Mark messages as read when chat is opened and not minimized
    useEffect(() => {
        if (!isMinimized && messages.length > 0) {
            const currentUserId = parseInt(localStorage.getItem("userId") || "0");
            const unreadMessages = messages.filter(msg => {
                const messageId = msg.chat_id || msg.Id;
                return msg.sender_id !== currentUserId &&
                    !msg.read_at &&
                    messageId &&
                    !markedAsReadRef.current.has(messageId);
            });

            if (unreadMessages.length > 0) {
                unreadMessages.forEach(async (msg) => {
                    const messageId = msg.chat_id || msg.Id;
                    if (!messageId) return;

                    // Mark as being processed to prevent duplicate calls
                    markedAsReadRef.current.add(messageId);

                    try {
                        if (isGroup) {
                            if (msg.Id) await markGroupMessageAsRead(msg.Id);
                        } else {
                            if (msg.chat_id) await markDirectMessageAsRead(msg.chat_id);
                        }
                    } catch (error) {
                        console.error("Failed to mark message as read:", error);
                        // Remove from set if failed so it can be retried
                        markedAsReadRef.current.delete(messageId);
                    }
                });
            }
        }
    }, [messages, isMinimized, isGroup, markDirectMessageAsRead, markGroupMessageAsRead]);

    // Handle typing indicator
    const handleTyping = () => {
        if (typingTimeout) {
            window.clearTimeout(typingTimeout);
        }

        // Emit typing event
        socketService.emit(isGroup ? "group_typing" : "typing", {
            [isGroup ? "group_id" : "receiver_id"]: chat.id
        });

        const timeout = window.setTimeout(() => {
            socketService.emit(isGroup ? "group_stop_typing" : "stop_typing", {
                [isGroup ? "group_id" : "receiver_id"]: chat.id
            });
        }, 3000);

        setTypingTimeout(timeout);
    };

    // Listen for typing events
    useEffect(() => {
        const handleTypingEvent = (data: any) => {
            const currentUserId = parseInt(localStorage.getItem("userId") || "0");
            if (isGroup) {
                if (data.group_id === chat.id && data.user_id !== currentUserId) {
                    setIsTyping(true);
                }
            } else {
                if (data.sender_id === chat.id) {
                    setIsTyping(true);
                }
            }
        };

        const handleStopTypingEvent = (data: any) => {
            if (isGroup) {
                if (data.group_id === chat.id) {
                    setIsTyping(false);
                }
            } else {
                if (data.sender_id === chat.id) {
                    setIsTyping(false);
                }
            }
        };

        socketService.on(isGroup ? "group_typing" : "typing", handleTypingEvent);
        socketService.on(isGroup ? "group_stop_typing" : "stop_typing", handleStopTypingEvent);

        return () => {
            socketService.off(isGroup ? "group_typing" : "typing", handleTypingEvent);
            socketService.off(isGroup ? "group_stop_typing" : "stop_typing", handleStopTypingEvent);
        };
    }, [chat.id, isGroup]);

    const handleSend = async () => {
        if (!message.trim() && selectedFiles.length === 0) return;

        const messageText = message.trim() || "Sent files";
        const tempId = `temp-${Date.now()}`;

        // Optimistic update - show message immediately
        const optimisticMessage = {
            [isGroup ? 'Id' : 'chat_id']: tempId,
            sender_id: currentUserId,
            [isGroup ? 'GroupId' : 'receiver_id']: chat.id,
            message: messageText,
            message_type: selectedFiles.length > 0 ? "file" : "text",
            files: selectedFiles.length > 0 ? selectedFiles.map(f => ({
                url: URL.createObjectURL(f),
                name: f.name,
                size: f.size,
                type: f.type
            })) : null,
            read_at: null,
            isDelete: 0,
            created_at: new Date().toISOString(),
            sender_name: "You",
            sender_email: "",
            sender_image: null,
            _optimistic: true
        };

        setLocalMessages(prev => [...prev, optimisticMessage]);

        // Clear input immediately
        const messageCopy = message;
        const filesCopy = [...selectedFiles];
        setMessage("");
        setSelectedFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        try {
            await (isGroup
                ? sendGroupMessage({
                    group_id: chat.id,
                    message: messageText,
                    files: filesCopy.length > 0 ? filesCopy : undefined
                }).unwrap()
                : sendDirectMessage({
                    receiver_id: chat.id,
                    message: messageText,
                    files: filesCopy.length > 0 ? filesCopy : undefined
                }).unwrap()
            );

            // Remove optimistic message and let the real one come through socket
            setLocalMessages(prev => prev.filter(msg =>
                (msg.chat_id || msg.Id) !== tempId
            ));
        } catch (error) {
            console.error("Failed to send message:", error);
            // Remove optimistic message on error
            setLocalMessages(prev => prev.filter(msg =>
                (msg.chat_id || msg.Id) !== tempId
            ));
            // Restore the message
            setMessage(messageCopy);
            setSelectedFiles(filesCopy);
            toast.error("Failed to send message");
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            setSelectedFiles(Array.from(files));
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const positionStyle = useMemo(() => {
        if (typeof window === 'undefined') return { right: '300px', bottom: '0px' };
        const isMobile = window.innerWidth < 640;
        const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;
        if (isMobile) return { right: '0px', bottom: position === 0 ? '60px' : '520px' };
        if (isTablet) return { right: `${320 + (position * 280)}px`, bottom: '0px' };
        return { right: `${300 + (position * 330)}px`, bottom: '0px' };
    }, [position]);

    return (
        <>
            <div className="fixed w-full sm:w-72 md:w-80 bg-white rounded-t-lg shadow-2xl border border-gray-200 flex flex-col z-50" style={{ ...positionStyle, height: isMinimized ? "56px" : "450px", maxHeight: isMinimized ? "56px" : "80vh" }}>
                <div className={`${isGroup ? "bg-green-600" : "bg-blue-600"} text-white p-3 rounded-t-lg flex items-center justify-between`}>
                    <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
                        {chat.image ? (
                            <img src={chat.image} alt={chat.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                            <div className={`w-8 h-8 rounded-full bg-white ${isGroup ? "text-green-600" : "text-blue-600"} flex items-center justify-center text-sm font-semibold`}>{chat.name.charAt(0).toUpperCase()}</div>
                        )}
                        <div className="flex-1 min-w-0">
                            <span className="font-medium truncate block">{chat.name}</span>
                            {isGroup && chat.group && (
                                <span className="text-xs opacity-90">{chat.group.member_count} members</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {isGroup && (
                            <button onClick={(e) => { e.stopPropagation(); setShowGroupInfo(true); }} className={`${isGroup ? "hover:bg-green-700" : "hover:bg-blue-700"} p-1 rounded`} title="Group Info">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className={`${isGroup ? "hover:bg-green-700" : "hover:bg-blue-700"} p-1 rounded`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMinimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                            </svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className={`${isGroup ? "hover:bg-green-700" : "hover:bg-blue-700"} p-1 rounded`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                {!isMinimized && (
                    <>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
                            {messages.map((msg) => (
                                <MessageBubble key={msg.chat_id || msg.Id} message={msg} isOwn={msg.sender_id === currentUserId} showSender={isGroup} />
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-200 px-4 py-2 rounded-lg">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-3 border-t border-gray-200 bg-white">
                            {selectedFiles.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-2">
                                    {selectedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                                            <span className="truncate max-w-[100px]">{file.name}</span>
                                            <button onClick={() => removeFile(idx)} className="text-gray-500 hover:text-red-500">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg" title="Attach files">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                </button>
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => {
                                        setMessage(e.target.value);
                                        handleTyping();
                                    }}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Type a message..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                <button onClick={handleSend} disabled={!message.trim() && selectedFiles.length === 0} className={`p-2 ${isGroup ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {showGroupInfo && isGroup && chat.group && (
                <GroupInfoModal group={chat.group} onClose={() => setShowGroupInfo(false)} />
            )}
        </>
    );
}

// ============================================================================
// CHAT CONTAINER
// ============================================================================

interface ChatContainerProps {
    chats: any[];
    onClose: (chatId: number) => void;
}

function ChatContainer({ chats, onClose }: ChatContainerProps) {
    if (chats.length === 0) return null;
    const visibleChats = chats.slice(0, 2);
    return (
        <>
            {visibleChats.map((chat, index) => (
                <ChatPopup key={`${chat.type}-${chat.id}`} chat={chat} onClose={() => onClose(chat.id)} position={index} />
            ))}
        </>
    );
}

// ============================================================================
// CHAT USERS LIST
// ============================================================================

interface ChatUsersListProps {
    onSelectUser: (user: any) => void;
    openChats: any[];
}

export function ChatUsersList({ onSelectUser, openChats }: ChatUsersListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [activeTab, setActiveTab] = useState<"recent" | "users" | "groups">("recent");

    const { user } = useAppSelector((state) => state.auth);
    const partyId = user?.partyId;
    const currentUserId = user?.id;

    const { data: partyUsers = [] } = useGetPartyUsersQuery(
        { party_id: partyId, state_id: undefined, page: 1, limit: 100 },
        { skip: !partyId }
    );

    const { data: userGroups = [] } = useGetUserGroupsQuery();
    const { data: recentChats = [], refetch: refetchRecentChats } = useGetRecentChatsQuery(undefined, {
        pollingInterval: 10000, // Poll every 10 seconds (reduced from 3)
        refetchOnMountOrArgChange: true,
    });
    const { data: unreadCount, refetch: refetchUnreadCount } = useGetUnreadCountQuery(undefined, {
        pollingInterval: 10000, // Poll every 10 seconds (reduced from 3)
        refetchOnMountOrArgChange: true,
    });

    // Listen for new messages to update recent chats (with debouncing)
    useEffect(() => {
        let refetchTimeout: NodeJS.Timeout | null = null;

        const handleNewMessage = () => {
            // Debounce refetch to avoid multiple rapid calls
            if (refetchTimeout) {
                clearTimeout(refetchTimeout);
            }
            refetchTimeout = setTimeout(() => {
                refetchRecentChats();
                refetchUnreadCount();
            }, 500); // Wait 500ms before refetching
        };

        socketService.on("new_direct_message", handleNewMessage);
        socketService.on("new_group_message", handleNewMessage);
        socketService.on("message_read", handleNewMessage);
        socketService.on("group_message_read", handleNewMessage);
        socketService.on("member_left_group", handleNewMessage);
        socketService.on("left_group", handleNewMessage);
        socketService.on("added_to_group", handleNewMessage);
        socketService.on("members_added", handleNewMessage);

        return () => {
            if (refetchTimeout) {
                clearTimeout(refetchTimeout);
            }
            socketService.off("new_direct_message", handleNewMessage);
            socketService.off("new_group_message", handleNewMessage);
            socketService.off("message_read", handleNewMessage);
            socketService.off("group_message_read", handleNewMessage);
            socketService.off("member_left_group", handleNewMessage);
            socketService.off("left_group", handleNewMessage);
            socketService.off("added_to_group", handleNewMessage);
            socketService.off("members_added", handleNewMessage);
        };
    }, [refetchRecentChats, refetchUnreadCount]);

    const filteredUsers = partyUsers.filter((u) => {
        if ((u as any).isSuperAdmin === 1) return false;
        if (u.user_id === currentUserId) return false;
        const fullName = u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim();
        return fullName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const filteredGroups = userGroups.filter((g) => {
        return g.Name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Deduplicate recent chats - keep only the most recent message per chat
    const deduplicatedChats = useMemo(() => {
        const chatMap = new Map();

        recentChats.forEach((chat) => {
            const key = chat.chat_type === "group"
                ? `group-${chat.group_id}`
                : `direct-${chat.other_user_id}`;

            // If this chat doesn't exist yet, or if this message is more recent, update it
            if (!chatMap.has(key)) {
                chatMap.set(key, chat);
            } else {
                const existing = chatMap.get(key);
                const existingTime = new Date(existing.last_message_time).getTime();
                const newTime = new Date(chat.last_message_time).getTime();

                if (newTime > existingTime) {
                    chatMap.set(key, chat);
                }
            }
        });

        // Convert map back to array and sort by most recent
        return Array.from(chatMap.values()).sort((a, b) => {
            const timeA = new Date(a.last_message_time).getTime();
            const timeB = new Date(b.last_message_time).getTime();
            return timeB - timeA; // Most recent first
        });
    }, [recentChats]);

    const filteredRecentChats = deduplicatedChats.filter((chat) => {
        return chat.chat_name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <>
            <div className="fixed bottom-0 right-0 w-full sm:w-80 md:w-72 bg-white shadow-2xl border-l border-t border-gray-200 flex flex-col z-40 max-h-[80vh] sm:max-h-[500px]">
                <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="font-semibold text-gray-800">Messaging</span>
                    </div>
                    <svg className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
                {isExpanded && (
                    <>
                        <div className="p-3 border-b border-gray-200 space-y-2">
                            <input type="text" placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            <button onClick={(e) => { e.stopPropagation(); setShowCreateGroup(true); }} className="w-full px-3 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Create Group
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200">
                            <button onClick={() => { setActiveTab("recent"); setSearchQuery(""); }} className={`flex-1 px-3 py-2 text-xs font-medium relative ${activeTab === "recent" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
                                Chats
                                {unreadCount && unreadCount.total_unread > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {unreadCount.total_unread > 99 ? "99+" : unreadCount.total_unread}
                                    </span>
                                )}
                            </button>
                            <button onClick={() => { setActiveTab("users"); setSearchQuery(""); }} className={`flex-1 px-3 py-2 text-xs font-medium ${activeTab === "users" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
                                Users
                            </button>
                            <button onClick={() => { setActiveTab("groups"); setSearchQuery(""); }} className={`flex-1 px-3 py-2 text-xs font-medium ${activeTab === "groups" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"}`}>
                                Groups
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto" style={{ maxHeight: "400px" }}>
                            {activeTab === "recent" ? (
                                filteredRecentChats.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">No recent chats</div>
                                ) : (
                                    filteredRecentChats.map((chat) => {
                                        const initial = chat.chat_name.charAt(0).toUpperCase() || "C";
                                        const isGroup = chat.chat_type === "group";
                                        const chatId = isGroup ? chat.group_id : chat.other_user_id;
                                        const isOpen = openChats.some((c) => c.type === chat.chat_type && c.id === chatId);
                                        // Handle has_unread as number, boolean, or string
                                        const hasUnread = chat.has_unread === 1 || chat.has_unread === true || chat.has_unread === "1";

                                        const formatTime = (timestamp: string) => {
                                            const date = new Date(timestamp);
                                            const now = new Date();
                                            const diffMs = now.getTime() - date.getTime();
                                            const diffMins = Math.floor(diffMs / 60000);
                                            const diffHours = Math.floor(diffMs / 3600000);
                                            const diffDays = Math.floor(diffMs / 86400000);

                                            if (diffMins < 1) return "Just now";
                                            if (diffMins < 60) return `${diffMins}m`;
                                            if (diffHours < 24) return `${diffHours}h`;
                                            if (diffDays < 7) return `${diffDays}d`;
                                            return date.toLocaleDateString();
                                        };

                                        const handleClick = () => {
                                            if (isGroup) {
                                                const group = userGroups.find(g => g.Id === chat.group_id);
                                                if (group) {
                                                    onSelectUser({ ...group, type: "group" });
                                                }
                                            } else {
                                                const user = partyUsers.find(u => u.user_id === chat.other_user_id);
                                                if (user) {
                                                    onSelectUser(user);
                                                }
                                            }
                                        };

                                        return (
                                            <div
                                                key={`${chat.chat_type}-${chatId}`}
                                                onClick={handleClick}
                                                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${isOpen ? "bg-blue-50" : ""} ${hasUnread ? "bg-green-50" : ""}`}
                                            >
                                                <div className="relative flex-shrink-0">
                                                    {chat.chat_image ? (
                                                        <img src={chat.chat_image} alt={chat.chat_name} className="w-12 h-12 rounded-full object-cover" />
                                                    ) : (
                                                        <div className={`w-12 h-12 rounded-full ${isGroup ? "bg-green-500" : "bg-blue-500"} flex items-center justify-center text-white text-sm font-semibold`}>
                                                            {initial}
                                                        </div>
                                                    )}
                                                    {hasUnread && (
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                                            <span className="text-white text-xs font-bold">•</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className={`text-sm truncate ${hasUnread ? "font-bold text-gray-900" : "font-medium text-gray-900"}`}>
                                                            {chat.chat_name}
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                                            <div className="text-xs text-gray-500">
                                                                {formatTime(chat.last_message_time)}
                                                            </div>
                                                            {hasUnread && (
                                                                <div className="bg-green-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-bold">
                                                                    {chat.unread_count || "1"}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className={`text-xs truncate flex-1 ${hasUnread ? "font-semibold text-gray-700" : "text-gray-500"}`}>
                                                            {chat.last_message_type !== "text" && (
                                                                <span className="mr-1">
                                                                    {chat.last_message_type === "image" && "📷"}
                                                                    {chat.last_message_type === "video" && "🎥"}
                                                                    {chat.last_message_type === "audio" && "🎵"}
                                                                    {chat.last_message_type === "document" && "📄"}
                                                                    {chat.last_message_type === "file" && "📎"}
                                                                </span>
                                                            )}
                                                            {chat.last_message}
                                                        </div>
                                                        {!hasUnread && chat.read_at && (
                                                            <div className="flex-shrink-0">
                                                                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                                                    <path d="M12.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-1-1a1 1 0 011.414-1.414l.293.293 7.293-7.293a1 1 0 011.414 0z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            ) : activeTab === "users" ? (
                                filteredUsers.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">No users found</div>
                                ) : (
                                    filteredUsers.map((u) => {
                                        const fullName = u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim();
                                        const initial = fullName.charAt(0).toUpperCase() || "U";
                                        const isOpen = openChats.some((chat) => chat.type === "direct" && chat.id === u.user_id);
                                        return (
                                            <div key={u.user_id} onClick={() => onSelectUser(u)} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${isOpen ? "bg-blue-50" : ""}`}>
                                                <div className="relative">
                                                    {u.profileImage ? (
                                                        <img src={u.profileImage} alt={fullName} className="w-10 h-10 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">{initial}</div>
                                                    )}
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 text-sm truncate">{fullName}</div>
                                                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            ) : (
                                filteredGroups.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500 text-sm">No groups found</div>
                                ) : (
                                    filteredGroups.map((g) => {
                                        const initial = g.Name.charAt(0).toUpperCase() || "G";
                                        const isOpen = openChats.some((chat) => chat.type === "group" && chat.id === g.Id);
                                        return (
                                            <div key={g.Id} onClick={() => onSelectUser({ ...g, type: "group" })} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${isOpen ? "bg-blue-50" : ""}`}>
                                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-semibold">{initial}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 text-sm truncate">{g.Name}</div>
                                                    <div className="text-xs text-gray-500 truncate">{g.member_count} members</div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )
                            )}
                        </div>
                    </>
                )}
            </div>
            {showCreateGroup && <CreateGroupModal users={filteredUsers} onClose={() => setShowCreateGroup(false)} />}
        </>
    );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export { ChatContainer };
