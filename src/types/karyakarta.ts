export interface Karyakarta {
  karyakarta_id: number;
  assembly_id: number;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  karyakartaName: string;
  assembly: string;
  profileImage?: string;
  status: string;
}

export type KaryakartaCandidate = {
  karyakartaName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: number;
  age: number;
  state: string;
  dist: string;
  address: string;
  profileImage: FileList | null;
  password: string;
  status: string;
};

export type KaryakartaFormData = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password?: string;
  state: string;
  district: string;
  assembly: string;
};
