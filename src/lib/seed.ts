import { nextBillNo } from "@/lib/ledger";
import type { Client, Entry } from "@/lib/types";

export const SEED_PRACTICE = "Rao & Associates";

function at(dayOffset: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

export function buildSeed() {
  const clients: Client[] = [
    { id: "c-mehta", name: "Mehta Textiles Pvt Ltd", matter: "GST and income tax", createdAt: at(-20, 9) },
    { id: "c-sharma", name: "Sharma & Kapoor", matter: "Statutory audit", createdAt: at(-24, 9) },
    { id: "c-north", name: "Northwind Logistics", matter: "Internal audit", createdAt: at(-5, 9) },
    { id: "c-kapoor", name: "Kapoor HUF", matter: "Personal tax", createdAt: at(-9, 9) },
  ];

  const entries: Entry[] = [];
  const push = (entry: Omit<Entry, "id" | "billNo"> & { id: string }) => {
    const billNo = entry.kind === "bill" ? nextBillNo(entries) : undefined;
    entries.push({ ...entry, billNo });
    return entries[entries.length - 1];
  };

  push({
    id: "e-mehta-note",
    clientId: "c-mehta",
    kind: "note",
    body: "Engagement letter signed for FY 2025-26.",
    createdAt: at(-18, 11),
    done: false,
  });
  const mehtaBill = push({
    id: "e-mehta-bill",
    clientId: "c-mehta",
    kind: "bill",
    body: "GST audit for FY 2025-26",
    createdAt: at(-14, 16, 20),
    amountPaise: 15000000,
    done: false,
  });
  push({
    id: "e-mehta-fee",
    clientId: "c-mehta",
    kind: "receipt",
    body: "Part received against the GST audit.",
    createdAt: at(-6, 12, 10),
    amountPaise: 10000000,
    billId: mehtaBill.id,
    done: false,
  });
  push({
    id: "e-mehta-todo",
    clientId: "c-mehta",
    kind: "todo",
    body: "Collect GSTR-9 workings and the sales register",
    createdAt: at(-2, 15),
    done: false,
  });
  push({
    id: "e-mehta-rem",
    clientId: "c-mehta",
    kind: "reminder",
    body: "Call Mr Mehta for the missing purchase invoices",
    createdAt: at(-1, 18),
    dueAt: at(1, 10),
    done: false,
  });

  const sharmaBill = push({
    id: "e-sharma-bill",
    clientId: "c-sharma",
    kind: "bill",
    body: "Statutory audit FY 2025-26",
    createdAt: at(-21, 11),
    amountPaise: 27500000,
    done: false,
  });
  push({
    id: "e-sharma-todo",
    clientId: "c-sharma",
    kind: "todo",
    body: "Engagement letter signed",
    createdAt: at(-20, 12),
    done: true,
  });
  push({
    id: "e-sharma-fee",
    clientId: "c-sharma",
    kind: "receipt",
    body: "Audit fee received in full.",
    createdAt: at(-4, 17),
    amountPaise: 27500000,
    billId: sharmaBill.id,
    done: false,
  });
  push({
    id: "e-sharma-note",
    clientId: "c-sharma",
    kind: "note",
    body: "Signed financial statements collected from the client.",
    createdAt: at(-1, 11, 30),
    done: false,
  });
  push({
    id: "e-sharma-rem",
    clientId: "c-sharma",
    kind: "reminder",
    body: "Send the audit report draft",
    createdAt: at(-1, 16),
    dueAt: at(0, 17),
    done: false,
  });

  push({
    id: "e-north-bill",
    clientId: "c-north",
    kind: "bill",
    body: "Internal audit — Q2",
    createdAt: at(-3, 10, 15),
    amountPaise: 8000000,
    done: false,
  });
  push({
    id: "e-north-todo",
    clientId: "c-north",
    kind: "todo",
    body: "Vouch cash expenses over ₹10,000",
    createdAt: at(-3, 10, 20),
    done: false,
  });
  push({
    id: "e-north-rem",
    clientId: "c-north",
    kind: "reminder",
    body: "Chase the HDFC bank confirmation",
    createdAt: at(-2, 9),
    dueAt: at(-1, 10),
    done: false,
  });

  const kapoorBill = push({
    id: "e-kapoor-bill",
    clientId: "c-kapoor",
    kind: "bill",
    body: "ITR for AY 2026-27",
    createdAt: at(-8, 14),
    amountPaise: 1800000,
    done: false,
  });
  push({
    id: "e-kapoor-fee",
    clientId: "c-kapoor",
    kind: "receipt",
    body: "ITR fee received.",
    createdAt: at(-8, 15),
    amountPaise: 1800000,
    billId: kapoorBill.id,
    done: false,
  });
  push({
    id: "e-kapoor-note",
    clientId: "c-kapoor",
    kind: "note",
    body: "Filed. Acknowledgement is with the client.",
    createdAt: at(-7, 18),
    done: false,
  });

  push({
    id: "e-desk-todo",
    clientId: null,
    kind: "todo",
    body: "Update the engagement letter template",
    createdAt: at(-1, 9, 30),
    done: false,
  });
  push({
    id: "e-desk-rem",
    clientId: null,
    kind: "reminder",
    body: "Renew the digital signature",
    createdAt: at(-1, 9, 40),
    dueAt: at(2, 10),
    done: false,
  });

  return { practiceName: SEED_PRACTICE, clients, entries, sample: true, initialized: true };
}
