export type Mandal = {
  id: number;
  district_id?: number;
  assembly_id?: number;
  block_id?: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  state?: string | null;
  district?: string | null;
  mandal?: string | null;
  mandalName?: string | null;
  mandal_id?: number | undefined;
  block?: string | null;
  profileImage?: string | File | null;
  password?: string | null;
  status?: string | number;
  acNo?: string | number;
  distNo?: string | number;
  designation?: string | null;
  assembly?: string | number | null;
};

export type MandalCandidate = {
  block_id?: number | null;
  mandal?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | number | null;
  state?: string | null;
  district?: string | null;
  profileImage?: FileList | null;
  password?: string | null;
  assembly?: string | number | null;
  block?: string | null;
  acNo?: string | number;
  distNo?: string | number;
  designation?: string | null;
};

export const MANDAL_STORAGE_KEY = "mandals";
