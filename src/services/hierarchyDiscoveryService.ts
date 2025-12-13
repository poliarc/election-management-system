import type { BlockHierarchyResponse } from '../store/api/blockTeamApi';

// Types for the flexible hierarchy system
export interface HierarchyLevel {
  id: number;
  displayName: string;
  levelName: string;
  levelType: 'Assembly' | 'Block' | 'Mandal' | 'PollingCenter' | 'Booth';
  parentId: number;
  childrenCount: number;
  hasDirectBooths: boolean;
  user_count?: number;
  isActive: number;
  assigned_users?: any[];
}

export interface HierarchyDiscoveryResponse {
  success: boolean;
  data: {
    children: HierarchyLevel[];
    levelTypes: string[];
    hasBooths: boolean;
    parent?: HierarchyLevel;
  };
  error?: string;
}

export interface LevelConfig {
  type: string;
  displayName: string;
  priority: number; // For ordering when multiple types exist
  isTerminal: boolean; // Can contain booths directly
}

// Configuration for level types and their priorities
const LEVEL_CONFIGS: Record<string, LevelConfig> = {
  'Block': {
    type: 'Block',
    displayName: 'Block',
    priority: 1,
    isTerminal: false
  },
  'Mandal': {
    type: 'Mandal',
    displayName: 'Mandal',
    priority: 2,
    isTerminal: true
  },
  'Polling Center': {
    type: 'PollingCenter',
    displayName: 'Polling Center',
    priority: 3,
    isTerminal: true
  },
  'Booth': {
    type: 'Booth',
    displayName: 'Booth',
    priority: 4,
    isTerminal: true
  }
};

// Cache for hierarchy data to avoid repeated API calls
class HierarchyCache {
  private cache = new Map<string, { data: HierarchyDiscoveryResponse; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  get(key: string): HierarchyDiscoveryResponse | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key: string, data: HierarchyDiscoveryResponse): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  invalidateLevel(levelId: number): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.startsWith(`hierarchy_${levelId}`) || key.includes(`_${levelId}_`)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

export class HierarchyDiscoveryService {
  private cache = new HierarchyCache();
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL}/api`;

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Discovers the hierarchy structure for a given level
   */
  async discoverHierarchy(levelId: number): Promise<HierarchyDiscoveryResponse> {
    const cacheKey = `hierarchy_${levelId}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/user-after-assembly-hierarchy/hierarchy/children/${levelId}`,
        {
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse: BlockHierarchyResponse = await response.json();
      
      if (!apiResponse.success) {
        return {
          success: false,
          data: { children: [], levelTypes: [], hasBooths: false },
          error: apiResponse.message || 'Failed to fetch hierarchy data'
        };
      }

      const result = this.processHierarchyResponse(apiResponse);
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error discovering hierarchy:', error);
      return {
        success: false,
        data: { children: [], levelTypes: [], hasBooths: false },
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Processes the API response and converts it to our hierarchy format
   */
  private processHierarchyResponse(apiResponse: BlockHierarchyResponse): HierarchyDiscoveryResponse {
    const children: HierarchyLevel[] = apiResponse.children.map(child => ({
      id: child.id,
      displayName: child.displayName,
      levelName: child.levelName,
      levelType: this.mapLevelType(child.levelName),
      parentId: child.parentId,
      childrenCount: child.user_count || 0,
      hasDirectBooths: this.isTerminalLevel(child.levelName),
      user_count: child.user_count,
      isActive: child.isActive,
      assigned_users: child.assigned_users
    }));

    // Get unique level types and sort by priority
    const levelTypes = [...new Set(children.map(child => child.levelName))]
      .sort((a, b) => {
        const priorityA = LEVEL_CONFIGS[a]?.priority || 999;
        const priorityB = LEVEL_CONFIGS[b]?.priority || 999;
        return priorityA - priorityB;
      });

    // Check if any children are booths or terminal levels
    const hasBooths = children.some(child => 
      child.levelType === 'Booth' || this.isTerminalLevel(child.levelName)
    );

    // Convert parent info if available
    const parent = apiResponse.parent ? {
      id: apiResponse.parent.id,
      displayName: apiResponse.parent.displayName,
      levelName: apiResponse.parent.levelName,
      levelType: this.mapLevelType(apiResponse.parent.levelName),
      parentId: apiResponse.parent.parentId || 0,
      childrenCount: children.length,
      hasDirectBooths: false,
      isActive: apiResponse.parent.isActive
    } : undefined;

    return {
      success: true,
      data: {
        children,
        levelTypes,
        hasBooths,
        parent
      }
    };
  }

  /**
   * Maps API level names to our standardized level types
   */
  private mapLevelType(levelName: string): HierarchyLevel['levelType'] {
    const normalized = levelName.toLowerCase();
    
    if (normalized.includes('assembly')) return 'Assembly';
    if (normalized.includes('block')) return 'Block';
    if (normalized.includes('mandal')) return 'Mandal';
    if (normalized.includes('polling') || normalized.includes('center')) return 'PollingCenter';
    if (normalized.includes('booth')) return 'Booth';
    
    // Default fallback based on level configuration
    return LEVEL_CONFIGS[levelName]?.type as HierarchyLevel['levelType'] || 'Booth';
  }

  /**
   * Determines if a level type can contain booths directly
   */
  private isTerminalLevel(levelName: string): boolean {
    return LEVEL_CONFIGS[levelName]?.isTerminal || false;
  }

  /**
   * Gets the priority order for level types
   */
  getLevelPriority(levelName: string): number {
    return LEVEL_CONFIGS[levelName]?.priority || 999;
  }

  /**
   * Determines the next level to display based on available children
   */
  getNextLevelType(children: HierarchyLevel[]): string | null {
    if (children.length === 0) return null;

    // Group children by level type
    const levelGroups = children.reduce((acc, child) => {
      if (!acc[child.levelName]) {
        acc[child.levelName] = [];
      }
      acc[child.levelName].push(child);
      return acc;
    }, {} as Record<string, HierarchyLevel[]>);

    // Get the level type with highest priority (lowest priority number)
    const availableTypes = Object.keys(levelGroups);
    availableTypes.sort((a, b) => this.getLevelPriority(a) - this.getLevelPriority(b));

    return availableTypes[0] || null;
  }

  /**
   * Checks if the current level chain is complete (reaches booths)
   */
  isChainComplete(currentLevel: HierarchyLevel, children: HierarchyLevel[]): boolean {
    // If current level is a booth, chain is complete
    if (currentLevel.levelType === 'Booth') {
      return true;
    }

    // If current level is terminal and has booths, chain is complete
    if (this.isTerminalLevel(currentLevel.levelName) && currentLevel.hasDirectBooths) {
      return true;
    }

    // If children contain booths, chain can be completed
    return children.some(child => child.levelType === 'Booth');
  }

  /**
   * Clears the cache (useful for testing or when data changes)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalidates cache for a specific level
   */
  invalidateLevel(levelId: number): void {
    this.cache.invalidateLevel(levelId);
  }
}

// Export a singleton instance
export const hierarchyDiscoveryService = new HierarchyDiscoveryService();