// ============================================
// Booking system types and business rules
// ============================================


export interface SessionType {
  id: number;
  name: string;
  slug: string;
  duration_minutes: number;
  description: string;
  price_note: string;
  sort_order: number;
  active: boolean;
}


export interface Booking {
  id: string;
  session_type_id: number;
  client_name: string;
  client_email: string;
  client_phone?: string;
  business_name?: string;
  description?: string;
  date: string;        // ISO: 2026-04-20
  start_time: string;  // 24hr: 09:00
  end_time: string;    // 24hr: 13:00
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled';
  gcal_event_id?: string;
  honeybook_link?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}


export interface TimeSlot {
  start: string;  // 09:00
  end: string;    // 13:00
}


export interface DayAvailability {
date: string;
slots: TimeSlot[];
}

// ── Business Rules ──
export const BOOKING_RULES = {
  // Your work availability
  START_HOUR: 9,       // 9:00 AM
  END_HOUR: 17,        // 5:00 PM (last slot ends at 5:30)
  END_MINUTE: 30,      // 5:30 PM hard cutoff


  // Minimum advance notice (days)
  MIN_ADVANCE_DAYS: 14,


  // Slot granularity (minutes)
  SLOT_INCREMENT: 30,  // Slots start every 30 min


  // Available days (0=Sun, 1=Mon, ..., 6=Sat)
  AVAILABLE_DAYS: [1, 2, 3, 4, 5],  // Mon-Fri


  // Timezone
  TIMEZONE: 'America/Chicago',
} as const;