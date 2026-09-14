export type User = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
};

export type QueueEntry = {
  id: number;
  branch_id: number;
  customer_name: string;
  customer_phone?: string;
  service_id: number;
  service_name?: string;
  priority: "NORMAL" | "PRIORITY" | "EMERGENCY";
  queue_number: string;
  status: string;
  checked_in_at: string;
};

export type Service = {
  id: number;
  name: string;
  duration_minutes: number;
  price: number;
  capacity: number;
};

export type Appointment = {
  id: number;
  appointment_number: string;
  branch_id: number;
  service_id: number;
  start_time: string;
  end_time: string;
  status: string;
  service_name?: string;
  branch_name?: string;
};

export type WaitlistEntry = {
  id: number;
  branch_id: number;
  service_id: number;
  requested_date: string;
  requested_start_time?: string | null;
  requested_end_time?: string | null;
  status: string;
  priority: "NORMAL" | "PRIORITY" | "EMERGENCY";
  joined_at: string;
  offered_at?: string | null;
  expires_at?: string | null;
  branch_name?: string;
  service_name?: string;
};