import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async () => {
  const db = env.DB;

  const { results } = await db
    .prepare('SELECT * FROM session_types WHERE active = 1 ORDER BY sort_order')
    .all();

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
};
