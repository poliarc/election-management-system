import { useState, useEffect } from "react";
import { ChatUsersList, ChatContainer } from "../../components/Chat";
import { socketService } from "../../services/socketService";
import toast from "react-hot-toast";

// Get auth token from localStorage
function getAuthToken(): string | null {
    try {
        const authState = localStorage.getItem("auth_state");
        if (!authState) return null;
        const parsed = JSON.parse(authState);
        return parsed.accessToken || null;
    } catch {
        return null;
    }
}

export default function ChatPage() {
    const [openChats, setOpenChats] = useState<any[]>([]);

    useEffect(() => {
        const token = getAuthToken();
        if (token) {
            const timer = setTimeout(() => {
                socketService.connect(token);
            }, 500);

            return () => {
                clearTimeout(timer);
                socketService.disconnect();
            };
        }
    }, []);

    const handleSelectUser = (item: any) => {
        // Check if it's a group or user
        const isGroup = item.type === "group" || item.Id !== undefined;

        let chatId, chatName, chatType, chatImage;

        if (isGroup) {
            chatId = item.Id;
            chatName = item.Name;
            chatType = "group";
            chatImage = null;
        } else {
            chatId = item.user_id;
            chatName = item.full_name || `${item.first_name || ""} ${item.last_name || ""}`.trim();
            chatType = "direct";
            chatImage = item.profileImage;
        }

        // Check if chat is already open
        const existingChat = openChats.find((chat) => chat.type === chatType && chat.id === chatId);
        if (existingChat) {
            return; // Chat already open
        }

        // Limit to max 2 chats open
        if (openChats.length >= 2) {
            toast.error("Maximum 2 chats can be open at once. Please close one to open another.");
            return;
        }

        // Add new chat
        const newChat = {
            type: chatType,
            id: chatId,
            name: chatName,
            image: chatImage,
            group: isGroup ? item : undefined,
            user: !isGroup ? item : undefined,
        };

        setOpenChats((prev) => [...prev, newChat]);
    };

    const handleCloseChat = (chatId: number) => {
        setOpenChats((prev) => prev.filter((chat) => chat.id !== chatId));
    };

    return (
        <div className="h-screen bg-gray-50 relative overflow-hidden">
            {/* Main content area */}
            <div className="flex items-center justify-center h-full px-4">
                <div className="text-center max-w-md">
                    <svg
                        className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto text-gray-300 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
                        Click on Messaging to start a conversation
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500">
                        Select a user from the list to open a chat window (max 2 chats)
                    </p>
                </div>
            </div>

            {/* Chat container - only 2 windows */}
            <ChatContainer chats={openChats} onClose={handleCloseChat} />

            {/* Users list (fixed bottom-right) */}
            <ChatUsersList onSelectUser={handleSelectUser} openChats={openChats} />
        </div>
    );
}
