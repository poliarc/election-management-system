import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, AlertTriangle, UserPlus } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://backend.assamnyay.com';

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

export default function PublicAddSupporterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [hierarchyData, setHierarchyData] = useState<any>(null);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);

  // Get URL parameters
  const partyId = searchParams.get('party_id');
  const partyName = searchParams.get('party_name');
  const stateId = searchParams.get('state_id');
  const stateName = searchParams.get('state_name');
  const districtId = searchParams.get('district_id');
  const districtName = searchParams.get('district_name');
  const assemblyId = searchParams.get('assembly_id');
  const assemblyName = searchParams.get('assembly_name');
  const blockId = searchParams.get('block_id');
  const blockName = searchParams.get('block_name');
  const mandalId = searchParams.get('mandal_id');
  const mandalName = searchParams.get('mandal_name');
  const boothId = searchParams.get('booth_id');
  const boothName = searchParams.get('booth_name');
  const createdBy = searchParams.get('created_by');
  const createdByName = searchParams.get('created_by_name');

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
    party_id: parseInt(partyId || '0'),
    state_id: parseInt(stateId || '0'),
    district_id: parseInt(districtId || '0'),
    assembly_id: parseInt(assemblyId || '0'),
    block_id: parseInt(blockId || '0'),
    mandal_id: parseInt(mandalId || '0'),
    booth_id: parseInt(boothId || '0'),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate URL parameters on mount
  useEffect(() => {
    if (!partyId || !partyName || !stateId || !stateName || !districtId || !districtName || !assemblyId || !assemblyName || !blockId || !blockName) {
      toast.error('Invalid registration link. Missing required parameters.');
      navigate('/login');
    }
  }, [partyId, partyName, stateId, stateName, districtId, districtName, assemblyId, assemblyName, blockId, blockName, navigate]);

  // Fetch hierarchy data for Block/Mandal/Booth dropdowns (only if not pre-filled from URL)
  useEffect(() => {
    // Skip if all hierarchy levels are already provided in URL
    if (blockId && mandalId && boothId) return;
    
    if (!stateId || !partyId) return;

    setHierarchyLoading(true);
    const fetchHierarchy = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/campaigns/hierarchy?state_id=${stateId}&party_id=${partyId}`
        );
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setHierarchyData(result.data);
          }
        } else {
          // API requires authentication - silently fail
          console.log('Hierarchy API requires authentication - optional fields will remain disabled');
        }
      } catch (error) {
        // Silently fail - optional fields will remain disabled
        console.log('Failed to fetch hierarchy - optional fields will remain disabled');
      } finally {
        setHierarchyLoading(false);
      }
    };

    fetchHierarchy();
  }, [stateId, partyId, blockId, mandalId, boothId]);

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

    if (name === 'phone_no' || name === 'whatsapp_no') {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
      return;
    }

    if (name === 'voter_epic_id') {
      const alphanumericValue = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      setFormData(prev => ({ ...prev, [name]: alphanumericValue }));
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
      return;
    }

    // Handle cascading dropdowns
    if (name === 'block_id') {
      const newBlockId = parseInt(value) || 0;
      setFormData(prev => ({
        ...prev,
        block_id: newBlockId,
        mandal_id: 0,
        booth_id: 0
      }));
    } else if (name === 'mandal_id') {
      const newMandalId = parseInt(value) || 0;
      setFormData(prev => ({
        ...prev,
        mandal_id: newMandalId,
        booth_id: 0
      }));
    } else if (name === 'booth_id') {
      setFormData(prev => ({
        ...prev,
        booth_id: parseInt(value) || 0
      }));
    } else if (name === 'religion') {
      setFormData(prev => ({ ...prev, [name]: value, category: '', caste: '' }));
    } else if (name === 'category') {
      setFormData(prev => ({ ...prev, [name]: value, caste: '' }));
    } else if (name === 'date_of_birth') {
      const age = calculateAge(value);
      setFormData(prev => ({ ...prev, [name]: value, age: age }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

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

    if (!formData.initials.trim()) newErrors.initials = 'Initials is required';
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.father_name.trim()) newErrors.father_name = 'Father name is required';
    if (!formData.date_of_birth.trim()) newErrors.date_of_birth = 'Date of birth is required';
    if (!formData.gender.trim()) newErrors.gender = 'Gender is required';
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
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (formData.language.length === 0) newErrors.language = 'At least one language must be selected';
    if (!formData.religion.trim()) newErrors.religion = 'Religion is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

    setIsCreating(true);

    try {
      // Build query parameters for public registration endpoint
      const queryParams = new URLSearchParams({
        party_id: formData.party_id.toString(),
        party_name: partyName || 'Party',
        state_id: formData.state_id.toString(),
        state_name: stateName || 'State',
        district_id: formData.district_id.toString(),
        district_name: districtName || 'District',
        assembly_id: formData.assembly_id.toString(),
        assembly_name: assemblyName || 'Assembly',
        block_id: formData.block_id.toString(),
        block_name: blockName || 'Block',
        created_by: createdBy || '0',
        created_by_name: createdByName || 'Public Registration'
      });

      // Add optional mandal and booth if present
      if (formData.mandal_id > 0 && mandalName) {
        queryParams.append('mandal_id', formData.mandal_id.toString());
        queryParams.append('mandal_name', mandalName);
      }
      if (formData.booth_id > 0 && boothName) {
        queryParams.append('booth_id', formData.booth_id.toString());
        queryParams.append('booth_name', boothName);
      }

      // Only send personal details in body (no location/party info)
      const createData = {
        initials: formData.initials,
        first_name: formData.first_name,
        last_name: formData.last_name,
        father_name: formData.father_name,
        phone_no: formData.phone_no,
        date_of_birth: formData.date_of_birth,
        age: formData.age > 0 ? formData.age : undefined,
        gender: formData.gender as 'Male' | 'Female' | 'Other',
        language: formData.language,
        religion: formData.religion,
        category: formData.category,
        caste: formData.caste || undefined,
        whatsapp_no: formData.whatsapp_no || undefined,
        voter_epic_id: formData.voter_epic_id || undefined,
        address: formData.address,
        remarks: formData.remarks || undefined,
      };

      const response = await fetch(`${API_BASE_URL}/api/supporters/register?${queryParams.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw result;
      }

      setIsSuccess(true);
      toast.success('Supporter registration successful!');
    } catch (error: any) {
      console.error('Failed to create supporter:', error);

      if (error.data?.error?.message) {
        toast.error(error.data.error.message);
      } else if (error.data?.message) {
        toast.error(error.data.message);
      } else if (error.data?.errors) {
        const apiErrors: Record<string, string> = {};
        const errorMessages: string[] = [];

        error.data.errors.forEach((err: any) => {
          apiErrors[err.field] = err.message;
          errorMessages.push(`${err.field}: ${err.message}`);
        });

        setErrors(apiErrors);

        if (errorMessages.length === 1) {
          toast.error(error.data.errors[0].message);
        } else {
          toast.error(`Validation failed: ${errorMessages.length} errors found`);
        }
      } else {
        toast.error('Failed to register supporter. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const getAvailableCategories = () => {
    if (formData.religion === 'Hindu') {
      return HINDU_CATEGORIES;
    } else if (RELIGION_CATEGORIES[formData.religion as keyof typeof RELIGION_CATEGORIES]) {
      return RELIGION_CATEGORIES[formData.religion as keyof typeof RELIGION_CATEGORIES];
    }
    return [];
  };

  const getAvailableCastes = () => {
    if (formData.religion === 'Hindu' && CASTE_OPTIONS[formData.category as keyof typeof CASTE_OPTIONS]) {
      return CASTE_OPTIONS[formData.category as keyof typeof CASTE_OPTIONS];
    }
    return [];
  };

  const shouldShowCaste = formData.religion === 'Hindu' && formData.category && getAvailableCastes().length > 0;

  // Get filtered hierarchy levels
  const afterAssemblyData = hierarchyData?.afterAssemblyHierarchy || [];

  // Filter mandals under the block (from URL)
  const mandals = !mandalId && formData.block_id > 0 ? afterAssemblyData.filter((h: any) =>
    h.levelName === 'Mandal' && h.parentId === formData.block_id
  ) : [];

  // Filter booths under the mandal (either from URL or selected)
  const effectiveMandalId = mandalId ? parseInt(mandalId) : formData.mandal_id;
  const booths = !boothId && effectiveMandalId > 0 ? afterAssemblyData.filter((h: any) =>
    h.levelName === 'Booth' && h.parentId === effectiveMandalId
  ) : [];

  // Show error state for invalid parameters
  if (!partyId || !stateId || !districtId || !assemblyId || !blockId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Registration Link</h1>
          <p className="text-gray-600 mb-6">
            This registration link is invalid or missing required parameters.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for registering as a supporter. Your information has been submitted successfully.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Register Another Supporter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center gap-3">
            <UserPlus className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Supporter Registration</h1>
              <p className="text-blue-100">
                {partyName} - {assemblyName}, {districtName}, {stateName}
              </p>
              {createdByName && (
                <p className="text-blue-200 text-sm mt-1">
                  Registered by: {createdByName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-b-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Initials */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initials *</label>
                  <select
                    name="initials"
                    value={formData.initials}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.initials ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Initials</option>
                    {INITIALS_OPTIONS.map((initial) => (
                      <option key={initial} value={initial}>{initial}</option>
                    ))}
                  </select>
                  {errors.initials && <p className="text-red-500 text-xs mt-1">{errors.initials}</p>}
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.first_name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter first name"
                  />
                  {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.last_name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter last name"
                  />
                  {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                </div>

                {/* Father's Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name *</label>
                  <input
                    type="text"
                    name="father_name"
                    value={formData.father_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.father_name ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter father's name"
                  />
                  {errors.father_name && <p className="text-red-500 text-xs mt-1">{errors.father_name}</p>}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.date_of_birth ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                </div>

                {/* Age - Auto-calculated */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Gender</option>
                    {GENDER_OPTIONS.map((gender) => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                  {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone_no"
                    value={formData.phone_no}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.phone_no ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="10-digit phone number"
                    maxLength={10}
                  />
                  {errors.phone_no && <p className="text-red-500 text-xs mt-1">{errors.phone_no}</p>}
                </div>

                {/* WhatsApp Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    name="whatsapp_no"
                    value={formData.whatsapp_no}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.whatsapp_no ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="10-digit WhatsApp number"
                    maxLength={10}
                  />
                  {errors.whatsapp_no && <p className="text-red-500 text-xs mt-1">{errors.whatsapp_no}</p>}
                </div>

                {/* EPIC ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">EPIC ID</label>
                  <input
                    type="text"
                    name="voter_epic_id"
                    value={formData.voter_epic_id}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.voter_epic_id ? 'border-red-500' : 'border-gray-300'}`}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Religion *</label>
                  <select
                    name="religion"
                    value={formData.religion}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.religion ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Religion</option>
                    {RELIGION_OPTIONS.map((religion) => (
                      <option key={religion} value={religion}>{religion}</option>
                    ))}
                  </select>
                  {errors.religion && <p className="text-red-500 text-xs mt-1">{errors.religion}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    disabled={!formData.religion}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-600 ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Category</option>
                    {getAvailableCategories().map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>

                {/* Caste (only for Hindu religion) */}
                {shouldShowCaste && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Caste</label>
                    <select
                      name="caste"
                      value={formData.caste}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Caste</option>
                      {getAvailableCastes().map((caste) => (
                        <option key={caste} value={caste}>{caste}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Custom Category Input for Others */}
                {formData.religion === 'Others' && formData.category === 'Others' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specify Category</label>
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
                    value={stateName || 'Unknown State'}
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
                    value={districtName || 'Unknown District'}
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
                    value={assemblyName || 'Unknown Assembly'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                {/* Block - Always Disabled (Required from URL) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Block
                  </label>
                  <input
                    type="text"
                    value={blockName || 'Unknown Block'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                {/* Mandal - Disabled if provided in URL, otherwise optional dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mandal {mandalId && <span className="text-gray-400">(Pre-filled)</span>}
                    {!mandalId && <span className="text-gray-400">(Optional)</span>}
                  </label>
                  {mandalId ? (
                    <input
                      type="text"
                      value={mandalName || 'Unknown Mandal'}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                  ) : (
                    <select
                      name="mandal_id"
                      value={formData.mandal_id}
                      onChange={handleInputChange}
                      disabled={hierarchyLoading || mandals.length === 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-600"
                    >
                      <option value={0}>Select Mandal</option>
                      {mandals.map((mandal: any) => (
                        <option key={mandal.id} value={mandal.id}>
                          {mandal.displayName || mandal.levelName}
                        </option>
                      ))}
                    </select>
                  )}
                  {!mandalId && !hierarchyLoading && mandals.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No mandals available
                    </p>
                  )}
                </div>

                {/* Booth - Disabled if provided in URL, otherwise optional dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Booth {boothId && <span className="text-gray-400">(Pre-filled)</span>}
                    {!boothId && <span className="text-gray-400">(Optional)</span>}
                  </label>
                  {boothId ? (
                    <input
                      type="text"
                      value={boothName || 'Unknown Booth'}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                  ) : (
                    <select
                      name="booth_id"
                      value={formData.booth_id}
                      onChange={handleInputChange}
                      disabled={hierarchyLoading || booths.length === 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-600"
                    >
                      <option value={0}>Select Booth</option>
                      {booths.map((booth: any) => (
                        <option key={booth.id} value={booth.id}>
                          {booth.displayName || booth.levelName}
                        </option>
                      ))}
                    </select>
                  )}
                  {!boothId && !hierarchyLoading && booths.length === 0 && !formData.mandal_id && (
                    <p className="text-xs text-gray-500 mt-1">Select a mandal first</p>
                  )}
                  {!boothId && !hierarchyLoading && booths.length === 0 && formData.mandal_id && (
                    <p className="text-xs text-gray-500 mt-1">No booths available for this mandal</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address and Remarks */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Enter complete address"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
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
                type="submit"
                disabled={isCreating}
                className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isCreating && (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {isCreating ? 'Submitting...' : 'Submit Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
