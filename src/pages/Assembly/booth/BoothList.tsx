import React, { useState, useEffect } from "react";
import type { Booth } from "../../../types/booth";
import { useNavigate } from "react-router-dom";
import ActionDropdown from "../../../components/common/ActionDropdown";
import { ChevronUp, ChevronDown } from "lucide-react";

type Props = {
  booths: Booth[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onStatusChange: (index: number) => void;
};

type SortConfig = {
  key: keyof Booth | null;
  direction: "asc" | "desc";
};

export const BoothList: React.FC<Props> = ({
  booths,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const navigate = useNavigate();
  const [sortedBooths, setSortedBooths] = useState<Booth[]>([...booths]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });

  // Sync props with sorted state
  useEffect(() => {
    setSortedBooths([...booths]);
  }, [booths]);

  // Sorting function
  const handleSort = (key: keyof Booth) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }

    const sorted = [...sortedBooths].sort((a, b) => {
      const aVal = a[key] ?? "";
      const bVal = b[key] ?? "";

      // Special handling for boothNo to sort numerically
      if (key === "boothNo") {
        const numA = parseInt(String(aVal), 10);
        const numB = parseInt(String(bVal), 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return direction === "asc" ? numA - numB : numB - numA;
        }
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

    setSortedBooths(sorted);
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Booth) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-3 h-3 inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1" />
    );
  };

  const handleViewProfile = (booth: Booth) => {
    navigate("/dashboard/profile", { state: { candidate: booth } });
  };

  const getStatusLabel = (status: number | string | undefined) => {
    if (status === 1 || status === "1" || status === "active") return "Active";
    if (
      status === 0 ||
      status === "0" ||
      status === "inactive" ||
      status === "disabled"
    )
      return "Inactive";
    return "Unknown";
  };

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm text-left rounded-lg shadow-md overflow-hidden bg-white">
        <thead className="bg-blue-50 text-[13px] sticky top-0 z-10">
          <tr>
            <th
              className="px-4 py-2 font-semibold cursor-pointer"
              onClick={() => handleSort("boothNo")}
            >
              Booth No {getSortIcon("boothNo")}
            </th>
            <th
              className="px-4 py-2 font-semibold cursor-pointer"
              onClick={() => handleSort("designation")}
            >
              Designation {getSortIcon("designation")}
            </th>
            <th
              className="px-4 py-2 font-semibold cursor-pointer"
              onClick={() => handleSort("firstName")}
            >
              First Name {getSortIcon("firstName")}
            </th>
            <th
              className="px-4 py-2 font-semibold cursor-pointer"
              onClick={() => handleSort("phone")}
            >
              Phone No {getSortIcon("phone")}
            </th>
            <th
              className="px-4 py-2 font-semibold cursor-pointer"
              onClick={() => handleSort("email")}
            >
              Email {getSortIcon("email")}
            </th>
            <th
              className="px-4 py-2 font-semibold cursor-pointer"
              onClick={() => handleSort("status")}
            >
              Status {getSortIcon("status")}
            </th>
            <th className="px-4 py-2 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedBooths.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-gray-400">
                No booth users found
              </td>
            </tr>
          ) : (
            sortedBooths.map((booth, index) => {
              const statusValue =
                typeof booth.status === "string"
                  ? booth.status
                  : String(booth.status);
              const isInactive =
                statusValue === "0" ||
                statusValue === "disabled" ||
                statusValue === "inactive" ||
                statusValue === "false" ||
                statusValue === "null" ||
                statusValue === "" ||
                statusValue === "2";

              return (
                <tr
                  key={booth.id || index}
                  className={`${
                    index % 2 === 0
                      ? "bg-white hover:bg-blue-50"
                      : "bg-gray-50 hover:bg-blue-50"
                  }`}
                >
                  <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
                    {booth.boothNo}
                  </td>
                  <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
                    {booth.designation}
                  </td>
                  <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
                    {booth.firstName}
                  </td>
                  <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
                    {booth.phone}
                  </td>
                  <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
                    {booth.email}
                  </td>
                  <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        isInactive
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {getStatusLabel(booth.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2 relative">
                    <ActionDropdown
                      items={[
                        {
                          label: "View",
                          onClick: () => handleViewProfile(booth),
                        },
                        {
                          label: "Edit",
                          onClick: () => onEdit(index),
                        },
                        {
                          label: "Toggle Status",
                          onClick: () => onStatusChange(index),
                        },
                        {
                          label: "Delete",
                          onClick: () => onDelete(index),
                          destructive: true,
                        },
                      ]}
                      buttonTitle="Actions"
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
