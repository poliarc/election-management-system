import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import ActionDropdown from "../../../components/common/ActionDropdown.tsx";

type AssemblyCandidate = {
  acNo: number;
  assemblyName: string;
  designation: string; // backward compatible with degignation
  firstName: string;
  phone: number | string;
  email?: string;
  status?: "active" | "disabled";
  state?: string;
  district?: string;
};

type FilterForm = {
  state: string;
  district: string;
  assembly: string;
  q: string;
  show: number;
};

const STORAGE_KEY = "assemblyCandidates";

export default function StateAssemblyListing() {
  const [rows, setRows] = useState<AssemblyCandidate[]>([]);

  const { register, watch } = useForm<FilterForm>({
    defaultValues: { state: "", district: "", assembly: "", q: "", show: 10 },
  });

  const selectedState = watch("state");
  const selectedDistrict = watch("district");
  const selectedAssembly = watch("assembly");
  const q = watch("q");
  const show = watch("show");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
        const normalized: AssemblyCandidate[] = parsed.map((r, idx) => ({
          acNo: (r["acNo"] as number) ?? idx + 1,
          assemblyName:
            (r["assemblyName"] as string) || (r["assembly"] as string) || "",
          designation:
            (r["designation"] as string) || (r["degignation"] as string) || "",
          firstName: (r["firstName"] as string) || (r["name"] as string) || "",
          phone: (r["phone"] as number | string) ?? "",
          email: (r["email"] as string | undefined) || undefined,
          status:
            (r["status"] as "active" | "disabled" | undefined) || "active",
          state: (r["state"] as string | undefined) || undefined,
          district: (r["district"] as string | undefined) || undefined,
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
      .forEach((r) => r.assemblyName && set.add(r.assemblyName));
    return Array.from(set).sort();
  }, [rows, selectedState, selectedDistrict]);

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
        ? (r.assemblyName || "") === selectedAssembly
        : true;
      const hay = [
        r.acNo?.toString(),
        r.assemblyName,
        r.designation,
        r.firstName,
        r.phone?.toString(),
        r.email ?? "",
        r.status === "disabled" ? "inactive" : "active",
      ]
        .filter(Boolean)
        .map((v) => v!.toString().toLowerCase());
      const matchQuery = query ? hay.some((h) => h.includes(query)) : true;
      return matchState && matchDistrict && matchAssembly && matchQuery;
    });
  }, [rows, selectedState, selectedDistrict, selectedAssembly, q]);

  const shown = filtered.slice(0, Number(show ?? 10));

  const handleDelete = (idx: number) => {
    if (!confirm("Delete this assembly candidate?")) return;
    const updated = [...rows];
    updated.splice(idx, 1);
    setRows(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <div className="p-6 rounded-2xl shadow-md bg-gray-50 w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Assembly List</h1>
      </div>

      <form className="mb-4 w-full flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap">
        <div className="flex flex-col gap-1 w-full sm:w-[200px]">
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

        <div className="flex flex-col gap-1 w-full sm:w-[200px]">
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

        <div className="flex flex-col gap-1 w-full sm:w-[220px]">
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

        <div className="flex flex-col gap-1 sm:flex-1 min-w-[220px]">
          <label htmlFor="q" className="text-sm font-medium text-gray-700">
            Search
          </label>
          <input
            id="q"
            type="text"
            placeholder="Search AC No, assembly, name, phone, designation..."
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            {...register("q")}
          />
        </div>

        <div className="flex flex-col gap-1 w-full sm:w-[140px]">
          <label htmlFor="show" className="text-sm font-medium text-gray-700">
            Show Result
          </label>
          <select
            id="show"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
              <th className="px-4 py-2 font-semibold">Ac No</th>
              <th className="px-4 py-2 font-semibold">Assembly Name</th>
              <th className="px-4 py-2 font-semibold">Designation</th>
              <th className="px-4 py-2 font-semibold">First Name</th>
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
                  key={`${c.acNo}-${c.assemblyName}-${index}`}
                  className={
                    index % 2 === 0
                      ? "bg-white hover:bg-indigo-50 transition"
                      : "bg-gray-50 hover:bg-indigo-50 transition"
                  }
                >
                  <td className="px-4 py-2">{c.acNo ?? index + 1}</td>
                  <td className="px-4 py-2">{c.assemblyName || "-"}</td>
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
