import React, { useState } from 'react';
import { ArrowLeft, Save, RotateCcw, X } from 'lucide-react';
import type { LevelConfig, PartyLevelFormData, AdminOption } from '../../../types/partyLevel';
import { DEFAULT_LEVELS } from '../../../types/partyLevel';

interface PartyLevelFormProps {
  initialData?: any;
  onSubmit: (data: PartyLevelFormData) => void;
  onCancel: () => void;
  isViewMode?: boolean;
}

const PartyLevelForm: React.FC<PartyLevelFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isViewMode = false
}) => {

  // -------------------------------------------
  // DUMMY STATIC PARTY LIST (API removed)
  // -------------------------------------------
  const parties = [
    { party_id: 1, partyName: "BJP", partyCode: "BJP" },
    { party_id: 2, partyName: "INC", partyCode: "INC" },
    { party_id: 3, partyName: "JDU", partyCode: "JDU" }
  ];

  // -------------------------------------------
  // DUMMY STATIC STATE LIST (API removed)
  // -------------------------------------------
  const states = [
    { id: 1, name: "Maharashtra" },
    { id: 2, name: "Bihar" },
    { id: 3, name: "UP" }
  ];

  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(initialData?.partyId || null);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(initialData?.stateId || null);
  const [levels, setLevels] = useState<LevelConfig[]>(
    initialData?.levels || DEFAULT_LEVELS.map(l => ({ ...l }))
  );

  const [availableAdmins] = useState<AdminOption[]>([
    { id: '1', name: 'Admin User 1', email: 'admin1@example.com' },
    { id: '2', name: 'Admin User 2', email: 'admin2@example.com' },
    { id: '3', name: 'Admin User 3', email: 'admin3@example.com' },
  ]);

  const handleRemoveLevel = (levelId: string) => {
    if (isViewMode) return;
    setLevels(levels.map(level =>
      level.id === levelId ? { ...level, isActive: false } : level
    ));
  };

  const handleAdminChange = (levelId: string, adminId: string) => {
    if (isViewMode) return;
    const admin = availableAdmins.find(a => a.id === adminId);
    setLevels(levels.map(level =>
      level.id === levelId
        ? { ...level, adminId: adminId || null, adminName: admin?.name || null }
        : level
    ));
  };

  const handleReset = () => {
    if (isViewMode) return;
    setLevels(DEFAULT_LEVELS.map(l => ({ ...l })));
  };

  const handleSubmit = () => {
    if (isViewMode || !selectedPartyId || !selectedStateId) return;

    const party = parties.find(p => p.party_id === selectedPartyId);
    const state = states.find(s => s.id === selectedStateId);

    if (!party || !state) return;

    onSubmit({
      partyId: selectedPartyId,
      partyName: party.partyName,
      stateId: selectedStateId,
      stateName: state.name,
      levels: levels.filter(l => l.isActive)
    });
  };

  const activeLevels = levels.filter(l => l.isActive);

  return (
    <div className="w-full space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isViewMode ? 'View' : initialData ? 'Edit' : ''} Party Wise Level Master Configuration
            </h1>
            <p className="text-gray-600 mt-1">
              {isViewMode
                ? 'View the organizational hierarchy configuration'
                : 'Configure organizational hierarchy for a party in a specific state'}
            </p>
          </div>
        </div>

        {/* PARTY & STATE DROPDOWN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* PARTY */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Party *
            </label>
            <select
              value={selectedPartyId || ''}
              onChange={(e) => setSelectedPartyId(Number(e.target.value))}
              disabled={isViewMode}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Select a party...</option>
              {parties.map(p => (
                <option key={p.party_id} value={p.party_id}>
                  {p.partyName} ({p.partyCode})
                </option>
              ))}
            </select>
          </div>

          {/* STATE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select State *
            </label>
            <select
              value={selectedStateId || ''}
              onChange={(e) => setSelectedStateId(Number(e.target.value))}
              disabled={isViewMode}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Select a state...</option>
              {states.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* LEVEL CONFIG */}
      {selectedPartyId && selectedStateId && (
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between mb-6">
            <h2 className="text-xl font-bold">Organizational Levels</h2>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
              {activeLevels.length} Active Levels
            </span>
          </div>

          <div className="space-y-3">
            {levels.map(level => (
              level.isActive && (
                <div key={level.id} className="flex items-center p-4 rounded-lg border">

                  {/* ORDER */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 font-bold">
                    {level.order}
                  </div>

                  {/* NAME */}
                  <div className="flex-1 ml-4">
                    <div className="font-semibold">{level.displayName}</div>
                    <div className="text-xs text-gray-500">{level.name}</div>
                  </div>

                  {/* REMOVE */}
                  {!level.isFixed && !isViewMode && (
                    <button
                      onClick={() => handleRemoveLevel(level.id)}
                      className="p-2"
                    >
                      <X className="w-5 h-5 text-gray-400 hover:text-red-500" />
                    </button>
                  )}

                  {/* ADMIN DROPDOWN */}
                  <div className="w-64 ml-4">
                    <select
                      value={level.adminId || ''}
                      onChange={(e) => handleAdminChange(level.id, e.target.value)}
                      disabled={isViewMode}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select Admin...</option>
                      {availableAdmins.map(admin => (
                        <option key={admin.id} value={admin.id}>
                          {admin.name}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
              )
            ))}
          </div>

          {/* BUTTONS */}
          <div className="flex justify-between mt-6 pt-6 border-t">
            <button
              onClick={handleReset}
              disabled={isViewMode}
              className="flex items-center px-4 py-2 border rounded-lg"
            >
              <RotateCcw className="w-4 h-4" /> Reset Levels
            </button>

            {!isViewMode && (
              <button
                onClick={handleSubmit}
                disabled={!selectedPartyId || !selectedStateId}
                className="flex items-center bg-blue-600 text-white px-6 py-2 rounded-lg"
              >
                <Save className="w-4 h-4" /> Submit
              </button>
            )}
          </div>
        </div>
      )}

      {/* INFO */}
      {(!selectedPartyId || !selectedStateId) && (
        <div className="bg-blue-50 border rounded-xl p-6 text-center">
          <p className="text-blue-700">
            Please select both Party and State to configure organizational levels
          </p>
        </div>
      )}
    </div>
  );
};

export default PartyLevelForm;
