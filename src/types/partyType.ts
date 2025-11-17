export type PartyType = {
  party_type_id: number;
  typeName: string;
  isActive: boolean;
  created_at: string;
};

export type PartyTypeForm = {
  typeName: string;
  isActive: boolean;
};

export type PartyTypeSearchParams = {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
};
