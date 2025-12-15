import { API_CONFIG } from '../config/api';
import type { HierarchyChild, EnhancedHierarchyChild } from '../types/hierarchy';

export interface HierarchyItem {
  id: number;
  levelName: string;
  levelType: string;
  ParentId: number | null;
  level: number;
}

export interface AfterAssemblyHierarchyItem {
  id: number;
  levelName: string;
  displayName: string;
  parentId: number | null;
  parentAssemblyId: number | null;
  partyLevelId: number;
  isActive: number;
  isDelete: number;
  created_at: string;
  updated_at: string;
  display_level_name: string;
}

export interface HierarchyResponse {
  success: boolean;
  message: string;
  data: {
    stateHierarchy: HierarchyItem[];
    afterAssemblyHierarchy: AfterAssemblyHierarchyItem[];
  };
}

export const fetchHierarchyData = async (stateId?: number, partyId?: number): Promise<HierarchyResponse> => {
  try {
    const authState = localStorage.getItem('auth_state');
    const token = authState ? JSON.parse(authState).accessToken : null;

    if (!token) {
      throw new Error('No authentication token found');
    }

    const params = new URLSearchParams();
    if (stateId) params.append('state_id', stateId.toString());
    if (partyId) params.append('party_id', partyId.toString());

    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/campaigns/hierarchy/?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching hierarchy data:', error);
    throw error;
  }
};

// Helper function to build hierarchy tree
export const buildHierarchyTree = (items: HierarchyItem[]) => {
  const itemMap = new Map<number, HierarchyItem & { children: HierarchyItem[] }>();
  const roots: (HierarchyItem & { children: HierarchyItem[] })[] = [];

  // Create map of all items with children array
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Build tree structure
  items.forEach(item => {
    const itemWithChildren = itemMap.get(item.id)!;
    if (item.ParentId === null) {
      roots.push(itemWithChildren);
    } else {
      const parent = itemMap.get(item.ParentId);
      if (parent) {
        parent.children.push(itemWithChildren);
      }
    }
  });

  return roots;
};

// Helper function to build after-assembly hierarchy tree
export const buildAfterAssemblyTree = (items: AfterAssemblyHierarchyItem[]) => {
  const itemMap = new Map<number, AfterAssemblyHierarchyItem & { children: AfterAssemblyHierarchyItem[] }>();
  const roots: (AfterAssemblyHierarchyItem & { children: AfterAssemblyHierarchyItem[] })[] = [];
  const assemblyChildren: (AfterAssemblyHierarchyItem & { children: AfterAssemblyHierarchyItem[] })[] = [];

  // Create map of all items with children array
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // Build tree structure based on the logic:
  // - If parentId is null and parentAssemblyId has id, it's a child of assembly
  // - If parentId is another id and parentAssemblyId is null, it's a child of assembly child
  items.forEach(item => {
    const itemWithChildren = itemMap.get(item.id)!;

    if (item.parentId === null && item.parentAssemblyId !== null) {
      // Direct child of assembly
      assemblyChildren.push(itemWithChildren);
    } else if (item.parentId !== null && item.parentAssemblyId === null) {
      // Child of assembly child
      const parent = itemMap.get(item.parentId);
      if (parent) {
        parent.children.push(itemWithChildren);
      }
    } else if (item.parentId === null && item.parentAssemblyId === null) {
      // Root level item
      roots.push(itemWithChildren);
    }
  });

  return { roots, assemblyChildren };
};

// Helper function to count items by level type
export const countByLevelType = (items: HierarchyItem[], levelType: string): number => {
  return items.filter(item => item.levelType === levelType).length;
};

// Helper function to count after-assembly items by level name
export const countAfterAssemblyByLevel = (items: AfterAssemblyHierarchyItem[], levelName: string): number => {
  // For booth counting, try multiple possible level names and also check display_level_name
  if (levelName === 'Booth') {
    // Debug: Always log to understand the data structure
    const uniqueLevelNames = [...new Set(items.map(item => item.levelName))];
    const uniqueDisplayLevelNames = [...new Set(items.map(item => item.display_level_name))];
    console.log('Booth counting debug:', {
      searchingFor: levelName,
      uniqueLevelNames,
      uniqueDisplayLevelNames,
      totalItems: items.length
    });

    const boothVariants = ['Booth', 'booth', 'BOOTH'];
    const boothItems = items.filter(item =>
      boothVariants.includes(item.levelName) ||
      boothVariants.includes(item.display_level_name) ||
      item.levelName?.toLowerCase().includes('booth') ||
      item.display_level_name?.toLowerCase().includes('booth')
    );

    console.log('Found booth items:', boothItems.length);
    return boothItems.length;
  }

  // For other level types, try both levelName and display_level_name with variations
  const levelVariants = [
    levelName,
    levelName.toLowerCase(),
    levelName.toUpperCase(),
    levelName.replace(/\s+/g, ''), // Remove spaces
    levelName.replace(/\s+/g, '').toLowerCase(),
  ];

  return items.filter(item => {
    const itemLevelName = item.levelName || '';
    const itemDisplayLevelName = item.display_level_name || '';

    return levelVariants.some(variant =>
      itemLevelName === variant ||
      itemDisplayLevelName === variant ||
      itemLevelName.toLowerCase() === variant.toLowerCase() ||
      itemDisplayLevelName.toLowerCase() === variant.toLowerCase()
    );
  }).length;
};

// Helper function to get children of a specific parent
export const getChildrenOf = (items: HierarchyItem[], parentId: number): HierarchyItem[] => {
  return items.filter(item => item.ParentId === parentId);
};

// Helper function to get after-assembly children of a specific parent
export const getAfterAssemblyChildrenOf = (items: AfterAssemblyHierarchyItem[], parentId: number): AfterAssemblyHierarchyItem[] => {
  return items.filter(item => item.parentId === parentId);
};

// Legacy function for backward compatibility with existing useHierarchyData hook
export const fetchHierarchyChildren = async (parentId: number, params: any) => {
  try {
    const authState = localStorage.getItem('auth_state');
    const token = authState ? JSON.parse(authState).accessToken : null;

    if (!token) {
      throw new Error('No authentication token found');
    }

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.order) queryParams.append('order', params.order);

    const response = await fetch(
      `${API_CONFIG.BASE_URL}/api/user-state-hierarchies/hierarchy/children/${parentId}?${queryParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching hierarchy children:', error);
    throw error;
  }
};

// Legacy function for backward compatibility
export const getSelectedDistrict = () => {
  try {
    const authState = localStorage.getItem('auth_state');
    if (authState) {
      const parsed = JSON.parse(authState);
      const selectedAssignment = parsed.selectedAssignment;

      if (selectedAssignment && selectedAssignment.levelType === 'District') {
        return {
          id: selectedAssignment.stateMasterData_id,
          name: selectedAssignment.levelName,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting selected district:', error);
    return null;
  }
};

// Legacy function for backward compatibility
export const getSelectedState = () => {
  try {
    const authState = localStorage.getItem('auth_state');
    if (authState) {
      const parsed = JSON.parse(authState);
      const selectedAssignment = parsed.selectedAssignment;

      if (selectedAssignment && selectedAssignment.levelType === 'State') {
        return {
          id: selectedAssignment.stateMasterData_id,
          name: selectedAssignment.levelName,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting selected state:', error);
    return null;
  }
};

// Enhanced interfaces for multi-district assembly fetching
export interface FetchAllDistrictsAssembliesParams {
  stateId: number;
  districts: HierarchyChild[];
  search?: string;
  sortBy?: 'location_name' | 'total_users' | 'active_users';
  order?: 'asc' | 'desc';
  userAssignmentFilter?: 'all' | 'with-users' | 'without-users';
}



// New function to fetch assemblies from all districts
export const fetchAllDistrictsAssemblies = async (
  params: FetchAllDistrictsAssembliesParams
): Promise<EnhancedHierarchyChild[]> => {
  try {
    const authState = localStorage.getItem('auth_state');
    const token = authState ? JSON.parse(authState).accessToken : null;

    if (!token) {
      throw new Error('No authentication token found');
    }

    // Create parallel API calls for all districts
    const districtPromises = params.districts.map(async (district) => {
      const queryParams = new URLSearchParams();
      queryParams.append('page', '1');
      queryParams.append('limit', '1000'); // Get all assemblies
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.order) queryParams.append('order', params.order);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/user-state-hierarchies/hierarchy/children/${district.location_id}?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.warn(`Failed to fetch assemblies for district ${district.location_name}: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (data.success && data.data.children) {
        // Enhance each assembly with district information
        return data.data.children.map((assembly: HierarchyChild): EnhancedHierarchyChild => ({
          ...assembly,
          district_name: district.location_name,
          district_id: district.location_id,
          has_users: assembly.total_users > 0,
        }));
      }
      
      return [];
    });

    // Wait for all district API calls to complete
    const districtResults = await Promise.all(districtPromises);
    
    // Flatten all assemblies into a single array
    let allAssemblies: EnhancedHierarchyChild[] = districtResults.flat();

    // Apply user assignment filter if specified
    if (params.userAssignmentFilter && params.userAssignmentFilter !== 'all') {
      if (params.userAssignmentFilter === 'with-users') {
        allAssemblies = allAssemblies.filter(assembly => assembly.has_users);
      } else if (params.userAssignmentFilter === 'without-users') {
        allAssemblies = allAssemblies.filter(assembly => !assembly.has_users);
      }
    }

    // Apply sorting if specified
    if (params.sortBy) {
      allAssemblies.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (params.sortBy) {
          case 'location_name':
            aValue = a.location_name.toLowerCase();
            bValue = b.location_name.toLowerCase();
            break;
          case 'total_users':
            aValue = a.total_users;
            bValue = b.total_users;
            break;
          case 'active_users':
            aValue = a.active_users;
            bValue = b.active_users;
            break;
          default:
            aValue = a.location_name.toLowerCase();
            bValue = b.location_name.toLowerCase();
        }

        if (params.order === 'desc') {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    return allAssemblies;
  } catch (error) {
    console.error('Error fetching all districts assemblies:', error);
    throw error;
  }
};