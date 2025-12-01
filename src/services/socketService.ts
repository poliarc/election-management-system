import { io, Socket } from "socket.io-client";

const SOCKET_URL = `${import.meta.env.VITE_API_BASE_URL}`;

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<Function>> = new Map();

    connect(token: string) {
        if (this.socket?.connected) return;

        if (!token) {
            console.warn("Cannot connect socket: No token provided");
            return;
        }

        try {
            this.socket = io(SOCKET_URL, {
                auth: { token },
                transports: ["polling", "websocket"], // Try polling first, then websocket
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
            });

            this.socket.on("connect", () => {
                console.log("Socket connected:", this.socket?.id);
            });

            this.socket.on("disconnect", (reason) => {
                console.log("Socket disconnected:", reason);
            });

            this.socket.on("connect_error", (error) => {
                console.warn("Socket connection error:", error.message);
                // Silently handle connection errors - likely auth issues
                if (error.message.includes("User not found") || error.message.includes("Session ID unknown")) {
                    // Backend authentication issue - disconnect and don't retry
                    this.disconnect();
                }
            });

            // Setup all event listeners
            this.setupEventListeners();
        } catch (error) {
            console.error("Failed to initialize socket:", error);
        }
    }

    private setupEventListeners() {
        if (!this.socket) return;

        const events = [
            "new_direct_message",
            "message_sent",
            "message_read",
            "message_deleted",
            "group_created",
            "added_to_group",
            "members_added",
            "removed_from_group",
            "member_removed",
            "member_left_group",
            "left_group",
            "group_deleted",
            "new_group_message",
            "group_message_read",
            "group_message_deleted",
            "typing",
            "stop_typing",
            "group_typing",
            "group_stop_typing",
        ];

        events.forEach((event) => {
            this.socket?.on(event, (data) => {
                const callbacks = this.listeners.get(event);
                if (callbacks) {
                    callbacks.forEach((callback) => callback(data));
                }
            });
        });
    }

    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)?.add(callback);
    }

    off(event: string, callback: Function) {
        this.listeners.get(event)?.delete(callback);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.listeners.clear();
        }
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    emit(event: string, data: any) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        }
    }
}

export const socketService = new SocketService();
