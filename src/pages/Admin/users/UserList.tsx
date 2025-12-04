import React, { useState } from "react";
import {
  Edit,

  Users,
  Phone,
  Mail,
  Shield,
  //   Calendar,
  ToggleRight,
  ToggleLeft,
  MoreHorizontal,
} from "lucide-react";
import type { User } from "../../../types/user";

interface UserListProps {
  users: User[];
  isLoading?: boolean;
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
  onToggleStatus: (userId: number, isActive: boolean) => void;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  isLoading = false,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [openUserId, setOpenUserId] = useState<number | null>(null);
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Party & Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State & District
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th> */}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="shrink-0 h-10 w-10 bg-gray-200 rounded-full"></div>
                      <div className="ml-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-40"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                      <div className="h-3 bg-gray-200 rounded w-28"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <div className="h-8 w-16 bg-gray-200 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Users Found
        </h3>
        <p className="text-gray-500">
          No users match your current search criteria. Try adjusting your
          filters or search terms.
        </p>
      </div>
    );
  }

  //   const formatDate = (dateString: string) => {
  //     return new Date(dateString).toLocaleDateString("en-US", {
  //       year: "numeric",
  //       month: "short",
  //       day: "numeric",
  //     });
  //   };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Users ({users.length})
          </h3>
          <div className="text-sm text-gray-500">
            {users.filter((user) => user.isActive).length} active,{" "}
            {users.filter((user) => !user.isActive).length} inactive
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Party & Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                State & District
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created Date
              </th> */}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.user_id} className="hover:bg-gray-50">
                {/* User Details */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.first_name.charAt(0)}
                          {user.last_name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {user.user_id}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Contact Info */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <div className="flex items-center gap-1 mb-1">
                      <Mail className="w-3 h-3 text-blue-500" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Phone className="w-3 h-3 text-green-500" />
                      <span>{user.contact_no || "No contact"}</span>
                    </div>
                  </div>
                </td>

                {/* Party & Role */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="flex items-center gap-1 mb-1">
                      <Shield className="w-3 h-3 text-purple-500" />
                      <span className="text-gray-900 font-medium">
                        
                        {user.partyName || "No party"}
                      </span>
                    </div>
                    <div className="text-blue-600 font-medium">
                      {user.role || "..."}
                    </div>
                  </div>
                </td>

                {/* State & District */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="text-gray-900 font-medium">
                      {user.stateName || "-"}
                    </div>
                    <div className="text-gray-600">
                      {user.districtName || "-"}
                    </div>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onToggleStatus(user.user_id, !user.isActive)}
                    className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                    title={`Click to ${
                      user.isActive ? "deactivate" : "activate"
                    }`}
                  >
                    {user.isActive ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-green-500" />
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      </>
                    )}
                  </button>
                </td>

                {/* Created Date */}
                {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(user.created_at)}</span>
                  </div>
                </td> */}

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                  <div className="flex items-center gap-2 justify-end">
                    {/* Edit Button */}
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit user"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {/* 3 Dots Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenUserId(
                            openUserId === user.user_id ? null : user.user_id
                          )
                        }
                        className={`p-2 rounded-md transition-all 
          ${
            openUserId === user.user_id
              ? "bg-gray-200 shadow-sm" // ACTIVE INDICATION
              : "hover:bg-gray-100"
          }
        `}
                      >
                        <MoreHorizontal className="w-5 h-5 text-gray-700" />
                      </button>

                      {/* Dropdown */}
                      {openUserId === user.user_id && (
                        <div className="absolute right-0 mt-2 w-32 bg-white shadow-lg border rounded-md z-10 animate-fadeIn">
                          <button
                            onClick={() => onDelete(user.user_id)}
                            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
