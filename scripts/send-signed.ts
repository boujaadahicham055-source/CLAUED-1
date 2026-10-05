// Sends a Retell-shaped request, signed like Retell does, to a local or deployed endpoint.
// Usage: RETELL_API_KEY=... tsx scripts/send-signed.ts <url> '<json body>' [--unsigned|--bad-signature]

import Retell from "retell-sdk";

const [url, body, mode] = process.argv.slice(2);
if (!url || !body) {
  console.error("usage: send-signed.ts <url> '<json>' [--unsigned|--bad-signature]");
  process.exit(1);
}
const key = process.env.RETELL_API_KEY;
if (!key && mode !== "--unsigned") throw new Error("RETELL_API_KEY is not set");

const headers: Record<string, string> = { "content-type": "application/json" };
if (mode === "--bad-signature") headers["x-retell-signature"] = await Retell.sign(body, "wrong_key");
else if (mode !== "--unsigned") headers["x-retell-signature"] = await Retell.sign(body, key!);

const res = await fetch(url, { method: "POST", headers, body });
console.log(`HTTP ${res.status}`);
const text = await res.text();
try {
  console.log(JSON.stringify(JSON.parse(text), null, 2));
} catch {
  console.log(text);
}
