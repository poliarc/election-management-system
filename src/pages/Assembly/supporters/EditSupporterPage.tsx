import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from "react-i18next";
import {
  useGetSupporterByIdQuery,
  useUpdateSupporterMutation,
  useGetHierarchyQuery
} from '../../../store/api/supportersApi';
import { useAppSelector } from '../../../store/hooks';
import type { UpdateSupporterRequest } from '../../../types/supporter';
import type { AfterAssemblyHierarchyNode } from '../../../types/campaign';

// Constants for dropdown options
const INITIALS_OPTIONS = ['Mr', 'Ms', 'Mrs', 'Dr'];

const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;

const LANGUAGE_OPTIONS = [
  'Assamese', 'Bengali', 'Bodo', 'Sadri', 'English', 'Hindi',
  'Garo', 'Nepali', 'Manipuri', 'Karbi', 'Rabha', 'Mishing',
  'Deori', 'Tiwa', 'Dimasa', 'Others'
];

const RELIGION_OPTIONS = [
  'Hindu', 'Islam', 'Christianity', 'Buddhism', 'Jainism', 'Sikhism', 'Others'
];

const HINDU_CATEGORIES = ['General', 'OBC', 'SC', 'ST'];

const CASTE_OPTIONS = {
  General: ['Brahmin', 'Gosain', 'Kalita', 'Kshatriya', 'Kayastha', 'Vaishya', 'Keot'],
  OBC: ['AHOM', 'Chutia', 'Chowdang', 'Bishnupriya Manipuri','Manipuri', 'Moran', 'Matak', 'Nepali', 'Koch Rajbonshi', 'Adivashi Tea Tribes', 'Nath Jogi', 'Others'],
  SC: ['Namasudra', 'Kaibarta', 'Muchi', 'Hira', 'Patni', 'Sutradhar', 'Jhalo Malo', 'Bania', 'Mali', 'Dhubi', 'Bansphor', 'Bhangi', 'Dholi', 'Mahara', 'Jalkeot', 'Lalbegi', 'Others'],
  ST: ['Boro', 'Dimasa', 'Karbi', 'Rabha', 'Mising', 'Tiwa', 'Deuri', 'Thengal Kachari', 'Sonowal Kachari', 'Others']
};

const RELIGION_CATEGORIES = {
  Islam: ['Shia', 'Sunni', 'Others'],
  Christianity: ['Catholic', 'Protestant', 'Others'],
  Buddhism: ['Theravada', 'Mahayana', 'Others'],
  Jainism: ['Shwetambar', 'Digambar', 'Others'],
  Sikhism: ['Khalsa', 'Namdhari', 'Nirankari', 'Udasi', 'Nirmala', 'Others'],
  Others: ['Others']
};

export default function EditSupporterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const supporterId = parseInt(id || '0');
  const { user } = useAppSelector((s) => s.auth);

  const { data: supporter, isLoading: supporterLoading } = useGetSupporterByIdQuery(supporterId, {
    skip: !supporterId,
  });

  // Fetch hierarchy data
  const { data: hierarchyData } = useGetHierarchyQuery({
    state_id: user?.state_id || 0,
    party_id: user?.partyId || 0,
  }, {
    skip: !user?.state_id || !user?.partyId,
  });

  const [formData, setFormData] = useState({
    initials: '',
    first_name: '',
    last_name: '',
    father_name: '',
    date_of_birth: '',
    age: 0,
    gender: '' as 'Male' | 'Female' | 'Other' | '',
    phone_no: '',
    whatsapp_no: '',
    voter_epic_id: '',
    address: '',
    language: [] as string[],
    religion: '',
    category: '',
    caste: '',
    remarks: '',
    // Hierarchy fields
    party_id: user?.partyId || 0,
    state_id: user?.state_id || 0,
    district_id: 0,
    assembly_id: 0,
    block_id: 0,
    mandal_id: 0,
    booth_id: 0,
  });

  // Dynamic after-assembly selections stored in BOTH state (for UI) and ref (for submit)
  // Ref ensures submit always reads the latest value regardless of re-renders
  const [afterAssemblySelections, setAfterAssemblySelections] = useState<number[]>([]);
  const afterAssemblySelectionsRef = useRef<number[]>([]);

  const updateAfterAssemblySelections = (val: number[]) => {
    afterAssemblySelectionsRef.current = val;
    setAfterAssemblySelections(val);
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Track if we have already initialized selections from supporter data
  const selectionsInitialized = useRef(false);

  const [updateSupporter, { isLoading: isUpdating }] = useUpdateSupporterMutation();

  // Function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  useEffect(() => {
    if (supporter) {
      // Helper function to normalize language to array
      const normalizeLanguage = (lang: any): string[] => {
        console.log('Original language data:', lang);
        if (!lang) return [];

        // If it's a JSON string, parse it first
        if (typeof lang === 'string') {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(lang);
            if (Array.isArray(parsed)) {
              console.log('Parsed JSON array:', parsed);
              return parsed;
            }
            // If not an array after parsing, treat as single string
            return [lang];
          } catch (e) {
            // If JSON parsing fails, treat as single string
            return [lang];
          }
        }

        if (Array.isArray(lang)) return lang;
        if (typeof lang === 'object' && lang.primary) {
          const languages = [lang.primary];
          if (lang.secondary && Array.isArray(lang.secondary)) {
            languages.push(...lang.secondary);
          }
          return languages;
        }
        return [];
      };

      const normalizedLanguages = normalizeLanguage(supporter.language);
      console.log('Normalized languages:', normalizedLanguages);

      setFormData({
        initials: supporter.initials || '',
        first_name: supporter.first_name || '',
        last_name: supporter.last_name || '',
        father_name: supporter.father_name || '',
        date_of_birth: supporter.date_of_birth || '',
        age: supporter.age || calculateAge(supporter.date_of_birth || ''),
        gender: supporter.gender || '',
        phone_no: supporter.phone_no || '',
        whatsapp_no: supporter.whatsapp_no || '',
        voter_epic_id: supporter.voter_epic_id || '',
        address: supporter.address || '',
        language: normalizedLanguages,
        religion: supporter.religion || '',
        category: supporter.category || '',
        caste: supporter.caste || '',
        remarks: supporter.remarks || '',
        // Hierarchy fields
        party_id: supporter.party_id || user?.partyId || 0,
        state_id: supporter.state_id || user?.state_id || 0,
        district_id: supporter.district_id || 0,
        assembly_id: supporter.assembly_id || 0,
        block_id: supporter.block_id || 0,
        mandal_id: supporter.mandal_id || 0,
        booth_id: supporter.booth_id || 0,
      });

      // Initialize afterAssemblySelections from new after_assembly_levels or legacy fields
      // Only run ONCE — guard against re-initialization when invalidatesTags triggers refetch
      if (!selectionsInitialized.current) {
        let sel: number[] = [];
        if (supporter.after_assembly_levels?.length) {
          const sorted = [...supporter.after_assembly_levels].sort((a: any, b: any) => a.depth - b.depth);
          sel = sorted.map((lvl: any) => Number(lvl.after_assembly_data_id));
          console.log('[EditSupporter] Initializing from after_assembly_levels:', sel);
        } else {
          if (supporter.block_id) sel.push(Number(supporter.block_id));
          if (supporter.mandal_id) sel.push(Number(supporter.mandal_id));
          if (supporter.booth_id) sel.push(Number(supporter.booth_id));
          console.log('[EditSupporter] Initializing from legacy fields:', sel);
        }
        console.log('[EditSupporter] Final sel array:', JSON.stringify(sel), 'length:', sel.length);
        setAfterAssemblySelections([...sel]);
        selectionsInitialized.current = true;
        afterAssemblySelectionsRef.current = [...sel];
      }
    }
  }, [supporter, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Handle numeric-only fields (phone numbers)
    if (name === 'phone_no' || name === 'whatsapp_no') {
      // Only allow digits
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
      return;
    }

    // Handle EPIC ID - allow alphanumeric characters only and convert to uppercase
    if (name === 'voter_epic_id') {
      // Only allow alphanumeric characters (A-Z, 0-9)
      const alphanumericValue = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      setFormData(prev => ({ ...prev, [name]: alphanumericValue }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
      return;
    }

    // Handle cascading dropdowns — legacy block_id/mandal_id/booth_id removed, now handled by afterAssemblySelections
    if (name === 'religion') {
      // Reset category and caste when religion changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        category: '',
        caste: ''
      }));
    } else if (name === 'category') {
      // Reset caste when category changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        caste: ''
      }));
    } else if (name === 'date_of_birth') {
      // Auto-calculate age when date of birth changes
      const age = calculateAge(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        age: age
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLanguageChange = (language: string) => {
    setFormData(prev => ({
      ...prev,
      language: prev.language.includes(language)
        ? prev.language.filter(l => l !== language)
        : [...prev.language, language]
    }));
  };

  // Get available categories based on religion
  const getAvailableCategories = () => {
    if (formData.religion === 'Hindu') {
      return HINDU_CATEGORIES;
    } else if (RELIGION_CATEGORIES[formData.religion as keyof typeof RELIGION_CATEGORIES]) {
      return RELIGION_CATEGORIES[formData.religion as keyof typeof RELIGION_CATEGORIES];
    }
    return [];
  };

  // Get available castes based on category (only for Hindu)
  const getAvailableCastes = () => {
    if (formData.religion === 'Hindu' && CASTE_OPTIONS[formData.category as keyof typeof CASTE_OPTIONS]) {
      return CASTE_OPTIONS[formData.category as keyof typeof CASTE_OPTIONS];
    }
    return [];
  };

  // All after-assembly nodes for this party
  const afterAssemblyData: AfterAssemblyHierarchyNode[] =
    (hierarchyData?.data?.afterAssemblyHierarchy || []) as AfterAssemblyHierarchyNode[];

  // ── Dynamic levels ────────────────────────────────────────────────────────
  const dynamicLevels = useMemo(() => {
    if (!afterAssemblyData.length) return [];
    const depthMap = new Map<number, number>();
    const getDepth = (node: AfterAssemblyHierarchyNode): number => {
      if (depthMap.has(node.id)) return depthMap.get(node.id)!;
      if (node.parentId === null) { depthMap.set(node.id, 0); return 0; }
      const parent = afterAssemblyData.find(n => n.id === node.parentId);
      const d = parent ? getDepth(parent) + 1 : 0;
      depthMap.set(node.id, d);
      return d;
    };
    afterAssemblyData.forEach(getDepth);
    const byDepth = new Map<number, { label: string; nodes: AfterAssemblyHierarchyNode[] }>();
    afterAssemblyData.forEach(node => {
      const d = depthMap.get(node.id) ?? 0;
      if (!byDepth.has(d)) byDepth.set(d, { label: node.display_level_name || node.levelName, nodes: [] });
      byDepth.get(d)!.nodes.push(node);
    });
    return Array.from(byDepth.entries())
      .sort(([a], [b]) => a - b)
      .map(([depth, { label, nodes }]) => ({ depth, label, nodes }));
  }, [afterAssemblyData]);

  // When dynamicLevels load, ensure afterAssemblySelections has enough slots
  // but DO NOT reset existing valid values
  useEffect(() => {
    if (dynamicLevels.length > 0 && selectionsInitialized.current) {
      const curr = afterAssemblySelectionsRef.current;
      if (curr.length < dynamicLevels.length) {
        const next = [...curr];
        while (next.length < dynamicLevels.length) next.push(0);
        updateAfterAssemblySelections(next);
      }
    }
  }, [dynamicLevels.length]);

  // Cascaded options per depth
  const visibleOptions = useMemo(() => {
    return dynamicLevels.map(({ depth, nodes }) => {
      if (depth === 0) return nodes.filter(n => n.parentAssemblyId === formData.assembly_id);
      const parentId = afterAssemblySelections[depth - 1];
      if (!parentId) return [];
      return nodes.filter(n => n.parentId === parentId);
    });
  }, [dynamicLevels, afterAssemblySelections, formData.assembly_id]);

  // Deepest selected id sent as block_id (existing API contract)
  const deepestSelectedId = [...afterAssemblySelections].reverse().find(id => id > 0) || 0;

  // Check if dropdowns should be enabled
  const isDropdownEnabled = !!hierarchyData && !isUpdating;

  // Check if caste should be shown (only for Hindu religion)
  const shouldShowCaste = formData.religion === 'Hindu' && formData.category && getAvailableCastes().length > 0;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.initials.trim()) {
      newErrors.initials = t("editSupporter.errInitialsRequired");
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = t("editSupporter.errFirstNameRequired");
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = t("editSupporter.errLastNameRequired");
    }

    if (!formData.father_name.trim()) {
      newErrors.father_name = t("editSupporter.errFatherNameRequired");
    }

    if (!formData.date_of_birth.trim()) {
      newErrors.date_of_birth = t("editSupporter.errDateOfBirthRequired");
    }

    if (!formData.gender.trim()) {
      newErrors.gender = t("editSupporter.errGenderRequired");
    }

    if (!formData.phone_no.trim()) {
      newErrors.phone_no = t("editSupporter.errPhoneRequired");
    } else if (!/^\d{10}$/.test(formData.phone_no)) {
      newErrors.phone_no = t("editSupporter.errPhoneMustBe10Digits");
    }

    if (formData.whatsapp_no && !/^\d{10}$/.test(formData.whatsapp_no)) {
      newErrors.whatsapp_no = t("editSupporter.errWhatsAppMustBe10Digits");
    }

    if (formData.voter_epic_id && !/^[A-Z0-9]{10}$/.test(formData.voter_epic_id)) {
      newErrors.voter_epic_id = t("editSupporter.errEpicIdMustBe10Chars");
    }

    if (!formData.address.trim()) {
      newErrors.address = t("editSupporter.errAddressRequired");
    }

    if (formData.language.length === 0) {
      newErrors.language = t("editSupporter.errAtLeastOneLanguage");
    }

    if (!formData.religion.trim()) {
      newErrors.religion = t("editSupporter.errReligionRequired");
    }

    if (!formData.category.trim()) {
      newErrors.category = t("editSupporter.errCategoryRequired");
    }

    setErrors(newErrors);

    // Auto-scroll to first error field
    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus on the field
        (errorElement as HTMLElement).focus();
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const updateData: UpdateSupporterRequest = {
        initials: formData.initials,
        first_name: formData.first_name,
        last_name: formData.last_name,
        father_name: formData.father_name,
        date_of_birth: formData.date_of_birth,
        age: formData.age > 0 ? formData.age : undefined,
        gender: formData.gender as 'Male' | 'Female' | 'Other',
        phone_no: formData.phone_no,
        whatsapp_no: formData.whatsapp_no || undefined,
        voter_epic_id: formData.voter_epic_id || undefined,
        address: formData.address,
        language: formData.language,
        religion: formData.religion,
        category: formData.category,
        caste: formData.caste || undefined,
        remarks: formData.remarks || undefined,
        // Include hierarchy fields
        party_id: formData.party_id,
        state_id: formData.state_id,
        district_id: formData.district_id,
        assembly_id: formData.assembly_id,
        block_id: deepestSelectedId ? deepestSelectedId : null,
        mandal_id: null,
        booth_id: null,
        after_assembly_levels: afterAssemblySelectionsRef.current.filter(Boolean).map(Number),
      };
      console.log('[EditSupporter] Submit REF afterAssemblySelections:', JSON.stringify(afterAssemblySelectionsRef.current));
      console.log('[EditSupporter] Submit STATE afterAssemblySelections:', JSON.stringify(afterAssemblySelections));
      console.log('[EditSupporter] Submit after_assembly_levels:', JSON.stringify(updateData.after_assembly_levels));
      await updateSupporter({ id: supporterId, data: updateData }).unwrap();
      toast.success(t("editSupporter.toastSupporterUpdated"));
      navigate('/assembly/supporters');
    } catch (error: any) {
      console.error('Failed to update supporter:', error);

      // Handle specific error cases
      if (error.data?.error?.message) {
        // Show the specific error message from the API
        toast.error(error.data.error.message);
      } else if (error.data?.message) {
        // Fallback to general message
        toast.error(error.data.message);
      } else if (error.data?.errors) {
        // Handle validation errors
        const apiErrors: Record<string, string> = {};
        const errorMessages: string[] = [];

        error.data.errors.forEach((err: any) => {
          apiErrors[err.field] = err.message;
          errorMessages.push(`${err.field}: ${err.message}`);
        });

        setErrors(apiErrors);

        // Show a toast with the first error or a summary
        if (errorMessages.length === 1) {
          toast.error(error.data.errors[0].message);
        } else {
          toast.error(t("editSupporter.toastValidationFailedCount", { count: errorMessages.length }));
        }
      } else {
        // Generic error message
        toast.error(t("editSupporter.toastFailedToUpdateSupporter"));
      }
    }
  };

  if (supporterLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[var(--bg-card)] rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!supporter) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[var(--bg-card)] rounded-lg shadow p-6 text-center">
            <p className="text-red-600">{t("editSupporter.supporterNotFound")}</p>
            <button
              onClick={() => navigate('/assembly/supporters')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {t("editSupporter.btnBackToSupporters")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-color)]">{t("editSupporter.title")}</h1>
            <p className="text-[var(--text-secondary)]">{t("editSupporter.subtitle")}</p>
          </div>
          <button
            onClick={() => navigate('/assembly/supporters')}
            className="text-[var(--text-secondary)] hover:text-[var(--text-color)] flex items-center gap-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5m7-7-7 7 7 7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t("editSupporter.btnBackToSupporters")}
          </button>
        </div>

        {/* Form */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-[var(--text-color)] mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Initials */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Initials *
                  </label>
                  <select
                    name="initials"
                    value={formData.initials}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.initials ? 'border-red-500' : 'border-gray-300'
                      }`}
                    aria-label={t("editSupporter.lblInitialsRequired")}
                    title={t("editSupporter.lblInitialsRequired")}
                  >
                    <option value="">Select Initials</option>
                    {INITIALS_OPTIONS.map((initial) => (
                      <option key={initial} value={initial}>
                        {initial}
                      </option>
                    ))}
                  </select>
                  {errors.initials && <p className="text-red-500 text-xs mt-1">{errors.initials}</p>}
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.first_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter first name"
                  />
                  {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.last_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter last name"
                  />
                  {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                </div>

                {/* Father's Name */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Father's Name *
                  </label>
                  <input
                    type="text"
                    name="father_name"
                    value={formData.father_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.father_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter father's name"
                  />
                  {errors.father_name && <p className="text-red-500 text-xs mt-1">{errors.father_name}</p>}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                      }`}
                    aria-label={t("editSupporter.lblDateOfBirthRequired")}
                    title={t("editSupporter.lblDateOfBirthRequired")}
                  />
                  {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                </div>

                {/* Age - Auto-calculated */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-[var(--text-secondary)]"
                    placeholder="Auto-calculated"
                  />
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Automatically calculated from date of birth</p>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.gender ? 'border-red-500' : 'border-gray-300'
                      }`}
                    aria-label={t("editSupporter.lblGenderRequired")}
                    title={t("editSupporter.lblGenderRequired")}
                  >
                    <option value="">Select Gender</option>
                    {GENDER_OPTIONS.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                  {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone_no"
                    value={formData.phone_no}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.phone_no ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="10-digit phone number"
                    maxLength={10}
                  />
                  {errors.phone_no && <p className="text-red-500 text-xs mt-1">{errors.phone_no}</p>}
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    name="whatsapp_no"
                    value={formData.whatsapp_no}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.whatsapp_no ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="10-digit WhatsApp number"
                    maxLength={10}
                  />
                  {errors.whatsapp_no && <p className="text-red-500 text-xs mt-1">{errors.whatsapp_no}</p>}
                </div>

                {/* EPIC ID */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    EPIC ID
                  </label>
                  <input
                    type="text"
                    name="voter_epic_id"
                    value={formData.voter_epic_id}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.voter_epic_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="10-character EPIC ID"
                    maxLength={10}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.voter_epic_id && <p className="text-red-500 text-xs mt-1">{errors.voter_epic_id}</p>}
                </div>
              </div>
            </div>

            {/* Language and Religion Information */}
            <div>
              <h3 className="text-lg font-medium text-[var(--text-color)] mb-4">Language & Religion Information</h3>

              {/* Language Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Languages * <span className="text-[var(--text-secondary)]">(Select multiple)</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 border border-gray-300 rounded-lg">
                  {LANGUAGE_OPTIONS.map((language) => (
                    <label key={language} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.language.includes(language)}
                        onChange={() => handleLanguageChange(language)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-[var(--text-secondary)]">{language}</span>
                    </label>
                  ))}
                </div>
                {errors.language && <p className="text-red-500 text-xs mt-1">{errors.language}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Religion */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Religion *
                  </label>
                  <select
                    name="religion"
                    value={formData.religion}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.religion ? 'border-red-500' : 'border-gray-300'
                      }`}
                    aria-label={t("editSupporter.lblReligionRequired")}
                    title={t("editSupporter.lblReligionRequired")}
                  >
                    <option value="">Select Religion</option>
                    {RELIGION_OPTIONS.map((religion) => (
                      <option key={religion} value={religion}>
                        {religion}
                      </option>
                    ))}
                  </select>
                  {errors.religion && <p className="text-red-500 text-xs mt-1">{errors.religion}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    disabled={!formData.religion}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-[var(--text-secondary)] ${errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                    aria-label={t("editSupporter.lblCategoryRequired")}
                    title={t("editSupporter.lblCategoryRequired")}
                  >
                    <option value="">Select Category</option>
                    {getAvailableCategories().map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>

                {/* Caste (only for Hindu religion) */}
                {shouldShowCaste && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                      Caste
                    </label>
                    <select
                      name="caste"
                      value={formData.caste}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      aria-label={t("editSupporter.lblCaste")}
                      title={t("editSupporter.lblCaste")}
                    >
                      <option value="">Select Caste</option>
                      {getAvailableCastes().map((caste) => (
                        <option key={caste} value={caste}>
                          {caste}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Custom Category Input for Others */}
                {formData.religion === 'Others' && formData.category === 'Others' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                      Specify Category
                    </label>
                    <input
                      type="text"
                      name="caste"
                      value={formData.caste}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter category"
                      aria-label={t("editSupporter.phEnterCategory")}
                      title={t("editSupporter.phEnterCategory")}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Location Information - Editable */}
            <div>
              <h3 className="text-lg font-medium text-[var(--text-color)] mb-4">Location Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">State</label>
                  <input
                    type="text"
                    value={supporter?.state_name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-[var(--text-secondary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">District</label>
                  <input
                    type="text"
                    value={supporter?.district_name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-[var(--text-secondary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Assembly</label>
                  <input
                    type="text"
                    value={supporter?.assembly_name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-[var(--text-secondary)]"
                  />
                </div>

                {/* Dynamic after-assembly dropdowns — all levels after assembly */}
                {dynamicLevels.map((level, idx) => {
                  const opts = visibleOptions[idx] || [];
                  const parentSelected = level.depth === 0 || (afterAssemblySelections[level.depth - 1] || 0) > 0;
                  const isOptional = true; // all after-assembly levels are optional
                  return (
                    <div key={level.depth}>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                        {level.label}
                        {isOptional && <span className="text-[var(--text-secondary)] ml-1">(Optional)</span>}
                      </label>
                      <select
                        value={afterAssemblySelections[level.depth] || 0}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          updateAfterAssemblySelections((() => {
                            const prev = afterAssemblySelectionsRef.current;
                            const next = [...prev];
                            next[level.depth] = val;
                            for (let i = level.depth + 1; i < dynamicLevels.length; i++) next[i] = 0;
                            return next;
                          })());
                        }}
                        disabled={!isDropdownEnabled || !parentSelected}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-[var(--text-secondary)]"
                      >
                        <option value={0}>
                          {!hierarchyData
                            ? `Loading ${level.label}s...`
                            : !parentSelected
                            ? `Select ${dynamicLevels[level.depth - 1]?.label} first`
                            : opts.length === 0
                            ? `No ${level.label} available`
                            : `Select ${level.label}`}
                        </option>
                        {opts.map(n => (
                          <option key={n.id} value={n.id}>{n.displayName}</option>
                        ))}
                      </select>
                      {hierarchyData && level.depth === 0 && opts.length === 0 && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1">No {level.label} available</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Address and Remarks */}
            <div>
              <h3 className="text-lg font-medium text-[var(--text-color)] mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Address *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Enter complete address"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Additional notes or remarks"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => navigate('/assembly/supporters')}
                className="px-6 py-2 text-[var(--text-secondary)] border border-gray-300 rounded-lg hover:bg-[var(--text-color)]/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isUpdating && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {isUpdating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}



