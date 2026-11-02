// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface AppTicket {
  number: string;
  date: string;
  time: string;
  name: string;
  id: string;
  service_type: string;
  window: string;
  venue: string;
  issued: string;
  appointment_time?: string;
  department?: string;
}

export interface CurrentUser {
  name: string;
  accountId: string;
  email: string;
}

export type PurposeOfVisit =
  | "General"
  | "Premium Support"
  | "Consultation"
  | "Billing";

export interface SelectedDate {
  day: number;
  month: number;
  year: number;
}

export interface SelectedSlot {
  id: number;
  time: string;
  hour?: number;
  minute?: number;
  available?: number;
  total?: number;
}

export interface QueueItem {
  ticket_number: string;
  user_name: string;
  public_display_name?: string | null;
  account_id?: string | null;
  appointment_time: string;
  department: string;
}

export type WindowStatus = "open" | "cutoff" | "closed";
export type BookingStep = "home" | "booking" | "confirm" | "ticket";
export type BookingMode = "now" | "later" | null;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
export const SCHOOL_NAME = "SASCHED Platform";
export const DEPT = "(SAS) Appointment system";
export const VENUE = "First Floor, Main Building";
export const BOOKING_WINDOW_DAYS = 14;

// ─── WINDOWS / DEPARTMENTS ────────────────────────────────────────────────────
export const WINDOWS = [
  {
    id: "cashier",
    label: "Cashier Window",
    desc: "Payments, fees & clearances",
    dept: "Cashier",
  },
  {
    id: "registrar",
    label: "Registrar Window",
    desc: "Appointments, records & forms",
    dept: "Registrar",
  },
];

// Max bookings allowed per time slot per window
export const SLOT_CAPACITY = 5;

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const HERO_WORDS = ["Slot", "Appointment", "Session", "Future"];

