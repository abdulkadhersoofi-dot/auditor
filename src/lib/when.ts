type Span = { start: number; end: number };

type DateHit = Span & {
  day: Date;
  explicit: boolean;
  defaultHour: number;
};

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTH_ALT =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function at(day: Date, hour: number, minute: number) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0);
}

function blankSpans(input: string, spans: Span[]) {
  const mask = Array<boolean>(input.length).fill(false);
  for (const span of spans) {
    for (let i = Math.max(0, span.start); i < Math.min(input.length, span.end); i++) mask[i] = true;
  }
  let out = "";
  for (let i = 0; i < input.length; i++) out += mask[i] ? " " : input[i];
  return out.replace(/\s+/g, " ").trim();
}

function overlaps(span: Span, spans: Span[]) {
  return spans.some((other) => span.start < other.end && other.start < span.end);
}

function to24(hour: number, ampm?: string) {
  if (ampm) {
    const mark = ampm.toLowerCase();
    if (mark === "am") return hour === 12 ? 0 : hour;
    return hour === 12 ? 12 : hour + 12;
  }
  if (hour >= 1 && hour <= 7) return hour + 12;
  return hour;
}

function matchClock(input: string): (Span & { hour: number; minute: number }) | null {
  const patterns = [
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i,
    /\bat\s+(\d{1,2}):(\d{2})\b/i,
    /\b([01]?\d|2[0-3]):([0-5]\d)\b/,
    new RegExp(`\\bat\\s+(\\d{1,2})\\b(?!\\s*(?:am|pm|${MONTH_ALT})\\b)`, "i"),
  ];
  const hits: (Span & { hour: number; minute: number })[] = [];
  for (const re of patterns) {
    const match = re.exec(input);
    if (!match || match.index === undefined) continue;
    const hourRaw = Number(match[1]);
    const minute = match[2] ? Number(match[2]) : 0;
    const hour = to24(hourRaw, match[3]);
    if (hourRaw > 23 || hour > 23 || minute > 59) continue;
    let start = match.index;
    if (input.slice(Math.max(0, start - 3), start).toLowerCase() === "at ") start -= 3;
    hits.push({ start, end: match.index + match[0].length, hour, minute });
  }
  hits.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  return hits[0] ?? null;
}

function calendarDay(day: number, monthIndex: number, year: number | null, now: Date) {
  let y = year ?? now.getFullYear();
  if (year != null && year < 100) y = 2000 + year;
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null;
  const date = new Date(y, monthIndex, day);
  if (date.getMonth() !== monthIndex || date.getDate() !== day) return null;
  if (year == null && date.getTime() < startOfDay(now).getTime()) date.setFullYear(date.getFullYear() + 1);
  return date;
}

function matchDate(input: string, now: Date): DateHit | null {
  const prefix = "(?:(?:on|by|before|due)\\s+)?";
  const hits: DateHit[] = [];
  const push = (match: RegExpExecArray | null, build: (match: RegExpExecArray) => Omit<DateHit, "start" | "end"> | null) => {
    if (!match || match.index === undefined) return;
    const built = build(match);
    if (!built) return;
    hits.push({ start: match.index, end: match.index + match[0].length, ...built });
  };

  push(new RegExp(`\\b${prefix}day after tomorrow\\b`, "i").exec(input), () => ({
    day: addDays(startOfDay(now), 2),
    explicit: true,
    defaultHour: 10,
  }));
  push(new RegExp(`\\b${prefix}(?:tomorrow|tmrw|tomm?orow)\\b`, "i").exec(input), () => ({
    day: addDays(startOfDay(now), 1),
    explicit: true,
    defaultHour: 10,
  }));
  push(new RegExp(`\\b${prefix}tonight\\b`, "i").exec(input), () => ({
    day: startOfDay(now),
    explicit: true,
    defaultHour: 19,
  }));
  push(new RegExp(`\\b${prefix}today\\b`, "i").exec(input), () => ({
    day: startOfDay(now),
    explicit: true,
    defaultHour: 10,
  }));
  push(new RegExp(`\\b${prefix}yesterday\\b`, "i").exec(input), () => ({
    day: addDays(startOfDay(now), -1),
    explicit: true,
    defaultHour: 10,
  }));
  push(new RegExp(`\\b${prefix}next week\\b`, "i").exec(input), () => ({
    day: addDays(startOfDay(now), 7),
    explicit: true,
    defaultHour: 10,
  }));
  push(new RegExp(`\\b${prefix}in\\s+(?:a|one)\\s+week\\b`, "i").exec(input), () => ({
    day: addDays(startOfDay(now), 7),
    explicit: true,
    defaultHour: 10,
  }));
  push(new RegExp(`\\b${prefix}in\\s+(\\d+|a|one)\\s+days?\\b`, "i").exec(input), (match) => {
    const token = match[1].toLowerCase();
    const n = token === "a" || token === "one" ? 1 : Number(token);
    if (!Number.isFinite(n) || n > 365) return null;
    return { day: addDays(startOfDay(now), n), explicit: true, defaultHour: 10 };
  });
  push(
    new RegExp(`\\b${prefix}(next\\s+)?(${WEEKDAYS.join("|")})\\b`, "i").exec(input),
    (match) => {
      const forceNext = Boolean(match[1]);
      const target = WEEKDAYS.indexOf(match[2].toLowerCase());
      const base = startOfDay(now);
      const delta = (target - base.getDay() + 7) % 7;
      const add = delta === 0 ? (forceNext ? 7 : 0) : delta;
      return { day: addDays(base, add), explicit: true, defaultHour: 10 };
    },
  );
  push(
    new RegExp(`\\b${prefix}(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_ALT})(?:\\s+(\\d{2,4}))?\\b`, "i").exec(input),
    (match) => {
      const month = MONTHS[match[2].toLowerCase()];
      const year = match[3] ? Number(match[3]) : null;
      const day = calendarDay(Number(match[1]), month, year, now);
      if (!day) return null;
      return { day, explicit: true, defaultHour: 10 };
    },
  );
  push(
    new RegExp(`\\b${prefix}(${MONTH_ALT})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{2,4}))?\\b`, "i").exec(input),
    (match) => {
      const month = MONTHS[match[1].toLowerCase()];
      const year = match[3] ? Number(match[3]) : null;
      const day = calendarDay(Number(match[2]), month, year, now);
      if (!day) return null;
      return { day, explicit: true, defaultHour: 10 };
    },
  );
  push(new RegExp(`\\b${prefix}(\\d{1,2})[\\/\\-.](\\d{1,2})(?:[\\/\\-.](\\d{2,4}))?\\b`).exec(input), (match) => {
    const year = match[3] ? Number(match[3]) : null;
    const day = calendarDay(Number(match[1]), Number(match[2]) - 1, year, now);
    if (!day) return null;
    return { day, explicit: true, defaultHour: 10 };
  });

  hits.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  return hits[0] ?? null;
}

function matchDaypart(input: string, taken: Span[]) {
  const parts: { re: RegExp; hour: number; minute: number }[] = [
    { re: /\b(?:this evening|evening|eod|end of day)\b/i, hour: 18, minute: 0 },
    { re: /\bafternoon\b/i, hour: 15, minute: 0 },
    { re: /\bnoon\b/i, hour: 12, minute: 0 },
    { re: /\bmorning\b/i, hour: 9, minute: 0 },
  ];
  const hits: (Span & { hour: number; minute: number })[] = [];
  for (const part of parts) {
    const match = part.re.exec(input);
    if (!match || match.index === undefined) continue;
    const span = { start: match.index, end: match.index + match[0].length };
    if (overlaps(span, taken)) continue;
    hits.push({ ...span, hour: part.hour, minute: part.minute });
  }
  hits.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  return hits[0] ?? null;
}

export function extractWhen(input: string, now: Date): { dueAt: number; rest: string } | null {
  const spans: Span[] = [];
  const clock = matchClock(input);
  if (clock) spans.push(clock);
  const date = matchDate(input, now);
  if (date) spans.push(date);
  const daypart = matchDaypart(input, spans);
  if (daypart) spans.push(daypart);

  if (!clock && !date && !daypart) return null;

  let hour = clock?.hour ?? daypart?.hour ?? null;
  let minute = clock?.minute ?? daypart?.minute ?? null;
  let day = date?.day ?? null;
  const defaultHour = date?.defaultHour ?? 10;

  if (!day) {
    const h = hour ?? defaultHour;
    const m = minute ?? 0;
    let base = startOfDay(now);
    if (at(base, h, m).getTime() < now.getTime() - 60_000) base = addDays(base, 1);
    day = base;
    hour = h;
    minute = m;
  }

  const due = at(day, hour ?? defaultHour, minute ?? 0);
  return { dueAt: due.getTime(), rest: blankSpans(input, spans) };
}
