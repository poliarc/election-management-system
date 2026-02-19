import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SupporterList, SupporterStats } from './index';
import type { Supporter } from '../../../types/supporter';
import { useAppSelector } from '../../../store/hooks';

export default function SupportersPage() {
  const navigate = useNavigate();
  const { user, selectedAssignment } = useAppSelector((s) => s.auth);
  const [viewingSupporter, setViewingSupporter] = useState<Supporter | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneModalSupporter, setPhoneModalSupporter] = useState<Supporter | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showBlockSelectionModal, setShowBlockSelectionModal] = useState(false);
  const [selectedBlockForLink, setSelectedBlockForLink] = useState<number>(0);
  const [selectedMandalForLink, setSelectedMandalForLink] = useState<number>(0);
  const [selectedBoothForLink, setSelectedBoothForLink] = useState<number>(0);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [mandals, setMandals] = useState<any[]>([]);
  const [booths, setBooths] = useState<any[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');

  const handleCreate = () => {
    navigate('/assembly/supporters/add');
  };

  const handleGenerateLink = async () => {
    // First show block selection modal
    setShowBlockSelectionModal(true);
    setLoadingBlocks(true);
    
    try {
      // Fetch hierarchy for the assembly
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/campaigns/hierarchy?state_id=${user?.state_id || selectedAssignment?.stateMasterData_id || 0}&party_id=${user?.partyId || 0}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`
          }
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const afterAssemblyData = result.data?.afterAssemblyHierarchy || [];
          const assemblyBlocks = afterAssemblyData.filter((h: any) =>
            h.levelName === 'Block' && h.parentAssemblyId === (selectedAssignment?.stateMasterData_id || 0)
          );
          setBlocks(assemblyBlocks);
          
          // Also get mandals directly under assembly (for when no block is selected)
          const assemblyMandals = afterAssemblyData.filter((h: any) =>
            h.levelName === 'Mandal' && h.parentAssemblyId === (selectedAssignment?.stateMasterData_id || 0)
          );
          setMandals(assemblyMandals);
        }
      }
    } catch (error) {
      console.error('Failed to fetch hierarchy:', error);
      toast.error('Failed to load hierarchy data');
    } finally {
      setLoadingBlocks(false);
    }
  };

  const handleBlockChange = (blockId: number) => {
    setSelectedBlockForLink(blockId);
    setSelectedMandalForLink(0);
    setSelectedBoothForLink(0);
    
    if (blockId > 0) {
      // Filter mandals under selected block
      fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/campaigns/hierarchy?state_id=${user?.state_id || selectedAssignment?.stateMasterData_id || 0}&party_id=${user?.partyId || 0}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`
          }
        }
      ).then(res => res.json()).then(result => {
        if (result.success) {
          const afterAssemblyData = result.data?.afterAssemblyHierarchy || [];
          const filteredMandals = afterAssemblyData.filter((h: any) =>
            h.levelName === 'Mandal' && h.parentId === blockId
          );
          setMandals(filteredMandals);
        }
      });
    } else {
      // Show assembly-level mandals
      fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/campaigns/hierarchy?state_id=${user?.state_id || selectedAssignment?.stateMasterData_id || 0}&party_id=${user?.partyId || 0}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`
          }
        }
      ).then(res => res.json()).then(result => {
        if (result.success) {
          const afterAssemblyData = result.data?.afterAssemblyHierarchy || [];
          const assemblyMandals = afterAssemblyData.filter((h: any) =>
            h.levelName === 'Mandal' && h.parentAssemblyId === (selectedAssignment?.stateMasterData_id || 0)
          );
          setMandals(assemblyMandals);
        }
      });
    }
    setBooths([]);
  };

  const handleMandalChange = (mandalId: number) => {
    setSelectedMandalForLink(mandalId);
    setSelectedBoothForLink(0);
    
    if (mandalId > 0) {
      // Fetch booths under selected mandal
      fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/campaigns/hierarchy?state_id=${user?.state_id || selectedAssignment?.stateMasterData_id || 0}&party_id=${user?.partyId || 0}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_access_token')}`
          }
        }
      ).then(res => res.json()).then(result => {
        if (result.success) {
          const afterAssemblyData = result.data?.afterAssemblyHierarchy || [];
          const filteredBooths = afterAssemblyData.filter((h: any) =>
            h.levelName === 'Booth' && h.parentId === mandalId
          );
          setBooths(filteredBooths);
        }
      });
    } else {
      setBooths([]);
    }
  };

  const handleConfirmBlockAndGenerateLink = () => {
    const selectedBlock = blocks.find(b => b.id === selectedBlockForLink);
    const selectedMandal = mandals.find(m => m.id === selectedMandalForLink);
    const selectedBooth = booths.find(b => b.id === selectedBoothForLink);
    
    // Generate public registration link with user's information including optional hierarchy
    const params = new URLSearchParams({
      party_id: (user?.partyId || 0).toString(),
      party_name: user?.partyName || 'Party',
      state_id: (user?.state_id || selectedAssignment?.stateMasterData_id || 0).toString(),
      state_name: user?.stateName || selectedAssignment?.stateName || 'State',
      district_id: (selectedAssignment?.parentId || 0).toString(),
      district_name: selectedAssignment?.parentLevelName || selectedAssignment?.districtName || 'District',
      assembly_id: (selectedAssignment?.stateMasterData_id || 0).toString(),
      assembly_name: selectedAssignment?.levelName || selectedAssignment?.displayName || 'Assembly',
      created_by: (user?.id || 0).toString(),
      created_by_name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    });

    // Add optional hierarchy levels
    if (selectedBlockForLink > 0) {
      params.append('block_id', selectedBlockForLink.toString());
      params.append('block_name', selectedBlock?.displayName || selectedBlock?.levelName || 'Block');
    }
    if (selectedMandalForLink > 0) {
      params.append('mandal_id', selectedMandalForLink.toString());
      params.append('mandal_name', selectedMandal?.displayName || selectedMandal?.levelName || 'Mandal');
    }
    if (selectedBoothForLink > 0) {
      params.append('booth_id', selectedBoothForLink.toString());
      params.append('booth_name', selectedBooth?.displayName || selectedBooth?.levelName || 'Booth');
    }

    const link = `${window.location.origin}/supporter/register?${params.toString()}`;
    setGeneratedLink(link);
    setShowBlockSelectionModal(false);
    setShowLinkModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link copied to clipboard!');
  };

  const handleCloseLinkModal = () => {
    setShowLinkModal(false);
    setGeneratedLink('');
  };

  const handleEdit = (supporter: Supporter) => {
    navigate(`/assembly/supporters/edit/${supporter.supporter_id}`);
  };

  const handleView = (supporter: Supporter) => {
    setViewingSupporter(supporter);
  };

  const handleCloseView = () => {
    setViewingSupporter(null);
  };

  const handleShowPhone = (supporter: Supporter) => {
    setPhoneModalSupporter(supporter);
    setShowPhoneModal(true);
  };

  const handleClosePhoneModal = () => {
    setShowPhoneModal(false);
    setPhoneModalSupporter(null);
  };

  // Helper function to format language data
  const formatLanguages = (language: any): string => {
    if (!language) return 'N/A';

    if (typeof language === 'string') {
      return language;
    }

    if (Array.isArray(language)) {
      return language.join(', ');
    }

    if (typeof language === 'object' && language.primary) {
      const languages = [language.primary];
      if (language.secondary && Array.isArray(language.secondary)) {
        languages.push(...language.secondary);
      }
      return languages.join(', ');
    }

    return 'N/A';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supporters</h1>
          <p className="text-gray-600">Manage your supporters database</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateLink}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            title="Generate a public link to share for supporter registration"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Generate Public Link
          </button>
          <button
            onClick={handleCreate}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 5v14m-7-7h14" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Add Supporter
          </button>
        </div>
      </div>

      <SupporterStats />

      <SupporterList
        onEdit={handleEdit}
        onView={handleView}
        onShowPhone={handleShowPhone}
      />

      {/* Block Selection Modal */}
      {showBlockSelectionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Select Location for Registration Link</h3>
                <p className="text-sm text-gray-600 mt-1">Choose hierarchy levels for the registration link</p>
              </div>
              <button
                onClick={() => {
                  setShowBlockSelectionModal(false);
                  setSelectedBlockForLink(0);
                  setSelectedMandalForLink(0);
                  setSelectedBoothForLink(0);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {loadingBlocks ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading hierarchy...</p>
                </div>
              ) : (
                <>
                  {/* Pre-filled Location (Disabled) */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Pre-filled Location</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                        <input
                          type="text"
                          value={user?.stateName || selectedAssignment?.stateName || 'State'}
                          disabled
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">District</label>
                        <input
                          type="text"
                          value={selectedAssignment?.parentLevelName || selectedAssignment?.districtName || 'District'}
                          disabled
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Assembly</label>
                        <input
                          type="text"
                          value={selectedAssignment?.levelName || selectedAssignment?.displayName || 'Assembly'}
                          disabled
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hierarchy Selection */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Hierarchy Levels</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Block Dropdown - Required */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Block <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedBlockForLink}
                          onChange={(e) => handleBlockChange(parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value={0}>Select Block</option>
                          {blocks.map((block) => (
                            <option key={block.id} value={block.id}>
                              {block.displayName || block.levelName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Mandal Dropdown */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mandal <span className="text-gray-400">(Optional)</span>
                        </label>
                        <select
                          value={selectedMandalForLink}
                          onChange={(e) => handleMandalChange(parseInt(e.target.value))}
                          disabled={mandals.length === 0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-600"
                        >
                          <option value={0}>Select Mandal</option>
                          {mandals.map((mandal) => (
                            <option key={mandal.id} value={mandal.id}>
                              {mandal.displayName || mandal.levelName}
                            </option>
                          ))}
                        </select>
                        {mandals.length === 0 && (
                          <p className="text-xs text-gray-500 mt-1">No mandals available</p>
                        )}
                      </div>

                      {/* Booth Dropdown */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Booth <span className="text-gray-400">(Optional)</span>
                        </label>
                        <select
                          value={selectedBoothForLink}
                          onChange={(e) => setSelectedBoothForLink(parseInt(e.target.value))}
                          disabled={booths.length === 0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-600"
                        >
                          <option value={0}>Select Booth</option>
                          {booths.map((booth) => (
                            <option key={booth.id} value={booth.id}>
                              {booth.displayName || booth.levelName}
                            </option>
                          ))}
                        </select>
                        {booths.length === 0 && selectedMandalForLink === 0 && (
                          <p className="text-xs text-gray-500 mt-1">Select a mandal first</p>
                        )}
                        {booths.length === 0 && selectedMandalForLink > 0 && (
                          <p className="text-xs text-gray-500 mt-1">No booths available</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" strokeWidth={2} />
                        <path d="M12 16v-4M12 8h.01" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-sm text-blue-800">
                        Block selection is required. Mandal and Booth are optional. Supporters registered through this link will be pre-filled with the selected levels.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowBlockSelectionModal(false);
                        setSelectedBlockForLink(0);
                        setSelectedMandalForLink(0);
                        setSelectedBoothForLink(0);
                      }}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmBlockAndGenerateLink}
                      disabled={selectedBlockForLink === 0}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Generate Link
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Link Generation Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Public Supporter Registration Link</h3>
                <p className="text-sm text-gray-600 mt-1">Share this link to allow others to register supporters on your behalf</p>
              </div>
              <button
                onClick={handleCloseLinkModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Generated Link:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={generatedLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    <path d="M12 16v-4M12 8h.01" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">How it works:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Share this link via WhatsApp, SMS, or social media</li>
                      <li>Anyone with the link can register supporters</li>
                      <li>All supporters registered through this link will be credited to you</li>
                      <li>The link contains your assembly and user information</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseLinkModal}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingSupporter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* <div className="bg-white bg-opacity-20 rounded-full p-2">
                    <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div> */}
                  <div>
                    <h2 className="text-xl font-bold text-white">Supporter Details</h2>
                    <p className="text-indigo-100 text-sm">Complete profile information</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseView}
                  className="text-white hover:text-indigo-200 transition-colors"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 6L6 18M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 text-indigo-600 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <p className="text-gray-900 font-medium">{viewingSupporter.initials} {viewingSupporter.first_name} {viewingSupporter.last_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                    <p className="text-gray-900">{viewingSupporter.father_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <p className="text-gray-900">{viewingSupporter.date_of_birth ? new Date(viewingSupporter.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <p className="text-gray-900">{viewingSupporter.age || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <p className="text-gray-900">{viewingSupporter.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">EPIC ID</label>
                    <p className="text-gray-900">{viewingSupporter.voter_epic_id || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Cultural Information */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 text-green-600 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3s-4.5 4.03-4.5 9 2.015 9 4.5 9Z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Cultural Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                    <p className="text-gray-900">{formatLanguages(viewingSupporter.language)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                    <p className="text-gray-900">{viewingSupporter.religion || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <p className="text-gray-900">{viewingSupporter.category || 'N/A'}</p>
                  </div>
                  {viewingSupporter.caste && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Caste</label>
                      <p className="text-gray-900">{viewingSupporter.caste}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 text-yellow-600 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="10" r="3" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Address & Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <p className="text-gray-900">{viewingSupporter.address}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assembly</label>
                    <p className="text-gray-900">{viewingSupporter.assembly_name}</p>
                    {viewingSupporter.block_name && (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-1 mt-2">Block</label>
                        <p className="text-gray-900">{viewingSupporter.block_name}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Record Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 text-gray-600 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Record Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                    <p className="text-gray-900">{viewingSupporter.created_by_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                    <p className="text-gray-900">{new Date(viewingSupporter.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {viewingSupporter.remarks && (
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 text-orange-600 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Remarks
                  </h3>
                  <p className="text-gray-900">{viewingSupporter.remarks}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phone Modal */}
      {showPhoneModal && phoneModalSupporter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
              <button
                onClick={handleClosePhoneModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <svg className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                </div>
                <p className="text-lg font-semibold text-gray-900 ml-7">{phoneModalSupporter.phone_no}</p>
              </div>

              {phoneModalSupporter.whatsapp_no && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg className="h-5 w-5 text-green-600 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <label className="text-sm font-medium text-gray-700">WhatsApp Number</label>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 ml-7">{phoneModalSupporter.whatsapp_no}</p>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  For {phoneModalSupporter.initials} {phoneModalSupporter.first_name} {phoneModalSupporter.last_name}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}