export type FamilyMember = {
  id: string;
  user_id: string;
  name: string;
  relationship: string | null;
  date_of_birth: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Prescription = {
  id: string;
  user_id: string;
  family_member_id: string;
  prescription_date: string;
  doctor_name: string | null;
  specialty: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PrescriptionSearchRow = Prescription & {
  family_member_name: string | null;
  family_member_relationship: string | null;
};

export type Attachment = {
  id: string;
  user_id: string;
  prescription_id: string;
  storage_path: string;
  original_file_name: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  original_file_size: number;
  display_order: number;
  created_at: string;
};

export const RELATIONSHIPS = ["Self", "Spouse", "Son", "Daughter", "Parent", "Other"] as const;

export const MAX_ATTACHMENTS = 4;
