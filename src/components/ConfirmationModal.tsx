import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "warning" | "info";
    isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "danger",
    isLoading = false,
}) => {
    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case "danger":
                return {
                    iconColor: "text-red-600",
                    iconBg: "bg-red-100",
                    confirmButton: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
                };
            case "warning":
                return {
                    iconColor: "text-yellow-600",
                    iconBg: "bg-yellow-100",
                    confirmButton: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
                };
            case "info":
                return {
                    iconColor: "text-blue-600",
                    iconBg: "bg-blue-100",
                    confirmButton: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
                };
            default:
                return {
                    iconColor: "text-red-600",
                    iconBg: "bg-red-100",
                    confirmButton: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
                };
        }
    };

    const styles = getTypeStyles();

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            onClick={handleBackdropClick}
        >
            {/* Enhanced Backdrop with stronger blur */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-all duration-300" />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-300 scale-100">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                        disabled={isLoading}
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="p-6">
                        {/* Icon */}
                        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${styles.iconBg} mb-4`}>
                            <AlertTriangle className={`h-6 w-6 ${styles.iconColor}`} />
                        </div>

                        {/* Content */}
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                {message}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${styles.confirmButton}`}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Processing...</span>
                                    </div>
                                ) : (
                                    confirmText
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Export both as named and default export for compatibility
export { ConfirmationModal };
export default ConfirmationModal;