import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  HierarchyLevelData,
  HierarchyDataStatus,
  HierarchyRelationship,
  NavigationVisibility,
  FilterOption,
  DataCache,
  DataAvailabilityServiceInterface
} from '../types/dynamicNavigation';

class DataAvailabilityService implements DataAvailabilityServiceInterface {
  private cache: Map<number, DataCache> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 50; // Maximum number of assemblies to cache
  private subscribers: ((status: HierarchyDataStatus) => void)[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_INTERVAL = 30 * 1000; // 30 seconds
  private isMonitoring = false;
  private visibilityChangeHandler: (() => void) | null = null;
  private currentAssemblyIds: number[] = [];
  private lastDataHash: Map<number, string> = new Map();

  /**
   * Check hierarchy data availability for an assembly
   */
  async checkHierarchyData(assemblyId: number): Promise<HierarchyDataStatus> {
    if (!assemblyId || assemblyId <= 0) {
      console.error('DataAvailabilityService: Invalid assembly ID provided', assemblyId);
      return this.getEmptyHierarchyData(assemblyId);
    }

    // Check cache first
    const cached = this.getCachedData(assemblyId);
    if (cached) {
      return cached.hierarchyData;
    }

    try {
      // Add overall timeout for the entire operation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Overall operation timeout')), 8000);
      });

      // Fetch data for all hierarchy levels with timeout
      const fetchPromises = [
        this.fetchLevelDataWithTimeout(assemblyId, 'blocks', 5000),
        this.fetchLevelDataWithTimeout(assemblyId, 'mandals', 5000),
        this.fetchLevelDataWithTimeout(assemblyId, 'pollingCenters', 5000),
        this.fetchLevelDataWithTimeout(assemblyId, 'booths', 5000)
      ];

      const dataFetchPromise = Promise.allSettled(fetchPromises);
      const [blocksData, mandalsData, pollingCentersData, boothsData] = await Promise.race([
        dataFetchPromise,
        timeoutPromise
      ]);

      const hierarchyData: HierarchyDataStatus = {
        assemblyId,
        availableLevels: {
          blocks: this.extractLevelData(blocksData),
          mandals: this.extractLevelData(mandalsData),
          pollingCenters: this.extractLevelData(pollingCentersData),
          booths: this.extractLevelData(boothsData)
        },
        hierarchyStructure: await this.detectHierarchyStructure(assemblyId)
      };



      // Cache the result
      this.setCachedData(assemblyId, hierarchyData);

      // Notify subscribers
      this.notifySubscribers(hierarchyData);

      return hierarchyData;
    } catch (error) {
      console.error('DataAvailabilityService: Error checking hierarchy data:', error);
      
      // Try to return cached data even if expired as fallback
      const expiredCache = this.cache.get(assemblyId);
      if (expiredCache) {

        return expiredCache.hierarchyData;
      }
      
      // Return fallback structure with basic hierarchy on error
      const fallbackData: HierarchyDataStatus = {
        assemblyId,
        availableLevels: {
          blocks: { count: 1, hasData: true, hasDirectChildren: true },
          mandals: { count: 1, hasData: true, hasDirectChildren: true },
          pollingCenters: { count: 1, hasData: true, hasDirectChildren: true },
          booths: { count: 1, hasData: true, hasDirectChildren: true }
        },
        hierarchyStructure: [
          { parentType: 'assembly', childType: 'block', isActive: true },
          { parentType: 'block', childType: 'mandal', isActive: true },
          { parentType: 'mandal', childType: 'booth', isActive: true }
        ]
      };
      

      
      // Still notify subscribers with fallback data
      this.notifySubscribers(fallbackData);
      
      return fallbackData;
    }
  }

  /**
   * Get filter options for a specific hierarchy level
   */
  async getFilterOptions(level: string, parentId?: number): Promise<FilterOption[]> {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem('auth_access_token');
      
      let url = '';
      switch (level) {
        case 'blocks':
          url = `/api/after-assembly-data/assembly/${parentId}`;
          break;
        case 'mandals':
        case 'pollingCenters':
        case 'booths':
          url = `/api/user-after-assembly-hierarchy/hierarchy/children/${parentId}`;
          break;
        default:
          return [];
      }

      const response = await fetch(`${baseUrl}${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${level} data`);
      }

      const data = await response.json();
      
      if (level === 'blocks') {
        return (data.data || []).map((item: any) => ({
          id: item.id,
          displayName: item.displayName,
          levelName: item.levelName,
          parentId: item.parentId
        }));
      } else {
        return (data.children || []).map((item: any) => ({
          id: item.id,
          displayName: item.displayName,
          levelName: item.levelName,
          parentId: item.parentId
        }));
      }
    } catch (error) {
      console.error(`Error fetching filter options for ${level}:`, error);
      return [];
    }
  }

  /**
   * Subscribe to data updates
   */
  subscribeToDataUpdates(callback: (status: HierarchyDataStatus) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Get navigation visibility based on data availability and hierarchy structure
   */
  getNavigationVisibility(hierarchyData: HierarchyDataStatus): NavigationVisibility {
    const { availableLevels, hierarchyStructure } = hierarchyData;
    
    // Check if each level is actually part of the hierarchy structure
    const hasBlockRelation = hierarchyStructure.some(rel => rel.childType === 'block');
    const hasMandalRelation = hierarchyStructure.some(rel => rel.childType === 'mandal');
    const hasPollingCenterRelation = hierarchyStructure.some(rel => rel.childType === 'pollingCenter');
    const hasBoothRelation = hierarchyStructure.some(rel => rel.childType === 'booth');
    
    const visibility = {
      showBlocks: availableLevels.blocks.hasData && hasBlockRelation,
      showMandals: availableLevels.mandals.hasData && hasMandalRelation,
      showPollingCenters: availableLevels.pollingCenters.hasData && hasPollingCenterRelation,
      showBooths: availableLevels.booths.hasData && hasBoothRelation
    };
    

    
    return visibility;
  }

  /**
   * Get the actual hierarchy path for a given assembly
   */
  getHierarchyPath(hierarchyData: HierarchyDataStatus): string[] {
    const path: string[] = ['assembly']; // Always start with assembly
    
    // Build path based on actual relationships
    let currentParent = 'assembly';
    const relationships = hierarchyData.hierarchyStructure;
    
    while (true) {
      const nextRelation = relationships.find(rel => rel.parentType === currentParent && rel.isActive);
      if (!nextRelation) break;
      
      path.push(nextRelation.childType);
      currentParent = nextRelation.childType;
    }
    
    return path;
  }

  /**
   * Clear cache for an assembly (useful when data changes)
   */
  clearCache(assemblyId?: number): void {
    if (assemblyId) {
      this.cache.delete(assemblyId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Start monitoring data changes for real-time updates
   */
  startMonitoring(assemblyIds: number[]): void {
    if (this.isMonitoring) {
      this.stopMonitoring();
    }

    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkForDataChanges(assemblyIds);
      } catch (error) {
        console.error('Error during data monitoring:', error);
        // Continue monitoring even if there's an error
      }
    }, this.MONITORING_INTERVAL);

    // Also listen for browser visibility changes to refresh when user returns
    this.setupVisibilityChangeListener(assemblyIds);
  }

  /**
   * Stop monitoring data changes
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    this.cleanupVisibilityChangeListener();
  }

  /**
   * Check for data changes and notify subscribers
   */
  private async checkForDataChanges(assemblyIds: number[]): Promise<void> {
    const changePromises = assemblyIds.map(async (assemblyId) => {
      try {
        const currentData = await this.checkHierarchyData(assemblyId);
        
        // Use enhanced change detection
        if (this.hasDataChangedEnhanced(assemblyId, currentData)) {
          // Clear cache to force refresh
          this.clearCache(assemblyId);
          
          // Notify subscribers of the change
          this.notifySubscribers(currentData);
          
          return { assemblyId, changed: true, data: currentData };
        }
        
        return { assemblyId, changed: false, data: currentData };
      } catch (error) {
        console.error(`Error checking data changes for assembly ${assemblyId}:`, error);
        return { assemblyId, changed: false, error: error };
      }
    });

    await Promise.allSettled(changePromises);
  }



  /**
   * Trigger immediate data refresh for an assembly
   */
  async refreshData(assemblyId: number): Promise<HierarchyDataStatus> {
    this.clearCache(assemblyId);
    return await this.checkHierarchyData(assemblyId);
  }

  /**
   * Get monitoring status
   */
  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }

  // Private helper methods

  private async fetchLevelDataWithTimeout(assemblyId: number, level: string, timeout = 10000): Promise<any> {
    return Promise.race([
      this.fetchLevelData(assemblyId, level),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout fetching ${level} data`)), timeout)
      )
    ]);
  }

  private async fetchLevelData(assemblyId: number, level: string): Promise<any> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    const token = localStorage.getItem('auth_access_token');
    

    
    if (!token) {
      throw new Error('No authentication token available');
    }

    if (!baseUrl) {
      throw new Error('API base URL not configured');
    }
    
    let url = '';
    switch (level) {
      case 'blocks':
        url = `/api/after-assembly-data/assembly/${assemblyId}`;
        break;
      case 'mandals':
      case 'pollingCenters':
      case 'booths':
        // For now, we'll check blocks first and then their children
        // This is a simplified approach - in reality, you might need more complex logic
        try {

          const blocksResponse = await fetch(`${baseUrl}/api/after-assembly-data/assembly/${assemblyId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!blocksResponse.ok) {

            if (blocksResponse.status === 401) {
              throw new Error('Authentication failed');
            }
            if (blocksResponse.status === 403) {
              throw new Error('Access denied');
            }
            return { data: [] };
          }
          
          const blocksData = await blocksResponse.json();
          const blocks = blocksData.data || [];
          

          
          if (blocks.length === 0) return { data: [] };
          
          // Check children of first block to see if this level exists

          const childrenResponse = await fetch(`${baseUrl}/api/user-after-assembly-hierarchy/hierarchy/children/${blocks[0].id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!childrenResponse.ok) {

            return { data: [] };
          }
          
          const childrenData = await childrenResponse.json();

          return childrenData;
        } catch (error) {
          console.error(`DataAvailabilityService: Error fetching ${level} data:`, error);
          return { data: [] };
        }
      default:
        return { data: [] };
    }

    try {

      const response = await fetch(`${baseUrl}${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {

        if (response.status === 401) {
          throw new Error('Authentication failed');
        }
        if (response.status === 403) {
          throw new Error('Access denied');
        }
        if (response.status === 404) {
          return { data: [] }; // Not found is acceptable, return empty data
        }
        throw new Error(`HTTP ${response.status}: Failed to fetch ${level} data`);
      }

      const data = await response.json();

      return data;
    } catch (error) {
      console.error(`DataAvailabilityService: Error in fetch for ${level}:`, error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }

  private extractLevelData(result: PromiseSettledResult<any>): HierarchyLevelData {
    if (result.status === 'rejected') {
      return { count: 0, hasData: false, hasDirectChildren: false };
    }

    const data = result.value;
    let items = [];
    
    if (data.data) {
      items = data.data;
    } else if (data.children) {
      items = data.children;
    }

    return {
      count: items.length,
      hasData: items.length > 0,
      hasDirectChildren: items.some((item: any) => item.user_count > 0 || item.total_users > 0)
    };
  }

  private async detectHierarchyStructure(assemblyId: number): Promise<HierarchyRelationship[]> {
    try {
      // Fetch actual data to determine the real hierarchy structure
      const [blocksData, mandalsData, pollingCentersData, boothsData] = await Promise.allSettled([
        this.fetchLevelDataWithTimeout(assemblyId, 'blocks', 3000),
        this.fetchLevelDataWithTimeout(assemblyId, 'mandals', 3000),
        this.fetchLevelDataWithTimeout(assemblyId, 'pollingCenters', 3000),
        this.fetchLevelDataWithTimeout(assemblyId, 'booths', 3000)
      ]);

      const relationships: HierarchyRelationship[] = [];
      
      // Always add assembly -> block if blocks exist
      if (blocksData.status === 'fulfilled' && this.extractLevelData(blocksData).hasData) {
        relationships.push({ parentType: 'assembly', childType: 'block', isActive: true });
        
        // Check if mandals exist
        if (mandalsData.status === 'fulfilled' && this.extractLevelData(mandalsData).hasData) {
          relationships.push({ parentType: 'block', childType: 'mandal', isActive: true });
          
          // Enhanced polling center detection
          const pollingCenterLevelData = this.extractLevelData(pollingCentersData);
          let hasRealPollingCenters = false;
          
          if (pollingCentersData.status === 'fulfilled' && pollingCenterLevelData.hasData) {
            // Analyze the actual data to see if these are real polling centers or misidentified booths
            const pollingCenterData = pollingCentersData.value;
            const items = pollingCenterData.data || pollingCenterData.children || [];
            
            if (items.length > 0) {
              // Check naming patterns to distinguish polling centers from booths
              const boothPatternCount = items.filter((item: any) => {
                const name = (item.displayName || item.levelName || '').toLowerCase().trim();
                // Booth patterns: "booth 1", "booth 111", "booth no 1", etc.
                return /^booth\s*(no\.?\s*)?\d+$/i.test(name);
              }).length;
              
              const boothPatternRatio = boothPatternCount / items.length;
              
              // If less than 70% match booth pattern, consider them real polling centers
              hasRealPollingCenters = boothPatternRatio < 0.7;
              

            }
          }
          
          if (hasRealPollingCenters) {
            relationships.push({ parentType: 'mandal', childType: 'pollingCenter', isActive: true });
            
            // Check if booths exist under polling centers
            if (boothsData.status === 'fulfilled' && this.extractLevelData(boothsData).hasData) {
              relationships.push({ parentType: 'pollingCenter', childType: 'booth', isActive: true });
            }
          } else {
            // No real polling centers, check if booths exist directly under mandals
            if (boothsData.status === 'fulfilled' && this.extractLevelData(boothsData).hasData) {
              relationships.push({ parentType: 'mandal', childType: 'booth', isActive: true });
            }
          }
        } else {
          // No mandals, check if polling centers exist directly under blocks
          if (pollingCentersData.status === 'fulfilled' && this.extractLevelData(pollingCentersData).hasData) {
            relationships.push({ parentType: 'block', childType: 'pollingCenter', isActive: true });
            
            if (boothsData.status === 'fulfilled' && this.extractLevelData(boothsData).hasData) {
              relationships.push({ parentType: 'pollingCenter', childType: 'booth', isActive: true });
            }
          } else {
            // No mandals or polling centers, check if booths exist directly under blocks
            if (boothsData.status === 'fulfilled' && this.extractLevelData(boothsData).hasData) {
              relationships.push({ parentType: 'block', childType: 'booth', isActive: true });
            }
          }
        }
      }

      return relationships;
    } catch (error) {
      console.error('Error detecting hierarchy structure:', error);
      // Fallback to basic structure
      return [
        { parentType: 'assembly', childType: 'block', isActive: true },
        { parentType: 'block', childType: 'mandal', isActive: true },
        { parentType: 'mandal', childType: 'booth', isActive: true }
      ];
    }
  }

  private getCachedData(assemblyId: number): DataCache | null {
    const cached = this.cache.get(assemblyId);
    if (!cached) return null;

    const now = new Date();
    const isExpired = now.getTime() - cached.lastUpdated.getTime() > this.CACHE_DURATION;
    
    if (isExpired) {
      this.cache.delete(assemblyId);
      return null;
    }

    return cached;
  }

  private setCachedData(assemblyId: number, hierarchyData: HierarchyDataStatus): void {
    // Implement LRU cache behavior
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(assemblyId, {
      assemblyId,
      lastUpdated: new Date(),
      hierarchyData,
      filterOptions: {}
    });
  }

  private notifySubscribers(status: HierarchyDataStatus): void {
    this.subscribers.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  private getEmptyHierarchyData(assemblyId: number): HierarchyDataStatus {
    return {
      assemblyId,
      availableLevels: {
        blocks: { count: 0, hasData: false, hasDirectChildren: false },
        mandals: { count: 0, hasData: false, hasDirectChildren: false },
        pollingCenters: { count: 0, hasData: false, hasDirectChildren: false },
        booths: { count: 0, hasData: false, hasDirectChildren: false }
      },
      hierarchyStructure: []
    };
  }

  /**
   * Setup visibility change listener for efficient monitoring
   */
  private setupVisibilityChangeListener(assemblyIds: number[]): void {
    this.currentAssemblyIds = assemblyIds;
    
    this.visibilityChangeHandler = async () => {
      if (!document.hidden && this.isMonitoring) {
        try {
          // Refresh data when user returns to the tab
          await this.checkForDataChanges(this.currentAssemblyIds);
        } catch (error) {
          console.error('Error refreshing data on visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
  }

  /**
   * Cleanup visibility change listener
   */
  private cleanupVisibilityChangeListener(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
  }

  /**
   * Generate a hash for data comparison
   */
  private generateDataHash(data: HierarchyDataStatus): string {
    const hashData = {
      blocks: { count: data.availableLevels.blocks.count, hasData: data.availableLevels.blocks.hasData },
      mandals: { count: data.availableLevels.mandals.count, hasData: data.availableLevels.mandals.hasData },
      pollingCenters: { count: data.availableLevels.pollingCenters.count, hasData: data.availableLevels.pollingCenters.hasData },
      booths: { count: data.availableLevels.booths.count, hasData: data.availableLevels.booths.hasData }
    };
    return JSON.stringify(hashData);
  }

  /**
   * Enhanced change detection using hashing
   */
  private hasDataChangedEnhanced(assemblyId: number, newData: HierarchyDataStatus): boolean {
    const newHash = this.generateDataHash(newData);
    const oldHash = this.lastDataHash.get(assemblyId);
    
    if (oldHash !== newHash) {
      this.lastDataHash.set(assemblyId, newHash);
      return true;
    }
    
    return false;
  }

  /**
   * Force refresh all monitored assemblies
   */
  async forceRefreshAll(): Promise<void> {
    if (!this.isMonitoring || this.currentAssemblyIds.length === 0) {
      return;
    }

    try {
      // Clear all caches
      this.cache.clear();
      this.lastDataHash.clear();
      
      // Refresh all assemblies
      const refreshPromises = this.currentAssemblyIds.map(async (assemblyId) => {
        try {
          const newData = await this.checkHierarchyData(assemblyId);
          this.notifySubscribers(newData);
          return newData;
        } catch (error) {
          console.error(`Error refreshing assembly ${assemblyId}:`, error);
          return null;
        }
      });

      await Promise.allSettled(refreshPromises);
    } catch (error) {
      console.error('Error during force refresh:', error);
    }
  }

  /**
   * Force refresh hierarchy detection for a specific assembly
   */
  async forceRefreshHierarchy(assemblyId: number): Promise<HierarchyDataStatus> {
    // Clear cache for this assembly to force fresh detection
    this.clearCache(assemblyId);
    this.lastDataHash.delete(assemblyId);
    
    // Re-detect hierarchy structure
    const newData = await this.checkHierarchyData(assemblyId);
    
    console.log(`Forced hierarchy refresh for assembly ${assemblyId}:`, {
      structure: newData.hierarchyStructure,
      hasPollingCenters: newData.hierarchyStructure.some(rel => rel.childType === 'pollingCenter')
    });
    
    return newData;
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    isMonitoring: boolean;
    assemblyCount: number;
    cacheSize: number;
    subscriberCount: number;
    monitoringInterval: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      assemblyCount: this.currentAssemblyIds.length,
      cacheSize: this.cache.size,
      subscriberCount: this.subscribers.length,
      monitoringInterval: this.MONITORING_INTERVAL
    };
  }
}

// Export singleton instance
export const dataAvailabilityService = new DataAvailabilityService();

// RTK Query API for data availability
export const dataAvailabilityApi = createApi({
  reducerPath: 'dataAvailabilityApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_BASE_URL}/api`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('auth_access_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['HierarchyData'],
  endpoints: (builder) => ({
    getHierarchyData: builder.query<HierarchyDataStatus, number>({
      queryFn: async (assemblyId) => {
        try {
          const data = await dataAvailabilityService.checkHierarchyData(assemblyId);
          return { data };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      providesTags: ['HierarchyData'],
    }),
  }),
});

export const { useGetHierarchyDataQuery } = dataAvailabilityApi;