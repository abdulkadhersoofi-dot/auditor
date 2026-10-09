import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, MoreHorizontal } from "lucide-react";
import { Composer } from "@/components/daftar/composer";
import { dayKey, dayLabel, formatClock, formatINR, formatWhen, paiseToInput } from "@/lib/format";
import { practiceTotals, summarizeClient, type BillView } from "@/lib/ledger";
import { parseMoney } from "@/lib/parse";
import { useDaftar } from "@/lib/store";
import type { Entry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { fieldClass } from "@/components/daftar/ui";

export function Thread({
  clientId,
  focusId,
  onBack,
  onOpenClient,
  onOpenEntry,
  onOpenBills,
  onRename,
  onRemove,
  onSettings,
}: {
  clientId: string | null;
  focusId: string | null;
  onBack: () => void;
  onOpenClient: (id: string) => void;
  onOpenEntry: (entry: Entry) => void;
  onOpenBills: (clientId: string) => void;
  onRename: () => void;
  onRemove: () => void;
  onSettings: () => void;
}) {
  const clients = useDaftar((state) => state.clients);
  const entries = useDaftar((state) => state.entries);
  const practiceName = useDaftar((state) => state.practiceName);
  const [draft, setDraft] = useState("");
  const [forceNote, setForceNote] = useState(false);
  const [stick, setStick] = useState(false);
  const [menu, setMenu] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const client = clients.find((item) => item.id === clientId) ?? null;
  const visible = entries
    .filter((entry) => (clientId === null ? true : entry.clientId === clientId))
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const summary = clientId ? summarizeClient(entries, clientId) : null;
  const totals = practiceTotals(clients, entries);
  const now = new Date();

  const bills = useMemo(() => {
    const map = new Map<string, BillView>();
    for (const item of clients) {
      for (const bill of summarizeClient(entries, item.id).bills) map.set(bill.entry.id, bill);
    }
    return map;
  }, [clients, entries]);

  useEffect(() => {
    const go = () => {
      if (focusId) {
        document.getElementById(`entry-${focusId}`)?.scrollIntoView({ block: "center" });
        return;
      }
      bottomRef.current?.scrollIntoView({ block: "end" });
    };
    go();
    const frame = requestAnimationFrame(go);
    return () => cancelAnimationFrame(frame);
  }, [clientId, visible.length, focusId]);

  const groups: { key: string; label: string; entries: Entry[] }[] = [];
  for (const entry of visible) {
    const key = dayKey(entry.createdAt);
    const last = groups[groups.length - 1];
    if (!last || last.key !== key) groups.push({ key, label: dayLabel(entry.createdAt, now), entries: [entry] });
    else last.entries.push(entry);
  }

  const openReminders = entries
    .filter((entry) => entry.kind === "reminder" && !entry.done && entry.dueAt)
    .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));
  const openTodos = entries
    .filter((entry) => entry.kind === "todo" && !entry.done)
    .sort((a, b) => (a.dueAt ?? Number.MAX_SAFE_INTEGER) - (b.dueAt ?? Number.MAX_SAFE_INTEGER));
  const owing = totals.owing.sort((a, b) => b.summary.outstanding - a.summary.outstanding);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col bg-paper">
      <header className="pt-safe relative shrink-0 border-b border-line px-2 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Back to chats"
            onClick={onBack}
            className="grid h-11 w-11 place-items-center rounded-full text-ink md:hidden"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1 px-2">
            <h2 className="truncate font-display text-xl">{client ? client.name : "Desk"}</h2>
            <p className="truncate text-sm text-muted">
              {client ? client.matter || "Client chat" : practiceName}
            </p>
          </div>
          {client ? (
            <button
              type="button"
              aria-label="Client actions"
              aria-expanded={menu}
              onClick={() => setMenu((open) => !open)}
              className="grid h-11 w-11 place-items-center rounded-full text-ink"
            >
              <MoreHorizontal className="size-5" />
            </button>
          ) : (
            <button type="button" onClick={onSettings} className="h-11 px-3 text-sm font-medium">
              Practice
            </button>
          )}
        </div>
        {menu && client ? (
          <>
            <button type="button" aria-label="Close menu" className="fixed inset-0 z-20" onClick={() => setMenu(false)} />
            <div className="absolute top-14 right-3 z-30 w-44 rounded-xl border border-line bg-sheet p-1">
              <button
                type="button"
                className="h-11 w-full rounded-lg px-3 text-left text-sm"
                onClick={() => {
                  setMenu(false);
                  onRename();
                }}
              >
                Rename
              </button>
              <button
                type="button"
                className="h-11 w-full rounded-lg px-3 text-left text-sm text-danger"
                onClick={() => {
                  setMenu(false);
                  onRemove();
                }}
              >
                Remove client
              </button>
            </div>
          </>
        ) : null}
      </header>
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {clientId === null ? (
          <div className="sticky top-0 z-10 mb-4 bg-paper pb-3">
            <div className="max-w-xl rounded-3xl border border-line bg-sheet p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">Fees still to come in</p>
                  <p className="font-display text-3xl tabular-nums lining-nums">
                    {totals.outstanding > 0 ? formatINR(totals.outstanding) : "Settled"}
                  </p>
                </div>
                <p className="text-right text-sm text-muted">
                  {openReminders.length} open reminder{openReminders.length === 1 ? "" : "s"}
                  <span className="block">{openTodos.length} open to-do{openTodos.length === 1 ? "" : "s"}</span>
                </p>
              </div>
              <div className="mt-2">
                {owing.slice(0, 4).map((row) => (
                  <button
                    key={row.client.id}
                    type="button"
                    onClick={() => onOpenClient(row.client.id)}
                    className="flex h-11 w-full items-center justify-between gap-3 text-left"
                  >
                    <span className="truncate">{row.client.name}</span>
                    <span className="shrink-0 text-danger tabular-nums lining-nums">
                      {formatINR(row.summary.outstanding)}
                    </span>
                  </button>
                ))}
                {owing.length === 0 ? <p className="py-2 text-sm text-ink-soft">Nothing outstanding.</p> : null}
              </div>
            </div>
          </div>
        ) : summary && (summary.billed > 0 || summary.received > 0) ? (
          <div className="sticky top-0 z-10 mb-4 bg-paper pb-3">
            <div className="flex items-end justify-between gap-3 border-b border-line pb-3">
              <div>
                <p className="text-xs text-muted">{summary.outstanding > 0 ? "Due" : summary.credit > 0 ? "Credit" : "Fees"}</p>
                <p className="font-display text-2xl tabular-nums lining-nums">
                  {summary.outstanding > 0
                    ? formatINR(summary.outstanding)
                    : summary.credit > 0
                      ? formatINR(summary.credit)
                      : "Settled"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted tabular-nums lining-nums">Billed {formatINR(summary.billed)}</p>
                <p className="text-xs text-muted tabular-nums lining-nums">Received {formatINR(summary.received)}</p>
                <button type="button" onClick={() => onOpenBills(clientId)} className="mt-1 h-11 text-sm font-medium">
                  All bills
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {visible.length === 0 ? (
          <p className="py-6 text-sm text-muted">Nothing logged for this client yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map((group) => (
              <div key={group.key} className="flex flex-col gap-3">
                <p className="self-center rounded-full bg-paper-2 px-3 py-1 text-xs text-muted">{group.label}</p>
                {group.entries.map((entry) => (
                  <EntryBubble
                    key={entry.id}
                    entry={entry}
                    desk={clientId === null}
                    clientName={entry.clientId ? clients.find((item) => item.id === entry.clientId)?.name ?? "Client" : "Desk"}
                    bill={entry.kind === "bill" ? bills.get(entry.id) : undefined}
                    linkedNo={entry.billId ? entries.find((item) => item.id === entry.billId)?.billNo : undefined}
                    focused={focusId === entry.id}
                    now={now}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <Composer
        clientId={clientId}
        draft={draft}
        setDraft={setDraft}
        forceNote={forceNote}
        setForceNote={setForceNote}
        stick={stick}
        setStick={setStick}
        showHints={visible.length === 0 && clientId !== null}
        onNavigate={onOpenClient}
      />
    </div>
  );
}

function EntryBubble({
  entry,
  desk,
  clientName,
  bill,
  linkedNo,
  focused,
  now,
}: {
  entry: Entry;
  desk: boolean;
  clientName: string;
  bill?: BillView;
  linkedNo?: string;
  focused: boolean;
  now: Date;
}) {
  const deleteEntry = useDaftar((state) => state.deleteEntry);
  const toggleDone = useDaftar((state) => state.toggleDone);
  const addEntry = useDaftar((state) => state.addEntry);
  const [more, setMore] = useState(false);
  const [armed, setArmed] = useState(false);
  const [recording, setRecording] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const overdue = entry.kind === "reminder" && !entry.done && entry.dueAt != null && entry.dueAt < now.getTime();

  function saveFee() {
    const paise = parseMoney(amount);
    if (!paise || !entry.clientId) {
      setError("Enter an amount such as 20000 or 20k");
      return;
    }
    const due = bill?.due ?? 0;
    addEntry({
      clientId: entry.clientId,
      kind: "receipt",
      body: paise >= due && due > 0 ? "Fee received in full." : "Fee received.",
      amountPaise: paise,
      billId: entry.id,
      done: false,
    });
    setRecording(false);
    setAmount("");
    setError("");
  }

  return (
    <article id={`entry-${entry.id}`} className={cn("flex max-w-md flex-col gap-1 self-end", focused && "w-full")}>
      {desk && entry.clientId ? <p className="self-end text-xs text-muted">{clientName}</p> : null}
      {entry.kind === "note" ? (
        <div className="rounded-2xl rounded-br-md bg-accent px-4 py-3 text-accent-fg">
          <p className="text-pretty whitespace-pre-wrap break-words">{entry.body}</p>
        </div>
      ) : (
        <div className="w-full rounded-3xl border border-line bg-sheet p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-muted">
              {entry.kind === "bill" && `Bill${entry.billNo ? ` · ${entry.billNo}` : ""}`}
              {entry.kind === "receipt" && "Fee in"}
              {entry.kind === "todo" && "To-do"}
              {entry.kind === "reminder" && "Reminder"}
            </p>
            <button
              type="button"
              aria-label="More actions"
              aria-expanded={more}
              onClick={() => {
                setMore((open) => !open);
                setArmed(false);
              }}
              className="grid h-11 w-11 place-items-center rounded-lg text-muted"
            >
              <MoreHorizontal className="size-5" />
            </button>
          </div>
          {entry.kind === "todo" ? (
            <div className="flex items-start gap-2">
              <button
                type="button"
                aria-pressed={Boolean(entry.done)}
                aria-label={entry.done ? "Mark not done" : "Mark done"}
                onClick={() => toggleDone(entry.id)}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line"
              >
                {entry.done ? <Check className="size-5" /> : null}
              </button>
              <p className={cn("pt-2 text-pretty break-words", entry.done && "text-muted line-through")}>{entry.body}</p>
            </div>
          ) : (
            <p className={cn("text-pretty break-words", entry.done && "text-muted line-through")}>{entry.body}</p>
          )}
          {entry.kind === "bill" ? (
            <div className="mt-3">
              <p className="font-display text-2xl tabular-nums lining-nums">{formatINR(entry.amountPaise ?? 0)}</p>
              {bill && bill.received > 0 ? (
                <p className="text-sm text-muted tabular-nums lining-nums">Received {formatINR(bill.received)}</p>
              ) : null}
              <p className={cn("text-sm tabular-nums lining-nums", bill && bill.due > 0 ? "text-danger" : "text-ok")}>
                {bill && bill.due > 0 ? `Due ${formatINR(bill.due)}` : "Paid"}
              </p>
              {bill && bill.due > 0 && !recording ? (
                <button
                  type="button"
                  onClick={() => {
                    setRecording(true);
                    setAmount(paiseToInput(bill.due));
                    setError("");
                  }}
                  className="mt-3 h-11 rounded-lg border border-line px-4 text-sm font-medium"
                >
                  Record fee
                </button>
              ) : null}
              {recording ? (
                <form
                  className="mt-3 space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveFee();
                  }}
                >
                  <input
                    aria-label="Amount received"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className={fieldClass}
                  />
                  {error ? <p className="text-sm text-danger">{error}</p> : null}
                  <div className="flex gap-2">
                    <button type="submit" className="h-11 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg">
                      Save fee
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecording(false)}
                      className="h-11 px-3 text-sm text-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ) : null}
          {entry.kind === "receipt" ? (
            <div className="mt-3">
              <p className="font-display text-2xl tabular-nums lining-nums">{formatINR(entry.amountPaise ?? 0)}</p>
              <p className="text-sm text-muted">{linkedNo ? `Against ${linkedNo}` : entry.billId ? "Against a removed bill" : "On account"}</p>
            </div>
          ) : null}
          {entry.kind === "reminder" && entry.dueAt ? (
            <p className={cn("mt-2 text-sm", overdue ? "text-danger" : "text-ink-soft")}>{formatWhen(entry.dueAt, now)}</p>
          ) : null}
          {entry.kind === "todo" && entry.dueAt ? (
            <p className="mt-2 text-sm text-muted">{formatWhen(entry.dueAt, now)}</p>
          ) : null}
          {(entry.kind === "reminder" || entry.kind === "todo") && entry.kind === "reminder" ? (
            <button type="button" onClick={() => toggleDone(entry.id)} className="mt-3 h-11 text-sm font-medium">
              {entry.done ? "Mark open" : "Mark done"}
            </button>
          ) : null}
          {more ? (
            <button
              type="button"
              onClick={() => {
                if (!armed) {
                  setArmed(true);
                  return;
                }
                deleteEntry(entry.id);
              }}
              className="mt-2 h-11 text-sm text-danger"
            >
              {armed ? "Confirm delete" : "Delete"}
            </button>
          ) : null}
        </div>
      )}
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-muted">{formatClock(entry.createdAt)}</span>
        {entry.kind === "note" ? (
          more ? (
            <button
              type="button"
              onClick={() => {
                if (!armed) {
                  setArmed(true);
                  return;
                }
                deleteEntry(entry.id);
              }}
              className="h-11 text-sm text-danger"
            >
              {armed ? "Confirm delete" : "Delete"}
            </button>
          ) : (
            <button
              type="button"
              aria-label="More actions"
              onClick={() => setMore(true)}
              className="grid h-11 w-11 place-items-center text-muted"
            >
              <MoreHorizontal className="size-5" />
            </button>
          )
        ) : null}
      </div>
    </article>
  );
}
