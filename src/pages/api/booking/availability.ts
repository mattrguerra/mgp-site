import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getBookableDates, getAvailableSlots } from '@/lib/booking-rules';

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

  // Get blocked dates
  const blocked = await db
    .prepare('SELECT date FROM blocked_dates WHERE date LIKE ?')
    .bind(`${month}%`)
    .all();
  const blockedSet = new Set(blocked.results.map((r: any) => r.date));

  // Get existing bookings (pending + confirmed)
  const existingBookings = await db
    .prepare(
      `SELECT date, start_time, end_time FROM bookings
       WHERE date LIKE ? AND status IN ('pending', 'confirmed')`
    )
    .bind(`${month}%`)
    .all();

  // TODO: Add Google Calendar API call here (Session 2)
  // For now, just use D1 bookings as the conflict source

  // Build availability for each date
  const availability = dates
    .filter(date => !blockedSet.has(date))
    .map(date => {
      const dayEvents = existingBookings.results
        .filter((b: any) => b.date === date)
        .map((b: any) => ({ start: b.start_time, end: b.end_time }));

      const slots = getAvailableSlots(
        sessionType.duration_minutes as number,
        dayEvents
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
