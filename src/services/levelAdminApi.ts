import { API_CONFIG } from "../config/api";

// Get auth token from localStorage
function getAuthToken(): string | null {
  try {
    const authState = localStorage.getItem("auth_state");
    if (!authState) return null;
    const parsed = JSON.parse(authState);
    return parsed.accessToken || null;
  } catch {
    return null;
  }
}

export interface User {
  user_id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  contact_no: string;
  party_id: number;
  state_id: number;
  district_id: number | null;
  partyName: string;
  stateName: string;
  districtName: string | null;
  isActive: number;
  isSuperAdmin?: number | boolean;
}

export interface UsersFilterResponse {
  success: boolean;
  message: string;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DistrictOption {
  id: number;
  name: string;
}

export interface AssemblyOption {
  stateId: number;
  stateName: string;
  districtId: number;
  districtName: string;
  assemblyId: number;
  assemblyName: string;
  totalUsers: number;
}

export interface AssemblyUserOption {
  userId: number;
  userName: string;
  email: string;
  mobileNumber: string;
}

export interface AssemblyUsersResponse {
  success: boolean;
  message: string;
  users: AssemblyUserOption[];
  totalUsers: number;
}

export interface WhatsAppGeneratePayload {
  stateId: number;
  districtId: number;
  assemblyId: number;
  groupType: "Party Team" | "Social Group";
  whatsappLink: string;
  selectedUsers: number[];
}

export interface WhatsAppLinkUser {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  contact_no: string;
}

export interface WhatsAppLinkData {
  id: number;
  link: string;
  group_type: string | null;
  group_name?: string | null;
  stateMasterData_id: number | null;
  afterAssemblyData_id: number | null;
  assembly_name?: string | null;
  district_name?: string | null;
  block_name?: string | null;
  mandal_name?: string | null;
  users: WhatsAppLinkUser[];
}

export interface WhatsAppLinkMutationPayload {
  stateMasterData_id?: number | null;
  afterAssemblyData_id?: number | null;
  link: string;
  group_type: string | null;
  user_ids: number[];
  users_to_delete?: number[];
}

// Fetch users by party and state
export async function fetchUsersByPartyAndState(
  partyId: number,
  stateId: number,
  page: number = 1,
  limit: number = 50,
  search?: string
): Promise<UsersFilterResponse> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  let url = `${API_CONFIG.BASE_URL}/api/users/filter?party_id=${partyId}&state_id=${stateId}&page=${page}&limit=${limit}`;

  if (search && search.trim()) {
    url += `&search=${encodeURIComponent(search.trim())}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to fetch users");
  }

  return response.json();
}

// Assign user to state hierarchy
export async function assignUserToState(
  userId: number,
  hierarchyId: number
): Promise<{ success: boolean; message: string }> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const url = `${API_CONFIG.BASE_URL}/api/user-state-hierarchies/create-user-state-hierarchy`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      user_id: userId,
      stateMasterData_id: hierarchyId,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to assign user");
  }

  return response.json();
}

// Assign user to district (for state-level admins)
export async function assignUserToDistrict(
  userId: number,
  districtId: number
): Promise<{ success: boolean; message: string }> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const url = `${API_CONFIG.BASE_URL}/api/user-state-hierarchies/create-user-state-hierarchy`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      user_id: userId,
      stateMasterData_id: districtId,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to assign user to district");
  }

  return response.json();
}

// Unassign user from state hierarchy
export async function unassignUserFromState(
  userId: number,
  stateMasterDataId: number
): Promise<{
  success: boolean;
  message: string;
  deleted?: any[];
  summary?: any;
}> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const url = `${API_CONFIG.BASE_URL}/api/user-state-hierarchies/delete-assigned-locations`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      userId: userId,
      stateMasterData_id: stateMasterDataId,
    }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to unassign user");
  }

  return response.json();
}

// Get assigned users for a hierarchy location
export async function fetchAssignedUsers(
  hierarchyId: number,
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<any> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  let url = `${API_CONFIG.BASE_URL}/api/user-state-hierarchies/location/${hierarchyId}/users?page=${page}&limit=${limit}`;

  if (search && search.trim()) {
    url += `&search=${encodeURIComponent(search.trim())}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to fetch assigned users");
  }

  return response.json();
}

// Fetch districts for a state
export async function fetchDistrictsByState(
  stateId: number
): Promise<{ success: boolean; data: DistrictOption[] }> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const url = `${API_CONFIG.BASE_URL}/api/user-state-hierarchies/hierarchy/children/${stateId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to fetch districts");
  }

  const result = await response.json();
  const children = result?.data?.children ?? result?.data ?? [];

  return {
    success: result?.success ?? true,
    data: children.map((item: any) => ({
      id: item.location_id ?? item.id,
      name: item.location_name ?? item.name ?? item.levelName,
    })),
  };
}

export async function fetchAssembliesByDistrict(
  stateId: number,
  districtId: number,
  search?: string
): Promise<AssemblyOption[]> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const params = new URLSearchParams({
    page: "1",
    limit: "1000",
    districtId: districtId.toString(),
  });

  if (search && search.trim()) {
    params.append("search", search.trim());
  }

  const url = `${API_CONFIG.BASE_URL}/api/v2/dash/assemblyLevel/${stateId}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to fetch hierarchy manager data");
  }

  const result = await response.json();
  const assemblies = result?.data?.assemblies ?? [];
  const stateName = result?.data?.metaData?.stateName ?? "";
  const resolvedStateId = result?.data?.metaData?.stateId ?? stateId;

  return assemblies.map((assembly: any) => ({
      stateId: resolvedStateId,
      stateName,
      districtId: assembly.districtId,
      districtName: assembly.districtName,
      assemblyId: assembly.assemblyId,
      assemblyName: assembly.assemblyName,
      totalUsers: assembly.userCount ?? 0,
    }));
}

export async function fetchUsersByAssembly(
  assemblyId: number,
  options?: {
    page?: number;
    limit?: number;
    search?: string;
  }
): Promise<AssemblyUsersResponse> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 500;
  const search = options?.search ?? "";

  let url = `${API_CONFIG.BASE_URL}/api/v2/Dash/usersbyassembely/${assemblyId}?page=${page}&limit=${limit}`;

  if (search.trim()) {
    url += `&search=${encodeURIComponent(search.trim())}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to fetch assembly users");
  }

  const result = await response.json();
  const rawUsers = result?.data?.users ?? result?.users ?? [];
  const totalUsers =
    result?.data?.pagination?.total ??
    result?.pagination?.total ??
    rawUsers.length;

  return {
    success: result?.success ?? true,
    message: result?.message ?? "Users fetched successfully",
    totalUsers,
    users: Array.isArray(rawUsers)
      ? rawUsers.map((user: any) => ({
          userId: user.user_id ?? user.id,
          userName:
            user.user_name ||
            `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
            user.username ||
            "Unknown User",
          email: user.email ?? "",
          mobileNumber: user.mobile_number ?? user.contact_no ?? "",
        }))
      : [],
  };
}

export async function fetchWhatsAppLinks(params: {
  stateMasterData_id?: number | null;
  afterAssemblyData_id?: number | null;
  state_id?: number | null;
  levelType?: string;
}): Promise<WhatsAppLinkData[]> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const query = new URLSearchParams();

  if (params.stateMasterData_id) {
    query.append("stateMasterData_id", params.stateMasterData_id.toString());
  }

  if (params.afterAssemblyData_id) {
    query.append(
      "afterAssemblyData_id",
      params.afterAssemblyData_id.toString()
    );
  }

  if (params.state_id) query.append("state_id", params.state_id.toString());

  if (params.levelType) query.append("levelType", params.levelType);

  const url = `${API_CONFIG.BASE_URL}/api/whatsapp/get-whatsapp-link?${query.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to fetch WhatsApp links");
  }

  const result = await response.json();
  return result?.data ?? [];
}

export async function createWhatsAppLink(
  payload: WhatsAppLinkMutationPayload
): Promise<WhatsAppLinkData> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(
    `${API_CONFIG.BASE_URL}/api/whatsapp/create-whatsapp-link`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to create WhatsApp link");
  }

  const result = await response.json();
  return result?.data?.link;
}

export async function updateWhatsAppLink(
  whatsappLinkId: number,
  payload: WhatsAppLinkMutationPayload
): Promise<WhatsAppLinkData[]> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(
    `${API_CONFIG.BASE_URL}/api/whatsapp/update-whatsapp-link/${whatsappLinkId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to update WhatsApp link");
  }

  const result = await response.json();
  return result?.data ?? [];
}

export async function deleteWhatsAppLink(
  whatsappLinkId: number
): Promise<{ id: number; deleted: boolean }> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  const response = await fetch(
    `${API_CONFIG.BASE_URL}/api/whatsapp/delete-whatsapp-link/${whatsappLinkId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to delete WhatsApp link");
  }

  const result = await response.json();
  return result?.data;
}

// Add this at the very bottom of levelAdminApi.ts

export async function fetchWhatsAppLinksByUser(userId: number, locationId?: number | null): Promise<WhatsAppLinkData[]> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required");

  let url = `${API_CONFIG.BASE_URL}/api/whatsapp/user-whatsapp-links/${userId}`;
  if (locationId) {
    url += `?locationId=${locationId}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(error.message || "Failed to fetch user WhatsApp links");
  }
  
  const result = await response.json();
  return result?.data ?? [];
}