import type { Client, Entry } from "@/lib/types";

export type BillView = {
  entry: Entry;
  billed: number;
  received: number;
  due: number;
};

export type ClientSummary = {
  billed: number;
  received: number;
  outstanding: number;
  credit: number;
  bills: BillView[];
};

export function summarizeClient(entries: Entry[], clientId: string): ClientSummary {
  const mine = entries.filter((entry) => entry.clientId === clientId);
  const bills = mine
    .filter((entry) => entry.kind === "bill")
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const receipts = mine.filter((entry) => entry.kind === "receipt");
  const remaining = new Map(bills.map((bill) => [bill.id, bill.amountPaise ?? 0]));
  let pool = 0;

  for (const receipt of receipts) {
    let left = receipt.amountPaise ?? 0;
    if (receipt.billId && remaining.has(receipt.billId)) {
      const room = remaining.get(receipt.billId) ?? 0;
      const used = Math.min(room, left);
      remaining.set(receipt.billId, room - used);
      left -= used;
    }
    pool += left;
  }

  for (const bill of bills) {
    const room = remaining.get(bill.id) ?? 0;
    const used = Math.min(room, pool);
    remaining.set(bill.id, room - used);
    pool -= used;
  }

  const views = bills.map((bill) => {
    const billed = bill.amountPaise ?? 0;
    const due = remaining.get(bill.id) ?? 0;
    return { entry: bill, billed, due, received: billed - due };
  });

  return {
    billed: views.reduce((sum, bill) => sum + bill.billed, 0),
    received: receipts.reduce((sum, receipt) => sum + (receipt.amountPaise ?? 0), 0),
    outstanding: views.reduce((sum, bill) => sum + bill.due, 0),
    credit: pool,
    bills: views,
  };
}

export function nextBillNo(entries: Entry[], now = new Date()) {
  const yy = String(now.getFullYear()).slice(-2);
  const re = new RegExp(`^DF-${yy}-(\\d+)$`, "i");
  let max = 0;
  for (const entry of entries) {
    if (!entry.billNo) continue;
    const match = re.exec(entry.billNo);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `DF-${yy}-${String(max + 1).padStart(3, "0")}`;
}

export function findBillByNo(entries: Entry[], billNo: string) {
  const target = billNo.toUpperCase();
  return entries.find((entry) => entry.kind === "bill" && entry.billNo?.toUpperCase() === target);
}

export function activityOf(client: Client, entries: Entry[]) {
  let max = client.createdAt;
  for (const entry of entries) {
    if (entry.clientId === client.id && entry.createdAt > max) max = entry.createdAt;
  }
  return max;
}

export function practiceTotals(clients: Client[], entries: Entry[]) {
  return clients.reduce(
    (totals, client) => {
      const summary = summarizeClient(entries, client.id);
      totals.billed += summary.billed;
      totals.received += summary.received;
      totals.outstanding += summary.outstanding;
      if (summary.outstanding > 0) totals.owing.push({ client, summary });
      return totals;
    },
    {
      billed: 0,
      received: 0,
      outstanding: 0,
      owing: [] as { client: Client; summary: ClientSummary }[],
    },
  );
}
