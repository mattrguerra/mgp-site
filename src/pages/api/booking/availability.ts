import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getBookableDates, getAvailableSlots } from '@/lib/booking-rules';
import { createGCalClient } from '@/lib/gcal';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const db = env.DB;
  const month = url.searchParams.get('month');  // YYYY-MM
  const typeSlug = url.searchParams.get('type');

  if (!month || !typeSlug) {
    return new Response(
      JSON.stringify({ error: 'month and type are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get session duration
  const sessionType = await db
    .prepare('SELECT * FROM session_types WHERE slug = ? AND active = 1')
    .bind(typeSlug)
    .first();

  if (!sessionType) {
    return new Response(
      JSON.stringify({ error: 'Invalid session type' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr);
  const monthNum = parseInt(monthStr);

  // Get bookable dates (weekdays, 14+ days out)
  const dates = getBookableDates(year, monthNum);

  // Get blocked dates from D1
  const blocked = await db
    .prepare('SELECT date FROM blocked_dates WHERE date LIKE ?')
    .bind(`${month}%`)
    .all();
  const blockedSet = new Set(blocked.results.map((r: any) => r.date));

  // Get existing bookings from D1 (pending + confirmed)
  const existingBookings = await db
    .prepare(
      `SELECT date, start_time, end_time FROM bookings
       WHERE date LIKE ? AND status IN ('pending', 'confirmed')`
    )
    .bind(`${month}%`)
    .all();

  // Fetch Google Calendar events for the month
  let gcalEventsByDate = new Map<string, { start: string; end: string }[]>();
  try {
    const gcal = createGCalClient(env as any);
    const gcalEvents = await gcal.getEventsForMonth(year, monthNum);
    for (const [date, events] of gcalEvents) {
      gcalEventsByDate.set(date, events.map(e => ({ start: e.start, end: e.end })));
    }
  } catch (err) {
    // If GCal fails (creds not set, network error), fall back to D1 only
    console.error('GCal fetch failed, using D1 bookings only:', err);
  }

  // Build availability for each date
  const availability = dates
    .filter(date => !blockedSet.has(date))
    .map(date => {
      // Merge D1 bookings + GCal events as conflict sources
      const d1Events = existingBookings.results
        .filter((b: any) => b.date === date)
        .map((b: any) => ({ start: b.start_time, end: b.end_time }));

      const gcalEvents = gcalEventsByDate.get(date) || [];
      const allEvents = [...d1Events, ...gcalEvents];

      const slots = getAvailableSlots(
        sessionType.duration_minutes as number,
        allEvents
      );

      return { date, slots };
    })
    .filter(day => day.slots.length > 0);

  return new Response(JSON.stringify({
    sessionType,
    availability,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
