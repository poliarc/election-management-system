import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, AlertTriangle, UserPlus } from 'lucide-react';
import { API_CONFIG } from '../../../config/api';

const API_BASE_URL = API_CONFIG.BASE_URL;

/* =========================================================================
   COMMENTED OUT: Dropdown Constants for Hidden Fields
   (Uncomment these if you re-enable the respective fields below)
   =========================================================================
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
  OBC: ['AHOM', 'Chutia', 'Chowdang', 'Bishnupriya Manipuri', 'Manipuri', 'Moran', 'Matak', 'Nepali', 'Koch Rajbonshi', 'Adivashi Tea Tribes', 'Nath Jogi', 'Others'],
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
========================================================================= */

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
  const blockLabel = searchParams.get('block_label') || 'Block';
  const mandalId = searchParams.get('mandal_id');
  const boothId = searchParams.get('booth_id');

  // Generic deeper levels: level_1_id/name/label, level_2_id/name/label, ...
  // These correspond to depth 1, 2, 3... after assembly (depth-0 = block)
  const deeperLevels = useMemo(() => {
    const levels: { id: number; name: string; label: string }[] = [];
    for (let i = 1; i <= 10; i++) {
      const id = searchParams.get(`level_${i}_id`);
      const name = searchParams.get(`level_${i}_name`);
      const label = searchParams.get(`level_${i}_label`);
      if (!id || parseInt(id) === 0) break;
      levels.push({ id: parseInt(id), name: name || '', label: label || `Level ${i}` });
    }
    return levels;
  }, [searchParams]);
  const createdBy = searchParams.get('created_by');
  const createdByName = searchParams.get('created_by_name');

  const [selectedDistrictId, setSelectedDistrictId] = useState<number>(parseInt(districtId || '0'));
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<number>(parseInt(assemblyId || '0'));

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

  // Validate URL parameters on mount — party and state are required; district/assembly optional for state-wide links
  useEffect(() => {
    if (!partyId || !stateId) {
      toast.error('Invalid registration link. Missing required parameters.');
      navigate('/login');
    }
  }, [partyId, stateId, navigate]);

  // Fetch hierarchy data from public endpoint (no login token required)
  useEffect(() => {
    if (!stateId || !partyId) return;

    setHierarchyLoading(true);
    const fetchHierarchy = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/supporters/public-hierarchy?state_id=${stateId}&party_id=${partyId}`
        );
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setHierarchyData(result.data);
          }
        } else {
          console.log('Failed to fetch public hierarchy');
        }
      } catch (error) {
        console.log('Failed to fetch public hierarchy:', error);
      } finally {
        setHierarchyLoading(false);
      }
    };

    fetchHierarchy();
  }, [stateId, partyId]);

  // District options for state-wide link
  const districtOptions = useMemo(() => {
    if (!hierarchyData?.stateHierarchy) return [];
    return hierarchyData.stateHierarchy.filter(
      (item: any) =>
        (item.levelType === 'District' || item.levelType?.toLowerCase() === 'district') &&
        item.ParentId === parseInt(stateId || '0')
    );
  }, [hierarchyData, stateId]);

  // Assembly options for state-wide link based on selected district
  const assemblyOptions = useMemo(() => {
    if (!hierarchyData?.stateHierarchy || !selectedDistrictId) return [];
    return hierarchyData.stateHierarchy.filter(
      (item: any) =>
        (item.levelType === 'Assembly' || item.levelType?.toLowerCase() === 'assembly') &&
        item.ParentId === selectedDistrictId
    );
  }, [hierarchyData, selectedDistrictId]);

  const currentDistrictName = useMemo(() => {
    if (districtName) return districtName;
    const found = hierarchyData?.stateHierarchy?.find((i: any) => i.id === selectedDistrictId);
    return found?.levelName || '';
  }, [districtName, hierarchyData, selectedDistrictId]);

  const currentAssemblyName = useMemo(() => {
    if (assemblyName) return assemblyName;
    const found = hierarchyData?.stateHierarchy?.find((i: any) => i.id === selectedAssemblyId);
    return found?.levelName || '';
  }, [assemblyName, hierarchyData, selectedAssemblyId]);

  const locationSubtitle = useMemo(() => {
    const locParts: string[] = [];
    const asm = assemblyName || currentAssemblyName;
    const dist = districtName || currentDistrictName;
    if (asm) locParts.push(asm);
    if (dist) locParts.push(dist);
    if (stateName) locParts.push(stateName);

    if (locParts.length > 0) {
      return partyName ? `${partyName} - ${locParts.join(', ')}` : locParts.join(', ');
    }
    return partyName || '';
  }, [partyName, assemblyName, currentAssemblyName, districtName, currentDistrictName, stateName]);

  const effectiveDistrictId = parseInt(districtId || '0') || selectedDistrictId;
  const effectiveAssemblyId = parseInt(assemblyId || '0') || selectedAssemblyId;
  const hasPreFilledBlock = !!(blockId && parseInt(blockId) > 0);

  // All after-assembly nodes from public hierarchy
  const afterAssemblyData = hierarchyData?.afterAssemblyHierarchy || [];

  // Filter afterAssemblyData to nodes belonging to the selected/effective assembly
  const currentAssemblyAfterData = useMemo(() => {
    if (!effectiveAssemblyId) return [];
    // Depth-0 nodes directly under this assembly
    const rootNodes = afterAssemblyData.filter(
      (n: any) => n.parentAssemblyId === effectiveAssemblyId && (!n.parentId || n.parentId === 0)
    );
    const result: any[] = [...rootNodes];
    let parentIds = new Set(rootNodes.map((n: any) => n.id));

    while (parentIds.size > 0) {
      const children = afterAssemblyData.filter((n: any) => parentIds.has(n.parentId));
      if (children.length === 0) break;
      result.push(...children);
      parentIds = new Set(children.map((n: any) => n.id));
    }
    return result;
  }, [afterAssemblyData, effectiveAssemblyId]);

  // Build depth map for current assembly's after-assembly nodes
  const depthMap = useMemo(() => {
    const map = new Map<number, number>();
    const getDepth = (node: any): number => {
      if (map.has(node.id)) return map.get(node.id)!;
      if (!node.parentId || node.parentId === 0) {
        map.set(node.id, 0);
        return 0;
      }
      const parent = currentAssemblyAfterData.find((n: any) => n.id === node.parentId);
      const d = parent ? getDepth(parent) + 1 : 0;
      map.set(node.id, d);
      return d;
    };
    currentAssemblyAfterData.forEach((n: any) => getDepth(n));
    return map;
  }, [currentAssemblyAfterData]);

  // Dynamic levels as ordered array
  const dynamicLevels = useMemo(() => {
    if (!currentAssemblyAfterData.length) return [];
    const byDepth = new Map<number, { label: string; nodes: any[] }>();
    currentAssemblyAfterData.forEach((node: any) => {
      const d = depthMap.get(node.id) ?? 0;
      if (hasPreFilledBlock && d < 1) return; // skip depth-0 only if block was pre-filled from URL
      if (!byDepth.has(d)) byDepth.set(d, { label: node.display_level_name || node.levelName, nodes: [] });
      byDepth.get(d)!.nodes.push(node);
    });
    return Array.from(byDepth.entries())
      .sort(([a], [b]) => a - b)
      .map(([depth, { label, nodes }]) => ({ depth, label, nodes }));
  }, [currentAssemblyAfterData, depthMap, hasPreFilledBlock]);

  // Selections for after-assembly levels
  const [subSelections, setSubSelections] = useState<number[]>(() => {
    const pre: number[] = [];
    for (let i = 1; i <= 10; i++) {
      const id = searchParams.get(`level_${i}_id`);
      if (!id || parseInt(id) === 0) break;
      pre[i - 1] = parseInt(id);
    }
    return pre;
  });

  // Cascaded options per level
  const visibleOptions = useMemo(() => {
    if (hasPreFilledBlock) {
      const blockIdNum = parseInt(blockId || '0');
      return dynamicLevels.map(({ depth, nodes }) => {
        if (depth === 1) return nodes.filter((n: any) => n.parentId === blockIdNum);
        const parentId = subSelections[depth - 2];
        if (!parentId) return [];
        return nodes.filter((n: any) => n.parentId === parentId);
      });
    } else {
      return dynamicLevels.map(({ depth, nodes }) => {
        if (depth === 0) {
          return nodes.filter((n: any) => n.parentAssemblyId === effectiveAssemblyId && (!n.parentId || n.parentId === 0));
        }
        const parentId = subSelections[depth - 1];
        if (!parentId) return [];
        return nodes.filter((n: any) => n.parentId === parentId);
      });
    }
  }, [dynamicLevels, subSelections, hasPreFilledBlock, blockId, effectiveAssemblyId]);

  /* =========================================================================
     COMMENTED OUT: Helper functions for hidden fields
     (Uncomment these if you re-enable Date of Birth / Languages / Categories)
     =========================================================================
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

  const handleLanguageChange = (language: string) => {
    setFormData(prev => ({
      ...prev,
      language: prev.language.includes(language)
        ? prev.language.filter(l => l !== language)
        : [...prev.language, language]
    }));
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
  ========================================================================= */

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
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.father_name.trim()) {
      newErrors.father_name = 'Father name is required';
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

    /* =========================================================================
       COMMENTED OUT VALIDATIONS:
       (Uncomment these if you re-enable the respective fields)
       =========================================================================
    if (!formData.initials.trim()) newErrors.initials = 'Initials is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.date_of_birth.trim()) newErrors.date_of_birth = 'Date of birth is required';
    if (!formData.gender.trim()) newErrors.gender = 'Gender is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (formData.language.length === 0) newErrors.language = 'At least one language must be selected';
    if (!formData.religion.trim()) newErrors.religion = 'Religion is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    ========================================================================= */

    if (!effectiveDistrictId) {
      newErrors.district_id = 'District is required';
    }

    if (!effectiveAssemblyId) {
      newErrors.assembly_id = 'Assembly is required';
    }

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
      const finalDistrictId = effectiveDistrictId;
      const finalAssemblyId = effectiveAssemblyId;
      const finalDistrictName = districtName || currentDistrictName || 'District';
      const finalAssemblyName = assemblyName || currentAssemblyName || 'Assembly';

      // Build query parameters for public registration endpoint
      const queryParams = new URLSearchParams({
        party_id: formData.party_id.toString(),
        party_name: partyName || 'Party',
        state_id: formData.state_id.toString(),
        state_name: stateName || 'State',
        district_id: finalDistrictId.toString(),
        district_name: finalDistrictName,
        assembly_id: finalAssemblyId.toString(),
        assembly_name: finalAssemblyName,
        created_by: createdBy || '0',
        created_by_name: createdByName || 'Public Registration'
      });

      // Collect all after-assembly levels ordered by depth
      const allAfterAssemblyLevels: number[] = [];

      if (hasPreFilledBlock) {
        // Block was pre-filled in URL
        queryParams.append('block_id', blockId!);
        queryParams.append('block_name', blockName || 'Block');
        queryParams.append('block_label', blockLabel || 'Block');
        allAfterAssemblyLevels.push(parseInt(blockId!));

        // 1. Prefilled from URL (deeperLevels)
        deeperLevels.forEach((lvl, idx) => {
          if (lvl.id > 0) {
            allAfterAssemblyLevels.push(lvl.id);
            queryParams.append(`level_${idx + 1}_id`, lvl.id.toString());
            queryParams.append(`level_${idx + 1}_name`, lvl.name || '');
            queryParams.append(`level_${idx + 1}_label`, lvl.label || `Level ${idx + 1}`);
          }
        });

        // 2. Extra selections beyond deeperLevels if user picked any in dropdowns
        if (dynamicLevels.length > deeperLevels.length) {
          dynamicLevels.slice(deeperLevels.length).forEach((level, relIdx) => {
            const idx = deeperLevels.length + relIdx;
            const selectedId = subSelections[idx] || 0;
            if (selectedId > 0) {
              allAfterAssemblyLevels.push(selectedId);
              const node = currentAssemblyAfterData.find((n: any) => n.id === selectedId) || afterAssemblyData.find((n: any) => n.id === selectedId);
              queryParams.append(`level_${idx + 1}_id`, selectedId.toString());
              queryParams.append(`level_${idx + 1}_name`, node?.displayName || node?.levelName || '');
              queryParams.append(`level_${idx + 1}_label`, level.label || `Level ${idx + 1}`);
            }
          });
        }
      } else {
        // No blockId in URL (e.g. State-Wide):
        // subSelections[0] is depth 0 (Zone / Block)
        if (subSelections[0] && subSelections[0] > 0) {
          const depth0Id = subSelections[0];
          const node0 = currentAssemblyAfterData.find((n: any) => n.id === depth0Id) || afterAssemblyData.find((n: any) => n.id === depth0Id);
          allAfterAssemblyLevels.push(depth0Id);
          queryParams.append('block_id', depth0Id.toString());
          queryParams.append('block_name', node0?.displayName || node0?.levelName || 'Block');
          queryParams.append('block_label', dynamicLevels[0]?.label || 'Block');
        }

        // subSelections[1..N] are depth 1..N
        for (let i = 1; i < subSelections.length; i++) {
          const sId = subSelections[i];
          if (sId && sId > 0) {
            allAfterAssemblyLevels.push(sId);
            const node = currentAssemblyAfterData.find((n: any) => n.id === sId) || afterAssemblyData.find((n: any) => n.id === sId);
            queryParams.append(`level_${i}_id`, sId.toString());
            queryParams.append(`level_${i}_name`, node?.displayName || node?.levelName || '');
            queryParams.append(`level_${i}_label`, dynamicLevels[i]?.label || `Level ${i}`);
          }
        }
      }

      // Send personal details, district, assembly, and after_assembly_levels in body
      const createData = {
        initials: formData.initials || undefined,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name?.trim() || undefined,
        father_name: formData.father_name?.trim() || undefined,
        phone_no: formData.phone_no.trim(),
        date_of_birth: formData.date_of_birth || undefined,
        age: formData.age > 0 ? formData.age : undefined,
        gender: (formData.gender as 'Male' | 'Female' | 'Other') || undefined,
        language: formData.language && formData.language.length > 0 ? formData.language : undefined,
        religion: formData.religion || undefined,
        category: formData.category || undefined,
        caste: formData.caste || undefined,
        whatsapp_no: formData.whatsapp_no?.trim() || undefined,
        voter_epic_id: formData.voter_epic_id?.trim() || undefined,
        address: formData.address?.trim() || undefined,
        remarks: formData.remarks?.trim() || undefined,
        district_id: finalDistrictId,
        assembly_id: finalAssemblyId,
        after_assembly_levels: allAfterAssemblyLevels,
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

  // Show error state for invalid parameters — party and state are required; district/assembly are selectable if not in URL
  if (!partyId || !stateId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[var(--bg-card)] rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-color)] mb-2">Invalid Registration Link</h1>
          <p className="text-[var(--text-secondary)] mb-6">
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
        <div className="max-w-md w-full bg-[var(--bg-card)] rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-color)] mb-2">Registration Successful!</h1>
          <p className="text-[var(--text-secondary)] mb-6">
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
                {locationSubtitle}
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
        <div className="bg-[var(--bg-card)] rounded-b-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-[var(--text-color)] mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* --- COMMENTED OUT: Initials (Uncomment to enable) ---
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Initials *</label>
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
                ------------------------------------------------------ */}

                {/* First Name (Visible & Required) */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">First Name *</label>
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

                {/* --- COMMENTED OUT: Last Name (Uncomment to enable) ---
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Last Name *</label>
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
                ----------------------------------------------------- */}

                {/* Father's Name (Visible & Required) */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Father's Name *</label>
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

                {/* --- COMMENTED OUT: Date of Birth & Age (Uncomment to enable) ---
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.date_of_birth ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Age</label>
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
                ----------------------------------------------------------------- */}

                {/* --- COMMENTED OUT: Gender (Uncomment to enable) ---
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Gender *</label>
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
                ---------------------------------------------------- */}

                {/* Phone Number (Visible & Required) */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Phone Number *</label>
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

                {/* WhatsApp Number (Visible & Optional) */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">WhatsApp Number</label>
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

                {/* EPIC ID (Visible & Optional) */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">EPIC ID</label>
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

            {/* --- COMMENTED OUT: Language & Religion Information Section (Uncomment to enable) ---
            <div>
              <h3 className="text-lg font-medium text-[var(--text-color)] mb-4">Language & Religion Information</h3>

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
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Religion *</label>
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

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    disabled={!formData.religion}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-[var(--text-secondary)] ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Category</option>
                    {getAvailableCategories().map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>

                {shouldShowCaste && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Caste</label>
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

                {formData.religion === 'Others' && formData.category === 'Others' && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Specify Category</label>
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
            ---------------------------------------------------------------------------------- */}

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-medium text-[var(--text-color)] mb-4">Location Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* State - Disabled */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={stateName || 'Unknown State'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-[var(--text-secondary)]"
                  />
                </div>

                {/* District */}
                {districtId ? (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                      District
                    </label>
                    <input
                      type="text"
                      value={districtName || 'Unknown District'}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-[var(--text-secondary)]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                      District *
                    </label>
                    <select
                      name="district_id"
                      value={selectedDistrictId || ''}
                      onChange={(e) => {
                        const dId = parseInt(e.target.value) || 0;
                        setSelectedDistrictId(dId);
                        setSelectedAssemblyId(0);
                        setSubSelections([]);
                        if (errors.district_id) setErrors(prev => ({ ...prev, district_id: '' }));
                      }}
                      disabled={hierarchyLoading || districtOptions.length === 0}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 ${errors.district_id ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">{hierarchyLoading ? 'Loading districts...' : 'Select District'}</option>
                      {districtOptions.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.levelName}</option>
                      ))}
                    </select>
                    {errors.district_id && <p className="text-red-500 text-xs mt-1">{errors.district_id}</p>}
                  </div>
                )}

                {/* Assembly */}
                {assemblyId ? (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                      Assembly
                    </label>
                    <input
                      type="text"
                      value={assemblyName || 'Unknown Assembly'}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-[var(--text-secondary)]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                      Assembly *
                    </label>
                    <select
                      name="assembly_id"
                      value={selectedAssemblyId || ''}
                      onChange={(e) => {
                        const aId = parseInt(e.target.value) || 0;
                        setSelectedAssemblyId(aId);
                        setSubSelections([]);
                        if (errors.assembly_id) setErrors(prev => ({ ...prev, assembly_id: '' }));
                      }}
                      disabled={hierarchyLoading || !selectedDistrictId || assemblyOptions.length === 0}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 ${errors.assembly_id ? 'border-red-500' : 'border-gray-300'}`}
                    >
                      <option value="">
                        {hierarchyLoading
                          ? 'Loading assemblies...'
                          : !selectedDistrictId
                          ? 'Select District first'
                          : assemblyOptions.length === 0
                          ? 'No assemblies found'
                          : 'Select Assembly'}
                      </option>
                      {assemblyOptions.map((a: any) => (
                        <option key={a.id} value={a.id}>{a.levelName}</option>
                      ))}
                    </select>
                    {errors.assembly_id && <p className="text-red-500 text-xs mt-1">{errors.assembly_id}</p>}
                  </div>
                )}

                {/* Dynamic Levels */}
                {hasPreFilledBlock ? (
                  <>
                    {/* Block/Zone pre-filled from URL */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                        {blockLabel}
                      </label>
                      <input
                        type="text"
                        value={blockName || `Unknown ${blockLabel}`}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-[var(--text-secondary)]"
                      />
                    </div>

                    {/* Pre-filled deeper levels from URL */}
                    {deeperLevels.map((lvl, idx) => (
                      <div key={`prefilled-${idx}`}>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                          {lvl.label}
                        </label>
                        <input
                          type="text"
                          value={lvl.name || `Unknown ${lvl.label}`}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-[var(--text-secondary)]"
                        />
                      </div>
                    ))}

                    {/* Additional optional dropdowns beyond deeper levels */}
                    {dynamicLevels.slice(deeperLevels.length).map((level, relIdx) => {
                      const idx = deeperLevels.length + relIdx;
                      const opts = visibleOptions[idx] || [];
                      const displayLabel = level.label;
                      const currentVal = subSelections[idx] || 0;
                      const parentSelected = idx === 0 || (subSelections[idx - 1] || 0) > 0;

                      return (
                        <div key={`dynamic-${level.depth}`}>
                          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                            {displayLabel} <span className="text-[var(--text-secondary)]">(Optional)</span>
                          </label>
                          <select
                            value={currentVal}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              setSubSelections(prev => {
                                const next = [...prev];
                                next[idx] = val;
                                for (let i = idx + 1; i < dynamicLevels.length; i++) next[i] = 0;
                                return next;
                              });
                            }}
                            disabled={hierarchyLoading || !parentSelected || opts.length === 0}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-[var(--text-secondary)]"
                          >
                            <option value={0}>
                              {hierarchyLoading
                                ? `Loading ${displayLabel}s...`
                                : !parentSelected
                                ? `Select ${dynamicLevels[idx - 1]?.label || 'previous level'} first`
                                : opts.length === 0
                                ? `No ${displayLabel} available`
                                : `Select ${displayLabel}`}
                            </option>
                            {opts.map((n: any) => (
                              <option key={n.id} value={n.id}>{n.displayName || n.levelName}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {/* Open link: all dynamic levels from depth 0 (Zone / Block, Sector, Booth...) */}
                    {dynamicLevels.map((level, idx) => {
                      const opts = visibleOptions[idx] || [];
                      const displayLabel = level.label;
                      const currentVal = subSelections[idx] || 0;
                      const parentSelected = idx === 0 ? !!effectiveAssemblyId : (subSelections[idx - 1] || 0) > 0;

                      return (
                        <div key={`dynamic-${level.depth}`}>
                          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                            {displayLabel} <span className="text-[var(--text-secondary)]">(Optional)</span>
                          </label>
                          <select
                            value={currentVal}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              setSubSelections(prev => {
                                const next = [...prev];
                                next[idx] = val;
                                for (let i = idx + 1; i < dynamicLevels.length; i++) next[i] = 0;
                                return next;
                              });
                            }}
                            disabled={hierarchyLoading || !parentSelected || opts.length === 0}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-[var(--text-secondary)]"
                          >
                            <option value={0}>
                              {hierarchyLoading
                                ? `Loading ${displayLabel}s...`
                                : !effectiveAssemblyId
                                ? 'Select Assembly first'
                                : !parentSelected
                                ? `Select ${dynamicLevels[idx - 1]?.label || 'previous level'} first`
                                : opts.length === 0
                                ? `No ${displayLabel} available`
                                : `Select ${displayLabel}`}
                            </option>
                            {opts.map((n: any) => (
                              <option key={n.id} value={n.id}>{n.displayName || n.levelName}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            {/* --- COMMENTED OUT: Additional Information Section (Address & Remarks) (Uncomment to enable) ---
            <div>
              <h3 className="text-lg font-medium text-[var(--text-color)] mb-4">Additional Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Address *</label>
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
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Remarks</label>
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
            ------------------------------------------------------------------------------------------------- */}

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[var(--border-color)]">
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
