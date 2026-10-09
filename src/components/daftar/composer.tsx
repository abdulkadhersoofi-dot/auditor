import { useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { applyChip, interpret, leadingCommand, type Action } from "@/lib/parse";
import { useDaftar } from "@/lib/store";
import { cn } from "@/lib/utils";

const CHIPS = [
  { id: "bill", label: "Bill", insert: "bill " },
  { id: "receipt", label: "Fee in", insert: "received " },
  { id: "todo", label: "To-do", insert: "todo " },
  { id: "reminder", label: "Remind", insert: "remind " },
  { id: "new-client", label: "Client", insert: "new client " },
] as const;

export function Composer({
  clientId,
  draft,
  setDraft,
  forceNote,
  setForceNote,
  stick,
  setStick,
  showHints,
  onNavigate,
}: {
  clientId: string | null;
  draft: string;
  setDraft: (value: string) => void;
  forceNote: boolean;
  setForceNote: (value: boolean) => void;
  stick: boolean;
  setStick: (value: boolean) => void;
  showHints: boolean;
  onNavigate: (id: string) => void;
}) {
  const clients = useDaftar((state) => state.clients);
  const entries = useDaftar((state) => state.entries);
  const addEntry = useDaftar((state) => state.addEntry);
  const addClient = useDaftar((state) => state.addClient);
  const box = useRef<HTMLTextAreaElement>(null);
  const active = clients.find((client) => client.id === clientId);
  const result = interpret(draft, {
    clients,
    entries,
    activeClientId: clientId,
    forceNote,
    stickToActive: stick,
  });
  const command = forceNote ? null : leadingCommand(draft);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [draft]);

  function apply(action: Action) {
    if (action.type === "create-client") {
      const id = addClient(action.name, action.matter);
      onNavigate(id);
    } else if (action.type === "open-client") {
      onNavigate(action.clientId);
    } else if (action.type === "entry") {
      addEntry(action.entry);
      if (action.entry.clientId && action.entry.clientId !== clientId) onNavigate(action.entry.clientId);
    }
    setDraft("");
    setForceNote(false);
    setStick(false);
  }

  function send(chosenId?: string) {
    const next = interpret(draft, {
      clients,
      entries,
      activeClientId: clientId,
      forceNote,
      stickToActive: stick,
      chosenClientId: chosenId,
    });
    if (!next.canSend) return;
    apply(next.action);
  }

  return (
    <div className="pb-safe shrink-0 border-t border-line bg-paper px-3 pt-2">
      {showHints && !draft.trim() ? (
        <div className="mb-2 flex flex-col gap-2">
          {["bill 25000 ITR filing", "todo Collect bank statements", "remind tomorrow Call for documents"].map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => {
                setDraft(hint);
                setForceNote(false);
                box.current?.focus();
              }}
              className="h-11 truncate rounded-full border border-line px-4 text-left text-sm text-ink-soft"
            >
              {hint}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mb-2 flex flex-wrap gap-2">
        {CHIPS.map((chip) => {
          const on = command === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={on}
              onClick={() => {
                setDraft(applyChip(draft, chip.insert));
                setForceNote(false);
                setStick(false);
                box.current?.focus();
              }}
              className={cn(
                "h-11 rounded-full px-4 text-sm",
                on ? "bg-accent text-accent-fg" : "border border-line text-ink",
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
      <p
        aria-live="polite"
        className={cn(
          "mb-2 text-sm text-pretty",
          result.tone === "warn" && "text-warn",
          result.tone === "muted" && "text-muted",
          result.tone === "ok" && "text-ink-soft",
        )}
      >
        {result.preview}
      </p>
      {result.choices.length > 0 ? (
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {result.choices.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => send(client.id)}
              className="h-11 shrink-0 rounded-full border border-line px-4 text-sm"
            >
              {client.name}
            </button>
          ))}
        </div>
      ) : null}
      {command && !forceNote || (result.routedAway && active) ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {command && !forceNote ? (
            <button type="button" onClick={() => setForceNote(true)} className="h-11 px-1 text-sm text-ink-soft">
              Save as note
            </button>
          ) : null}
          {result.routedAway && active ? (
            <button type="button" onClick={() => setStick(true)} className="h-11 px-1 text-sm text-ink-soft">
              Keep in {active.name}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="flex items-end gap-2 pb-2">
        <label className="sr-only" htmlFor="composer">
          Log a bill, fee, to-do, or reminder
        </label>
        <textarea
          id="composer"
          ref={box}
          rows={1}
          value={draft}
          placeholder="bill 45000 GST audit"
          enterKeyHint="send"
          className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-line bg-sheet px-4 py-3 text-base text-ink placeholder:text-muted"
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (!next.trim()) {
              setForceNote(false);
              setStick(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
        />
        <button
          type="button"
          aria-label="Log entry"
          disabled={!result.canSend}
          onClick={() => send()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-accent-fg disabled:opacity-40"
        >
          <Send className="size-5" />
        </button>
      </div>
    </div>
  );
}
