import { useState, useEffect } from "react";
import { ChatUsersList, ChatContainer } from "./Chat";
import { socketService } from "../services/socketService";
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

export default function GlobalChat() {
    const [openChats, setOpenChats] = useState<any[]>([]);
    const [chatModalOpen, setChatModalOpen] = useState(false);

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
        <>
            {/* Chat container - only 2 windows */}
            <ChatContainer chats={openChats} onClose={handleCloseChat} />

            {/* Users list - Modal on mobile, fixed on desktop */}
            {chatModalOpen && (
                // Mobile Modal View
                <div className="fixed inset-0 z-40 lg:hidden bg-black/50" onClick={() => setChatModalOpen(false)}>
                    <div 
                        className="absolute inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-3 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
                            <button
                                onClick={() => setChatModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <ChatUsersList onSelectUser={handleSelectUser} openChats={openChats} isMobileModal={true} />
                    </div>
                </div>
            )}

            {/* Floating Chat Button - Bottom Right on Mobile */}
            <button
                onClick={() => setChatModalOpen(true)}
                className="fixed bottom-6 right-6 z-30 lg:hidden inline-flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:shadow-xl"
                aria-label="Open chats"
            >
                <svg
                    className="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            </button>

            {/* Desktop Fixed View */}
            <div className="hidden lg:block">
                <ChatUsersList onSelectUser={handleSelectUser} openChats={openChats} />
            </div>
        </>
    );
}
