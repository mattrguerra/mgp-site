import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createGCalClient } from '@/lib/gcal';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const db = env.DB;
  const body = await request.json();

  const { sessionTypeId, date, startTime, clientName,
          clientEmail, clientPhone, businessName, description } = body;

  // Validate required fields
  if (!sessionTypeId || !date || !startTime || !clientName || !clientEmail) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get session type for duration
  const sessionType = await db
    .prepare('SELECT * FROM session_types WHERE id = ?')
    .bind(sessionTypeId)
    .first();

  if (!sessionType) {
    return new Response(
      JSON.stringify({ error: 'Invalid session type' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Calculate end time
  const [h, m] = startTime.split(':').map(Number);
  const endMinutes = h * 60 + m + (sessionType.duration_minutes as number);
  const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

  // Re-check availability (race condition prevention)
  const existing = await db
    .prepare(
      `SELECT start_time, end_time FROM bookings
       WHERE date = ? AND status IN ('pending', 'confirmed')`
    )
    .bind(date)
    .all();

  const conflicts = existing.results.filter((b: any) => {
    const bStart = timeToMin(b.start_time);
    const bEnd = timeToMin(b.end_time);
    const reqStart = h * 60 + m;
    const reqEnd = endMinutes;
    return reqStart < bEnd && reqEnd > bStart;
  });

  if (conflicts.length > 0) {
    return new Response(
      JSON.stringify({ error: 'This time slot is no longer available' }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Generate booking ID
  const id = crypto.randomUUID();

  // Create Google Calendar hold event
  let gcalEventId: string | null = null;
  try {
    const gcal = createGCalClient(env as any);
    gcalEventId = await gcal.createBookingEvent({
      date,
      startTime,
      endTime,
      clientName,
      sessionType: sessionType.name as string,
      clientEmail,
      description,
    });
  } catch (err) {
    // Log but don't block the booking — GCal is nice-to-have
    console.error('GCal event creation failed:', err);
  }

  // Save to D1
  await db.prepare(
    `INSERT INTO bookings (id, session_type_id, client_name, client_email,
     client_phone, business_name, description, date, start_time, end_time, gcal_event_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, sessionTypeId, clientName, clientEmail,
    clientPhone || null, businessName || null,
    description || null, date, startTime, endTime,
    gcalEventId
  ).run();

  return new Response(JSON.stringify({
    success: true,
    bookingId: id,
    message: 'Booking request submitted. You will receive a confirmation email shortly.',
  }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
