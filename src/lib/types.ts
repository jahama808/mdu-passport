export type PropertyType = "mdu" | "resort" | "office" | "mixed";
export type Island = "oahu" | "maui" | "kauai" | "big-island" | "molokai" | "lanai";
export type AreaType =
  | "pool"
  | "gym"
  | "lobby"
  | "hallway"
  | "courtyard"
  | "parking"
  | "office"
  | "other";
export type InstallStatus = "not_started" | "in_progress" | "completed";

export type PropertyDetails = {
  contract_number?: string;
  customer?: string;
  service_type?: string;
  plan_speed?: string;
  billable_units?: string;
  mrc?: string;
  contract_start?: string;
  contract_term?: string;
  contract_end?: string;
  install_date?: string;
  account_exec?: string;
  account_manager?: string;
  website?: string;
  scope?: string;
};

export type Property = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  type: PropertyType;
  address: string | null;
  island: Island | null;
  gm_name: string | null;
  gm_email: string | null;
  notes: string | null;
  details: PropertyDetails | null;
  created_at: string;
  updated_at: string;
};

export type EquipmentType = {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  manufacturer: string | null;
  model: string | null;
  description: string | null;
  created_at: string;
};

export type CommonArea = {
  id: string;
  user_id: string;
  property_id: string;
  area_type: AreaType;
  area_name: string;
  description: string | null;
  notes: string | null;
  installation_status: InstallStatus;
  priority: number;
  installation_date: string | null;
  created_at: string;
  updated_at: string;
};

export type CommonAreaEquipment = {
  id: string;
  user_id: string;
  common_area_id: string;
  equipment_type_id: string;
  quantity: number;
  notes: string | null;
  created_at: string;
};

export type PropertyNote = {
  id: string;
  user_id: string;
  property_id: string;
  content: string;
  created_at: string;
};

export type PropertyDocument = {
  id: string;
  user_id: string;
  property_id: string;
  kind: string;
  filename: string;
  subject: string | null;
  content_md: string;
  created_at: string;
};

export type PropertyScanSession = {
  id: string;
  user_id: string;
  property_id: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  passport_md: string | null;
  passport_url: string | null;
  notes: string | null;
  current_location: string | null;
};

export type PropertyScan = {
  id: string;
  user_id: string;
  session_id: string;
  property_id: string;
  location: string | null;
  device_type: string | null;
  device_model: string | null;
  label_sn: string | null;
  label_mac: string | null;
  asset_tag: string | null;
  mount: string | null;
  led_state: string | null;
  narration: string | null;
  photo_urls: string[] | null;
  extracted_json: Record<string, unknown> | null;
  captured_at: string;
};

export const PROPERTY_TYPES: PropertyType[] = ["mdu", "resort", "office", "mixed"];
export const ISLANDS: Island[] = [
  "oahu",
  "maui",
  "kauai",
  "big-island",
  "molokai",
  "lanai",
];
export const AREA_TYPES: AreaType[] = [
  "pool",
  "gym",
  "lobby",
  "hallway",
  "courtyard",
  "parking",
  "office",
  "other",
];
export const INSTALL_STATUSES: InstallStatus[] = [
  "not_started",
  "in_progress",
  "completed",
];
