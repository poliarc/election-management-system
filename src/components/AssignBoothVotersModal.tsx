import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
    fetchAvailablePartNos,
    assignPartNoRange,
    fetchPartNoAssignments,
    deletePartNoAssignment,
    type PartNoAssignment,
} from "../services/partNoAssignmentApi";

interface AssignBoothVotersModalProps {
    isOpen: boolean;
    onClose: () => void;
    levelId: number;
    levelName: string;
    levelType: "afterAssembly";
    assemblyId: number;
    stateId?: number;
    districtId?: number;
}

export default function AssignBoothVotersModal({
    isOpen,
    onClose,
    levelId,
    levelName,
    levelType,
    assemblyId,
    stateId,
    districtId,
}: AssignBoothVotersModalProps) {
    const [availablePartNos, setAvailablePartNos] = useState<string[]>([]);
    const [selectedPartNos, setSelectedPartNos] = useState<Set<string>>(new Set());
    const [partNoFrom, setPartNoFrom] = useState("");
    const [partNoTo, setPartNoTo] = useState("");
    const [loading, setLoading] = useState(false);
    const [assignments, setAssignments] = useState<PartNoAssignment[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [searchPartNo, setSearchPartNo] = useState("");
    const [hierarchyIds, setHierarchyIds] = useState({
        stateId: stateId || 0,
        districtId: districtId || 0,
    });

    // Fetch assembly hierarchy details if not provided
    useEffect(() => {
        const fetchHierarchyIds = async () => {
            if ((hierarchyIds.stateId > 0 && hierarchyIds.districtId > 0) || !assemblyId) return;

            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL || "https://backend.peopleconnect.in"}/api/state-master-data/${assemblyId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
                        },
                    }
                );
                const data = await response.json();

                if (data.success && data.data) {
                    setHierarchyIds({
                        stateId: data.data.state_id || 0,
                        districtId: data.data.district_id || data.data.parent_id || 0,
                    });
                    console.log("Fetched hierarchy IDs:", {
                        stateId: data.data.state_id,
                        districtId: data.data.district_id || data.data.parent_id,
                    });
                }
            } catch (error) {
                console.error("Error fetching hierarchy IDs:", error);
            }
        };

        fetchHierarchyIds();
    }, [assemblyId, hierarchyIds.stateId, hierarchyIds.districtId]);

    // Update hierarchyIds when props change
    useEffect(() => {
        if (stateId && stateId > 0) {
            setHierarchyIds(prev => ({ ...prev, stateId }));
        }
        if (districtId && districtId > 0) {
            setHierarchyIds(prev => ({ ...prev, districtId }));
        }
    }, [stateId, districtId]);

    // Load available part numbers and existing assignments
    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, assemblyId, levelId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch available part numbers
            const partNosResponse = await fetchAvailablePartNos(assemblyId);
            setAvailablePartNos(partNosResponse.data);

            // Fetch existing assignments
            setLoadingAssignments(true);
            const assignmentsResponse = await fetchPartNoAssignments(levelType, levelId);
            setAssignments(assignmentsResponse.data);
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error(error instanceof Error ? error.message : "Failed to load data");
        } finally {
            setLoading(false);
            setLoadingAssignments(false);
        }
    };

    const handlePartNoToggle = (partNo: string) => {
        const newSelected = new Set(selectedPartNos);
        if (newSelected.has(partNo)) {
            newSelected.delete(partNo);
        } else {
            newSelected.add(partNo);
        }
        setSelectedPartNos(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedPartNos.size === availablePartNos.length) {
            setSelectedPartNos(new Set());
        } else {
            setSelectedPartNos(new Set(availablePartNos));
        }
    };

    const handleAssignRange = async () => {
        if (!partNoFrom || !partNoTo) {
            toast.error("Please enter both From and To part numbers");
            return;
        }

        const fromNum = parseInt(partNoFrom);
        const toNum = parseInt(partNoTo);

        if (isNaN(fromNum) || isNaN(toNum)) {
            toast.error("Part numbers must be valid numbers");
            return;
        }

        if (fromNum > toNum) {
            toast.error("From part number must be less than or equal to To part number");
            return;
        }

        try {
            setLoading(true);

            const payload: any = {
                levelType,
                levelId,
                part_no_from: partNoFrom,
                part_no_to: partNoTo,
                assembly_id: assemblyId,
            };

            // Include state_id and district_id if they're valid (not 0)
            if (hierarchyIds.stateId && hierarchyIds.stateId > 0) {
                payload.state_id = hierarchyIds.stateId;
            }
            if (hierarchyIds.districtId && hierarchyIds.districtId > 0) {
                payload.district_id = hierarchyIds.districtId;
            }

            console.log("Assigning part no range with payload:", payload);

            await assignPartNoRange(payload);

            toast.success("Part number range assigned successfully");
            setPartNoFrom("");
            setPartNoTo("");
            loadData(); // Reload data
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to assign range");
        } finally {
            setLoading(false);
        }
    };

    const handleAssignSelected = async () => {
        if (selectedPartNos.size === 0) {
            toast.error("Please select at least one part number");
            return;
        }

        const sortedPartNos = Array.from(selectedPartNos).sort((a, b) => parseInt(a) - parseInt(b));

        try {
            setLoading(true);

            // Group consecutive part numbers into ranges
            const ranges: { from: string; to: string }[] = [];
            let rangeStart = sortedPartNos[0];
            let rangeEnd = sortedPartNos[0];

            for (let i = 1; i < sortedPartNos.length; i++) {
                const current = parseInt(sortedPartNos[i]);
                const prev = parseInt(sortedPartNos[i - 1]);

                if (current === prev + 1) {
                    rangeEnd = sortedPartNos[i];
                } else {
                    ranges.push({ from: rangeStart, to: rangeEnd });
                    rangeStart = sortedPartNos[i];
                    rangeEnd = sortedPartNos[i];
                }
            }
            ranges.push({ from: rangeStart, to: rangeEnd });

            // Assign each range
            for (const range of ranges) {
                const payload: any = {
                    levelType,
                    levelId,
                    part_no_from: range.from,
                    part_no_to: range.to,
                    assembly_id: assemblyId,
                };

                // Include state_id and district_id if they're valid (not 0)
                if (hierarchyIds.stateId && hierarchyIds.stateId > 0) {
                    payload.state_id = hierarchyIds.stateId;
                }
                if (hierarchyIds.districtId && hierarchyIds.districtId > 0) {
                    payload.district_id = hierarchyIds.districtId;
                }

                await assignPartNoRange(payload);
            }

            toast.success(`Assigned ${ranges.length} part number range(s) successfully`);
            setSelectedPartNos(new Set());
            loadData(); // Reload data
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to assign selected part numbers");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAssignment = async (id: number) => {
        if (!confirm("Are you sure you want to delete this assignment?")) {
            return;
        }

        try {
            await deletePartNoAssignment(id);
            toast.success("Assignment deleted successfully");
            loadData(); // Reload data
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete assignment");
        }
    };

    // Filter available part numbers based on search
    const filteredPartNos = availablePartNos.filter((partNo) =>
        partNo.toLowerCase().includes(searchPartNo.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">Assign Booth Voters</h2>
                            <p className="text-indigo-100 mt-1">{levelName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Assign by Range */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Assign Part No Range</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Part No From
                                </label>
                                <input
                                    type="number"
                                    value={partNoFrom}
                                    onChange={(e) => setPartNoFrom(e.target.value)}
                                    placeholder="e.g., 1"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Part No To
                                </label>
                                <input
                                    type="number"
                                    value={partNoTo}
                                    onChange={(e) => setPartNoTo(e.target.value)}
                                    placeholder="e.g., 10"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleAssignRange}
                                    disabled={loading}
                                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? "Assigning..." : "Assign Range"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Available Part Numbers */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Available Part Numbers ({availablePartNos.length})
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSelectAll}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                                >
                                    {selectedPartNos.size === availablePartNos.length ? "Deselect All" : "Select All"}
                                </button>
                                <button
                                    onClick={handleAssignSelected}
                                    disabled={loading || selectedPartNos.size === 0}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Assign Selected ({selectedPartNos.size})
                                </button>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="mb-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchPartNo}
                                    onChange={(e) => setSearchPartNo(e.target.value)}
                                    placeholder="Search part number..."
                                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <svg
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {searchPartNo && (
                                    <button
                                        onClick={() => setSearchPartNo("")}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            {searchPartNo && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Showing {filteredPartNos.length} of {availablePartNos.length} part numbers
                                </p>
                            )}
                        </div>

                        {loading ? (
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                <p className="mt-2 text-gray-600">Loading part numbers...</p>
                            </div>
                        ) : availablePartNos.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">No available part numbers found</p>
                            </div>
                        ) : filteredPartNos.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">No part numbers match your search</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 max-h-60 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                                {filteredPartNos.map((partNo) => (
                                    <button
                                        key={partNo}
                                        onClick={() => handlePartNoToggle(partNo)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${selectedPartNos.has(partNo)
                                            ? "bg-indigo-600 text-white shadow-md"
                                            : "bg-white text-gray-700 border border-gray-300 hover:border-indigo-500"
                                            }`}
                                    >
                                        {partNo}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Existing Assignments */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Current Assignments ({assignments.length})
                        </h3>
                        {loadingAssignments ? (
                            <div className="text-center py-8">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : assignments.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">No assignments yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {assignments.map((assignment) => (
                                    <div
                                        key={assignment.id}
                                        className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-indigo-100 p-2 rounded-lg">
                                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    Part No: {assignment.part_no_from} - {assignment.part_no_to}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Assigned on {new Date(assignment.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteAssignment(assignment.id)}
                                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
