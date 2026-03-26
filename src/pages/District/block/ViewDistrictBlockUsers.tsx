import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetBlockAssignmentsQuery } from "../../../store/api/blockApi";
import { useTranslation } from "react-i18next";

export default function ViewDistrictBlockUsers() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const blockId = searchParams.get("blockId");
    const blockName = searchParams.get("blockName");

    const { data, isLoading, error } = useGetBlockAssignmentsQuery(
        Number(blockId),
        { skip: !blockId }
    );

    if (!blockId || !blockName) {
        return (
            <div className="p-6 bg-[var(--bg-main)] min-h-screen">
                <div className="max-w-4xl mx-auto bg-[var(--bg-card)] rounded-lg shadow-md p-6">
                    <p className="text-red-600">Invalid block information</p>
                    <button
                        onClick={() => navigate("/district/block")}
                        className="mt-4 bg-gray-200 text-[var(--text-secondary)] py-2 px-4 rounded-lg hover:bg-gray-300"
                    >
                        Back to Block List
                    </button>
                </div>
            </div>
        );
    }

    const users = data?.users || [];

    return (
        <div className="p-6 bg-[var(--bg-main)] min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">{t("districtBlock.Block_Users")}</h1>
                            <p className="text-blue-100 mt-2">
                                {t("districtBlock.Block")}: {blockName}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/district/block")}
                            className="bg-[var(--bg-card)] text-blue-700 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center gap-2 shadow-md"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            {t("districtBlock.Back_Blocks")}
                        </button>
                    </div>
                </div>

                {/* Users List */}
                <div className="bg-[var(--bg-card)] rounded-xl shadow-lg overflow-hidden">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="mt-4 text-[var(--text-secondary)]">{t("districtBlock.Loading_users")}</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-600">
                            <p>{t("districtBlock.Error_loading_users")}</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="mt-2 text-[var(--text-secondary)] font-medium">{t("districtBlock.Desc1")}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-[var(--bg-main)]">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("districtBlock.S_No")}
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("districtBlock.Name")}
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("districtBlock.Email")}
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("districtBlock.Contact")}
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("districtBlock.Party")}
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("districtBlock.Status")}
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                            {t("districtBlock.Assigned_At")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-[var(--bg-card)] divide-y divide-gray-200">
                                    {users.map((user: any, index: number) => (
                                        <tr key={user.assignment_id} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-[var(--text-color)]">
                                                    {user.first_name} {user.last_name}
                                                </div>
                                                <div className="text-xs text-[var(--text-secondary)]">
                                                    {user.username}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                                                {user.contact_no}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {user.partyName}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.user_active === 1
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                        }`}
                                                >
                                                    {user.user_active === 1 ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                                                {user.assigned_at ? new Date(user.assigned_at).toLocaleDateString() : "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Summary Card */}
                <div className="mt-6 bg-[var(--bg-card)] rounded-xl shadow-md p-6 border border-blue-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-[var(--text-secondary)] font-medium">{t("districtBlock.Total_Users")}</p>
                            <p className="text-2xl font-bold text-[var(--text-color)]">{users.length}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


