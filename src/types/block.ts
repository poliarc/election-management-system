export interface Block {
  block_id?: string;
  id: number;
  assembly_id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  state: string;
  district: string;
  blockName: string;
  assembly: string;
  acNo: string;
  distNo: string;
  designation: string;
  profileImage?: string;
}

export type BlockCandidate = {
  id?: number;
  assembly_id?: number;
  blockName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  profileImage: FileList | null;
  password: string;
  assembly: string;
  district: string;
  acNo: string;
  distNo: string;
  designation: string;
};
