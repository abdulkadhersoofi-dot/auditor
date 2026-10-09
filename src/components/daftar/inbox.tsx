import { useMemo, useState } from "react";
import { MessageSquare, Plus, Search } from "lucide-react";
import { endOfToday, entryPreview, formatINR, formatListTime, initials } from "@/lib/format";
import { activityOf, practiceTotals, summarizeClient } from "@/lib/ledger";
import { useDaftar } from "@/lib/store";
import type { Entry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ViewSwitch, fieldClass } from "@/components/daftar/ui";

type Filter = "all" | "outstanding" | "due";

function clientName(clients: { id: string; name: string }[], id: string | null) {
  if (!id) return "Desk";
  return clients.find((client) => client.id === id)?.name ?? "Client";
}

function hasDue(entries: Entry[], clientId: string | null, now: Date) {
  const end = endOfToday(now);
  return entries.some(
    (entry) =>
      entry.clientId === clientId &&
      !entry.done &&
      (entry.kind === "reminder" || entry.kind === "todo") &&
      entry.dueAt != null &&
      entry.dueAt <= end,
  );
}

function latest(entries: Entry[], clientId: string | null) {
  let found: Entry | undefined;
  for (const entry of entries) {
    if (entry.clientId !== clientId) continue;
    if (!found || entry.createdAt > found.createdAt) found = entry;
  }
  return found;
}

export function Inbox({
  selectedId,
  mainView,
  onSelect,
  onView,
  onAdd,
  onSettings,
  onClearSample,
}: {
  selectedId: string | null;
  mainView: "thread" | "bills";
  onSelect: (id: string | null) => void;
  onView: (view: "thread" | "bills") => void;
  onAdd: () => void;
  onSettings: () => void;
  onClearSample: () => void;
}) {
  const practiceName = useDaftar((state) => state.practiceName);
  const clients = useDaftar((state) => state.clients);
  const entries = useDaftar((state) => state.entries);
  const sample = useDaftar((state) => state.sample);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const now = new Date();
  const totals = practiceTotals(clients, entries);
  const titled = practiceName !== "Daftar";

  const deskTime = entries.reduce((max, entry) => Math.max(max, entry.createdAt), 0);
  const overdue = entries.find((entry) => entry.kind === "reminder" && !entry.done && entry.dueAt && entry.dueAt < now.getTime());
  const deskLine = overdue
    ? `Overdue · ${clientName(clients, overdue.clientId)} · ${overdue.body}`
    : latest(entries, null)
      ? entryPreview(latest(entries, null) as Entry)
      : entries.length
        ? entryPreview([...entries].sort((a, b) => b.createdAt - a.createdAt)[0])
        : "Bills, fees, to-dos, reminders";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients
      .filter((client) => {
        const summary = summarizeClient(entries, client.id);
        if (filter === "outstanding" && summary.outstanding <= 0) return false;
        if (filter === "due" && !hasDue(entries, client.id, now)) return false;
        if (!q) return true;
        if (client.name.toLowerCase().includes(q) || client.matter.toLowerCase().includes(q)) return true;
        return entries.some(
          (entry) =>
            entry.clientId === client.id &&
            `${entry.body} ${entry.billNo ?? ""}`.toLowerCase().includes(q),
        );
      })
      .sort((a, b) => activityOf(b, entries) - activityOf(a, entries));
  }, [clients, entries, filter, query, now]);

  const showDesk =
    filter === "all" &&
    (!query.trim() || "desk".includes(query.trim().toLowerCase()) || practiceName.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper">
      <header className="pt-safe shrink-0 space-y-3 px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <button type="button" onClick={onSettings} className="min-w-0 text-left">
            <p className="text-xs text-muted">{titled ? "Daftar" : "Practice chat"}</p>
            <h1 className="truncate font-display text-2xl">{titled ? practiceName : "Daftar"}</h1>
          </button>
          <div className="flex shrink-0 items-start gap-2">
            <p className="text-right whitespace-nowrap">
              <span className="block font-display text-xl tabular-nums lining-nums">
                {totals.outstanding > 0 ? formatINR(totals.outstanding) : "Settled"}
              </span>
              <span className="text-xs text-muted">{totals.outstanding > 0 ? "to come in" : "no fees out"}</span>
            </p>
            <button
              type="button"
              aria-label="Add client"
              onClick={onAdd}
              className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-fg"
            >
              <Plus className="size-5" />
            </button>
          </div>
        </div>
        <ViewSwitch value={mainView} onChange={onView} />
        <label className="relative block">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search clients, bills, notes"
            className={cn(fieldClass, "pl-10")}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["outstanding", "Fees out"],
              ["due", "Due"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={cn(
                "h-11 rounded-full px-4 text-sm",
                filter === id ? "bg-accent text-accent-fg" : "border border-line text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>
      {sample ? (
        <div className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-2xl bg-paper-2 px-3 py-2">
          <p className="text-sm text-ink-soft">Sample practice. Clear it before real clients.</p>
          <button type="button" onClick={onClearSample} className="h-11 shrink-0 px-2 text-sm font-medium text-ink">
            Clear
          </button>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {showDesk ? (
          <ChatRow
            title="Desk"
            matter="Everything still open"
            preview={deskLine}
            time={deskTime ? formatListTime(deskTime, now) : ""}
            status=""
            tone="muted"
            selected={selectedId === null}
            icon
            onClick={() => onSelect(null)}
          />
        ) : null}
        {rows.map((client) => {
          const summary = summarizeClient(entries, client.id);
          const last = latest(entries, client.id);
          const due = hasDue(entries, client.id, now);
          const status = summary.outstanding > 0 ? formatINR(summary.outstanding) : due ? "Due" : summary.billed > 0 ? "Settled" : "";
          const tone = summary.outstanding > 0 || due ? "danger" : summary.billed > 0 ? "ok" : "muted";
          return (
            <ChatRow
              key={client.id}
              title={client.name}
              matter={client.matter}
              preview={last ? entryPreview(last) : "No messages yet"}
              time={last ? formatListTime(last.createdAt, now) : ""}
              status={status}
              tone={tone}
              selected={selectedId === client.id}
              initials={initials(client.name)}
              onClick={() => onSelect(client.id)}
            />
          );
        })}
        {rows.length === 0 && !showDesk ? (
          <p className="px-4 py-8 text-sm text-muted">No chats in this view.</p>
        ) : null}
      </div>
    </div>
  );
}

function ChatRow({
  title,
  matter,
  preview,
  time,
  status,
  tone,
  selected,
  initials: mark,
  icon,
  onClick,
}: {
  title: string;
  matter: string;
  preview: string;
  time: string;
  status: string;
  tone: "danger" | "ok" | "muted";
  selected: boolean;
  initials?: string;
  icon?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors duration-150",
        selected ? "bg-paper-2" : "hover:bg-paper-2",
      )}
    >
      <span
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-medium",
          icon ? "bg-accent text-accent-fg" : "border border-line bg-sheet text-ink",
        )}
      >
        {icon ? <MessageSquare className="size-5" /> : mark}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="truncate font-medium">{title}</span>
          <span className="shrink-0 text-xs text-muted">{time}</span>
        </span>
        {matter ? <span className="block truncate text-xs text-muted">{matter}</span> : null}
        <span className="mt-1 flex items-baseline justify-between gap-3">
          <span className="truncate text-sm text-ink-soft">{preview}</span>
          {status ? (
            <span
              className={cn(
                "shrink-0 text-xs font-medium tabular-nums lining-nums",
                tone === "danger" && "text-danger",
                tone === "ok" && "text-ok",
                tone === "muted" && "text-muted",
              )}
            >
              {status}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
