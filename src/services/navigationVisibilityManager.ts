import { dataAvailabilityService } from './dataAvailabilityService';
import type {
  HierarchyDataStatus,
  NavigationVisibility,
  NavigationConfig,
  NavigationVisibilityManagerInterface
} from '../types/dynamicNavigation';

class NavigationVisibilityManager implements NavigationVisibilityManagerInterface {
  private currentVisibility: NavigationVisibility = {
    showBlocks: false,
    showMandals: false,
    showPollingCenters: false,
    showBooths: false
  };

  private subscribers: ((visibility: NavigationVisibility) => void)[] = [];
  private unsubscribeFromDataService?: () => void;

  /**
   * Initialize the navigation visibility manager
   */
  initialize(assemblyIds?: number[]): void {
    // Subscribe to data availability changes
    this.unsubscribeFromDataService = dataAvailabilityService.subscribeToDataUpdates(
      (status: HierarchyDataStatus) => {
        this.updateNavigationVisibility(status);
      }
    );

    // Start monitoring if assembly IDs are provided
    if (assemblyIds && assemblyIds.length > 0) {
      dataAvailabilityService.startMonitoring(assemblyIds);
    }
  }

  /**
   * Check data availability and update navigation items
   */
  async checkDataAvailability(assemblyId: number): Promise<NavigationVisibility> {
    try {

      
      const hierarchyData = await dataAvailabilityService.checkHierarchyData(assemblyId);

      
      const visibility = dataAvailabilityService.getNavigationVisibility(hierarchyData);

      
      // Always update and notify - don't skip based on comparison
      this.currentVisibility = visibility;
      
      // Immediate notification to subscribers
      setTimeout(() => {
        this.notifySubscribers(visibility);
      }, 0);
      
      return visibility;
    } catch (error) {
      console.error('NavigationVisibilityManager: Error checking data availability:', error);
      // Return fallback visibility on error - show all items
      const fallbackVisibility: NavigationVisibility = {
        showBlocks: true,
        showMandals: true,
        showPollingCenters: true,
        showBooths: true
      };
      
      this.currentVisibility = fallbackVisibility;
      
      // Immediate notification to subscribers
      setTimeout(() => {
        this.notifySubscribers(fallbackVisibility);
      }, 0);
      
      return fallbackVisibility;
    }
  }

  /**
   * Get current navigation visibility
   */
  getCurrentVisibility(): NavigationVisibility {
    return { ...this.currentVisibility };
  }

  /**
   * Get navigation configuration with visibility applied
   */
  getNavigationConfig(): NavigationConfig[] {
    const baseConfig: Omit<NavigationConfig, 'isVisible'>[] = [
      {
        id: 'block',
        label: 'Block',
        route: 'block',
        requiredData: 'blocks'
      },
      {
        id: 'mandal',
        label: 'Mandal',
        route: 'mandal',
        requiredData: 'mandals'
      },
      {
        id: 'polling-center',
        label: 'Polling Center',
        route: 'polling-center',
        requiredData: 'pollingCenters'
      },
      {
        id: 'booth',
        label: 'Booth',
        route: 'booth',
        requiredData: 'booths'
      }
    ];

    return baseConfig.map(config => ({
      ...config,
      isVisible: this.getVisibilityForLevel(config.requiredData)
    }));
  }

  /**
   * Subscribe to navigation visibility changes
   */
  subscribeToVisibilityChanges(callback: (visibility: NavigationVisibility) => void): () => void {
    this.subscribers.push(callback);
    
    // Immediately call with current visibility (with error handling)
    try {
      callback(this.currentVisibility);
    } catch (error) {
      console.error('Error in initial visibility callback:', error);
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Update navigation items based on hierarchy data
   */
  updateNavigationItems(visibility: NavigationVisibility): void {
    this.currentVisibility = visibility;
    this.notifySubscribers(visibility);
  }

  /**
   * Check if any navigation items are visible
   */
  hasVisibleItems(): boolean {
    return Object.values(this.currentVisibility).some(visible => visible);
  }

  /**
   * Get visible navigation items count
   */
  getVisibleItemsCount(): number {
    return Object.values(this.currentVisibility).filter(visible => visible).length;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.unsubscribeFromDataService) {
      this.unsubscribeFromDataService();
    }
    
    // Stop monitoring
    dataAvailabilityService.stopMonitoring();
    
    this.subscribers = [];
  }

  /**
   * Refresh data for an assembly and update navigation
   */
  async refreshAssemblyData(assemblyId: number): Promise<void> {
    try {
      const hierarchyData = await dataAvailabilityService.refreshData(assemblyId);
      const visibility = dataAvailabilityService.getNavigationVisibility(hierarchyData);
      this.updateNavigationItems(visibility);
    } catch (error) {
      console.error('Error refreshing assembly data:', error);
    }
  }

  // Private helper methods

  private updateNavigationVisibility(hierarchyData: HierarchyDataStatus): void {
    const visibility = dataAvailabilityService.getNavigationVisibility(hierarchyData);
    this.updateNavigationItems(visibility);
  }

  private getVisibilityForLevel(level: 'blocks' | 'mandals' | 'pollingCenters' | 'booths'): boolean {
    switch (level) {
      case 'blocks':
        return this.currentVisibility.showBlocks;
      case 'mandals':
        return this.currentVisibility.showMandals;
      case 'pollingCenters':
        return this.currentVisibility.showPollingCenters;
      case 'booths':
        return this.currentVisibility.showBooths;
      default:
        return false;
    }
  }

  private notifySubscribers(visibility: NavigationVisibility): void {
    // Create a copy of subscribers to avoid issues if array is modified during iteration
    const subscribersCopy = [...this.subscribers];
    
    subscribersCopy.forEach((callback, index) => {
      try {
        callback(visibility);
      } catch (error) {
        console.error(`NavigationVisibilityManager: Error notifying subscriber ${index}:`, error);
        // Remove problematic subscribers to prevent repeated errors
        const originalIndex = this.subscribers.indexOf(callback);
        if (originalIndex > -1) {
          this.subscribers.splice(originalIndex, 1);
          console.warn('NavigationVisibilityManager: Removed problematic subscriber to prevent further errors');
        }
      }
    });
  }
}

// Export singleton instance
export const navigationVisibilityManager = new NavigationVisibilityManager();