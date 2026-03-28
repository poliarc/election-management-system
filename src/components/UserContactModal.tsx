import React from "react";
import { X, Mail, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UserContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    first_name: string;
    last_name: string;
    email: string;
    contact_no: string;
  } | null;
}

export const UserContactModal: React.FC<UserContactModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!isOpen || !user) return null;
  const {t} = useTranslation();
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown User";
  const email = user.email || "";
  const phone = user.contact_no || "";

  return (
    <div 
      className="fixed inset-0 bg-backdrop-blur-sm bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-[var(--bg-card)] rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-color)]">
              {t("UserContact.Title")}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Name */}
          <div className="mb-4">
            <h4 className="text-xl font-medium text-[var(--text-color)] mb-3">
              {fullName}
            </h4>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            {/* Email */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">{t("UserContact.Email")}</p>
                <p className="text-sm text-[var(--text-color)]">
                  {email || "Not provided"}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Phone className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">{t("UserContact.Phone")}</p>
                <p className="text-sm text-[var(--text-color)]">
                  {phone || "Not provided"}
                </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-[var(--text-secondary)] rounded-md hover:bg-[var(--text-color)]/5 transition-colors"
            >
              {t("UserContact.Close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


