import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatDayShort, formatINR } from "@/lib/format";
import { practiceTotals, summarizeClient } from "@/lib/ledger";
import { useDaftar } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ViewSwitch, fieldClass } from "@/components/daftar/ui";

export function Bills({
  focusClientId,
  mainView,
  onView,
  onOpenClient,
}: {
  focusClientId: string | null;
  mainView: "thread" | "bills";
  onView: (view: "thread" | "bills") => void;
  onOpenClient: (id: string) => void;
}) {
  const clients = useDaftar((state) => state.clients);
  const entries = useDaftar((state) => state.entries);
  const [query, setQuery] = useState("");
  const now = new Date();
  const totals = practiceTotals(clients, entries);
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    return clients
      .map((client) => {
        const summary = summarizeClient(entries, client.id);
        const bills = summary.bills.filter((bill) => {
          if (!q) return true;
          const blob = `${client.name} ${client.matter} ${bill.entry.billNo ?? ""} ${bill.entry.body}`.toLowerCase();
          return blob.includes(q);
        });
        const nameHit = !q || client.name.toLowerCase().includes(q) || client.matter.toLowerCase().includes(q);
        if (!nameHit && bills.length === 0) return null;
        return { client, summary, bills: nameHit && !q ? summary.bills : bills };
      })
      .filter((group): group is NonNullable<typeof group> => group !== null)
      .sort((a, b) => b.summary.outstanding - a.summary.outstanding || a.client.name.localeCompare(b.client.name));
  }, [clients, entries, q]);

  useEffect(() => {
    if (!focusClientId) return;
    document.getElementById(`bills-${focusClientId}`)?.scrollIntoView({ block: "start" });
  }, [focusClientId]);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col bg-paper">
      <header className="pt-safe shrink-0 space-y-3 px-4 pt-4 pb-3">
        <div className="md:hidden">
          <ViewSwitch value={mainView} onChange={onView} />
        </div>
        <div>
          <p className="text-xs text-muted">Still to come in</p>
          <h2 className="font-display text-3xl tabular-nums lining-nums">
            {totals.outstanding > 0 ? formatINR(totals.outstanding) : "Settled"}
          </h2>
          <p className="text-sm text-muted tabular-nums lining-nums">
            Billed {formatINR(totals.billed)} · Received {formatINR(totals.received)}
          </p>
        </div>
        <label className="relative block">
          <span className="sr-only">Search bills</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a client or bill"
            className={cn(fieldClass, "pl-10")}
          />
        </label>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {groups.length === 0 ? <p className="px-4 py-8 text-sm text-muted">No clients yet. Add one from Chats.</p> : null}
        {groups.map((group) => (
          <section key={group.client.id} id={`bills-${group.client.id}`} className="border-b border-line">
            <button
              type="button"
              onClick={() => onOpenClient(group.client.id)}
              className="sticky top-0 z-10 flex w-full items-center justify-between gap-3 bg-paper px-4 py-3 text-left"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{group.client.name}</span>
                {group.client.matter ? <span className="block truncate text-xs text-muted">{group.client.matter}</span> : null}
              </span>
              <span
                className={cn(
                  "shrink-0 text-sm tabular-nums lining-nums",
                  group.summary.outstanding > 0 ? "text-danger" : "text-ok",
                )}
              >
                {group.summary.outstanding > 0 ? formatINR(group.summary.outstanding) : "Settled"}
              </span>
            </button>
            {group.bills.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-muted">No bills issued.</p>
            ) : (
              group.bills.map((bill) => (
                <button
                  key={bill.entry.id}
                  type="button"
                  onClick={() => onOpenClient(group.client.id)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-4 py-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-muted">
                      {bill.entry.billNo} · {formatDayShort(bill.entry.createdAt, now)}
                    </span>
                    <span className="block truncate">{bill.entry.body}</span>
                  </span>
                  <span className="text-right">
                    <span className="block tabular-nums lining-nums">{formatINR(bill.billed)}</span>
                    <span className={cn("block text-sm tabular-nums lining-nums", bill.due > 0 ? "text-danger" : "text-ok")}>
                      {bill.due > 0 ? `Due ${formatINR(bill.due)}` : "Paid"}
                    </span>
                  </span>
                </button>
              ))
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
