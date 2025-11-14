import React, { useEffect, useMemo, useState } from "react";
import type { PollingCenterCandidate } from "../../../types/pollingCenter";
import { PollingCenterForm } from "./PollingCenterForm";
import { PollingCenterList } from "./PollingCenterList";
import { BulkUpload } from "../../../components/BulkUpload";
import { BulkUploadResults } from "../../../components/BulkUploadResults";
import { ArrowLeft, Upload } from "lucide-react";

const POLLING_CENTERS_KEY = "pollingCenters";

const loadPollingCenters = (): PollingCenterCandidate[] => {
  try {
    const raw = localStorage.getItem(POLLING_CENTERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const PollingCenterPage: React.FC = () => {
  const [loggedInUser, setLoggedInUser] = useState<any | null>(null);
  const [assemblyFilter, setAssemblyFilter] = useState<number | "">("");
  const [blockFilter, setBlockFilter] = useState("");
  const [mandalFilter, setMandalFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showUploadResults, setShowUploadResults] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  const [showCount, setShowCount] = useState(25);
  const handleShowCountChange = (count: number) => {
    setShowCount(count);
  };

  const [pollingCenters, setPollingCenters] = useState<PollingCenterCandidate[]>(() => loadPollingCenters());

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
      localStorage.setItem(POLLING_CENTERS_KEY, JSON.stringify(pollingCenters));
    } catch {}
  }, [pollingCenters]);

  const assemblyFilteredCenters = useMemo(() => {
    if (assemblyFilter === "" || assemblyFilter == null) return [] as PollingCenterCandidate[];
    return pollingCenters.filter((pc) => pc.assembly_id === assemblyFilter);
  }, [pollingCenters, assemblyFilter]);

  // Apply filters
  const [filteredCenters, setFilteredCenters] = useState<PollingCenterCandidate[]>([]);
  useEffect(() => {
    let filtered = assemblyFilteredCenters.slice();
    if (blockFilter) filtered = filtered.filter((pc) => pc.block === blockFilter);
    if (mandalFilter) filtered = filtered.filter((pc) => pc.mandal === mandalFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pc) =>
          pc.firstName?.toLowerCase().includes(q) ||
          pc.lastName?.toLowerCase().includes(q) ||
          pc.email?.toLowerCase().includes(q) ||
          String(pc.phone).includes(q) ||
          pc.Designation?.toLowerCase().includes(q) ||
          pc.pollingCenterName?.toLowerCase().includes(q) ||
          pc.pollingCenter?.toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => (b.id || 0) - (a.id || 0));
    setFilteredCenters(filtered);
  }, [assemblyFilteredCenters, blockFilter, mandalFilter, searchQuery]);

  const uniqueBlocks = useMemo(() => {
    const blocks = Array.from(new Set(assemblyFilteredCenters.map((pc) => pc.block).filter(Boolean))) as string[];
    blocks.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return blocks;
  }, [assemblyFilteredCenters]);

  const uniqueMandals = useMemo(() => {
    let mandals = assemblyFilteredCenters.map((pc) => pc.mandal).filter(Boolean);
    if (blockFilter) {
      mandals = assemblyFilteredCenters
        .filter((pc) => pc.block === blockFilter)
        .map((pc) => pc.mandal)
        .filter(Boolean);
    }
    const unique = Array.from(new Set(mandals)) as string[];
    unique.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return unique;
  }, [assemblyFilteredCenters, blockFilter]);

  const handleAdd = (data: PollingCenterCandidate) => {
    const newData = { ...data, id: Date.now(), status: data.status || 1 };
    setPollingCenters((prev) => [newData, ...prev]);
    setShowForm(false);
    setEditingIndex(null);
  };

  const handleEdit = (data: PollingCenterCandidate) => {
    if (editingIndex === null) return;
    const target = filteredCenters.slice(0, showCount)[editingIndex];
    if (!target) return;
    
    setPollingCenters((prev) =>
      prev.map((pc) => (pc.id === target.id ? { ...data, id: target.id } : pc))
    );
    setShowForm(false);
    setEditingIndex(null);
  };

  const handleEditClick = (idx: number) => {
    setEditingIndex(idx);
    setShowForm(true);
  };

  const handleDelete = (idx: number) => {
    const target = filteredCenters.slice(0, showCount)[idx];
    if (!target) return;
    setPollingCenters((prev) => prev.filter((pc) => pc.id !== target.id));
  };

  const handleStatusChange = (_idx: number, pollingCenter: PollingCenterCandidate) => {
    setPollingCenters((prev) =>
      prev.map((pc) =>
        pc.id === pollingCenter.id
          ? { ...pc, status: pc.status === 1 || pc.status === "1" ? 0 : 1 }
          : pc
      )
    );
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingIndex(null);
  };

  const handleBulkUpload = async (file: File) => {
    setIsBulkUploading(true);
    
    try {
      // Simulate file processing
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // In real implementation, you would parse the file and add records
      console.log("Bulk upload file:", file.name);
      
      setUploadResults({
        success: true,
        message: `File "${file.name}" uploaded successfully (demo mode - no actual processing)`,
        data: {
          total: 0,
          successful: 0,
          failed: 0,
        },
      });
      setShowBulkUpload(false);
      setShowUploadResults(true);
    } catch (error) {
      console.error("Bulk upload error:", error);
      setUploadResults({
        success: false,
        message: "Failed to upload file. Please try again.",
        data: null,
      });
      setShowBulkUpload(false);
      setShowUploadResults(true);
    } finally {
      setIsBulkUploading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl shadow-md bg-gray-50 w-full">
      {!showForm ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-800">Polling Centers List</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkUpload(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-md shadow-md transition flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload Polling Centers
              </button>
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingIndex(null);
                }}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-6 py-2 rounded-md shadow-md transition"
              >
                Add Polling Center
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-4 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 w-full">
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

              <div>
                <label className="text-sm">Block</label>
                <select
                  value={blockFilter}
                  onChange={(e) => {
                    setBlockFilter(e.target.value);
                    setMandalFilter("");
                  }}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Block</option>
                  {uniqueBlocks.map((block, i) => (
                    <option key={block || i} value={block}>
                      {block}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm">Mandal</label>
                <select
                  value={mandalFilter}
                  onChange={(e) => setMandalFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Mandal</option>
                  {uniqueMandals.map((mandal, i) => (
                    <option key={mandal || i} value={mandal}>
                      {mandal}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
              <input
                type="text"
                placeholder="Search by polling center, designation, first name, last name, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              <div className="flex items-center gap-2">
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

          <PollingCenterList
            pollingCenters={filteredCenters.slice(0, showCount)}
            onEdit={handleEditClick}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        </>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingIndex !== null ? "Edit" : "Create New"} Polling Center
            </h2>
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>

          <div className="w-24 h-1 bg-blue-500 mb-4 rounded"></div>

          <PollingCenterForm
            initialValues={
              editingIndex !== null && filteredCenters.slice(0, showCount)[editingIndex]
                ? filteredCenters.slice(0, showCount)[editingIndex]
                : undefined
            }
            onSubmit={editingIndex !== null ? handleEdit : handleAdd}
            onCancel={handleCancel}
          />
        </>
      )}

      {/* Bulk Upload Modal */}
      <BulkUpload
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onUpload={handleBulkUpload}
        title="Upload Polling Centers"
        description="Upload multiple polling center users at once using an Excel file. Make sure your file follows the required format."
        sampleFileName="polling_centers_template.xlsx"
        isLoading={isBulkUploading}
      />

      {/* Upload Results Modal */}
      <BulkUploadResults
        isOpen={showUploadResults}
        onClose={() => setShowUploadResults(false)}
        results={uploadResults}
      />
    </div>
  );
};

export { PollingCenterPage };
export default PollingCenterPage;
