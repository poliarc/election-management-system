export interface CampaignReport {
  id: string;
  campaignId: string;
  campaignName: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  images: string[];
  createdAt: string;
  likes: number;
  comments: number;
  shares: number;
  isApproved: boolean;
  districtId: string;
  districtName: string;
  assemblyId: string;
  assemblyName: string;
  blockId: string;
  blockName: string;
  mandalId: string;
  mandalName: string;
}

export interface District {
  id: string;
  name: string;
  assemblyCount: number;
  memberCount: number;
  reportCount: number;
}

export interface Assembly {
  id: string;
  name: string;
  districtId: string;
  blockCount: number;
  memberCount: number;
  reportCount: number;
}

export interface Block {
  id: string;
  name: string;
  districtId: string;
  assemblyId: string;
  mandalCount: number;
  memberCount: number;
  reportCount: number;
}

export interface Mandal {
  id: string;
  name: string;
  districtId: string;
  assemblyId: string;
  blockId: string;
  memberCount: number;
  reportCount: number;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  districtId: string;
  assemblyId: string;
  blockId: string;
  mandalId: string;
  reportCount: number;
  lastActive: string;
  totalEngagement: number;
}

export type ViewMode =
  | "districts"
  | "assemblies"
  | "blocks"
  | "mandals"
  | "members"
  | "reports";

export interface CampaignReportsState {
  viewMode: ViewMode;
  selectedDistrict: District | null;
  selectedAssembly: Assembly | null;
  selectedBlock: Block | null;
  selectedMandal: Mandal | null;
  selectedMember: Member | null;
}

export interface CampaignReportsActions {
  handleDistrictClick: (district: District) => void;
  handleAssemblyClick: (assembly: Assembly) => void;
  handleBlockClick: (block: Block) => void;
  handleMandalClick: (mandal: Mandal) => void;
  handleMemberClick: (member: Member) => void;
  handleBack: () => void;
  handleApproveReport: (reportId: string) => void;
  handleRejectReport: (reportId: string) => void;
}
