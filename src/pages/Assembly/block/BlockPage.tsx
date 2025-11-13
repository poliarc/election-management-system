import React, { useEffect, useMemo, useState } from "react";
import BlockList from "../block/BlockList";
import BlockForm from "../block/BlockForm";
import type { Block, BlockCandidate } from "../../../types/block";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BLOCKS_KEY = "blocks";

const loadBlocks = (): Block[] => {
  try {
    const raw = localStorage.getItem(BLOCKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const toBlockCandidate = (block: Block): BlockCandidate & { id?: number } => ({
  id: block.id,
  blockName: block.blockName ?? "",
  firstName: block.firstName ?? "",
  lastName: block.lastName ?? "",
  email: block.email ?? "",
  phone: block.phone,
  state: block.state ?? "",
  district: block.district ?? "",
  acNo: block.acNo ?? "",
  distNo: block.distNo ?? "",
  designation: block.designation ?? "",
  profileImage: null as any,
  password: "",
  assembly: block.assembly ?? "",
  assembly_id: block.assembly_id,
});

const BlockPage: React.FC = () => {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState<any | null>(null);
  const [assemblyFilter, setAssemblyFilter] = useState<number | "">("");
  const [blockNameFilter, setBlockNameFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [showCount, setShowCount] = useState(25);
  const handleShowCountChange = (count: number) => {
    setShowCount(count);
  };

  const [blocks, setBlocks] = useState<Block[]>(() => loadBlocks());

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
      localStorage.setItem(BLOCKS_KEY, JSON.stringify(blocks));
    } catch {}
  }, [blocks]);

  // assembly options
  const assemblyOptions = useMemo(() => {
    if (assemblyFilter !== "" && assemblyFilter != null) {
      const map = new Map<number, string>();
      blocks.forEach((block) => {
        if (block.assembly_id === assemblyFilter && block.assembly && !map.has(block.assembly_id!)) {
          map.set(block.assembly_id!, block.assembly!);
        }
      });
      if (map.size === 0 && loggedInUser?.assembly_id) return [[loggedInUser.assembly_id, "Assembly"]];
      return Array.from(map.entries());
    }
    const map = new Map<number, string>();
    blocks.forEach((block) => {
      if (block.assembly_id && block.assembly && !map.has(block.assembly_id)) map.set(block.assembly_id, block.assembly);
    });
    return Array.from(map.entries());
  }, [blocks, assemblyFilter, loggedInUser]);

  const assemblyFilteredBlocks = useMemo(() => {
    if (assemblyFilter === "" || assemblyFilter == null) return [] as Block[];
    return blocks.filter((b) => b.assembly_id === assemblyFilter);
  }, [blocks, assemblyFilter]);

  // apply filters
  const [filteredBlocks, setFilteredBlocks] = useState<Block[]>([]);
  useEffect(() => {
    let filtered = assemblyFilteredBlocks.slice();
    if (blockNameFilter) filtered = filtered.filter((b) => b.blockName === blockNameFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.firstName?.toLowerCase().includes(q) ||
          b.lastName?.toLowerCase().includes(q) ||
          b.email?.toLowerCase().includes(q) ||
          String(b.phone).includes(q) ||
          b.designation?.toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => b.id - a.id);
    setFilteredBlocks(filtered);
  }, [assemblyFilteredBlocks, blockNameFilter, searchQuery]);

  const uniqueBlockNames = useMemo(() => {
    const names = Array.from(new Set(assemblyFilteredBlocks.map((b) => b.blockName).filter(Boolean)));
    names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return names;
  }, [assemblyFilteredBlocks]);

  // actions
//   const handleAddClick = () => {
//     setEditingId(null);
//     setShowForm(true);
//   };

  const handleCancel = () => {
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = (data: BlockCandidate) => {
    if (editingId !== null) {
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== editingId) return b;
          return {
            ...b,
            blockName: data.blockName,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            // ensure phone is a string in Block type
            phone: String(data.phone ?? ""),
            designation: data.designation,
            state: data.state,
            district: data.district,
            acNo: data.acNo,
            distNo: data.distNo,
            assembly: data.assembly ?? b.assembly,
            assembly_id: Number(data.assembly_id ?? loggedInUser?.assembly_id ?? b.assembly_id ?? 0),
            // keep existing profileImage if present (Block.profileImage is string)
            profileImage: (b as any).profileImage,
          } as Block;
        })
      );
    } else {
      const newBlock: Block = {
        id: Date.now(),
        blockName: data.blockName,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: String(data.phone ?? ""),
        designation: data.designation,
        state: data.state,
        district: data.district,
        acNo: data.acNo,
        distNo: data.distNo,
        assembly: data.assembly ?? (loggedInUser?.assembly ?? ""),
        assembly_id: Number(data.assembly_id ?? loggedInUser?.assembly_id ?? 0),
        status: "1",
      };
      setBlocks((prev) => [newBlock, ...prev]);
    }
    setShowForm(false);
    setEditingId(null);
  };

  const handleEditClick = (idx: number) => {
    const target = filteredBlocks[idx];
    if (!target) return;
    setEditingId(target.id);
    setShowForm(true);
  };

  const handleDelete = (idx: number) => {
    const target = filteredBlocks[idx];
    if (!target) return;
    if (!confirm(`Delete ${target.firstName || "user"}?`)) return;
    setBlocks((prev) => prev.filter((b) => b.id !== target.id));
  };

  const handleStatusChange = (idx: number) => {
    const target = filteredBlocks[idx];
    if (!target) return;
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === target.id
          ? ({ ...b, status: (b.status === "1" ? "0" : "1") } as Block)
          : b
      )
    );
  };

  const handleView = (idx: number) => {
    const target = filteredBlocks[idx];
    if (!target) return;
    navigate("/assembly/block/profile", { state: { candidate: toBlockCandidate(target) } });
  };

  return (
    <div className="p-6 rounded-2xl shadow-md bg-gray-50 w-full">
      {!showForm ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-800">Block List</h1>
            {/* <button onClick={handleAddClick} className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-6 py-2 rounded-md shadow-md transition">
              Add Block User
            </button> */}
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2 w-full">
            <div>
              <label className="text-sm">State</label>
              <input type="text" value={loggedInUser?.state || ""} disabled className="w-full px-3 py-2 border rounded bg-gray-100" />
            </div>
            <div>
              <label className="text-sm">District</label>
              <input type="text" value={loggedInUser?.district || ""} disabled className="w-full px-3 py-2 border rounded bg-gray-100" />
            </div>
            <div>
              <label className="text-sm">Assembly</label>
              <select value={assemblyFilter} className="w-full px-3 py-2 border rounded bg-gray-100" disabled>
                {loggedInUser?.assembly_id && <option value={loggedInUser.assembly_id}>{assemblyOptions[0]?.[1]}</option>}
              </select>
            </div>

            <div>
              <label className="text-sm">Block</label>
              <select value={blockNameFilter} onChange={(e) => setBlockNameFilter(e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="">Select Block Name</option>
                {uniqueBlockNames.map((n, i) => (
                  <option key={n || i} value={n}>{n}</option>
                ))}
              </select>
            </div>


                 <div className="flex items-center gap-2 sm:ml-4">
              <label
                htmlFor="showCount"
                className="font-medium text-gray-700 whitespace-nowrap"
              >
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
          

            <div className="flex items-center gap-2 sm:ml-4">
              {/* spacer to keep layout */}
            </div>
          </div>

          <div className="mb-6">
            <input type="text" placeholder="Search by First Name, Last Name, Email, Phone, Designation" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-3 py-2 border rounded" />
          </div>

          <BlockList blocks={filteredBlocks} onEdit={handleEditClick} onDelete={handleDelete} onStatusChange={handleStatusChange} onView={handleView} />

        </>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">{editingId !== null ? "Edit" : "Create New"} Block User</h2>
            <button type="button" onClick={handleCancel} className="flex items-center text-gray-600 hover:text-gray-900"><ArrowLeft className="w-5 h-5 mr-2" />Back</button>
          </div>
          <BlockForm initialValues={editingId !== null ? toBlockCandidate(blocks.find((b) => b.id === editingId) as Block) : ({ assembly: loggedInUser?.assembly ?? "", assembly_id: loggedInUser?.assembly_id, state: loggedInUser?.state ?? "", district: loggedInUser?.district ?? "" } as any)} onSubmit={handleSave} onCancel={handleCancel} />
        </>
      )}
    </div>
  );
};

export default BlockPage;
