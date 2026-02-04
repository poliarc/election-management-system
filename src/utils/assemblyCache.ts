// Assembly cache utility for persistent storage across components
interface AssemblyInfo {
  id: number;
  name: string;
}

type AssemblyCache = Record<number, AssemblyInfo>;

const CACHE_KEY = 'assemblyInfoCache';

// Get assembly cache from localStorage
export const getAssemblyCache = (): AssemblyCache => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.error('Error reading assembly cache from localStorage:', error);
    return {};
  }
};

// Set assembly cache to localStorage
export const setAssemblyCache = (cache: AssemblyCache): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving assembly cache to localStorage:', error);
  }
};

// Get assembly name by ID from cache
export const getAssemblyNameFromCache = (assemblyId: number): string | null => {
  const cache = getAssemblyCache();
  return cache[assemblyId]?.name || null;
};

// Add assembly to cache
export const addAssemblyToCache = (assemblyId: number, assemblyName: string): void => {
  const cache = getAssemblyCache();
  cache[assemblyId] = { id: assemblyId, name: assemblyName };
  setAssemblyCache(cache);
};

// Fetch assembly name with caching
export const fetchAssemblyNameWithCache = async (
  assemblyId: number,
  districtId: number
): Promise<string> => {
  // Check cache first
  const cachedName = getAssemblyNameFromCache(assemblyId);
  if (cachedName) {
    return cachedName;
  }

  try {
    // Fetch from API
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/user-state-hierarchies/hierarchy/children/${districtId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_access_token")}`,
        },
      }
    );
    const data = await response.json();
    
    if (data.success && data.children) {
      const foundAssembly = data.children.find((a: any) => (a.location_id || a.id) === assemblyId);
      if (foundAssembly) {
        const assemblyName = foundAssembly.location_name || foundAssembly.displayName || foundAssembly.name || `Assembly ${assemblyId}`;
        
        // Cache the result
        addAssemblyToCache(assemblyId, assemblyName);
        
        return assemblyName;
      }
    }
  } catch (error) {
    console.error(`Error fetching assembly name for ID ${assemblyId}:`, error);
  }

  // Fallback
  return `Assembly ${assemblyId}`;
};

// Clear assembly cache (useful for logout or data refresh)
export const clearAssemblyCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing assembly cache:', error);
  }
};