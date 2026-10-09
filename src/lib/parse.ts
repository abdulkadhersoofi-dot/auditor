import { formatINR, formatWhen } from "@/lib/format";
import { findBillByNo } from "@/lib/ledger";
import type { Client, Entry, Kind } from "@/lib/types";
import { extractWhen } from "@/lib/when";

const MAX_PAISE = 1e11;
const STOP = new Set([
  "pvt",
  "ltd",
  "llp",
  "huf",
  "and",
  "the",
  "co",
  "mr",
  "mrs",
  "ms",
  "private",
  "limited",
  "company",
  "associates",
  "sons",
  "bros",
  "brothers",
  "of",
  "for",
]);

const NOTE_RE = /^(?:\/)?note\b[:\s-]*/i;
const COMMANDS: { kind: "bill" | "receipt" | "todo" | "reminder" | "new-client"; re: RegExp }[] = [
  { kind: "new-client", re: /^(?:\/)?(?:new\s+client|add\s+client)\b[:\s-]*/i },
  { kind: "bill", re: /^(?:\/)?(?:raise\s+)?(?:a\s+)?(?:bill|billed|invoice)\b[:\s-]*/i },
  {
    kind: "receipt",
    re: /^(?:\/)?(?:fee\s+in|fees\s+in|fee\s+received|fees\s+received|fees?\s+of|received|receipt|collected|payment|fees?)\b[:\s-]*/i,
  },
  { kind: "todo", re: /^(?:\/)?(?:to-?do|task|to\s+do)\b[:\s-]*/i },
  { kind: "reminder", re: /^(?:\/)?(?:reminder|remind|follow(?:\s*|-)?up|ping)\b[:\s-]*/i },
];

const CHIP_PREFIX =
  /^(?:note|new\s+client|add\s+client|raise\s+a\s+bill|raise\s+bill|raise|a\s+bill|bill|billed|invoice|fee\s+in|fees\s+in|fee\s+received|fees\s+received|fees?\s+of|received|receipt|collected|payment|fees?|to-?do|task|to\s+do|reminder|remind|follow(?:\s*|-)?up|ping)\b[:\s-]*/i;

export type Action =
  | { type: "none" }
  | { type: "create-client"; name: string; matter: string }
  | { type: "open-client"; clientId: string }
  | { type: "entry"; entry: Omit<Entry, "id" | "createdAt"> };

export type InterpretResult = {
  tone: "muted" | "ok" | "warn";
  preview: string;
  canSend: boolean;
  choices: Client[];
  routedAway: boolean;
  action: Action;
};

type Mention =
  | { type: "none" }
  | { type: "one"; id: string; start: number; end: number }
  | { type: "many"; ids: string[] };

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function cleanBody(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[\s,.;:\-–—]+|[\s,.;:\-–—]+$/g, "")
    .replace(/^(?:for|about|re|regarding|against|towards)\s+/i, "")
    .replace(/\s+(?:for|about|re|regarding|against|towards)$/i, "")
    .trim();
}

function anchorWord(name: string) {
  const words = name
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9]/g, ""))
    .filter((word) => word.length >= 3 && !STOP.has(word.toLowerCase()));
  return words[0] ?? null;
}

function mentionOf(text: string, clients: Client[]): Mention {
  const hay = text.toLowerCase();
  const scored: { id: string; score: number }[] = [];
  for (const client of clients) {
    const name = client.name.toLowerCase();
    if (name && hay.includes(name)) {
      scored.push({ id: client.id, score: 1000 + name.length });
      continue;
    }
    const anchor = anchorWord(client.name);
    if (anchor && new RegExp(`\\b${escapeRegExp(anchor)}\\b`, "i").test(text)) {
      scored.push({ id: client.id, score: anchor.length });
    }
  }
  if (scored.length === 0) return { type: "none" };
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((item) => item.score === scored[0].score);
  const ids = [...new Set(top.map((item) => item.id))];
  if (ids.length > 1) return { type: "many", ids };
  const client = clients.find((item) => item.id === ids[0]);
  if (!client) return { type: "none" };
  const fullAt = hay.indexOf(client.name.toLowerCase());
  if (fullAt !== -1) return { type: "one", id: client.id, start: fullAt, end: fullAt + client.name.length };
  const anchor = anchorWord(client.name);
  if (anchor) {
    const match = new RegExp(`\\b${escapeRegExp(anchor)}\\b`, "i").exec(text);
    if (match && match.index !== undefined) {
      return { type: "one", id: client.id, start: match.index, end: match.index + match[0].length };
    }
  }
  return { type: "one", id: client.id, start: 0, end: 0 };
}

const MULT: Record<string, number> = {
  k: 1_000,
  thousand: 1_000,
  l: 100_000,
  lac: 100_000,
  lakh: 100_000,
  lakhs: 100_000,
  cr: 10_000_000,
  crore: 10_000_000,
  crores: 10_000_000,
};

export function pullAmount(input: string): { paise: number; rest: string } | null {
  const match = /(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d{1,2})?)\s*(k|thousand|l|lac|lakh|lakhs|cr|crore|crores)?\b/i.exec(
    input,
  );
  if (!match || match.index === undefined) return null;
  const value = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(value)) return null;
  const unit = match[2]?.toLowerCase() ?? "";
  const rupees = value * (MULT[unit] ?? 1);
  const paise = Math.round(rupees * 100);
  if (paise <= 0) return null;
  const rest = cleanBody(`${input.slice(0, match.index)} ${input.slice(match.index + match[0].length)}`);
  return { paise, rest };
}

export function parseMoney(input: string) {
  const got = pullAmount(input.trim());
  if (!got || got.rest) return null;
  if (got.paise > MAX_PAISE) return null;
  return got.paise;
}

function pullBillNo(input: string) {
  const match = /\b(DF-\d{2}-\d{3,})\b/i.exec(input);
  if (!match || match.index === undefined) return { billNo: undefined as string | undefined, rest: input };
  return {
    billNo: match[1].toUpperCase(),
    rest: cleanBody(`${input.slice(0, match.index)} ${input.slice(match.index + match[0].length)}`),
  };
}

export function leadingCommand(text: string): "bill" | "receipt" | "todo" | "reminder" | "new-client" | "note" | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (NOTE_RE.test(trimmed)) return "note";
  for (const command of COMMANDS) {
    if (command.re.test(trimmed)) return command.kind;
  }
  return null;
}

export function applyChip(text: string, insert: string) {
  const rest = text.trim().replace(CHIP_PREFIX, "").trim();
  return rest ? `${insert}${rest}` : insert;
}

function clientName(clients: Client[], id: string | null) {
  if (!id) return null;
  return clients.find((client) => client.id === id)?.name ?? null;
}

function idle(): InterpretResult {
  return {
    tone: "muted",
    preview: "Try bill 45000 GST audit",
    canSend: false,
    choices: [],
    routedAway: false,
    action: { type: "none" },
  };
}

function invalid(preview: string, choices: Client[] = []): InterpretResult {
  return { tone: "warn", preview, canSend: false, choices, routedAway: false, action: { type: "none" } };
}

export function interpret(
  text: string,
  ctx: {
    clients: Client[];
    entries: Entry[];
    activeClientId: string | null;
    forceNote?: boolean;
    stickToActive?: boolean;
    chosenClientId?: string | null;
    now?: Date;
  },
): InterpretResult {
  const now = ctx.now ?? new Date();
  const trimmed = text.trim();
  if (!trimmed) return idle();

  const forced = ctx.forceNote || NOTE_RE.test(trimmed);
  let kind: Kind | "new-client" | null = forced ? "note" : null;
  let rest = trimmed;
  if (forced) {
    rest = trimmed.replace(NOTE_RE, "").trim() || trimmed;
    kind = "note";
  } else {
    for (const command of COMMANDS) {
      if (command.re.test(trimmed)) {
        kind = command.kind;
        rest = trimmed.replace(command.re, "").trim();
        break;
      }
    }
    if (!kind) kind = "note";
  }

  if (kind === "new-client") {
    const [rawName, ...matterParts] = rest.split(/\s*[-–—]\s+|\s*,\s+/);
    const name = cleanBody(rawName ?? "");
    const matter = cleanBody(matterParts.join(" — "));
    if (name.length < 2) return invalid("Add a client name");
    const existing = ctx.clients.find((client) => client.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return {
        tone: "ok",
        preview: `Open ${existing.name}`,
        canSend: true,
        choices: [],
        routedAway: false,
        action: { type: "open-client", clientId: existing.id },
      };
    }
    return {
      tone: "ok",
      preview: matter ? `New client · ${name} · ${matter}` : `New client · ${name}`,
      canSend: true,
      choices: [],
      routedAway: false,
      action: { type: "create-client", name, matter },
    };
  }

  let dueAt: number | undefined;
  let assumedWhen = false;
  if (kind === "reminder" || kind === "todo") {
    const when = extractWhen(rest, now);
    if (when) {
      dueAt = when.dueAt;
      rest = when.rest;
    } else if (kind === "reminder") {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      dueAt = tomorrow.getTime();
      assumedWhen = true;
    }
  }

  let amountPaise: number | undefined;
  let receiptBillNo: string | undefined;
  if (kind === "bill" || kind === "receipt") {
    const billToken = kind === "receipt" ? pullBillNo(rest) : { billNo: undefined as string | undefined, rest };
    const amount = pullAmount(billToken.rest);
    if (!amount) {
      return invalid(kind === "bill" ? "Add an amount, e.g. bill 45000 GST audit" : "Add an amount, e.g. received 20000");
    }
    if (amount.paise > MAX_PAISE) return invalid("That amount looks too large");
    amountPaise = amount.paise;
    rest = amount.rest;
    receiptBillNo = billToken.billNo;
  }

  const linked = receiptBillNo ? findBillByNo(ctx.entries, receiptBillNo) : undefined;
  const mention = mentionOf(rest, ctx.clients);
  const chosen = ctx.chosenClientId ? ctx.clients.find((client) => client.id === ctx.chosenClientId) : undefined;
  const stick = Boolean(ctx.stickToActive && ctx.activeClientId);

  let clientId: string | null = null;
  let ambiguous: string[] | null = null;
  let usedMention = false;

  if (chosen) clientId = chosen.id;
  else if (linked?.clientId) clientId = linked.clientId;
  else if (stick) clientId = ctx.activeClientId;
  else if (mention.type === "one") {
    clientId = mention.id;
    usedMention = true;
  } else if (mention.type === "many") ambiguous = mention.ids;
  else if (ctx.activeClientId) clientId = ctx.activeClientId;
  else if ((kind === "bill" || kind === "receipt") && ctx.clients.length === 1) clientId = ctx.clients[0].id;

  rest = cleanBody(rest);

  const needsClient = kind === "bill" || kind === "receipt";
  if (needsClient && ambiguous) {
    const choices = ctx.clients.filter((client) => ambiguous?.includes(client.id));
    return invalid("Which client?", choices);
  }
  if (needsClient && !clientId) {
    if (ctx.clients.length === 0) return invalid("Add a client first — try new client Apex Forge");
    return invalid(kind === "bill" ? "Which client is this bill for?" : "Which client paid this fee?", ctx.clients);
  }

  const routedAway = Boolean(
    usedMention && ctx.activeClientId && clientId && clientId !== ctx.activeClientId && !linked && !chosen && !stick,
  );

  const name = clientName(ctx.clients, clientId);
  let body = rest;
  if (!body) {
    if (kind === "bill") body = "Professional fees";
    else if (kind === "receipt") body = "Fee received";
    else if (kind === "reminder") return invalid("Add what to remember");
    else if (kind === "todo") return invalid("Add the to-do");
    else return invalid("Write a note");
  }

  const where = name ?? "the desk";
  let preview = "";
  if (kind === "note") preview = name ? `Note · ${name}` : "Note on the desk";
  if (kind === "bill") preview = `Bill · ${formatINR(amountPaise ?? 0)} · ${name}`;
  if (kind === "receipt") {
    const against = linked?.billNo ?? (receiptBillNo ? `${receiptBillNo} not found` : "on account");
    preview = `Fee in · ${formatINR(amountPaise ?? 0)} · ${name} · ${against}`;
  }
  if (kind === "todo") {
    preview = dueAt ? `To-do · ${formatWhen(dueAt, now)} · ${where}` : `To-do · ${where}`;
  }
  if (kind === "reminder") {
    preview = `Reminder · ${formatWhen(dueAt ?? now.getTime(), now)}${assumedWhen ? " · assumed" : ""} · ${where}`;
  }

  const entry: Omit<Entry, "id" | "createdAt"> = {
    clientId,
    kind,
    body,
    done: false,
    amountPaise,
    dueAt,
    billId: linked?.id,
  };

  return {
    tone: "ok",
    preview,
    canSend: true,
    choices: [],
    routedAway,
    action: { type: "entry", entry },
  };
}
