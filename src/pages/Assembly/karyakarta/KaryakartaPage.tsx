import React, { useEffect, useMemo, useState } from "react";
import ActionDropdown from "../../../components/common/ActionDropdown";
import type { Karyakarta } from "../../../types/karyakarta";
import { useNavigate } from "react-router-dom";

const KARYAKARTAS_KEY = "karyakartas";

const loadKaryakartas = (): Karyakarta[] => {
  try {
    const raw = localStorage.getItem(KARYAKARTAS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const KaryakartaPage: React.FC = () => {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState<any | null>(null);
  const [assemblyFilter, setAssemblyFilter] = useState<number | "">("");
  const [searchQuery, setSearchQuery] = useState("");

  const [showCount, setShowCount] = useState(25);
  const handleShowCountChange = (count: number) => {
    setShowCount(count);
  };

  const [karyakartas, setKaryakartas] = useState<Karyakarta[]>(() => loadKaryakartas());

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setLoggedInUser(parsed);
        setAssemblyFilter(parsed.assembly_id ?? "");
      } catch {
        setLoggedInUser(null);
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KARYAKARTAS_KEY, JSON.stringify(karyakartas));
    } catch {}
  }, [karyakartas]);

  const assemblyFilteredKaryakartas = useMemo(() => {
    if (assemblyFilter === "" || assemblyFilter == null) return [] as Karyakarta[];
    return karyakartas.filter((k) => k.assembly_id === assemblyFilter);
  }, [karyakartas, assemblyFilter]);

  // Apply filters
  const [filteredKaryakartas, setFilteredKaryakartas] = useState<Karyakarta[]>([]);
  useEffect(() => {
    let filtered = assemblyFilteredKaryakartas.slice();
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (k) =>
          k.firstName?.toLowerCase().includes(q) ||
          k.lastName?.toLowerCase().includes(q) ||
          k.email?.toLowerCase().includes(q) ||
          String(k.phone).includes(q) ||
          k.state?.toLowerCase().includes(q) ||
          k.district?.toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => {
      const aId = typeof a.id === "string" ? parseInt(a.id, 10) : (a.id || 0);
      const bId = typeof b.id === "string" ? parseInt(b.id, 10) : (b.id || 0);
      return bId - aId;
    });
    setFilteredKaryakartas(filtered);
  }, [assemblyFilteredKaryakartas, searchQuery]);

  const handleStatusChange = (idx: number) => {
    const target = filteredKaryakartas.slice(0, showCount)[idx];
    if (!target) return;
    setKaryakartas((prev) =>
      prev.map((k) =>
        k.id === target.id
          ? { ...k, status: k.status === "1" || k.status === "active" ? "0" : "1" }
          : k
      )
    );
  };

  const handleView = (idx: number) => {
    const target = filteredKaryakartas.slice(0, showCount)[idx];
    if (!target) return;
    navigate("/dashboard/profile", { state: { candidate: target } });
  };

  return (
    <div className="p-6 rounded-2xl shadow-md bg-gray-50 w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Karyakarta List</h1>
      </div>

      <div className="mb-4 flex flex-col gap-4 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 w-full">
          <div>
            <label className="text-sm">Search</label>
            <input
              type="text"
              placeholder="Search by Name, Email, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="text-sm">State</label>
            <input
              type="text"
              value={loggedInUser?.state || ""}
              disabled
              className="w-full px-3 py-2 border rounded bg-gray-200 text-gray-700 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-sm">District</label>
            <input
              type="text"
              value={loggedInUser?.district || ""}
              disabled
              className="w-full px-3 py-2 border rounded bg-gray-200 text-gray-700 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="text-sm">Assembly</label>
            <input
              value={loggedInUser?.assembly || ""}
              disabled
              className="w-full px-3 py-2 border rounded bg-gray-200 text-gray-700 cursor-not-allowed appearance-none focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 sm:ml-4">
            <label htmlFor="showCount" className="font-medium text-gray-700 whitespace-nowrap">
              Show Result
            </label>
            <select
              id="showCount"
              value={showCount}
              onChange={(e) => handleShowCountChange(Number(e.target.value))}
              className="px-2 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {[25, 50, 75, 100].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Karyakarta List Table */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left rounded-lg shadow-md overflow-hidden bg-white">
          <thead className="bg-blue-50 text-[13px] sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 font-semibold">SN.</th>
              <th className="px-4 py-2 font-semibold">First Name</th>
              <th className="px-4 py-2 font-semibold">Last Name</th>
              <th className="px-4 py-2 font-semibold">Phone No</th>
              <th className="px-4 py-2 font-semibold">Email</th>
               <th className="px-4 py-2 font-semibold">State</th>
                <th className="px-4 py-2 font-semibold">District</th>
                 <th className="px-4 py-2 font-semibold">Assembly</th>
              <th className="px-4 py-2 font-semibold">Status</th>
              <th className="px-4 py-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredKaryakartas.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-400">
                  No karyakartas found
                </td>
              </tr>
            ) : (
              filteredKaryakartas.slice(0, showCount).map((karyakarta, index) => {
                const statusValue = typeof karyakarta.status === "string" ? karyakarta.status : String(karyakarta.status);
                const isInactive = ["0", "disabled", "inactive", "false", "null", "", "2"].includes(statusValue);
                return (
                  <tr
                    key={karyakarta.id || index}
                    className={index % 2 === 0 ? "bg-white hover:bg-blue-50 transition" : "bg-gray-50 hover:bg-blue-50 transition"}
                  >
                    <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{index + 1}</td>
                    <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{karyakarta.firstName}</td>
                    <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{karyakarta.lastName}</td>
                    <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{karyakarta.phone}</td>
                    <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{karyakarta.email}</td>
                    <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{karyakarta.state}</td>
                    <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{karyakarta.district}</td>
                    <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>{karyakarta.assembly}</td>
                    <td className={`px-4 py-2 ${isInactive ? "opacity-60" : ""}`}>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          isInactive ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isInactive ? "Inactive" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-2 relative">
                      <ActionDropdown
                        items={[
                          {
                            label: "View",
                            onClick: () => handleView(index),
                          },
                          {
                            label: "Toggle Status",
                            onClick: () => handleStatusChange(index),
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
    </div>
  );
};

export default KaryakartaPage;
