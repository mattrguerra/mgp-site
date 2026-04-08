import { BOOKING_RULES, type TimeSlot, type DayAvailability } from './booking';


const { START_HOUR, END_HOUR, END_MINUTE, MIN_ADVANCE_DAYS,
        SLOT_INCREMENT, AVAILABLE_DAYS, TIMEZONE } = BOOKING_RULES;


/**
 * Get all weekday dates in a month that are >= MIN_ADVANCE_DAYS away
 */
export function getBookableDates(year: number, month: number): string[] {
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + MIN_ADVANCE_DAYS);


  const dates: string[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();


  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();


    // Must be a weekday and at least MIN_ADVANCE_DAYS away
    if ((AVAILABLE_DAYS as readonly number[]).includes(dayOfWeek) && date >= minDate) {
      dates.push(date.toISOString().split('T')[0]);
    }
  }
  return dates;
}


/**
 * Generate available time slots for a date, given a session duration
 * and a list of existing events (from Google Calendar)
 */
export function getAvailableSlots(
  durationMinutes: number,
  existingEvents: { start: string; end: string }[]
): TimeSlot[] {
  const slots: TimeSlot[] = [];


  // Generate all possible start times
  const dayStartMin = START_HOUR * 60;
  const dayEndMin = END_HOUR * 60 + END_MINUTE;


  for (let startMin = dayStartMin; startMin + durationMinutes <= dayEndMin; startMin += SLOT_INCREMENT) {
    const endMin = startMin + durationMinutes;
    const startStr = minutesToTime(startMin);
    const endStr = minutesToTime(endMin);


    // Check if this slot conflicts with any existing event
    const hasConflict = existingEvents.some(event => {
      const evStart = timeToMinutes(event.start);
      const evEnd = timeToMinutes(event.end);
      // Overlap: slot starts before event ends AND slot ends after event starts
      return startMin < evEnd && endMin > evStart;
    });


    if (!hasConflict) {
      slots.push({ start: startStr, end: endStr });
    }
  }
  return slots;
}


// ── Helpers ──
function minutesToTime(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, '0');
  const m = (min % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}


function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}