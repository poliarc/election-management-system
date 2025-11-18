import React, { useState } from 'react';
import PartyLevelList from '../../Admin/partyWiseLevel/PartyLevelList';
import PartyLevelForm from '../../Admin/partyWiseLevel/PartyLevelForm';
import type { PartyLevelConfig, PartyLevelFormData } from '../../../types/partyLevel';

type ViewMode = 'list' | 'add' | 'view';

const PartyLevelManagementPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedConfig, setSelectedConfig] = useState<PartyLevelConfig | null>(null);

  const handleAdd = () => {
    setSelectedConfig(null);
    setViewMode('add');
  };

  const handleView = (config: PartyLevelConfig) => {
    setSelectedConfig(config);
    setViewMode('view');
  };

  const handleCancel = () => {
    setSelectedConfig(null);
    setViewMode('list');
  };

  const handleSubmit = (data: PartyLevelFormData) => {
    try {
      const stored = localStorage.getItem('partyLevelConfigurations');
      const configurations: PartyLevelConfig[] = stored ? JSON.parse(stored) : [];

      const newConfig: PartyLevelConfig = {
        id: Date.now(),
        partyId: data.partyId,
        partyName: data.partyName,
        stateId: data.stateId,
        stateName: data.stateName,
        levels: data.levels,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const existingIndex = configurations.findIndex(
        c => c.partyId === data.partyId && c.stateId === data.stateId
      );

      if (existingIndex >= 0) {
        configurations[existingIndex] = {
          ...configurations[existingIndex],
          ...newConfig,
          id: configurations[existingIndex].id,
          createdAt: configurations[existingIndex].createdAt
        };
      } else {
        configurations.push(newConfig);
      }

      localStorage.setItem('partyLevelConfigurations', JSON.stringify(configurations));

      setViewMode('list');
      setSelectedConfig(null);

      window.dispatchEvent(new CustomEvent('partyLevelConfigUpdated'));
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  return (
    <div>
      {viewMode === 'list' && (
        <PartyLevelList onAdd={handleAdd} onView={handleView} />
      )}

      {viewMode === 'add' && (
        <PartyLevelForm onSubmit={handleSubmit} onCancel={handleCancel} isViewMode={false} />
      )}

      {viewMode === 'view' && selectedConfig && (
        <PartyLevelForm
          initialData={selectedConfig}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isViewMode={true}
        />
      )}
    </div>
  );
};

export default PartyLevelManagementPage;
