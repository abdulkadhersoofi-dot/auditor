import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nextBillNo } from "@/lib/ledger";
import { SEED_PRACTICE, buildSeed } from "@/lib/seed";
import type { Entry } from "@/lib/types";

type DaftarState = {
  practiceName: string;
  initialized: boolean;
  sample: boolean;
  clients: ReturnType<typeof buildSeed>["clients"];
  entries: Entry[];
  setPracticeName: (name: string) => void;
  finishBoot: () => void;
  clearSample: () => void;
  addClient: (name: string, matter: string) => string;
  updateClient: (id: string, patch: { name?: string; matter?: string }) => void;
  removeClient: (id: string) => void;
  addEntry: (entry: Omit<Entry, "id" | "createdAt">) => string;
  toggleDone: (id: string) => void;
  deleteEntry: (id: string) => void;
};

export const useDaftar = create<DaftarState>()(
  persist(
    (set, get) => ({
      practiceName: "Daftar",
      initialized: false,
      sample: false,
      clients: [],
      entries: [],
      setPracticeName: (name) => set({ practiceName: name.trim() || "Daftar" }),
      finishBoot: () => {
        if (get().initialized) return;
        set(buildSeed());
      },
      clearSample: () =>
        set((state) => ({
          sample: false,
          clients: [],
          entries: [],
          initialized: true,
          practiceName: state.practiceName === SEED_PRACTICE ? "Daftar" : state.practiceName,
        })),
      addClient: (name, matter) => {
        const id = crypto.randomUUID();
        set((state) => ({
          clients: [
            ...state.clients,
            { id, name: name.trim(), matter: matter.trim(), createdAt: Date.now() },
          ],
        }));
        return id;
      },
      updateClient: (id, patch) =>
        set((state) => ({
          clients: state.clients.map((client) =>
            client.id === id
              ? {
                  ...client,
                  name: patch.name === undefined ? client.name : patch.name.trim() || client.name,
                  matter: patch.matter === undefined ? client.matter : patch.matter.trim(),
                }
              : client,
          ),
        })),
      removeClient: (id) =>
        set((state) => ({
          clients: state.clients.filter((client) => client.id !== id),
          entries: state.entries.filter((entry) => entry.clientId !== id),
        })),
      addEntry: (draft) => {
        const id = crypto.randomUUID();
        const createdAt = Date.now();
        set((state) => {
          const entry: Entry = {
            ...draft,
            id,
            createdAt,
            billNo: draft.kind === "bill" ? draft.billNo ?? nextBillNo(state.entries, new Date(createdAt)) : draft.billNo,
          };
          return { entries: [...state.entries, entry] };
        });
        return id;
      },
      toggleDone: (id) =>
        set((state) => ({
          entries: state.entries.map((entry) => (entry.id === id ? { ...entry, done: !entry.done } : entry)),
        })),
      deleteEntry: (id) => set((state) => ({ entries: state.entries.filter((entry) => entry.id !== id) })),
    }),
    { name: "daftar-v1", skipHydration: true, version: 1 },
  ),
);
