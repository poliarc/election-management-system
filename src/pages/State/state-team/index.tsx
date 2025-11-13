import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import ActionDropdown from "../../../components/common/ActionDropdown.tsx";

type Candidate = {
  assembly: string;
  name: string;
  profileImage?: FileList | null;
  designation: string; // renamed from degignation
  phone: number;
  city: string;
  district: string;
  status?: "active" | "disabled";
  profileImageURL?: string;
  email?: string;
};

type FilterForm = {
  q: string;
  show: number;
};

const STORAGE_KEY = "statecandidate";

export default function StateTeamListing() {
  const [rows, setRows] = useState<Candidate[]>([]);
  // No global dropdown handling; each row uses reusable ActionDropdown

  const { register, watch } = useForm<FilterForm>({
    defaultValues: { q: "", show: 10 },
  });

  const q = watch("q");
  const show = watch("show");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsedRaw = JSON.parse(raw) as Array<Record<string, unknown>>;
        const normalized: Candidate[] = parsedRaw.map((r) => ({
          assembly: (r["assembly"] as string) || "",
          name: (r["name"] as string) || "",
          profileImage: (r["profileImage"] as FileList | null) || null,
          designation:
            (r["designation"] as string) || (r["degignation"] as string) || "",
          phone: (r["phone"] as number) || 0,
          city: (r["city"] as string) || "",
          district: (r["district"] as string) || "",
          status:
            (r["status"] as "active" | "disabled" | undefined) || "active",
          profileImageURL:
            (r["profileImageURL"] as string | undefined) || undefined,
          email: (r["email"] as string | undefined) || undefined,
        }));
        setRows(normalized);
        return;
      } catch {
        // ignore parse errors
      }
    }
    setRows([]);
  }, []);

  // Dropdown handling moved inside reusable ActionDropdown component

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) =>
      !query
        ? true
        : [
            r.name,
            r.designation,
            r.phone?.toString(),
            r.email ?? "",
            r.district,
            r.assembly,
            r.city,
          ]
            .filter(Boolean)
            .some((v) => v!.toString().toLowerCase().includes(query))
    );
  }, [rows, q]);

  const shown = filtered.slice(0, Number(show ?? 10));

  const handleDelete = (idx: number) => {
    if (!confirm("Delete this member?")) return;
    const updated = [...rows];
    updated.splice(idx, 1);
    setRows(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <div className="p-6 rounded-2xl shadow-md bg-gray-50 w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">State Team Members</h1>
      </div>

      <form className="mb-4 w-full flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex flex-col gap-1 sm:flex-1">
          <label htmlFor="q" className="text-sm font-medium text-gray-700">
            Search
          </label>
          <input
            id="q"
            type="text"
            placeholder="Search name, phone, designation..."
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
              <th className="px-4 py-2 font-semibold">SN</th>
              <th className="px-4 py-2 font-semibold">State Name</th>
              <th className="px-4 py-2 font-semibold">Designation</th>
              <th className="px-4 py-2 font-semibold">First Name</th>
              <th className="px-4 py-2 font-semibold">Phone No</th>
              <th className="px-4 py-2 font-semibold">Email ID</th>
              <th className="px-4 py-2 font-semibold">District</th>
              <th className="px-4 py-2 font-semibold">Assembly</th>
              <th className="px-4 py-2 font-semibold">City</th>
              <th className="px-4 py-2 font-semibold">Status</th>
              <th className="px-4 py-2 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-gray-400">
                  No records found
                </td>
              </tr>
            ) : (
              shown.map((c, index) => (
                <tr
                  key={index}
                  className={
                    index % 2 === 0
                      ? "bg-white hover:bg-indigo-50 transition"
                      : "bg-gray-50 hover:bg-indigo-50 transition"
                  }
                >
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">{c.name || "-"}</td>
                  <td className="px-4 py-2">{c.designation || "-"}</td>
                  <td className="px-4 py-2">{(c.name || "-").split(" ")[0]}</td>
                  <td className="px-4 py-2">{c.phone || "-"}</td>
                  <td className="px-4 py-2">{c.email || "-"}</td>
                  <td className="px-4 py-2">{c.district || "-"}</td>
                  <td className="px-4 py-2">{c.assembly || "-"}</td>
                  <td className="px-4 py-2">{c.city || "-"}</td>
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
                          onClick: () => alert("View profile coming soon"),
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
