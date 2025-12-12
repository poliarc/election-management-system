import React, { useState, useEffect } from 'react';
import { useRealTimeMonitoring, useDataRefreshTrigger } from '../hooks/useRealTimeUpdates';

interface RealTimeMonitoringStatusProps {
  /**
   * Whether to show detailed statistics
   */
  showDetails?: boolean;
  
  /**
   * Whether to show refresh controls
   */
  showControls?: boolean;
  
  /**
   * Custom CSS classes
   */
  className?: string;
}

export const RealTimeMonitoringStatus: React.FC<RealTimeMonitoringStatusProps> = ({
  showDetails = false,
  showControls = true,
  className = ''
}) => {
  const { getStats, isActive } = useRealTimeMonitoring();
  const { triggerRefresh } = useDataRefreshTrigger();
  const [stats, setStats] = useState(getStats());
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStats());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getStats]);

  const handleRefresh = async () => {
    setLastRefresh(new Date());
    triggerRefresh();
  };

  const isMonitoring = isActive();

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm font-medium text-gray-700">
            Real-time Updates
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            isMonitoring 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {isMonitoring ? 'Active' : 'Inactive'}
          </span>
        </div>

        {showControls && (
          <button
            onClick={handleRefresh}
            className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            title="Force refresh data"
          >
            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        )}
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-500">Assemblies:</span>
              <span className="ml-1 font-medium">{stats.assemblyCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Cache Size:</span>
              <span className="ml-1 font-medium">{stats.cacheSize}</span>
            </div>
            <div>
              <span className="text-gray-500">Subscribers:</span>
              <span className="ml-1 font-medium">{stats.subscriberCount}</span>
            </div>
            <div>
              <span className="text-gray-500">Interval:</span>
              <span className="ml-1 font-medium">{stats.monitoringInterval / 1000}s</span>
            </div>
          </div>
          
          {lastRefresh && (
            <div className="mt-2 text-xs text-gray-500">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Compact version for use in headers or toolbars
 */
export const RealTimeStatusIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isActive } = useRealTimeMonitoring();
  const isMonitoring = isActive();

  return (
    <div className={`flex items-center gap-1 ${className}`} title={`Real-time updates: ${isMonitoring ? 'Active' : 'Inactive'}`}>
      <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
      <span className="text-xs text-gray-600">Live</span>
    </div>
  );
};