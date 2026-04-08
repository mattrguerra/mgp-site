// ============================================
// Google Calendar integration via Service Account
// Uses Web Crypto API — runs natively on Cloudflare Workers
// ============================================

import { BOOKING_RULES } from './booking';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GCAL_API = 'https://www.googleapis.com/calendar/v3';

// ── Base64url helpers (no Node Buffer needed) ──

function base64url(input: string | ArrayBuffer): string {
  const bytes = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : new Uint8Array(input);

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ── JWT signing with Web Crypto API ──

async function createSignedJWT(
  email: string,
  privateKeyPEM: string,
  calendarId: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/calendar',
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600, // 1 hour
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // Import the RSA private key
  const pemBody = privateKeyPEM
    .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/g, '')
    .replace(/-----END (RSA )?PRIVATE KEY-----/g, '')
    .replace(/\\n/g, '')
    .replace(/\n/g, '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${base64url(signature)}`;
}

// ── Token cache (per-request lifetime on Workers) ──

let cachedToken: { token: string; expires: number } | null = null;

async function getAccessToken(
  email: string,
  privateKey: string,
  calendarId: string
): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expires > now + 60_000) {
    return cachedToken.token;
  }

  const jwt = await createSignedJWT(email, privateKey, calendarId);

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google OAuth failed: ${err}`);
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expires: now + data.expires_in * 1000,
  };
  return data.access_token;
}

// ── Public API ──

export interface GCalEvent {
  id: string;
  summary: string;
  start: string; // HH:MM
  end: string;   // HH:MM
}

export class GoogleCalendarClient {
  private email: string;
  private privateKey: string;
  private calendarId: string;

  constructor(email: string, privateKey: string, calendarId: string) {
    this.email = email;
    this.privateKey = privateKey;
    this.calendarId = calendarId;
  }

  private async token(): Promise<string> {
    return getAccessToken(this.email, this.privateKey, this.calendarId);
  }

  /**
   * Get all events for a specific date
   */
  async getEventsForDate(date: string): Promise<GCalEvent[]> {
    const token = await this.token();
    const timeMin = `${date}T00:00:00-06:00`;
    const timeMax = `${date}T23:59:59-06:00`;

    const url = new URL(`${GCAL_API}/calendars/${encodeURIComponent(this.calendarId)}/events`);
    url.searchParams.set('timeMin', timeMin);
    url.searchParams.set('timeMax', timeMax);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GCal events fetch failed: ${err}`);
    }

    const data = await res.json() as {
      items?: Array<{
        id: string;
        summary?: string;
        start: { dateTime?: string; date?: string };
        end: { dateTime?: string; date?: string };
      }>;
    };

    return (data.items || [])
      .filter(ev => ev.start.dateTime && ev.end.dateTime) // skip all-day events
      .map(ev => ({
        id: ev.id,
        summary: ev.summary || 'Busy',
        start: extractTime(ev.start.dateTime!),
        end: extractTime(ev.end.dateTime!),
      }));
  }

  /**
   * Get all events for an entire month (batched by date range)
   */
  async getEventsForMonth(year: number, month: number): Promise<Map<string, GCalEvent[]>> {
    const token = await this.token();
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const url = new URL(`${GCAL_API}/calendars/${encodeURIComponent(this.calendarId)}/events`);
    url.searchParams.set('timeMin', `${firstDay}T00:00:00-06:00`);
    url.searchParams.set('timeMax', `${lastDayStr}T23:59:59-06:00`);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', '250');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GCal month fetch failed: ${err}`);
    }

    const data = await res.json() as {
      items?: Array<{
        id: string;
        summary?: string;
        start: { dateTime?: string; date?: string };
        end: { dateTime?: string; date?: string };
      }>;
    };

    const byDate = new Map<string, GCalEvent[]>();

    for (const ev of data.items || []) {
      if (!ev.start.dateTime || !ev.end.dateTime) continue;
      const date = ev.start.dateTime.split('T')[0];
      const event: GCalEvent = {
        id: ev.id,
        summary: ev.summary || 'Busy',
        start: extractTime(ev.start.dateTime),
        end: extractTime(ev.end.dateTime),
      };
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(event);
    }

    return byDate;
  }

  /**
   * Create a hold event when a booking request comes in
   */
  async createBookingEvent(params: {
    date: string;
    startTime: string;
    endTime: string;
    clientName: string;
    sessionType: string;
    clientEmail: string;
    description?: string;
  }): Promise<string> {
    const token = await this.token();
    const tz = BOOKING_RULES.TIMEZONE;

    const event = {
      summary: `[HOLD] ${params.sessionType} — ${params.clientName}`,
      description: [
        `Client: ${params.clientName}`,
        `Email: ${params.clientEmail}`,
        `Type: ${params.sessionType}`,
        params.description ? `Notes: ${params.description}` : '',
      ].filter(Boolean).join('\n'),
      start: {
        dateTime: `${params.date}T${params.startTime}:00`,
        timeZone: tz,
      },
      end: {
        dateTime: `${params.date}T${params.endTime}:00`,
        timeZone: tz,
      },
      colorId: '5', // banana yellow = pending
    };

    const res = await fetch(
      `${GCAL_API}/calendars/${encodeURIComponent(this.calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GCal create event failed: ${err}`);
    }

    const created = await res.json() as { id: string };
    return created.id;
  }
}

// ── Helper ──

function extractTime(dateTime: string): string {
  // "2026-05-15T09:00:00-06:00" → "09:00"
  const timePart = dateTime.split('T')[1];
  return timePart.substring(0, 5);
}

/**
 * Factory: build a GCal client from env vars
 */
export function createGCalClient(env: {
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  GOOGLE_CALENDAR_ID: string;
}): GoogleCalendarClient {
  return new GoogleCalendarClient(
    env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    env.GOOGLE_PRIVATE_KEY,
    env.GOOGLE_CALENDAR_ID,
  );
}
