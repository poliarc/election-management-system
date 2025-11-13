import { useMemo, useState, useRef, useEffect } from "react";
import type { FC } from "react";
import { EllipsisVertical } from "lucide-react";

type Block = {
  id: number;
  blockName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | number;
  designation?: string;
  status?: number | string;
};

type Props = {
  blocks: Block[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onStatusChange: (index: number) => void;
  onView?: (index: number) => void;
};

const BlockList: FC<Props> = ({ blocks, onEdit, onDelete, onStatusChange, onView }) => {
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRefs = useRef<Array<HTMLDivElement | null>>([]);

  // close on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (openDropdown === null) return;
      const el = dropdownRefs.current[openDropdown];
      if (el && !el.contains(e.target as Node)) setOpenDropdown(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [openDropdown]);

  const sortedBlocks = useMemo(() => {
    return blocks;
  }, [blocks]);

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm text-left rounded-lg shadow-md overflow-hidden bg-white">
        <thead className="bg-blue-50 text-[13px] sticky top-0 z-10">
          <tr>
            <th className="px-4 py-2 font-semibold">SN.</th>
            <th className="px-4 py-2 font-semibold">Block Name</th>
            <th className="px-4 py-2 font-semibold">Designation</th>
            <th className="px-4 py-2 font-semibold">First Name</th>
            <th className="px-4 py-2 font-semibold">Phone No</th>
            <th className="px-4 py-2 font-semibold">Email Id</th>
            <th className="px-4 py-2 font-semibold">Status</th>
            <th className="px-4 py-2 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedBlocks.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center py-8 text-gray-400">
                No block users found
              </td>
            </tr>
          ) : (
            sortedBlocks.map((s, index) => {
              const statusValue = typeof s.status === "string" ? s.status : String(s.status);
              const isInactive = ["0", "disabled", "inactive", "false", "null", "", "2"].includes(statusValue);
              return (
                <tr key={index} className={index % 2 === 0 ? "bg-white hover:bg-blue-50 transition" : "bg-gray-50 hover:bg-blue-50 transition"}>
                  <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{index + 1}</td>
                  <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{s.blockName}</td>
                  <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{s.designation}</td>
                  <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{s.firstName}</td>
                  <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{s.phone}</td>
                  <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{s.email}</td>
                  <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isInactive ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {isInactive ? "Inactive" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-2 relative" ref={(el) => { dropdownRefs.current[index] = el; }}>
                    <button
                      onClick={() => setOpenDropdown((p) => (p === index ? null : index))}
                      className="bg-blue-100 text-blue-700 rounded-full p-2 hover:bg-blue-600 hover:text-white transition duration-150 shadow-sm"
                      title="Actions"
                    >
                      <EllipsisVertical className="w-5 h-5" />
                    </button>

                    {openDropdown === index && (
                      <div className="absolute right-2 top-10 bg-white border rounded shadow-md z-20 w-40">
                        <button onClick={() => { if (typeof onView === "function") onView(index); setOpenDropdown(null); }} className="block w-full px-3 py-2 text-left hover:bg-gray-50">View</button>
                        <button onClick={() => { onEdit(index); setOpenDropdown(null); }} className="block w-full px-3 py-2 text-left hover:bg-gray-50">Edit</button>
                        <button onClick={() => { onStatusChange(index); setOpenDropdown(null); }} className="block w-full px-3 py-2 text-left hover:bg-gray-50">Toggle Status</button>
                        <button onClick={() => { onDelete(index); setOpenDropdown(null); }} className="block w-full px-3 py-2 text-left text-red-600 hover:bg-gray-50">Delete</button>
                      </div>
                    )}
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

export default BlockList;
