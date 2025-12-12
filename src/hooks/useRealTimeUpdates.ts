import { useEffect, useCallback, useRef } from 'react';
import { dataAvailabilityService } from '../services/dataAvailabilityService';
import { navigationVisibilityManager } from '../services/navigationVisibilityManager';
import type { HierarchyDataStatus } from '../types/dynamicNavigation';

export interface RealTimeUpdateOptions {
  /**
   * Assembly IDs to monitor for changes
   */
  assemblyIds: number[];
  
  /**
   * Callback when data changes are detected
   */
  onDataChange?: (data: HierarchyDataStatus) => void;
  
  /**
   * Whether to automatically start monitoring
   */
  autoStart?: boolean;
  
  /**
   * Whether to force refresh on mount
   */
  refreshOnMount?: boolean;
}

export interface RealTimeUpdateControls {
  /**
   * Start real-time monitoring
   */
  startMonitoring: () => void;
  
  /**
   * Stop real-time monitoring
   */
  stopMonitoring: () => void;
  
  /**
   * Force refresh all data
   */
  forceRefresh: () => Promise<void>;
  
  /**
   * Get current monitoring status
   */
  isMonitoring: boolean;
  
  /**
   * Get monitoring statistics
   */
  getStats: () => ReturnType<typeof dataAvailabilityService.getMonitoringStats>;
}

/**
 * Hook for managing real-time data updates
 */
export function useRealTimeUpdates(options: RealTimeUpdateOptions): RealTimeUpdateControls {
  const {
    assemblyIds,
    onDataChange,
    autoStart = true,
    refreshOnMount = false
  } = options;

  const isMountedRef = useRef(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (!isMountedRef.current || assemblyIds.length === 0) return;

    // Subscribe to data changes
    unsubscribeRef.current = dataAvailabilityService.subscribeToDataUpdates((data) => {
      if (isMountedRef.current && onDataChange) {
        onDataChange(data);
      }
    });

    // Start monitoring
    dataAvailabilityService.startMonitoring(assemblyIds);
    
    // Initialize navigation visibility manager
    navigationVisibilityManager.initialize(assemblyIds);
  }, [assemblyIds, onDataChange]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    dataAvailabilityService.stopMonitoring();
  }, []);

  // Force refresh
  const forceRefresh = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    await dataAvailabilityService.forceRefreshAll();
  }, []);

  // Get monitoring status
  const isMonitoring = dataAvailabilityService.isCurrentlyMonitoring();

  // Get stats
  const getStats = useCallback(() => {
    return dataAvailabilityService.getMonitoringStats();
  }, []);

  // Setup and cleanup
  useEffect(() => {
    isMountedRef.current = true;

    // Force refresh on mount if requested
    if (refreshOnMount && assemblyIds.length > 0) {
      forceRefresh();
    }

    // Auto-start monitoring if enabled
    if (autoStart && assemblyIds.length > 0) {
      startMonitoring();
    }

    // Listen for custom events that might trigger data refresh
    const handleDataRefresh = () => {
      if (isMountedRef.current) {
        forceRefresh();
      }
    };

    const handleAssignmentChange = () => {
      if (isMountedRef.current) {
        // Restart monitoring with new assembly IDs
        stopMonitoring();
        setTimeout(() => {
          if (isMountedRef.current) {
            startMonitoring();
          }
        }, 100);
      }
    };

    // Listen for global events
    window.addEventListener('dataRefreshRequested', handleDataRefresh);
    window.addEventListener('assignmentChanged', handleAssignmentChange);

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
      stopMonitoring();
      window.removeEventListener('dataRefreshRequested', handleDataRefresh);
      window.removeEventListener('assignmentChanged', handleAssignmentChange);
    };
  }, [assemblyIds, autoStart, refreshOnMount]); // Removed function dependencies to prevent re-runs

  return {
    startMonitoring,
    stopMonitoring,
    forceRefresh,
    isMonitoring,
    getStats
  };
}

/**
 * Hook for triggering global data refresh
 */
export function useDataRefreshTrigger() {
  const triggerRefresh = useCallback(() => {
    console.log('Triggering global data refresh');
    window.dispatchEvent(new CustomEvent('dataRefreshRequested'));
  }, []);

  return { triggerRefresh };
}

/**
 * Hook for monitoring real-time update performance
 */
export function useRealTimeMonitoring() {
  const getStats = useCallback(() => {
    return dataAvailabilityService.getMonitoringStats();
  }, []);

  const isActive = useCallback(() => {
    return dataAvailabilityService.isCurrentlyMonitoring();
  }, []);

  return {
    getStats,
    isActive
  };
}