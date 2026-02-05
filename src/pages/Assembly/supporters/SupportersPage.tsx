import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupporterList, SupporterStats } from './index';
import type { Supporter } from '../../../types/supporter';

export default function SupportersPage() {
  const navigate = useNavigate();
  const [viewingSupporter, setViewingSupporter] = useState<Supporter | null>(null);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneModalSupporter, setPhoneModalSupporter] = useState<Supporter | null>(null);

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
        onShowPhone={handleShowPhone}
      />

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