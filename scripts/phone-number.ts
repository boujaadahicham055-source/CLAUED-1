// Buys (once) a Retell US phone number bound to the agent for inbound test calls, or shows the existing one.
// Paid resource: monthly fee plus per-minute telephony. Run only with the account owner's approval.
//
//   NODE_USE_ENV_PROXY=1 npx tsx scripts/phone-number.ts            # show the number bound to the agent
//   NODE_USE_ENV_PROXY=1 npx tsx scripts/phone-number.ts --buy      # buy one if none is bound yet

import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import Retell from "retell-sdk";
import { agency } from "../config/agency.js";

const { values } = parseArgs({ options: { buy: { type: "boolean", default: false } } });
const client = new Retell({ apiKey: process.env.RETELL_API_KEY });
const { agent_id } = JSON.parse(readFileSync(".retell-ids.json", "utf8")) as { agent_id: string };

const numbers = await client.phoneNumber.list();
const bound = numbers.items.filter((n) => JSON.stringify(n).includes(agent_id));
if (bound.length) {
  for (const n of bound) console.log(`Existing number bound to the agent: ${n.phone_number_pretty ?? n.phone_number}`);
  process.exit(0);
}
if (!values.buy) {
  console.log("No number bound to the agent. Re-run with --buy to purchase one.");
  process.exit(0);
}

const number = await client.phoneNumber.create({
  country_code: "US",
  nickname: `${agency.name} demo`,
  // "latest_published" follows each publish from scripts/provision-retell.ts without rebinding.
  inbound_agents: [{ agent_id, weight: 1, agent_version: "latest_published" }],
});
console.log(`Bought ${number.phone_number_pretty ?? number.phone_number}, inbound calls go to ${agent_id}`);
