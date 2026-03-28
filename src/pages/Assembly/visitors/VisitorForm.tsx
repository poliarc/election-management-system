import React, { useState, useEffect } from 'react';
import { useCreateVisitorMutation, useUpdateVisitorMutation, useGetStateMasterDataQuery, useGetAssemblyUsersQuery } from '../../../store/api/visitorsApi';
import { useAppSelector } from '../../../store/hooks';
import type { Visitor, CreateVisitorRequest, UpdateVisitorRequest } from '../../../types/visitor';
import { useTranslation } from "react-i18next";

interface VisitorFormProps {
  visitor?: Visitor | null;
  onClose: () => void;
}

const VisitorForm: React.FC<VisitorFormProps> = ({ visitor, onClose }) => {
  const { t } = useTranslation();
  const { selectedAssignment, user } = useAppSelector((state) => state.auth);
  const [createVisitor, { isLoading: isCreating }] = useCreateVisitorMutation();
  const [updateVisitor, { isLoading: isUpdating }] = useUpdateVisitorMutation();
  const { data: stateMasterData } = useGetStateMasterDataQuery();

  // Get party ID from localStorage
  const getPartyId = () => {
    try {
      const authState = localStorage.getItem('auth_state');
      if (authState) {
        const parsed = JSON.parse(authState);
        return parsed?.user?.partyId || 1;
      }
    } catch (error) {
      console.error('Error reading partyId from localStorage:', error);
    }
    return 1;
  };

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    state_id: 0,
    district_id: 0,
    assembly_id: selectedAssignment?.stateMasterData_id || 0,
    date_of_visit: '',
    place_of_visit: '',
    no_of_persons: 1,
    purpose_of_visit: '',
    follow_up_date: '',
    assembly_user_id: user?.id || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get states, districts, and assemblies from master data
  const states = stateMasterData?.data?.filter(item => item.levelType === 'State') || [];
  const districts = stateMasterData?.data?.filter(item =>
    item.levelType === 'District' && item.ParentId === formData.state_id
  ) || [];
  const assemblies = stateMasterData?.data?.filter(item =>
    item.levelType === 'Assembly' && item.ParentId === formData.district_id
  ) || [];

  // Get assembly users for the current user's assembly (not the selected assembly in form)
  const currentAssemblyId = selectedAssignment?.stateMasterData_id || 0;
  const { data: assemblyUsersData, isLoading: usersLoading, error: usersError } = useGetAssemblyUsersQuery(currentAssemblyId, {
    skip: !currentAssemblyId,
  });
  // Extract users from the response structure
  const assemblyUsers = assemblyUsersData?.data?.users || [];

  // Initialize form data when editing
  useEffect(() => {
    if (visitor) {
      setFormData({
        name: visitor.name,
        phone: visitor.phone,
        email: visitor.email || '',
        state_id: visitor.state_id,
        district_id: visitor.district_id,
        assembly_id: visitor.assembly_id,
        date_of_visit: visitor.date_of_visit.split('T')[0], // Convert to YYYY-MM-DD
        place_of_visit: visitor.place_of_visit,
        no_of_persons: visitor.no_of_persons,
        purpose_of_visit: visitor.purpose_of_visit,
        follow_up_date: visitor.follow_up_date ? visitor.follow_up_date.split('T')[0] : '', // Convert to YYYY-MM-DD
        assembly_user_id: visitor.assembly_user_id,
      });
    }
  }, [visitor]);

  // Set default state and district based on assembly when data is loaded
  useEffect(() => {
    if (stateMasterData?.data && formData.assembly_id && !visitor) {
      const assembly = stateMasterData.data.find(item => item.id === formData.assembly_id && item.levelType === 'Assembly');
      if (assembly) {
        const district = stateMasterData.data.find(item => item.id === assembly.ParentId && item.levelType === 'District');
        if (district) {
          const state = stateMasterData.data.find(item => item.id === district.ParentId && item.levelType === 'State');
          if (state) {
            setFormData(prev => ({
              ...prev,
              state_id: state.id,
              district_id: district.id,
            }));
          }
        }
      }
    }
  }, [stateMasterData, formData.assembly_id, visitor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Special handling for phone number
    if (name === 'phone') {
      // Only allow digits and limit to 10 characters
      const phoneValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: phoneValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'state_id' || name === 'district_id' || name === 'assembly_id' || name === 'assembly_user_id' || name === 'no_of_persons'
          ? parseInt(value) || 0
          : value
      }));
    }

    // Clear related fields when parent changes
    if (name === 'state_id') {
      setFormData(prev => ({ ...prev, district_id: 0, assembly_id: 0 }));
    } else if (name === 'district_id') {
      setFormData(prev => ({ ...prev, assembly_id: 0 }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = t("visitorForm.errNameRequired");
    if (!formData.phone.trim()) newErrors.phone = t("visitorForm.errPhoneRequired");
    if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = t("visitorForm.errPhoneMustBe10Digits");
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t("visitorForm.errInvalidEmail");
    if (!formData.state_id) newErrors.state_id = t("visitorForm.errStateRequired");
    if (!formData.district_id) newErrors.district_id = t("visitorForm.errDistrictRequired");
    if (!formData.assembly_id) newErrors.assembly_id = t("visitorForm.errAssemblyRequired");
    if (!formData.date_of_visit) newErrors.date_of_visit = t("visitorForm.errVisitDateRequired");
    if (!formData.place_of_visit.trim()) newErrors.place_of_visit = t("visitorForm.errPlaceOfVisitRequired");
    if (formData.no_of_persons < 1) newErrors.no_of_persons = t("visitorForm.errNoOfPersonsMin");
    if (!formData.purpose_of_visit.trim()) newErrors.purpose_of_visit = t("visitorForm.errPurposeRequired");
    if (formData.follow_up_date && formData.follow_up_date < new Date().toISOString().split('T')[0]) {
      newErrors.follow_up_date = t("visitorForm.errFollowUpDatePast");
    }
    if (!formData.assembly_user_id) {
      newErrors.assembly_user_id = t("visitorForm.errMeetingWithRequired");
    } else {
      // Validate that the selected assembly_user_id exists in the current assembly users
      const userExists = assemblyUsers.some(user => user.user_id === formData.assembly_user_id);
      if (!userExists) {
        newErrors.assembly_user_id = t("visitorForm.errSelectedUserInvalid");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Helper function to remove empty optional fields
      const cleanData = (data: any) => {
        const cleaned = { ...data };
        if (!cleaned.follow_up_date?.trim()) {
          delete cleaned.follow_up_date;
        }
        if (!cleaned.email?.trim()) {
          delete cleaned.email;
        }
        return cleaned;
      };

      if (visitor) {
        // Update existing visitor
        const updateData = cleanData(formData) as UpdateVisitorRequest;
        await updateVisitor({ id: visitor.visitor_id, visitor: updateData }).unwrap();
      } else {
        // Create new visitor
        const createData = cleanData({
          ...formData,
          party_id: getPartyId(),
        }) as CreateVisitorRequest;
        await createVisitor(createData).unwrap();
      }
      onClose();
    } catch (error: any) {
      console.error('Failed to save visitor:', error);
      if (error.data?.errors) {
        const apiErrors: Record<string, string> = {};
        error.data.errors.forEach((err: any) => {
          apiErrors[err.field] = err.message;
        });
        setErrors(apiErrors);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-color)]">
              {visitor ? t("visitorForm.titleEditVisitor") : t("visitorForm.titleAddNewVisitor")}
            </h1>
            <p className="text-[var(--text-secondary)]">
              {visitor ? t("visitorForm.subtitleEdit") : t("visitorForm.subtitleAdd")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-secondary)]"
            aria-label={t("visitorForm.btnClose")}
            title={t("visitorForm.btnClose")}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-6">
            <h3 className="text-lg font-medium text-[var(--text-color)] mb-4">{t("visitorForm.sectionPersonalInformation")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  {t("visitorForm.lblNameRequired")}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder={t("visitorForm.phEnterVisitorName")}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  {t("visitorForm.lblPhoneRequired")}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  maxLength={10}
                  pattern="[0-9]{10}"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder={t("visitorForm.phEnter10DigitPhone")}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              {/* <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address (optional)"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div> */}
            </div>
          </div>

          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-6">
            <h3 className="text-lg font-medium text-[var(--text-color)] mb-4">{t("visitorForm.sectionLocationInformation")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  {t("visitorForm.lblStateRequired")}
                </label>
                <select
                  name="state_id"
                  value={formData.state_id}
                  onChange={handleInputChange}
                  disabled={true}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100 cursor-not-allowed ${errors.state_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  aria-label={t("visitorForm.lblStateRequired")}
                  title={t("visitorForm.lblStateRequired")}
                >
                  <option value={0}>{t("visitorForm.optSelectState")}</option>
                  {states.map(state => (
                    <option key={state.id} value={state.id}>
                      {state.levelName}
                    </option>
                  ))}
                </select>
                {errors.state_id && <p className="text-red-500 text-sm mt-1">{errors.state_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  {t("visitorForm.lblDistrictRequired")}
                </label>
                <select
                  name="district_id"
                  value={formData.district_id}
                  onChange={handleInputChange}
                  disabled={!formData.state_id}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.district_id ? 'border-red-500' : 'border-gray-300'
                    } ${!formData.state_id ? 'bg-gray-100' : ''}`}
                  aria-label={t("visitorForm.lblDistrictRequired")}
                  title={t("visitorForm.lblDistrictRequired")}
                >
                  <option value={0}>{t("visitorForm.optSelectDistrict")}</option>
                  {districts.map(district => (
                    <option key={district.id} value={district.id}>
                      {district.levelName}
                    </option>
                  ))}
                </select>
                {errors.district_id && <p className="text-red-500 text-sm mt-1">{errors.district_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  {t("visitorForm.lblAssemblyRequired")}
                </label>
                <select
                  name="assembly_id"
                  value={formData.assembly_id}
                  onChange={handleInputChange}
                  disabled={!formData.district_id}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.assembly_id ? 'border-red-500' : 'border-gray-300'
                    } ${!formData.district_id ? 'bg-gray-100' : ''}`}
                  aria-label={t("visitorForm.lblAssemblyRequired")}
                  title={t("visitorForm.lblAssemblyRequired")}
                >
                  <option value={0}>{t("visitorForm.optSelectAssembly")}</option>
                  {assemblies.map(assembly => (
                    <option key={assembly.id} value={assembly.id}>
                      {assembly.levelName}
                    </option>
                  ))}
                </select>
                {errors.assembly_id && <p className="text-red-500 text-sm mt-1">{errors.assembly_id}</p>}
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] p-6">
            <h3 className="text-lg font-medium text-[var(--text-color)] mb-4">{t("visitorForm.sectionVisitInformation")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  {t("visitorForm.lblDateOfVisitRequired")}
                </label>
                <input
                  type="date"
                  name="date_of_visit"
                  value={formData.date_of_visit}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.date_of_visit ? 'border-red-500' : 'border-gray-300'
                    }`}
                  aria-label={t("visitorForm.lblDateOfVisitRequired")}
                  title={t("visitorForm.lblDateOfVisitRequired")}
                />
                {errors.date_of_visit && <p className="text-red-500 text-sm mt-1">{errors.date_of_visit}</p>}
              </div>



              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  {t("visitorForm.lblPlaceOfVisitRequired")}
                </label>
                <input
                  type="text"
                  name="place_of_visit"
                  value={formData.place_of_visit}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.place_of_visit ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder={t("visitorForm.phEnterPlaceOfVisit")}
                />
                {errors.place_of_visit && <p className="text-red-500 text-sm mt-1">{errors.place_of_visit}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  {t("visitorForm.lblNumberOfPersonsRequired")}
                </label>
                <input
                  type="number"
                  name="no_of_persons"
                  value={formData.no_of_persons}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.no_of_persons ? 'border-red-500' : 'border-gray-300'
                    }`}
                  aria-label={t("visitorForm.lblNumberOfPersonsRequired")}
                  title={t("visitorForm.lblNumberOfPersonsRequired")}
                />
                {errors.no_of_persons && <p className="text-red-500 text-sm mt-1">{errors.no_of_persons}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  {t("visitorForm.lblMeetingWithRequired")}
                </label>
                {/* Assembly users are always from the current user's assembly panel, not the selected assembly in the form */}
                <select
                  name="assembly_user_id"
                  value={formData.assembly_user_id}
                  onChange={handleInputChange}
                  disabled={usersLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.assembly_user_id ? 'border-red-500' : 'border-gray-300'
                    } ${usersLoading ? 'bg-gray-100' : ''}`}
                  aria-label={t("visitorForm.lblMeetingWithRequired")}
                  title={t("visitorForm.lblMeetingWithRequired")}
                >
                  <option value={0}>
                    {usersLoading ? t("visitorForm.loadingUsers") : t("visitorForm.optSelectUser")}
                  </option>
                  {assemblyUsers.map(user => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </option>
                  ))}
                </select>
                {errors.assembly_user_id && <p className="text-red-500 text-sm mt-1">{errors.assembly_user_id}</p>}
                {usersError && (
                  <p className="text-red-500 text-sm mt-1">
                    {t("visitorForm.errorLoadingUsers", { message: usersError.toString() })}
                  </p>
                )}
                {!usersLoading && assemblyUsers.length === 0 && (
                  <p className="text-yellow-600 text-sm mt-1">
                    {t("visitorForm.noUsersFoundForAssembly")}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  {t("visitorForm.lblPurposeOfVisitRequired")}
                </label>
                <textarea
                  name="purpose_of_visit"
                  value={formData.purpose_of_visit}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.purpose_of_visit ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder={t("visitorForm.phEnterPurposeOfVisit")}
                />
                {errors.purpose_of_visit && <p className="text-red-500 text-sm mt-1">{errors.purpose_of_visit}</p>}
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  name="follow_up_date"
                  value={formData.follow_up_date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.follow_up_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.follow_up_date && <p className="text-red-500 text-sm mt-1">{errors.follow_up_date}</p>}
              </div> */}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[var(--text-secondary)] bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {t("visitorForm.btnCancel")}
            </button>
            <button
              type="submit"
              disabled={isCreating || isUpdating}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isCreating || isUpdating
                ? t("visitorForm.saving")
                : visitor
                ? t("visitorForm.btnUpdateVisitor")
                : t("visitorForm.btnCreateVisitor")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VisitorForm;
