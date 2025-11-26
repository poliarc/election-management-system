import type { Campaign, CampaignEvent } from "../../../types/initative";

// Static campaigns database
export const staticCampaigns: Campaign[] = [
  {
    id: 1,
    name: "Youth Voter Registration Drive",
    description:
      "A comprehensive campaign to register young voters aged 18-25 across all districts. Help build democratic participation.",
    start_date: "2025-12-01",
    end_date: "2025-12-15",
    image: [
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800",
      "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800",
    ],
    location: "District Headquarters",
    levelType: "STATE",
    level_id: 1,
    acceptance_status: "pending",
    created_at: "2025-11-20T10:00:00Z",
    updated_at: "2025-11-20T10:00:00Z",
    scope_id: 101,
    acceptance_id: undefined,
    scope_level_type: "DISTRICT",
    scope_level_id: 1,
    report_count: 0,
  },
  {
    id: 2,
    name: "Community Health Camp",
    description:
      "Free health checkups and awareness programs for all community members. Includes blood donation drive and health screenings.",
    start_date: "2025-11-28",
    end_date: "2025-11-30",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800",
    location: "Central Park, Assembly Area",
    levelType: "DISTRICT",
    level_id: 1,
    acceptance_status: "accepted",
    created_at: "2025-11-15T08:30:00Z",
    updated_at: "2025-11-22T14:20:00Z",
    scope_id: 102,
    acceptance_id: 201,
    scope_level_type: "ASSEMBLY",
    scope_level_id: 10,
    report_count: 2,
  },
  {
    id: 3,
    name: "Road Safety Awareness Program",
    description:
      "Educating citizens about road safety rules, traffic regulations, and safe driving practices. Interactive sessions for all age groups.",
    start_date: "2025-12-05",
    end_date: "2025-12-07",
    image: [
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800",
      "https://images.unsplash.com/photo-1502489597346-dad15683d4c2?w=800",
    ],
    location: "Block Office Premises",
    levelType: "ASSEMBLY",
    level_id: 10,
    acceptance_status: "accepted",
    created_at: "2025-11-18T09:15:00Z",
    updated_at: "2025-11-23T11:45:00Z",
    scope_id: 103,
    acceptance_id: 202,
    scope_level_type: "BLOCK",
    scope_level_id: 50,
    report_count: 1,
  },
  {
    id: 4,
    name: "Women Empowerment Workshop",
    description:
      "Skill development and entrepreneurship training for women. Includes financial literacy, digital skills, and business planning sessions.",
    start_date: "2025-12-10",
    end_date: "2025-12-12",
    image: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800",
    location: "Community Hall",
    levelType: "DISTRICT",
    level_id: 1,
    acceptance_status: "pending",
    created_at: "2025-11-19T13:00:00Z",
    updated_at: "2025-11-19T13:00:00Z",
    scope_id: 104,
    acceptance_id: undefined,
    scope_level_type: "ASSEMBLY",
    scope_level_id: 10,
    report_count: 0,
  },
  {
    id: 5,
    name: "Clean & Green Initiative",
    description:
      "Tree plantation drive and cleanliness campaign. Join us in making our community greener and cleaner for future generations.",
    start_date: "2025-11-26",
    end_date: "2025-11-27",
    image: [
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800",
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800",
    ],
    location: "Multiple Locations",
    levelType: "STATE",
    level_id: 1,
    acceptance_status: "declined",
    created_at: "2025-11-10T07:00:00Z",
    updated_at: "2025-11-21T16:30:00Z",
    scope_id: 105,
    acceptance_id: undefined,
    scope_level_type: "DISTRICT",
    scope_level_id: 1,
    report_count: 0,
  },
  {
    id: 6,
    name: "Digital Literacy Campaign",
    description:
      "Teaching basic computer skills and internet usage to senior citizens and rural communities. Bridging the digital divide.",
    start_date: "2025-12-08",
    end_date: "2025-12-10",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
    location: "Village Panchayat Office",
    levelType: "BLOCK",
    level_id: 50,
    acceptance_status: "accepted",
    created_at: "2025-11-17T10:30:00Z",
    updated_at: "2025-11-24T09:15:00Z",
    scope_id: 106,
    acceptance_id: 203,
    scope_level_type: "BLOCK",
    scope_level_id: 50,
    report_count: 3,
  },
  {
    id: 7,
    name: "Farmers' Support Meet",
    description:
      "Interactive session with farmers to discuss agricultural schemes, subsidies, and modern farming techniques.",
    start_date: "2025-12-03",
    end_date: "2025-12-03",
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800",
    location: "Agriculture Department Hall",
    levelType: "DISTRICT",
    level_id: 1,
    acceptance_status: "pending",
    created_at: "2025-11-21T11:00:00Z",
    updated_at: "2025-11-21T11:00:00Z",
    scope_id: 107,
    acceptance_id: undefined,
    scope_level_type: "ASSEMBLY",
    scope_level_id: 11,
    report_count: 0,
  },
];

// Static reports database
export interface CampaignReport {
  id: number;
  campaign_acceptance_id: number;
  campaign_id: number;
  campaign_name: string;
  report_text: string;
  description: string; // Alias for report_text for UI compatibility
  images: string[];
  created_at: string;
  updated_at: string;
  userLevelType: string;
  userLevelId: number;
  personName: string;
  personPhone: string;
  date: string;
  attendees: number;
  isDelete: number;
  acceptance_status: string;
}

export const staticReports: CampaignReport[] = [
  {
    id: 1,
    campaign_acceptance_id: 201,
    campaign_id: 2,
    campaign_name: "Community Health Camp",
    report_text:
      "Successfully organized health camp with 150+ participants. Free checkups completed for all attendees. Blood donation drive collected 25 units.",
    description:
      "Successfully organized health camp with 150+ participants. Free checkups completed for all attendees. Blood donation drive collected 25 units.",
    images: [
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800",
      "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800",
    ],
    created_at: "2025-11-23T15:30:00Z",
    updated_at: "2025-11-23T15:30:00Z",
    userLevelType: "ASSEMBLY",
    userLevelId: 10,
    personName: "Dr. Rajesh Kumar",
    personPhone: "+91 98765 43210",
    date: "2025-11-23",
    attendees: 150,
    isDelete: 0,
    acceptance_status: "accepted",
  },
  {
    id: 2,
    campaign_acceptance_id: 201,
    campaign_id: 2,
    campaign_name: "Community Health Camp",
    report_text:
      "Day 2 update: Increased participation to 200+ people. Eye checkup and dental screening camps well received.",
    description:
      "Day 2 update: Increased participation to 200+ people. Eye checkup and dental screening camps well received.",
    images: [
      "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=800",
    ],
    created_at: "2025-11-24T16:00:00Z",
    updated_at: "2025-11-24T16:00:00Z",
    userLevelType: "ASSEMBLY",
    userLevelId: 10,
    personName: "Dr. Priya Sharma",
    personPhone: "+91 98765 43211",
    date: "2025-11-24",
    attendees: 200,
    isDelete: 0,
    acceptance_status: "accepted",
  },
  {
    id: 3,
    campaign_acceptance_id: 202,
    campaign_id: 3,
    campaign_name: "Road Safety Awareness Program",
    report_text:
      "Conducted interactive sessions with 80+ students. Distributed safety helmets and reflective jackets to participants.",
    description:
      "Conducted interactive sessions with 80+ students. Distributed safety helmets and reflective jackets to participants.",
    images: [
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800",
    ],
    created_at: "2025-11-24T10:15:00Z",
    updated_at: "2025-11-24T10:15:00Z",
    userLevelType: "BLOCK",
    userLevelId: 50,
    personName: "Suresh Patil",
    personPhone: "+91 98765 43212",
    date: "2025-11-24",
    attendees: 80,
    isDelete: 0,
    acceptance_status: "accepted",
  },
  {
    id: 4,
    campaign_acceptance_id: 203,
    campaign_id: 6,
    campaign_name: "Digital Literacy Campaign",
    report_text:
      "Excellent turnout with 45 senior citizens enrolled. Basic computer operations taught successfully.",
    description:
      "Excellent turnout with 45 senior citizens enrolled. Basic computer operations taught successfully.",
    images: [
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800",
    ],
    created_at: "2025-11-22T14:45:00Z",
    updated_at: "2025-11-22T14:45:00Z",
    userLevelType: "BLOCK",
    userLevelId: 50,
    personName: "Ramesh Verma",
    personPhone: "+91 98765 43213",
    date: "2025-11-22",
    attendees: 45,
    isDelete: 0,
    acceptance_status: "accepted",
  },
  {
    id: 5,
    campaign_acceptance_id: 203,
    campaign_id: 6,
    campaign_name: "Digital Literacy Campaign",
    report_text:
      "Day 2: Internet basics and email usage covered. All participants showed great enthusiasm and progress.",
    description:
      "Day 2: Internet basics and email usage covered. All participants showed great enthusiasm and progress.",
    images: [],
    created_at: "2025-11-23T15:20:00Z",
    updated_at: "2025-11-23T15:20:00Z",
    userLevelType: "BLOCK",
    userLevelId: 50,
    personName: "Ramesh Verma",
    personPhone: "+91 98765 43213",
    date: "2025-11-23",
    attendees: 42,
    isDelete: 0,
    acceptance_status: "accepted",
  },
  {
    id: 6,
    campaign_acceptance_id: 203,
    campaign_id: 6,
    campaign_name: "Digital Literacy Campaign",
    report_text:
      "Final day: Certificates distributed. Total 42 participants completed the course successfully.",
    description:
      "Final day: Certificates distributed. Total 42 participants completed the course successfully.",
    images: [
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800",
    ],
    created_at: "2025-11-24T17:00:00Z",
    updated_at: "2025-11-24T17:00:00Z",
    userLevelType: "BLOCK",
    userLevelId: 50,
    personName: "Ramesh Verma",
    personPhone: "+91 98765 43213",
    date: "2025-11-24",
    attendees: 42,
    isDelete: 0,
    acceptance_status: "accepted",
  },
];

// Helper functions for static data operations
export const getCampaignsByLevel = (
  levelType: string,
  levelId: number
): Campaign[] => {
  return staticCampaigns.filter(
    (campaign) =>
      campaign.scope_level_type === levelType &&
      campaign.scope_level_id === levelId
  );
};

export const getCampaignById = (id: number): Campaign | undefined => {
  return staticCampaigns.find((campaign) => campaign.id === id);
};

export const getReportsByCampaignAcceptanceId = (
  acceptanceId: number
): CampaignReport[] => {
  return staticReports.filter(
    (report) => report.campaign_acceptance_id === acceptanceId
  );
};

export const updateCampaignAcceptanceStatus = (
  scopeId: number,
  status: "accepted" | "declined"
): Campaign | null => {
  const campaign = staticCampaigns.find((c) => c.scope_id === scopeId);
  if (campaign) {
    campaign.acceptance_status = status;
    campaign.updated_at = new Date().toISOString();
    if (status === "accepted" && !campaign.acceptance_id) {
      campaign.acceptance_id = 200 + scopeId; // Generate acceptance_id
    }
    return campaign;
  }
  return null;
};

export const addCampaignReport = (reportData: {
  campaign_acceptance_id: number;
  campaign_id: number;
  campaign_name: string;
  report_text: string;
  images: string[];
  userLevelType: string;
  userLevelId: number;
}): CampaignReport => {
  const newReport: CampaignReport = {
    id: staticReports.length + 1,
    ...reportData,
    description: reportData.report_text, // Copy report_text to description
    personName: "Demo User",
    personPhone: "+91 98765 00000",
    date: new Date().toISOString().split("T")[0],
    attendees: 0,
    isDelete: 0,
    acceptance_status: "accepted",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  staticReports.push(newReport);

  // Update report count in campaign
  const campaign = staticCampaigns.find((c) => c.id === reportData.campaign_id);
  if (campaign) {
    campaign.report_count++;
  }

  return newReport;
};

export const updateCampaignReport = (
  reportId: number,
  updates: { report_text?: string; images?: string[] }
): CampaignReport | null => {
  const report = staticReports.find((r) => r.id === reportId);
  if (report) {
    if (updates.report_text) report.report_text = updates.report_text;
    if (updates.images) report.images = updates.images;
    report.updated_at = new Date().toISOString();
    return report;
  }
  return null;
};

// Map Campaign to CampaignEvent for UI compatibility
export const mapCampaignToEvent = (campaign: Campaign): CampaignEvent => {
  const images = Array.isArray(campaign.image)
    ? campaign.image
    : campaign.image
    ? [campaign.image]
    : [];

  return {
    id: String(campaign.id),
    title: campaign.name,
    description: campaign.description,
    date: campaign.start_date,
    startDate: campaign.start_date,
    endDate: campaign.end_date,
    time: "10:00 AM - 4:00 PM",
    location: campaign.location || "TBA",
    category:
      campaign.description.toLowerCase().includes("health") ||
      campaign.description.toLowerCase().includes("camp")
        ? "social"
        : "meeting",
    priority: "medium",
    attendeeCount: 0,
    maxAttendees: 100,
    acceptance_status: campaign.acceptance_status,
    image: images,
    organizer: `${campaign.levelType} Level`,
    requirements: [],
    createdAt: campaign.created_at,
    updatedAt: campaign.updated_at,
    campaign_id: campaign.id,
    scope_id: campaign.scope_id,
    acceptance_id: campaign.acceptance_id,
    levelType: campaign.levelType,
    level_id: campaign.level_id,
    scope_level_type: campaign.scope_level_type,
    scope_level_id: campaign.scope_level_id,
  };
};
