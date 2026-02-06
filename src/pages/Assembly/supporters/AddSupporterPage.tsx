import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  useCreateSupporterMutation,
  useGetHierarchyQuery
} from '../../../store/api/supportersApi';
import { useAppSelector } from '../../../store/hooks';
import type { CreateSupporterRequest } from '../../../types/supporter';

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
  OBC: ['AHOM', 'Chutia', 'Chowdang', 'Bishnupriya Manipuri', 'Moran', 'Matak', 'Nepali', 'Koch Rajbonshi', 'Adivashi Tea Tribes', 'Nath Jogi', 'Others'],
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

export default function AddSupporterPage() {
  const navigate = useNavigate();
  const { user, selectedAssignment } = useAppSelector((s) => s.auth);

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
    party_id: user?.partyId || 0,
    state_id: user?.state_id || selectedAssignment?.stateMasterData_id || 0,
    district_id: selectedAssignment?.parentId || 0,
    assembly_id: selectedAssignment?.stateMasterData_id || 0, // Use stateMasterData_id for assembly
    block_id: 0,
    mandal_id: 0,
    booth_id: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get hierarchy data for dropdowns
  const { data: hierarchyData, isLoading: hierarchyLoading } = useGetHierarchyQuery({
    state_id: formData.state_id,
    party_id: formData.party_id,
  }, {
    skip: !formData.state_id || !formData.party_id,
  });

  const [createSupporter, { isLoading: isCreating }] = useCreateSupporterMutation();

  // Set district_id from selectedAssignment parent
  useEffect(() => {
    if (selectedAssignment?.parentId) {
      setFormData(prev => ({ ...prev, district_id: selectedAssignment.parentId || 0 }));
    }
  }, [selectedAssignment]);

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

    // Handle cascading dropdowns
    if (name === 'block_id') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0,
        mandal_id: 0,
        booth_id: 0
      }));
    } else if (name === 'mandal_id') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0,
        booth_id: 0
      }));
    } else if (name === 'booth_id') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else if (name === 'religion') {
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.initials.trim()) {
      newErrors.initials = 'Initials is required';
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.father_name.trim()) {
      newErrors.father_name = 'Father name is required';
    }

    if (!formData.date_of_birth.trim()) {
      newErrors.date_of_birth = 'Date of birth is required';
    }

    if (!formData.gender.trim()) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.phone_no.trim()) {
      newErrors.phone_no = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone_no)) {
      newErrors.phone_no = 'Phone number must be exactly 10 digits';
    }

    if (formData.whatsapp_no && !/^\d{10}$/.test(formData.whatsapp_no)) {
      newErrors.whatsapp_no = 'WhatsApp number must be exactly 10 digits';
    }

    if (formData.voter_epic_id && !/^[A-Z0-9]{10}$/.test(formData.voter_epic_id)) {
      newErrors.voter_epic_id = 'EPIC ID must be exactly 10 alphanumeric characters';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (formData.language.length === 0) {
      newErrors.language = 'At least one language must be selected';
    }

    if (!formData.religion.trim()) {
      newErrors.religion = 'Religion is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
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
      const createData: CreateSupporterRequest = {
        ...formData,
        gender: formData.gender as 'Male' | 'Female' | 'Other',
        age: formData.age > 0 ? formData.age : undefined,
        whatsapp_no: formData.whatsapp_no || undefined,
        voter_epic_id: formData.voter_epic_id || undefined,
        remarks: formData.remarks || undefined,
        block_id: formData.block_id || undefined,
        mandal_id: formData.mandal_id || undefined,
        booth_id: formData.booth_id || undefined,
        caste: formData.caste || undefined,
      };
      await createSupporter(createData).unwrap();
      toast.success('Supporter created successfully!');
      navigate('/assembly/supporters');
    } catch (error: any) {
      console.error('Failed to create supporter:', error);

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
          toast.error(`Validation failed: ${errorMessages.length} errors found`);
        }
      } else {
        // Generic error message
        toast.error('Failed to create supporter. Please try again.');
      }
    }
  };

  // Get filtered hierarchy levels
  const stateData = hierarchyData?.data?.stateHierarchy?.find(h => h.id === formData.state_id);
  const districtData = hierarchyData?.data?.stateHierarchy?.find(h => h.id === formData.district_id);

  // Get blocks, mandals, and booths from afterAssemblyHierarchy
  const afterAssemblyData = hierarchyData?.data?.afterAssemblyHierarchy || [];

  // Filter blocks under the selected assembly
  const blocks = afterAssemblyData.filter(h =>
    h.levelName === 'Block' && h.parentAssemblyId === formData.assembly_id
  ) || [];

  // Filter mandals under the selected block or assembly
  const mandals = afterAssemblyData.filter(h =>
    h.levelName === 'Mandal' && (
      h.parentId === formData.block_id ||
      (h.parentAssemblyId === formData.assembly_id && !formData.block_id)
    )
  ) || [];

  // Filter booths under the selected mandal
  const booths = afterAssemblyData.filter(h =>
    h.levelName === 'Booth' && h.parentId === formData.mandal_id
  ) || [];

  // Get display names - use selectedAssignment data when available
  const getStateName = () => {
    if (hierarchyLoading) return 'Loading...';
    return stateData?.levelName || selectedAssignment?.stateName || 'Unknown State';
  };

  const getDistrictName = () => {
    if (hierarchyLoading) return 'Loading...';
    return districtData?.levelName || selectedAssignment?.parentLevelName || selectedAssignment?.districtName || 'Unknown District';
  };

  const getAssemblyName = () => {
    if (hierarchyLoading) return 'Loading...';
    // For Assembly level users, selectedAssignment represents the assembly itself
    return selectedAssignment?.levelName || selectedAssignment?.displayName || 'Unknown Assembly';
  };

  // Check if dropdowns should be enabled - Always enable when not loading
  const isBlockDropdownEnabled = !hierarchyLoading;
  const isMandalDropdownEnabled = !hierarchyLoading;
  const isBoothDropdownEnabled = !hierarchyLoading;

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

  // Check if caste should be shown (only for Hindu religion)
  const shouldShowCaste = formData.religion === 'Hindu' && formData.category && getAvailableCastes().length > 0;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Supporter</h1>
            <p className="text-gray-600">Create a new supporter record</p>
          </div>
          <button
            onClick={() => navigate('/assembly/supporters')}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5m7-7-7 7 7 7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Supporters
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Initials */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initials *
                  </label>
                  <select
                    name="initials"
                    value={formData.initials}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.initials ? 'border-red-500' : 'border-gray-300'
                      }`}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                </div>

                {/* Age - Auto-calculated */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    placeholder="Auto-calculated"
                  />
                  <p className="text-xs text-gray-500 mt-1">Automatically calculated from date of birth</p>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.gender ? 'border-red-500' : 'border-gray-300'
                      }`}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Language & Religion Information</h3>

              {/* Language Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages * <span className="text-gray-500">(Select multiple)</span>
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
                      <span className="text-sm text-gray-700">{language}</span>
                    </label>
                  ))}
                </div>
                {errors.language && <p className="text-red-500 text-xs mt-1">{errors.language}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Religion */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Religion *
                  </label>
                  <select
                    name="religion"
                    value={formData.religion}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.religion ? 'border-red-500' : 'border-gray-300'
                      }`}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    disabled={!formData.religion}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-600 ${errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Caste
                    </label>
                    <select
                      name="caste"
                      value={formData.caste}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specify Category
                    </label>
                    <input
                      type="text"
                      name="caste"
                      value={formData.caste}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter category"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* State - Disabled */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={getStateName()}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                {/* District - Disabled */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={getDistrictName()}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                {/* Assembly - Disabled */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assembly
                  </label>
                  <input
                    type="text"
                    value={getAssemblyName()}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                {/* Block Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Block
                  </label>
                  <select
                    name="block_id"
                    value={formData.block_id}
                    onChange={handleInputChange}
                    disabled={!isBlockDropdownEnabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-600"
                  >
                    <option value={0}>Select Block</option>
                    {blocks.map((block) => (
                      <option key={block.id} value={block.id}>
                        {block.displayName || block.levelName}
                      </option>
                    ))}
                  </select>
                  {hierarchyLoading && <p className="text-xs text-gray-500 mt-1">Loading blocks...</p>}
                  {!hierarchyLoading && blocks.length === 0 && <p className="text-xs text-gray-500 mt-1">No blocks available</p>}
                </div>

                {/* Mandal Dropdown - Optional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mandal <span className="text-gray-400">(Optional)</span>
                  </label>
                  <select
                    name="mandal_id"
                    value={formData.mandal_id}
                    onChange={handleInputChange}
                    disabled={!isMandalDropdownEnabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-600"
                  >
                    <option value={0}>Select Mandal</option>
                    {mandals.map((mandal) => (
                      <option key={mandal.id} value={mandal.id}>
                        {mandal.displayName || mandal.levelName}
                      </option>
                    ))}
                  </select>
                  {!hierarchyLoading && !formData.block_id && <p className="text-xs text-gray-500 mt-1">Select a block first (or leave empty)</p>}
                  {/* {!hierarchyLoading && formData.block_id && mandals.length === 0 && <p className="text-xs text-gray-500 mt-1">No mandals available for selected block</p>} */}
                </div>

                {/* Booth Dropdown - Optional */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Booth <span className="text-gray-400">(Optional)</span>
                  </label>
                  <select
                    name="booth_id"
                    value={formData.booth_id}
                    onChange={handleInputChange}
                    disabled={!isBoothDropdownEnabled}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-600"
                  >
                    <option value={0}>Select Booth</option>
                    {booths.map((booth) => (
                      <option key={booth.id} value={booth.id}>
                        {booth.displayName || booth.levelName}
                      </option>
                    ))}
                  </select>
                  {!hierarchyLoading && !formData.mandal_id && <p className="text-xs text-gray-500 mt-1">Select a mandal first</p>}
                  {/* {!hierarchyLoading && formData.mandal_id && booths.length === 0 && <p className="text-xs text-gray-500 mt-1">No booths available for selected mandal</p>} */}
                </div>
              </div>
            </div>

            {/* Address and Remarks */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/assembly/supporters')}
                className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || hierarchyLoading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isCreating && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {isCreating ? 'Creating...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}