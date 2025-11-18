// Level Configuration Types
export interface LevelConfig {
  id: string;
  name: string;
  displayName: string;
  order: number;
  isFixed: boolean;
  isActive: boolean;
  adminId?: string | null;
  adminName?: string | null;
}

export interface PartyLevelConfig {
  id?: number;
  partyId: number;
  partyName: string;
  stateId: number;
  stateName: string;
  levels: LevelConfig[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PartyLevelFormData {
  partyId: number;
  partyName: string;
  stateId: number;
  stateName: string;
  levels: LevelConfig[];
}

// Component Props
export interface PartyLevelListProps {
  onAdd: () => void;
  onView: (config: PartyLevelConfig) => void;
  onEdit: (config: PartyLevelConfig) => void;
}

export interface PartyLevelFormProps {
  initialData?: PartyLevelConfig;
  onSubmit: (data: PartyLevelFormData) => void;
  onCancel: () => void;
  isViewMode?: boolean;
}

export interface LevelRowProps {
  level: LevelConfig;
  onRemove: (levelId: string) => void;
  onAdminChange: (levelId: string, adminId: string, adminName: string) => void;
  isViewMode?: boolean;
  availableAdmins: AdminOption[];
}

export interface AdminOption {
  id: string;
  name: string;
  email: string;
}

// Default Levels
export const DEFAULT_LEVELS: LevelConfig[] = [
  { id: 'state', name: 'state', displayName: 'State', order: 1, isFixed: true, isActive: true, adminId: null, adminName: null },
  { id: 'district', name: 'district', displayName: 'District', order: 2, isFixed: true, isActive: true, adminId: null, adminName: null },
  { id: 'assembly', name: 'assembly', displayName: 'Assembly', order: 3, isFixed: true, isActive: true, adminId: null, adminName: null },
  { id: 'block', name: 'block', displayName: 'Block', order: 4, isFixed: false, isActive: true, adminId: null, adminName: null },
  { id: 'mandal', name: 'mandal', displayName: 'Mandal', order: 5, isFixed: false, isActive: true, adminId: null, adminName: null },
  { id: 'booth', name: 'booth', displayName: 'Booth', order: 6, isFixed: false, isActive: true, adminId: null, adminName: null },
  { id: 'karyakarta', name: 'karyakarta', displayName: 'Karyakarta', order: 7, isFixed: false, isActive: true, adminId: null, adminName: null }
];