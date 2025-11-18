export type PartyType = {
  typeName: string;
  type: string;
  party_type_id: number;
  // typeName: string;
  isActive: boolean;
  created_at: string;
};

export type PartyTypeForm = {
  typeName: string;
  isActive: boolean;
  type?: string;

};

export type PartyTypeSearchParams = {
  page: number;
  limit: number;
  search?: string;
  isActive?: boolean;
  type?: string;
};
