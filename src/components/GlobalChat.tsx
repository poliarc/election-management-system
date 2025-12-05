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
    const [isChatButtonHidden, setIsChatButtonHidden] = useState(false);

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

            {/* Desktop Modal View */}
            {chatModalOpen && (
                <div className="hidden lg:block fixed inset-0 z-40 bg-black/30" onClick={() => setChatModalOpen(false)}>
                    <div 
                        className="absolute bottom-0 right-0 w-96 bg-white shadow-2xl flex flex-col rounded-tl-lg"
                        style={{ maxHeight: '600px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white rounded-tl-lg">
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

            {/* Floating Chat Buttons - Bottom Right (All Screens) */}
            <>
                {/* Hide/Unhide Toggle Button - Fixed at right edge */}
                <button
                    onClick={() => setIsChatButtonHidden(!isChatButtonHidden)}
                    className="fixed bottom-6 right-1 z-30 inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-110"
                    aria-label={isChatButtonHidden ? "Show chat button" : "Hide chat button"}
                    title={isChatButtonHidden ? "Show chat" : "Hide chat"}
                >
                    <svg
                        className={`h-5 w-5 transition-transform duration-300 ${isChatButtonHidden ? 'rotate-180' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* Main Chat Button - Slides in/out to the left of toggle button */}
                <div
                    className={`fixed bottom-6 right-14 z-30 transition-all duration-300 ease-in-out ${
                        isChatButtonHidden 
                            ? 'translate-x-24 opacity-0' 
                            : 'translate-x-0 opacity-100'
                    }`}
                >
                    <button
                        onClick={() => setChatModalOpen(true)}
                        className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-110"
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
                </div>
            </>
        </>
    );
}
