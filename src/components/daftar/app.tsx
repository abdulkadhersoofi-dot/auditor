import { useEffect, useState } from "react";
import { Bills } from "@/components/daftar/bills";
import { Inbox } from "@/components/daftar/inbox";
import { Thread } from "@/components/daftar/thread";
import { Sheet, fieldClass, primaryClass, quietClass } from "@/components/daftar/ui";
import { useDaftar } from "@/lib/store";
import { cn } from "@/lib/utils";

type Dialog =
  | { kind: "settings" }
  | { kind: "create" }
  | { kind: "rename"; id: string }
  | { kind: "remove"; id: string }
  | null;

export function DaftarApp() {
  const [booted, setBooted] = useState(false);
  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        await useDaftar.persist.rehydrate();
      } catch {
        /* storage unavailable — keep the in-memory practice */
      }
      if (!live) return;
      useDaftar.getState().finishBoot();
      setBooted(true);
    })();
    return () => {
      live = false;
    };
  }, []);

  if (!booted) {
    return (
      <main className="flex h-dvh items-center justify-center bg-paper px-6 text-ink">
        <div>
          <h1 className="font-display text-3xl">Daftar</h1>
          <p className="mt-1 text-sm text-muted">Opening your practice</p>
        </div>
      </main>
    );
  }
  return <Shell />;
}

function Shell() {
  const clients = useDaftar((state) => state.clients);
  const clearSample = useDaftar((state) => state.clearSample);
  const removeClient = useDaftar((state) => state.removeClient);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<"list" | "main">("list");
  const [mainView, setMainView] = useState<"thread" | "bills">("thread");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [billsClient, setBillsClient] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  function openClient(id: string) {
    setSelectedId(id);
    setFocusId(null);
    setMainView("thread");
    setMobilePane("main");
  }

  const listVisible = mobilePane === "list" && mainView === "thread";
  const client = clients.find((item) => item.id === (dialog?.kind === "rename" || dialog?.kind === "remove" ? dialog.id : ""));

  return (
    <main data-ready="true" className="h-dvh overflow-hidden bg-paper text-ink">
      <div className="flex h-full min-h-0">
        <aside className={cn("h-full min-h-0 w-full md:w-96 md:shrink-0 md:border-r md:border-line", listVisible ? "flex" : "hidden md:flex")}>
          <div className="flex h-full min-h-0 w-full flex-col">
            <Inbox
              selectedId={selectedId}
              mainView={mainView}
              onSelect={(id) => {
                setSelectedId(id);
                setFocusId(null);
                setMainView("thread");
                setMobilePane("main");
              }}
              onView={(view) => {
                setMainView(view);
                if (view === "thread") setMobilePane("list");
                else setMobilePane("main");
              }}
              onAdd={() => setDialog({ kind: "create" })}
              onSettings={() => setDialog({ kind: "settings" })}
              onClearSample={() => {
                clearSample();
                setSelectedId(null);
                setMobilePane("list");
                setMainView("thread");
              }}
            />
          </div>
        </aside>
        <section className={cn("h-full min-h-0 min-w-0 flex-1", listVisible ? "hidden md:flex" : "flex")}>
          {mainView === "bills" ? (
            <Bills
              focusClientId={billsClient}
              mainView={mainView}
              onView={(view) => {
                setMainView(view);
                if (view === "thread") setMobilePane("list");
              }}
              onOpenClient={openClient}
            />
          ) : (
            <Thread
              clientId={selectedId}
              focusId={focusId}
              onBack={() => setMobilePane("list")}
              onOpenClient={openClient}
              onOpenEntry={(entry) => {
                setSelectedId(entry.clientId);
                setFocusId(entry.id);
                setMainView("thread");
                setMobilePane("main");
              }}
              onOpenBills={(id) => {
                setBillsClient(id);
                setMainView("bills");
                setMobilePane("main");
              }}
              onRename={() => {
                if (selectedId) setDialog({ kind: "rename", id: selectedId });
              }}
              onRemove={() => {
                if (selectedId) setDialog({ kind: "remove", id: selectedId });
              }}
              onSettings={() => setDialog({ kind: "settings" })}
            />
          )}
        </section>
      </div>

      <Sheet open={dialog?.kind === "create"} title="New client" onClose={() => setDialog(null)}>
        <ClientForm
          submitLabel="Add client"
          onSave={(name, matter) => {
            const id = useDaftar.getState().addClient(name, matter);
            setDialog(null);
            openClient(id);
          }}
        />
      </Sheet>
      <Sheet open={dialog?.kind === "rename"} title="Rename client" onClose={() => setDialog(null)}>
        {dialog?.kind === "rename" ? (
          <ClientForm
            key={dialog.id}
            submitLabel="Save"
            initial={{ name: client?.name ?? "", matter: client?.matter ?? "" }}
            onSave={(name, matter) => {
              useDaftar.getState().updateClient(dialog.id, { name, matter });
              setDialog(null);
            }}
          />
        ) : null}
      </Sheet>
      <Sheet open={dialog?.kind === "remove"} title="Remove client" onClose={() => setDialog(null)}>
        <p className="text-pretty text-ink-soft">
          Remove {client?.name ?? "this client"}? Their bills, fees, notes, to-dos, and reminders will leave this device.
        </p>
        <div className="mt-4 flex gap-2">
          <button type="button" className={quietClass} onClick={() => setDialog(null)} autoFocus>
            Cancel
          </button>
          <button
            type="button"
            className="h-11 rounded-lg border border-line px-4 text-sm font-medium text-danger"
            onClick={() => {
              if (dialog?.kind === "remove") {
                removeClient(dialog.id);
                if (selectedId === dialog.id) setSelectedId(null);
              }
              setDialog(null);
              setMobilePane("list");
            }}
          >
            Remove
          </button>
        </div>
      </Sheet>
      <Sheet open={dialog?.kind === "settings"} title="Practice" onClose={() => setDialog(null)}>
        <SettingsForm
          onDone={() => setDialog(null)}
          onClear={() => {
            clearSample();
            setSelectedId(null);
            setMobilePane("list");
            setMainView("thread");
            setDialog(null);
          }}
        />
      </Sheet>
    </main>
  );
}

function ClientForm({
  initial,
  submitLabel,
  onSave,
}: {
  initial?: { name: string; matter: string };
  submitLabel: string;
  onSave: (name: string, matter: string) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [matter, setMatter] = useState(initial?.matter ?? "");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim().length < 2) return;
        onSave(name.trim(), matter.trim());
      }}
      className="space-y-3"
    >
      <label className="block text-sm text-muted" htmlFor="client-name">
        Client name
      </label>
      <input id="client-name" value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} autoFocus required />
      <label className="block text-sm text-muted" htmlFor="client-matter">
        Matter
      </label>
      <input
        id="client-matter"
        value={matter}
        onChange={(event) => setMatter(event.target.value)}
        placeholder="Statutory audit, GST, ITR"
        className={fieldClass}
      />
      <button type="submit" className={cn(primaryClass, "w-full")} disabled={name.trim().length < 2}>
        {submitLabel}
      </button>
    </form>
  );
}

function SettingsForm({ onDone, onClear }: { onDone: () => void; onClear: () => void }) {
  const practiceName = useDaftar((state) => state.practiceName);
  const sample = useDaftar((state) => state.sample);
  const setPracticeName = useDaftar((state) => state.setPracticeName);
  const [name, setName] = useState(practiceName);
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setPracticeName(name);
        onDone();
      }}
    >
      <label className="block text-sm text-muted" htmlFor="practice-name">
        Practice name
      </label>
      <input id="practice-name" value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} autoFocus />
      <div>
        <p className="text-sm text-muted">From any chat</p>
        <ul className="mt-2 space-y-1 font-mono text-sm text-ink-soft">
          <li>bill 150000 GST audit</li>
          <li>received 50000</li>
          <li>todo Collect bank statements</li>
          <li>remind tomorrow Call for invoices</li>
          <li>new client Apex Forge</li>
        </ul>
      </div>
      <p className="text-sm text-pretty text-muted">
        Add Daftar to your phone home screen and it opens like an app. What you log stays on this device.
      </p>
      <button type="submit" className={cn(primaryClass, "w-full")}>
        Save
      </button>
      {sample ? (
        <button type="button" onClick={onClear} className="h-11 w-full text-sm text-danger">
          Clear sample clients
        </button>
      ) : null}
    </form>
  );
}
