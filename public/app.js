// Demo page: mic check, token from our server, then the Retell browser SDK.
// The Retell API key never reaches this page; /api/create-web-call returns a short lived token.

const $ = (id) => document.getElementById(id);
const ui = {
  orb: $("orb"),
  orbLabel: $("orb-label"),
  status: $("status"),
  hint: $("hint"),
  timer: $("timer"),
  controls: $("controls"),
  mute: $("mute"),
  hangup: $("hangup"),
  transcript: $("transcript"),
  list: $("transcript-list"),
};

const COPY = {
  idle: ["Prête à vous écouter", "Appuyez, autorisez le micro, et parlez naturellement.", "Parler à l'assistant"],
  connecting: ["Connexion…", "Salma arrive dans un instant.", "Connexion…"],
  listening: ["Je vous écoute", "Parlez quand vous voulez.", "En ligne"],
  speaking: ["Salma vous répond", "Vous pouvez l'interrompre à tout moment.", "En ligne"],
  ended: ["Appel terminé", "Merci ! Votre conseiller a toutes les informations.", "Relancer un appel"],
};

const ERRORS = {
  "mic-denied": "Le micro est bloqué. Autorisez-le dans les réglages du navigateur (icône à gauche de l'adresse), puis réessayez.",
  "mic-missing": "Aucun micro détecté sur cet appareil.",
  "mic-unsupported": "Ce navigateur ne permet pas l'accès au micro. Essayez Chrome ou Safari à jour.",
  network: "Connexion impossible. Vérifiez votre réseau et réessayez.",
  connection: "La connexion avec l'assistante a été interrompue.",
};

let session = null; // RetellWebClient instance while a call is active
let muted = false;
let timerId = null;
let state = "idle";
const loadSdk = () => import("./vendor/retell-client.js");

// Fetch the SDK in the background once the page has painted, so the first click is fast.
window.addEventListener("load", () => setTimeout(() => loadSdk().catch(() => {}), 1200));

function setState(next, hintOverride) {
  state = next;
  document.body.dataset.state = next;
  const copy = COPY[next] ?? COPY.idle;
  ui.status.textContent = next === "error" ? "Petit souci" : copy[0];
  ui.hint.textContent = hintOverride ?? copy[1];
  ui.orbLabel.textContent = next === "error" ? "Réessayer" : copy[2];
  const inCall = next === "connecting" || next === "listening" || next === "speaking";
  ui.orb.disabled = inCall;
  ui.controls.hidden = !(next === "listening" || next === "speaking");
  ui.timer.hidden = !(next === "listening" || next === "speaking");
}

function fail(kind, message) {
  stopTimer();
  setState("error", message ?? ERRORS[kind] ?? ERRORS.connection);
}

function startTimer() {
  const started = Date.now();
  stopTimer();
  const tick = () => {
    const s = Math.floor((Date.now() - started) / 1000);
    ui.timer.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };
  tick();
  timerId = setInterval(tick, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function renderTranscript(items) {
  if (!Array.isArray(items) || items.length === 0) return;
  ui.transcript.hidden = false;
  const atBottom = ui.list.scrollHeight - ui.list.scrollTop - ui.list.clientHeight < 40;
  ui.list.replaceChildren(
    ...items
      .filter((t) => (t.role === "agent" || t.role === "user") && t.content)
      .map((t) => {
        const li = document.createElement("li");
        li.dataset.role = t.role;
        const who = document.createElement("span");
        who.className = "who";
        who.textContent = t.role === "agent" ? "Salma" : "Vous";
        li.append(who, document.createTextNode(t.content));
        return li;
      }),
  );
  if (atBottom) ui.list.scrollTop = ui.list.scrollHeight;
}

async function checkMicrophone() {
  if (!navigator.mediaDevices?.getUserMedia) return "mic-unsupported";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return null;
  } catch (err) {
    if (err?.name === "NotAllowedError" || err?.name === "SecurityError") return "mic-denied";
    if (err?.name === "NotFoundError" || err?.name === "OverconstrainedError") return "mic-missing";
    return "mic-denied";
  }
}

function endCall() {
  stopTimer();
  if (session) {
    const s = session;
    session = null;
    try {
      s.stopCall();
    } catch {}
  }
  if (state !== "error") setState("ended");
}

async function startCall() {
  if (session || state === "connecting") return;
  muted = false;
  ui.mute.setAttribute("aria-pressed", "false");
  ui.list.replaceChildren();
  ui.transcript.hidden = true;
  setState("connecting");

  // Mic first: a refused mic must not create (and bill) a web call.
  const micError = await checkMicrophone();
  if (micError) return fail(micError);

  let token;
  try {
    const res = await fetch("/api/create-web-call", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return fail("server", data.message ?? ERRORS.network);
    token = data;
  } catch {
    return fail("network");
  }

  try {
    const { RetellWebClient } = await loadSdk();
    const client = new RetellWebClient({ defaultTransport: "gateway" });
    session = client;
    client.on("call_started", () => {
      if (session !== client) return;
      setState("listening");
      startTimer();
    });
    client.on("agent_start_talking", () => session === client && setState("speaking"));
    client.on("agent_stop_talking", () => session === client && setState("listening"));
    client.on("update", (event) => session === client && renderTranscript(event?.transcript));
    client.on("call_ended", () => session === client && endCall());
    client.on("error", (message) => {
      if (session !== client) return;
      console.warn("Retell call error:", message);
      session = null;
      try {
        client.stopCall();
      } catch {}
      fail("connection");
    });
    await client.startCall({
      accessToken: token.access_token,
      callId: token.call_id,
      transport: token.transport,
      iceServers: token.ice_servers,
    });
  } catch (err) {
    console.warn("Could not start the call:", err);
    session = null;
    fail("connection");
  }
}

ui.orb.addEventListener("click", startCall);
ui.hangup.addEventListener("click", endCall);
ui.mute.addEventListener("click", () => {
  if (!session) return;
  muted = !muted;
  muted ? session.mute() : session.unmute();
  ui.mute.setAttribute("aria-pressed", String(muted));
  ui.mute.querySelector(".control-label").textContent = muted ? "Réactiver le micro" : "Couper le micro";
});
window.addEventListener("pagehide", () => session && endCall());
