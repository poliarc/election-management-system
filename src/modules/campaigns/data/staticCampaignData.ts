import type { Campaign, CampaignReport } from "../../../types/campaign";

/**
 * Static Campaign Data for Demo/Testing
 * This replaces API calls with hardcoded sample data
 */

export const STATIC_CAMPAIGNS: Campaign[] = [
  {
    id: "1",
    name: "Grassroots Outreach - Urban Areas",
    description:
      "Door-to-door campaign focusing on urban development issues, connecting with voters about infrastructure and local governance improvements.",
    start_date: "2025-01-15",
    end_date: "2025-02-28",
    location: "Guwahati District",
    image:
      "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=600&fit=crop",
    ],
    levelType: "STATE",
    level_id: 1,
    levelOrderNo: "1",
    status: 1,
    isDelete: 0,
    created_at: "2025-01-10T08:00:00Z",
    updated_at: "2025-01-10T08:00:00Z",
    scope_id: 1,
    scope_level_type: "DISTRICT",
    scope_level_id: 101,
    acceptance_status: "ACCEPTED",
    acceptance_id: 1,
    report_count: 45,
    totalParticipants: 15,
    media: {
      images: [
        "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=600&fit=crop",
      ],
      videos: [],
    },
  },
  {
    id: "2",
    name: "Youth Engagement Initiative",
    description:
      "Mobilizing young voters through social media campaigns, campus visits, and youth-focused policy discussions on education and employment.",
    start_date: "2025-02-01",
    end_date: "2025-03-15",
    location: "Silchar Assembly",
    image:
      "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop",
    ],
    levelType: "STATE",
    level_id: 1,
    levelOrderNo: "1",
    status: 1,
    isDelete: 0,
    created_at: "2025-01-25T10:30:00Z",
    updated_at: "2025-01-25T10:30:00Z",
    scope_id: 2,
    scope_level_type: "ASSEMBLY",
    scope_level_id: 201,
    acceptance_status: "PENDING",
    acceptance_id: null,
    report_count: 28,
    totalParticipants: 22,
    media: {
      images: [
        "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=600&fit=crop",
      ],
      videos: [],
    },
  },
  {
    id: "3",
    name: "Health & Wellness Awareness",
    description:
      "Community health camps and awareness programs highlighting healthcare initiatives and wellness schemes for all age groups.",
    start_date: "2024-12-01",
    end_date: "2024-12-31",
    location: "Jorhat Block",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&h=600&fit=crop",
    ],
    levelType: "STATE",
    level_id: 1,
    levelOrderNo: "1",
    status: 0,
    isDelete: 0,
    created_at: "2024-11-20T14:00:00Z",
    updated_at: "2025-01-05T09:00:00Z",
    scope_id: 3,
    scope_level_type: "BLOCK",
    scope_level_id: 301,
    acceptance_status: "ACCEPTED",
    acceptance_id: 3,
    report_count: 67,
    totalParticipants: 34,
    media: {
      images: [
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=800&h=600&fit=crop",
      ],
      videos: [],
    },
  },
  {
    id: "4",
    name: "Agricultural Development Drive",
    description:
      "Farmer support campaign focusing on agricultural subsidies, modern farming techniques, and rural infrastructure development.",
    start_date: "2025-03-01",
    end_date: "2025-04-30",
    location: "Tinsukia District",
    image:
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=600&fit=crop",
    ],
    levelType: "STATE",
    level_id: 1,
    levelOrderNo: "1",
    status: 1,
    isDelete: 0,
    created_at: "2025-02-15T11:00:00Z",
    updated_at: "2025-02-15T11:00:00Z",
    scope_id: 4,
    scope_level_type: "MANDAL",
    scope_level_id: 401,
    acceptance_status: "ACCEPTED",
    acceptance_id: 4,
    report_count: 12,
    totalParticipants: 8,
    media: {
      images: [
        "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800&h=600&fit=crop",
      ],
      videos: [],
    },
  },
  {
    id: "5",
    name: "Women Empowerment Program",
    description:
      "Empowering women through skill development workshops, awareness on women's rights, and promoting female leadership in politics.",
    start_date: "2024-11-01",
    end_date: "2024-11-30",
    location: "Dibrugarh Assembly",
    image:
      "https://images.unsplash.com/photo-1573496527892-904f897eb744?w=800&h=600&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1573496527892-904f897eb744?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1573496774426-fe3c8e12aa30?w=800&h=600&fit=crop",
    ],
    levelType: "STATE",
    level_id: 1,
    levelOrderNo: "1",
    status: 0,
    isDelete: 0,
    created_at: "2024-10-20T09:30:00Z",
    updated_at: "2024-12-05T16:00:00Z",
    scope_id: 5,
    scope_level_type: "ASSEMBLY",
    scope_level_id: 202,
    acceptance_status: "ACCEPTED",
    acceptance_id: 5,
    report_count: 89,
    totalParticipants: 41,
    media: {
      images: [
        "https://images.unsplash.com/photo-1573496527892-904f897eb744?w=800&h=600&fit=crop",
      ],
      videos: [],
    },
  },
];

export const STATIC_CAMPAIGN_REPORTS: CampaignReport[] = [
  {
    id: 1,
    state: "Assam",
    district: "Guwahati",
    location: "Ward 12, Guwahati City",
    attendees: 45,
    personName: "Rajesh Kumar",
    personPhone: "+91-98765-43210",
    images: [
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=600&fit=crop",
    ],
    date: "2025-01-18T10:00:00Z",
    description:
      "Conducted door-to-door campaign covering 45 households. Discussed urban infrastructure issues.",
    karyakarta_id: 101,
    campaign_id: 1,
    created_at: "2025-01-18T14:30:00Z",
    updated_at: "2025-01-18T14:30:00Z",
    karyakarta_firstName: "Rajesh",
    karyakarta_phone: "+91-98765-43210",
    reporter_level: "DISTRICT",
  },
  {
    id: 2,
    state: "Assam",
    district: "Guwahati",
    location: "Fancy Bazaar Area",
    attendees: 67,
    personName: "Priya Sharma",
    personPhone: "+91-98123-45678",
    images: [
      "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&h=600&fit=crop",
    ],
    date: "2025-01-20T15:00:00Z",
    description:
      "Street corner meeting with local shopkeepers and residents about civic amenities.",
    karyakarta_id: 102,
    campaign_id: 1,
    created_at: "2025-01-20T18:00:00Z",
    updated_at: "2025-01-20T18:00:00Z",
    karyakarta_firstName: "Priya",
    karyakarta_phone: "+91-98123-45678",
    reporter_level: "ASSEMBLY",
  },
  {
    id: 3,
    state: "Assam",
    district: "Guwahati",
    location: "Panbazaar Market",
    attendees: 32,
    personName: "Amit Borah",
    personPhone: "+91-97543-21098",
    images: [
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&h=600&fit=crop",
    ],
    date: "2025-01-22T11:00:00Z",
    description:
      "Interactive session with market vendors about trade and business development.",
    karyakarta_id: 103,
    campaign_id: 1,
    created_at: "2025-01-22T15:45:00Z",
    updated_at: "2025-01-22T15:45:00Z",
    karyakarta_firstName: "Amit",
    karyakarta_phone: "+91-97543-21098",
    reporter_level: "BLOCK",
  },
  {
    id: 4,
    state: "Assam",
    district: "Cachar",
    location: "Silchar University Campus",
    attendees: 120,
    personName: "Neha Das",
    personPhone: "+91-96543-87654",
    images: [
      "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop",
    ],
    date: "2025-02-05T09:30:00Z",
    description:
      "Campus rally and discussion on youth employment policies with college students.",
    karyakarta_id: 104,
    campaign_id: 2,
    created_at: "2025-02-05T13:00:00Z",
    updated_at: "2025-02-05T13:00:00Z",
    karyakarta_firstName: "Neha",
    karyakarta_phone: "+91-96543-87654",
    reporter_level: "ASSEMBLY",
  },
  {
    id: 5,
    state: "Assam",
    district: "Cachar",
    location: "Youth Club, Silchar",
    attendees: 55,
    personName: "Vikram Singh",
    personPhone: "+91-94321-67890",
    images: [
      "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&h=600&fit=crop",
    ],
    date: "2025-02-08T16:00:00Z",
    description:
      "Youth forum discussing education reform and skill development opportunities.",
    karyakarta_id: 105,
    campaign_id: 2,
    created_at: "2025-02-08T19:30:00Z",
    updated_at: "2025-02-08T19:30:00Z",
    karyakarta_firstName: "Vikram",
    karyakarta_phone: "+91-94321-67890",
    reporter_level: "MANDAL",
  },
];

/**
 * Helper functions to work with static data
 */

export const getCampaignById = (id: string): Campaign | undefined => {
  return STATIC_CAMPAIGNS.find((campaign) => campaign.id === id);
};

export const getReportsByCampaignId = (
  campaignId: number
): CampaignReport[] => {
  return STATIC_CAMPAIGN_REPORTS.filter(
    (report) => report.campaign_id === campaignId
  );
};

export const getAllCampaigns = (): Campaign[] => {
  return [...STATIC_CAMPAIGNS];
};

export const getAllReports = (): CampaignReport[] => {
  return [...STATIC_CAMPAIGN_REPORTS];
};

// Simulate adding a new campaign
let campaignIdCounter = STATIC_CAMPAIGNS.length + 1;

export const addCampaign = (campaignData: Partial<Campaign>): Campaign => {
  const newCampaign: Campaign = {
    id: String(campaignIdCounter++),
    name: campaignData.name || "New Campaign",
    description: campaignData.description || "",
    start_date: campaignData.start_date || new Date().toISOString(),
    end_date: campaignData.end_date || new Date().toISOString(),
    location: campaignData.location || null,
    image: campaignData.image || null,
    images: campaignData.images || [],
    levelType: "STATE",
    level_id: 1,
    levelOrderNo: "1",
    status: 1,
    isDelete: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    scope_id: campaignIdCounter,
    scope_level_type: "STATE",
    scope_level_id: 1,
    acceptance_status: "PENDING",
    acceptance_id: null,
    report_count: 0,
    totalParticipants: 0,
    media: {
      images: campaignData.images || [],
      videos: [],
    },
  };

  STATIC_CAMPAIGNS.push(newCampaign);
  return newCampaign;
};

// Simulate updating a campaign
export const updateCampaign = (
  id: string,
  updates: Partial<Campaign>
): Campaign | null => {
  const index = STATIC_CAMPAIGNS.findIndex((c) => c.id === id);
  if (index === -1) return null;

  STATIC_CAMPAIGNS[index] = {
    ...STATIC_CAMPAIGNS[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  return STATIC_CAMPAIGNS[index];
};

// Simulate deleting a campaign
export const deleteCampaign = (id: string): boolean => {
  const index = STATIC_CAMPAIGNS.findIndex((c) => c.id === id);
  if (index === -1) return false;

  STATIC_CAMPAIGNS.splice(index, 1);
  return true;
};

// Simulate ending a campaign
export const endCampaign = (id: string): Campaign | null => {
  const campaign = STATIC_CAMPAIGNS.find((c) => c.id === id);
  if (!campaign) return null;

  campaign.status = 0;
  campaign.updated_at = new Date().toISOString();
  return campaign;
};
