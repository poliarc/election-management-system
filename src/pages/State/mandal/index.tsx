import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import ActionDropdown from "../../../components/common/ActionDropdown.tsx";

type MandalCandidate = {
  no: number;
  mandalName: string;
  designation: string;
  firstName: string;
  phone: number | string;
  email?: string;
  status?: "active" | "disabled";
  state?: string;
  district?: string;
  assembly?: string;
  blockName?: string;
};

type FilterForm = {
  state: string;
  district: string;
  assembly: string;
  blockName: string;
  mandalName: string;
  q: string;
  show: number;
};

const STORAGE_KEY = "mandalCandidates";

export default function StateMandalListing() {
  const [rows, setRows] = useState<MandalCandidate[]>([]);

  const { register, watch } = useForm<FilterForm>({
    defaultValues: {
      state: "",
      district: "",
      assembly: "",
      blockName: "",
      mandalName: "",
      q: "",
      show: 10,
    },
  });

  const selectedState = watch("state");
  const selectedDistrict = watch("district");
  const selectedAssembly = watch("assembly");
  const selectedBlockName = watch("blockName");
  const selectedMandalName = watch("mandalName");
  const q = watch("q");
  const show = watch("show");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
        const normalized: MandalCandidate[] = parsed.map((r, idx) => ({
          no: (r["no"] as number) ?? idx + 1,
          mandalName:
            (r["mandalName"] as string) || (r["mandal"] as string) || "",
          designation:
            (r["designation"] as string) || (r["degignation"] as string) || "",
          firstName: (r["firstName"] as string) || (r["name"] as string) || "",
          phone: (r["phone"] as number | string) ?? "",
          email: (r["email"] as string | undefined) || undefined,
          status:
            (r["status"] as "active" | "disabled" | undefined) || "active",
          state: (r["state"] as string | undefined) || undefined,
          district: (r["district"] as string | undefined) || undefined,
          assembly: (r["assembly"] as string | undefined) || undefined,
          blockName:
            (r["blockName"] as string | undefined) ||
            (r["block"] as string) ||
            undefined,
        }));
        setRows(normalized);
        return;
      } catch {
        // ignore parse errors
      }
    }
    setRows([]);
  }, []);

  const stateOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.state && set.add(r.state));
    return Array.from(set).sort();
  }, [rows]);

  const districtOptions = useMemo(() => {
    const set = new Set<string>();
    rows
      .filter((r) => (selectedState ? r.state === selectedState : true))
      .forEach((r) => r.district && set.add(r.district));
    return Array.from(set).sort();
  }, [rows, selectedState]);

  const assemblyOptions = useMemo(() => {
    const set = new Set<string>();
    rows
      .filter((r) => (selectedState ? r.state === selectedState : true))
      .filter((r) =>
        selectedDistrict ? r.district === selectedDistrict : true
      )
      .forEach((r) => r.assembly && set.add(r.assembly));
    return Array.from(set).sort();
  }, [rows, selectedState, selectedDistrict]);

  const blockOptions = useMemo(() => {
    const set = new Set<string>();
    rows
      .filter((r) => (selectedState ? r.state === selectedState : true))
      .filter((r) =>
        selectedDistrict ? r.district === selectedDistrict : true
      )
      .filter((r) =>
        selectedAssembly ? r.assembly === selectedAssembly : true
      )
      .forEach((r) => r.blockName && set.add(r.blockName));
    return Array.from(set).sort();
  }, [rows, selectedState, selectedDistrict, selectedAssembly]);

  const mandalOptions = useMemo(() => {
    const set = new Set<string>();
    rows
      .filter((r) => (selectedState ? r.state === selectedState : true))
      .filter((r) =>
        selectedDistrict ? r.district === selectedDistrict : true
      )
      .filter((r) =>
        selectedAssembly ? r.assembly === selectedAssembly : true
      )
      .filter((r) =>
        selectedBlockName ? r.blockName === selectedBlockName : true
      )
      .forEach((r) => r.mandalName && set.add(r.mandalName));
    return Array.from(set).sort();
  }, [
    rows,
    selectedState,
    selectedDistrict,
    selectedAssembly,
    selectedBlockName,
  ]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      const matchState = selectedState
        ? (r.state || "") === selectedState
        : true;
      const matchDistrict = selectedDistrict
        ? (r.district || "") === selectedDistrict
        : true;
      const matchAssembly = selectedAssembly
        ? (r.assembly || "") === selectedAssembly
        : true;
      const matchBlockName = selectedBlockName
        ? (r.blockName || "") === selectedBlockName
        : true;
      const matchMandalName = selectedMandalName
        ? (r.mandalName || "") === selectedMandalName
        : true;
      const hay = [
        r.no?.toString(),
        r.mandalName,
        r.designation,
        r.firstName,
        r.phone?.toString(),
        r.email ?? "",
        r.status === "disabled" ? "inactive" : "active",
      ]
        .filter(Boolean)
        .map((v) => v!.toString().toLowerCase());
      const matchQuery = query ? hay.some((h) => h.includes(query)) : true;
      return (
        matchState &&
        matchDistrict &&
        matchAssembly &&
        matchBlockName &&
        matchMandalName &&
        matchQuery
      );
    });
  }, [
    rows,
    selectedState,
    selectedDistrict,
    selectedAssembly,
    selectedBlockName,
    selectedMandalName,
    q,
  ]);

  const shown = filtered.slice(0, Number(show ?? 10));

  const handleDelete = (idx: number) => {
    if (!confirm("Delete this mandal candidate?")) return;
    const updated = [...rows];
    updated.splice(idx, 1);
    setRows(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <div className="p-6 rounded-2xl shadow-md bg-gray-50 w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Mandal List</h1>
      </div>

      <form className="mb-4 w-full flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap">
        <div className="flex flex-col gap-1 w-full sm:w-[180px]">
          <label htmlFor="state" className="text-sm font-medium text-gray-700">
            State
          </label>
          <select
            id="state"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            {...register("state")}
          >
            <option value="">All</option>
            {stateOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 w-full sm:w-[180px]">
          <label
            htmlFor="district"
            className="text-sm font-medium text-gray-700"
          >
            District
          </label>
          <select
            id="district"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            {...register("district")}
          >
            <option value="">All</option>
            {districtOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 w-full sm:w-[180px]">
          <label
            htmlFor="assembly"
            className="text-sm font-medium text-gray-700"
          >
            Assembly
          </label>
          <select
            id="assembly"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            {...register("assembly")}
          >
            <option value="">All</option>
            {assemblyOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 w-full sm:w-[180px]">
          <label
            htmlFor="blockName"
            className="text-sm font-medium text-gray-700"
          >
            Block Name
          </label>
          <select
            id="blockName"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            {...register("blockName")}
          >
            <option value="">All</option>
            {blockOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 w-full sm:w-[180px]">
          <label
            htmlFor="mandalName"
            className="text-sm font-medium text-gray-700"
          >
            Mandal Name
          </label>
          <select
            id="mandalName"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            {...register("mandalName")}
          >
            <option value="">All</option>
            {mandalOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 sm:flex-1 min-w-[220px]">
          <label htmlFor="q" className="text-sm font-medium text-gray-700">
            Search
          </label>
          <input
            id="q"
            type="text"
            placeholder="Search no., mandal name, designation, name..."
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            {...register("q")}
          />
        </div>

        <div className="flex flex-col gap-1 w-max sm:ml-auto">
          <label htmlFor="show" className="text-sm font-medium text-gray-700">
            Show Result
          </label>
          <select
            id="show"
            className="w-28 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            {...register("show", { valueAsNumber: true })}
          >
            {[5, 10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </form>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left rounded-lg shadow-md overflow-hidden bg-white">
          <thead className="bg-indigo-50 text-[13px]">
            <tr>
              <th className="px-4 py-2 font-semibold">No.</th>
              <th className="px-4 py-2 font-semibold">MandalName</th>
              <th className="px-4 py-2 font-semibold">Designation</th>
              <th className="px-4 py-2 font-semibold">FirstName</th>
              <th className="px-4 py-2 font-semibold">Phone</th>
              <th className="px-4 py-2 font-semibold">Email</th>
              <th className="px-4 py-2 font-semibold">Status</th>
              <th className="px-4 py-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">
                  No records found
                </td>
              </tr>
            ) : (
              shown.map((c, index) => (
                <tr
                  key={`${c.no}-${c.mandalName}-${index}`}
                  className={
                    index % 2 === 0
                      ? "bg-white hover:bg-indigo-50 transition"
                      : "bg-gray-50 hover:bg-indigo-50 transition"
                  }
                >
                  <td className="px-4 py-2">{c.no ?? index + 1}</td>
                  <td className="px-4 py-2">{c.mandalName || "-"}</td>
                  <td className="px-4 py-2">{c.designation || "-"}</td>
                  <td className="px-4 py-2">{c.firstName || "-"}</td>
                  <td className="px-4 py-2">{c.phone || "-"}</td>
                  <td className="px-4 py-2">{c.email || "-"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        c.status === "disabled"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {c.status === "disabled" ? "Inactive" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-2 relative">
                    <ActionDropdown
                      items={[
                        {
                          label: "View",
                          onClick: () => alert("View coming soon"),
                        },
                        {
                          label: "Edit",
                          onClick: () => alert("Edit coming soon"),
                        },
                        {
                          label: "Delete",
                          onClick: () => handleDelete(index),
                          destructive: true,
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
