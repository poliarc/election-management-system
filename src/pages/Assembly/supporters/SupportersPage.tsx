import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupporterList, SupporterStats } from './index';
import type { Supporter } from '../../../types/supporter';

export default function SupportersPage() {
  const navigate = useNavigate();
  const [viewingSupporter, setViewingSupporter] = useState<Supporter | null>(null);

  const handleCreate = () => {
    navigate('/assembly/supporters/add');
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supporters</h1>
          <p className="text-gray-600">Manage your supporters database</p>
        </div>
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

      <SupporterStats />

      <SupporterList 
        onEdit={handleEdit}
        onView={handleView}
      />

      {viewingSupporter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Supporter Details</h2>
              <button
                onClick={handleCloseView}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{viewingSupporter.initials} {viewingSupporter.first_name} {viewingSupporter.last_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Father's Name</label>
                  <p className="text-gray-900">{viewingSupporter.father_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <p className="text-gray-900">{viewingSupporter.date_of_birth ? new Date(viewingSupporter.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <p className="text-gray-900">{viewingSupporter.phone_no}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
                  <p className="text-gray-900">{viewingSupporter.whatsapp_no || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">EPIC ID</label>
                  <p className="text-gray-900">{viewingSupporter.voter_epic_id || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Languages</label>
                  <p className="text-gray-900">{viewingSupporter.language?.join(', ') || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Religion</label>
                  <p className="text-gray-900">{viewingSupporter.religion || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="text-gray-900">{viewingSupporter.category || 'N/A'}</p>
                </div>
                {viewingSupporter.caste && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Caste</label>
                    <p className="text-gray-900">{viewingSupporter.caste}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    viewingSupporter.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {viewingSupporter.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <p className="text-gray-900">{viewingSupporter.address}</p>
              </div>
              
              {viewingSupporter.remarks && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <p className="text-gray-900">{viewingSupporter.remarks}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assembly</label>
                  <p className="text-gray-900">{viewingSupporter.assembly_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Block</label>
                  <p className="text-gray-900">{viewingSupporter.block_name || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created By</label>
                  <p className="text-gray-900">{viewingSupporter.created_by_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created At</label>
                  <p className="text-gray-900">{new Date(viewingSupporter.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}