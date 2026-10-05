// Every request from Retell (custom function calls and webhooks) is signed with the
// Retell API key. We verify the raw body with the official SDK helper before parsing it.

import Retell from "retell-sdk";

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function isSignedByRetell(rawBody: string, signature: string | null): Promise<boolean> {
  const apiKey = process.env.RETELL_API_KEY;
  if (!apiKey || !signature) return false;
  try {
    return await Retell.verify(rawBody, apiKey, signature);
  } catch {
    return false;
  }
}

export type RetellPayload = Record<string, any>;

/** Returns the parsed body, or the error Response to send back (401 unsigned, 400 bad JSON). */
export async function readSignedBody(request: Request): Promise<{ body: RetellPayload } | { error: Response }> {
  const raw = await request.text();
  if (!(await isSignedByRetell(raw, request.headers.get("x-retell-signature")))) {
    return { error: json({ error: "invalid_signature" }, 401) };
  }
  try {
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object") throw new Error("not an object");
    return { body };
  } catch {
    return { error: json({ error: "invalid_json" }, 400) };
  }
}
