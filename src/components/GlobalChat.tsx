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

            {/* Users list (fixed bottom-right) */}
            <ChatUsersList onSelectUser={handleSelectUser} openChats={openChats} />
        </>
    );
}
