export type Kind = "note" | "bill" | "receipt" | "todo" | "reminder";

export type Client = {
  id: string;
  name: string;
  matter: string;
  createdAt: number;
};

export type Entry = {
  id: string;
  clientId: string | null;
  kind: Kind;
  body: string;
  createdAt: number;
  amountPaise?: number;
  billNo?: string;
  billId?: string;
  dueAt?: number;
  done?: boolean;
};
