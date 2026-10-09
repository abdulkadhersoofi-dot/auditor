import { format as formatDate, isToday, isTomorrow, isYesterday } from "date-fns";
import type { Entry } from "@/lib/types";

export function formatINR(paise: number) {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(rupees);
}

export function paiseToInput(paise: number) {
  const rupees = paise / 100;
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2);
}

export function startOfToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

export function endOfToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
}

export function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function dayLabel(ts: number, now = new Date()) {
  const d = new Date(ts);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  if (d.getFullYear() === now.getFullYear()) return formatDate(d, "d MMM");
  return formatDate(d, "d MMM yyyy");
}

export function formatWhen(ts: number, now = new Date()) {
  const d = new Date(ts);
  const time = formatDate(d, "h:mm a");
  if (isToday(d)) return `Today, ${time}`;
  if (isTomorrow(d)) return `Tomorrow, ${time}`;
  if (isYesterday(d)) return `Yesterday, ${time}`;
  if (d.getFullYear() === now.getFullYear()) return `${formatDate(d, "d MMM")}, ${time}`;
  return `${formatDate(d, "d MMM yyyy")}, ${time}`;
}

export function formatClock(ts: number) {
  return formatDate(new Date(ts), "h:mm a");
}

export function formatListTime(ts: number, now = new Date()) {
  const d = new Date(ts);
  if (isToday(d)) return formatDate(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  if (d.getFullYear() === now.getFullYear()) return formatDate(d, "d MMM");
  return formatDate(d, "d MMM yyyy");
}

export function formatDayShort(ts: number, now = new Date()) {
  const d = new Date(ts);
  if (d.getFullYear() === now.getFullYear()) return formatDate(d, "d MMM");
  return formatDate(d, "d MMM yyyy");
}

export function entryPreview(entry: Entry) {
  switch (entry.kind) {
    case "note":
      return entry.body;
    case "bill":
      return `Bill ${entry.billNo ?? ""} · ${formatINR(entry.amountPaise ?? 0)}`.replace(/\s+/g, " ").trim();
    case "receipt":
      return `Fee in · ${formatINR(entry.amountPaise ?? 0)}`;
    case "todo":
      return `${entry.done ? "Done" : "To-do"} · ${entry.body}`;
    case "reminder":
      return `${entry.done ? "Done" : "Reminder"} · ${entry.body}`;
  }
}

const INITIAL_STOP = new Set(["pvt", "ltd", "llp", "huf", "and", "the", "co", "of", "for"]);

export function initials(name: string) {
  const words = name
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9]/g, ""))
    .filter((word) => word.length > 0 && !INITIAL_STOP.has(word.toLowerCase()));
  if (words.length === 0) return "•";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}
