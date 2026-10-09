import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Plus, c as Check, i as Search, l as ArrowLeft, o as MessageSquare, r as Send, s as Ellipsis, t as X } from "../_libs/lucide-react.mjs";
import { i as format, n as isTomorrow, r as isToday, t as isYesterday } from "../_libs/date-fns.mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-FjugQ2fe.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function formatINR(paise) {
	const rupees = paise / 100;
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
		maximumFractionDigits: paise % 100 === 0 ? 0 : 2
	}).format(rupees);
}
function paiseToInput(paise) {
	const rupees = paise / 100;
	return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2);
}
function endOfToday(now = /* @__PURE__ */ new Date()) {
	return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
}
function dayKey(ts) {
	const d = new Date(ts);
	return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function dayLabel(ts, now = /* @__PURE__ */ new Date()) {
	const d = new Date(ts);
	if (isToday(d)) return "Today";
	if (isYesterday(d)) return "Yesterday";
	if (d.getFullYear() === now.getFullYear()) return format(d, "d MMM");
	return format(d, "d MMM yyyy");
}
function formatWhen(ts, now = /* @__PURE__ */ new Date()) {
	const d = new Date(ts);
	const time = format(d, "h:mm a");
	if (isToday(d)) return `Today, ${time}`;
	if (isTomorrow(d)) return `Tomorrow, ${time}`;
	if (isYesterday(d)) return `Yesterday, ${time}`;
	if (d.getFullYear() === now.getFullYear()) return `${format(d, "d MMM")}, ${time}`;
	return `${format(d, "d MMM yyyy")}, ${time}`;
}
function formatClock(ts) {
	return format(new Date(ts), "h:mm a");
}
function formatListTime(ts, now = /* @__PURE__ */ new Date()) {
	const d = new Date(ts);
	if (isToday(d)) return format(d, "h:mm a");
	if (isYesterday(d)) return "Yesterday";
	if (d.getFullYear() === now.getFullYear()) return format(d, "d MMM");
	return format(d, "d MMM yyyy");
}
function formatDayShort(ts, now = /* @__PURE__ */ new Date()) {
	const d = new Date(ts);
	if (d.getFullYear() === now.getFullYear()) return format(d, "d MMM");
	return format(d, "d MMM yyyy");
}
function entryPreview(entry) {
	switch (entry.kind) {
		case "note": return entry.body;
		case "bill": return `Bill ${entry.billNo ?? ""} · ${formatINR(entry.amountPaise ?? 0)}`.replace(/\s+/g, " ").trim();
		case "receipt": return `Fee in · ${formatINR(entry.amountPaise ?? 0)}`;
		case "todo": return `${entry.done ? "Done" : "To-do"} · ${entry.body}`;
		case "reminder": return `${entry.done ? "Done" : "Reminder"} · ${entry.body}`;
	}
}
var INITIAL_STOP = /* @__PURE__ */ new Set([
	"pvt",
	"ltd",
	"llp",
	"huf",
	"and",
	"the",
	"co",
	"of",
	"for"
]);
function initials(name) {
	const words = name.split(/\s+/).map((word) => word.replace(/[^A-Za-z0-9]/g, "")).filter((word) => word.length > 0 && !INITIAL_STOP.has(word.toLowerCase()));
	if (words.length === 0) return "•";
	if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
	return `${words[0][0]}${words[1][0]}`.toUpperCase();
}
function summarizeClient(entries, clientId) {
	const mine = entries.filter((entry) => entry.clientId === clientId);
	const bills = mine.filter((entry) => entry.kind === "bill").slice().sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
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
		return {
			entry: bill,
			billed,
			due,
			received: billed - due
		};
	});
	return {
		billed: views.reduce((sum, bill) => sum + bill.billed, 0),
		received: receipts.reduce((sum, receipt) => sum + (receipt.amountPaise ?? 0), 0),
		outstanding: views.reduce((sum, bill) => sum + bill.due, 0),
		credit: pool,
		bills: views
	};
}
function nextBillNo(entries, now = /* @__PURE__ */ new Date()) {
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
function findBillByNo(entries, billNo) {
	const target = billNo.toUpperCase();
	return entries.find((entry) => entry.kind === "bill" && entry.billNo?.toUpperCase() === target);
}
function activityOf(client, entries) {
	let max = client.createdAt;
	for (const entry of entries) if (entry.clientId === client.id && entry.createdAt > max) max = entry.createdAt;
	return max;
}
function practiceTotals(clients, entries) {
	return clients.reduce((totals, client) => {
		const summary = summarizeClient(entries, client.id);
		totals.billed += summary.billed;
		totals.received += summary.received;
		totals.outstanding += summary.outstanding;
		if (summary.outstanding > 0) totals.owing.push({
			client,
			summary
		});
		return totals;
	}, {
		billed: 0,
		received: 0,
		outstanding: 0,
		owing: []
	});
}
var SEED_PRACTICE = "Rao & Associates";
function at$1(dayOffset, hour, minute = 0) {
	const date = /* @__PURE__ */ new Date();
	date.setDate(date.getDate() + dayOffset);
	date.setHours(hour, minute, 0, 0);
	return date.getTime();
}
function buildSeed() {
	const clients = [
		{
			id: "c-mehta",
			name: "Mehta Textiles Pvt Ltd",
			matter: "GST and income tax",
			createdAt: at$1(-20, 9)
		},
		{
			id: "c-sharma",
			name: "Sharma & Kapoor",
			matter: "Statutory audit",
			createdAt: at$1(-24, 9)
		},
		{
			id: "c-north",
			name: "Northwind Logistics",
			matter: "Internal audit",
			createdAt: at$1(-5, 9)
		},
		{
			id: "c-kapoor",
			name: "Kapoor HUF",
			matter: "Personal tax",
			createdAt: at$1(-9, 9)
		}
	];
	const entries = [];
	const push = (entry) => {
		const billNo = entry.kind === "bill" ? nextBillNo(entries) : void 0;
		entries.push({
			...entry,
			billNo
		});
		return entries[entries.length - 1];
	};
	push({
		id: "e-mehta-note",
		clientId: "c-mehta",
		kind: "note",
		body: "Engagement letter signed for FY 2025-26.",
		createdAt: at$1(-18, 11),
		done: false
	});
	const mehtaBill = push({
		id: "e-mehta-bill",
		clientId: "c-mehta",
		kind: "bill",
		body: "GST audit for FY 2025-26",
		createdAt: at$1(-14, 16, 20),
		amountPaise: 15e6,
		done: false
	});
	push({
		id: "e-mehta-fee",
		clientId: "c-mehta",
		kind: "receipt",
		body: "Part received against the GST audit.",
		createdAt: at$1(-6, 12, 10),
		amountPaise: 1e7,
		billId: mehtaBill.id,
		done: false
	});
	push({
		id: "e-mehta-todo",
		clientId: "c-mehta",
		kind: "todo",
		body: "Collect GSTR-9 workings and the sales register",
		createdAt: at$1(-2, 15),
		done: false
	});
	push({
		id: "e-mehta-rem",
		clientId: "c-mehta",
		kind: "reminder",
		body: "Call Mr Mehta for the missing purchase invoices",
		createdAt: at$1(-1, 18),
		dueAt: at$1(1, 10),
		done: false
	});
	const sharmaBill = push({
		id: "e-sharma-bill",
		clientId: "c-sharma",
		kind: "bill",
		body: "Statutory audit FY 2025-26",
		createdAt: at$1(-21, 11),
		amountPaise: 275e5,
		done: false
	});
	push({
		id: "e-sharma-todo",
		clientId: "c-sharma",
		kind: "todo",
		body: "Engagement letter signed",
		createdAt: at$1(-20, 12),
		done: true
	});
	push({
		id: "e-sharma-fee",
		clientId: "c-sharma",
		kind: "receipt",
		body: "Audit fee received in full.",
		createdAt: at$1(-4, 17),
		amountPaise: 275e5,
		billId: sharmaBill.id,
		done: false
	});
	push({
		id: "e-sharma-note",
		clientId: "c-sharma",
		kind: "note",
		body: "Signed financial statements collected from the client.",
		createdAt: at$1(-1, 11, 30),
		done: false
	});
	push({
		id: "e-sharma-rem",
		clientId: "c-sharma",
		kind: "reminder",
		body: "Send the audit report draft",
		createdAt: at$1(-1, 16),
		dueAt: at$1(0, 17),
		done: false
	});
	push({
		id: "e-north-bill",
		clientId: "c-north",
		kind: "bill",
		body: "Internal audit — Q2",
		createdAt: at$1(-3, 10, 15),
		amountPaise: 8e6,
		done: false
	});
	push({
		id: "e-north-todo",
		clientId: "c-north",
		kind: "todo",
		body: "Vouch cash expenses over ₹10,000",
		createdAt: at$1(-3, 10, 20),
		done: false
	});
	push({
		id: "e-north-rem",
		clientId: "c-north",
		kind: "reminder",
		body: "Chase the HDFC bank confirmation",
		createdAt: at$1(-2, 9),
		dueAt: at$1(-1, 10),
		done: false
	});
	const kapoorBill = push({
		id: "e-kapoor-bill",
		clientId: "c-kapoor",
		kind: "bill",
		body: "ITR for AY 2026-27",
		createdAt: at$1(-8, 14),
		amountPaise: 18e5,
		done: false
	});
	push({
		id: "e-kapoor-fee",
		clientId: "c-kapoor",
		kind: "receipt",
		body: "ITR fee received.",
		createdAt: at$1(-8, 15),
		amountPaise: 18e5,
		billId: kapoorBill.id,
		done: false
	});
	push({
		id: "e-kapoor-note",
		clientId: "c-kapoor",
		kind: "note",
		body: "Filed. Acknowledgement is with the client.",
		createdAt: at$1(-7, 18),
		done: false
	});
	push({
		id: "e-desk-todo",
		clientId: null,
		kind: "todo",
		body: "Update the engagement letter template",
		createdAt: at$1(-1, 9, 30),
		done: false
	});
	push({
		id: "e-desk-rem",
		clientId: null,
		kind: "reminder",
		body: "Renew the digital signature",
		createdAt: at$1(-1, 9, 40),
		dueAt: at$1(2, 10),
		done: false
	});
	return {
		practiceName: SEED_PRACTICE,
		clients,
		entries,
		sample: true,
		initialized: true
	};
}
var useDaftar = create()(persist((set, get) => ({
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
	clearSample: () => set((state) => ({
		sample: false,
		clients: [],
		entries: [],
		initialized: true,
		practiceName: state.practiceName === "Rao & Associates" ? "Daftar" : state.practiceName
	})),
	addClient: (name, matter) => {
		const id = crypto.randomUUID();
		set((state) => ({ clients: [...state.clients, {
			id,
			name: name.trim(),
			matter: matter.trim(),
			createdAt: Date.now()
		}] }));
		return id;
	},
	updateClient: (id, patch) => set((state) => ({ clients: state.clients.map((client) => client.id === id ? {
		...client,
		name: patch.name === void 0 ? client.name : patch.name.trim() || client.name,
		matter: patch.matter === void 0 ? client.matter : patch.matter.trim()
	} : client) })),
	removeClient: (id) => set((state) => ({
		clients: state.clients.filter((client) => client.id !== id),
		entries: state.entries.filter((entry) => entry.clientId !== id)
	})),
	addEntry: (draft) => {
		const id = crypto.randomUUID();
		const createdAt = Date.now();
		set((state) => {
			const entry = {
				...draft,
				id,
				createdAt,
				billNo: draft.kind === "bill" ? draft.billNo ?? nextBillNo(state.entries, new Date(createdAt)) : draft.billNo
			};
			return { entries: [...state.entries, entry] };
		});
		return id;
	},
	toggleDone: (id) => set((state) => ({ entries: state.entries.map((entry) => entry.id === id ? {
		...entry,
		done: !entry.done
	} : entry) })),
	deleteEntry: (id) => set((state) => ({ entries: state.entries.filter((entry) => entry.id !== id) }))
}), {
	name: "daftar-v1",
	skipHydration: true,
	version: 1
}));
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var fieldClass = "h-11 w-full rounded-lg border border-line bg-paper px-3 text-base text-ink placeholder:text-muted";
var primaryClass = "h-11 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg disabled:opacity-40";
var quietClass = "h-11 rounded-lg border border-line bg-sheet px-4 text-sm font-medium text-ink";
function ViewSwitch({ value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-2 gap-1 rounded-full bg-paper-2 p-1",
		children: [{
			id: "thread",
			label: "Chats"
		}, {
			id: "bills",
			label: "Bills"
		}].map((item) => {
			const on = value === item.id;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-pressed": on,
				onClick: () => onChange(item.id),
				className: cn("h-11 rounded-full text-sm font-medium", on ? "bg-sheet text-ink" : "text-muted"),
				children: item.label
			}, item.id);
		})
	});
}
function Sheet({ open, title, onClose, children }) {
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onKey = (event) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, onClose]);
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-40 flex items-end justify-center md:items-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"aria-label": "Close",
			className: "absolute inset-0 bg-ink/40",
			onClick: onClose
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": title,
			className: "rise-in relative z-10 m-3 w-full max-w-md rounded-3xl border border-line bg-sheet p-4 pb-safe text-ink",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-4 flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Close",
					onClick: onClose,
					className: "grid h-11 w-11 place-items-center rounded-full text-ink",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
				})]
			}), children]
		})]
	});
}
function Bills({ focusClientId, mainView, onView, onOpenClient }) {
	const clients = useDaftar((state) => state.clients);
	const entries = useDaftar((state) => state.entries);
	const [query, setQuery] = (0, import_react.useState)("");
	const now = /* @__PURE__ */ new Date();
	const totals = practiceTotals(clients, entries);
	const q = query.trim().toLowerCase();
	const groups = (0, import_react.useMemo)(() => {
		return clients.map((client) => {
			const summary = summarizeClient(entries, client.id);
			const bills = summary.bills.filter((bill) => {
				if (!q) return true;
				return `${client.name} ${client.matter} ${bill.entry.billNo ?? ""} ${bill.entry.body}`.toLowerCase().includes(q);
			});
			const nameHit = !q || client.name.toLowerCase().includes(q) || client.matter.toLowerCase().includes(q);
			if (!nameHit && bills.length === 0) return null;
			return {
				client,
				summary,
				bills: nameHit && !q ? summary.bills : bills
			};
		}).filter((group) => group !== null).sort((a, b) => b.summary.outstanding - a.summary.outstanding || a.client.name.localeCompare(b.client.name));
	}, [
		clients,
		entries,
		q
	]);
	(0, import_react.useEffect)(() => {
		if (!focusClientId) return;
		document.getElementById(`bills-${focusClientId}`)?.scrollIntoView({ block: "start" });
	}, [focusClientId]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 w-full min-w-0 flex-col bg-paper",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "pt-safe shrink-0 space-y-3 px-4 pt-4 pb-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "md:hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViewSwitch, {
						value: mainView,
						onChange: onView
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: "Still to come in"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-3xl tabular-nums lining-nums",
						children: totals.outstanding > 0 ? formatINR(totals.outstanding) : "Settled"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted tabular-nums lining-nums",
						children: [
							"Billed ",
							formatINR(totals.billed),
							" · Received ",
							formatINR(totals.received)
						]
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "relative block",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "sr-only",
							children: "Search bills"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: query,
							onChange: (event) => setQuery(event.target.value),
							placeholder: "Search a client or bill",
							className: cn(fieldClass, "pl-10")
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-h-0 flex-1 overflow-y-auto",
			children: [groups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-4 py-8 text-sm text-muted",
				children: "No clients yet. Add one from Chats."
			}) : null, groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				id: `bills-${group.client.id}`,
				className: "border-b border-line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onOpenClient(group.client.id),
					className: "sticky top-0 z-10 flex w-full items-center justify-between gap-3 bg-paper px-4 py-3 text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate font-medium",
							children: group.client.name
						}), group.client.matter ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate text-xs text-muted",
							children: group.client.matter
						}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("shrink-0 text-sm tabular-nums lining-nums", group.summary.outstanding > 0 ? "text-danger" : "text-ok"),
						children: group.summary.outstanding > 0 ? formatINR(group.summary.outstanding) : "Settled"
					})]
				}), group.bills.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "px-4 pb-4 text-sm text-muted",
					children: "No bills issued."
				}) : group.bills.map((bill) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onOpenClient(group.client.id),
					className: "grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-3 px-4 py-3 text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "block text-sm text-muted",
							children: [
								bill.entry.billNo,
								" · ",
								formatDayShort(bill.entry.createdAt, now)
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block truncate",
							children: bill.entry.body
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block tabular-nums lining-nums",
							children: formatINR(bill.billed)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("block text-sm tabular-nums lining-nums", bill.due > 0 ? "text-danger" : "text-ok"),
							children: bill.due > 0 ? `Due ${formatINR(bill.due)}` : "Paid"
						})]
					})]
				}, bill.entry.id))]
			}, group.client.id))]
		})]
	});
}
function clientName$1(clients, id) {
	if (!id) return "Desk";
	return clients.find((client) => client.id === id)?.name ?? "Client";
}
function hasDue(entries, clientId, now) {
	const end = endOfToday(now);
	return entries.some((entry) => entry.clientId === clientId && !entry.done && (entry.kind === "reminder" || entry.kind === "todo") && entry.dueAt != null && entry.dueAt <= end);
}
function latest(entries, clientId) {
	let found;
	for (const entry of entries) {
		if (entry.clientId !== clientId) continue;
		if (!found || entry.createdAt > found.createdAt) found = entry;
	}
	return found;
}
function Inbox({ selectedId, mainView, onSelect, onView, onAdd, onSettings, onClearSample }) {
	const practiceName = useDaftar((state) => state.practiceName);
	const clients = useDaftar((state) => state.clients);
	const entries = useDaftar((state) => state.entries);
	const sample = useDaftar((state) => state.sample);
	const [query, setQuery] = (0, import_react.useState)("");
	const [filter, setFilter] = (0, import_react.useState)("all");
	const now = /* @__PURE__ */ new Date();
	const totals = practiceTotals(clients, entries);
	const titled = practiceName !== "Daftar";
	const deskTime = entries.reduce((max, entry) => Math.max(max, entry.createdAt), 0);
	const overdue = entries.find((entry) => entry.kind === "reminder" && !entry.done && entry.dueAt && entry.dueAt < now.getTime());
	const deskLine = overdue ? `Overdue · ${clientName$1(clients, overdue.clientId)} · ${overdue.body}` : latest(entries, null) ? entryPreview(latest(entries, null)) : entries.length ? entryPreview([...entries].sort((a, b) => b.createdAt - a.createdAt)[0]) : "Bills, fees, to-dos, reminders";
	const rows = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		return clients.filter((client) => {
			const summary = summarizeClient(entries, client.id);
			if (filter === "outstanding" && summary.outstanding <= 0) return false;
			if (filter === "due" && !hasDue(entries, client.id, now)) return false;
			if (!q) return true;
			if (client.name.toLowerCase().includes(q) || client.matter.toLowerCase().includes(q)) return true;
			return entries.some((entry) => entry.clientId === client.id && `${entry.body} ${entry.billNo ?? ""}`.toLowerCase().includes(q));
		}).sort((a, b) => activityOf(b, entries) - activityOf(a, entries));
	}, [
		clients,
		entries,
		filter,
		query,
		now
	]);
	const showDesk = filter === "all" && (!query.trim() || "desk".includes(query.trim().toLowerCase()) || practiceName.toLowerCase().includes(query.trim().toLowerCase()));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 flex-col bg-paper",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "pt-safe shrink-0 space-y-3 px-4 pb-3 pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: onSettings,
							className: "min-w-0 text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: titled ? "Daftar" : "Practice chat"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "truncate font-display text-2xl",
								children: titled ? practiceName : "Daftar"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex shrink-0 items-start gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-right whitespace-nowrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block font-display text-xl tabular-nums lining-nums",
									children: totals.outstanding > 0 ? formatINR(totals.outstanding) : "Settled"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted",
									children: totals.outstanding > 0 ? "to come in" : "no fees out"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								"aria-label": "Add client",
								onClick: onAdd,
								className: "grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-fg",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" })
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViewSwitch, {
						value: mainView,
						onChange: onView
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "relative block",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "sr-only",
								children: "Search"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: query,
								onChange: (event) => setQuery(event.target.value),
								placeholder: "Search clients, bills, notes",
								className: cn(fieldClass, "pl-10")
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							["all", "All"],
							["outstanding", "Fees out"],
							["due", "Due"]
						].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": filter === id,
							onClick: () => setFilter(id),
							className: cn("h-11 rounded-full px-4 text-sm", filter === id ? "bg-accent text-accent-fg" : "border border-line text-ink"),
							children: label
						}, id))
					})
				]
			}),
			sample ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-4 mb-3 flex items-center justify-between gap-3 rounded-2xl bg-paper-2 px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-ink-soft",
					children: "Sample practice. Clear it before real clients."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClearSample,
					className: "h-11 shrink-0 px-2 text-sm font-medium text-ink",
					children: "Clear"
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 overflow-y-auto",
				children: [
					showDesk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatRow, {
						title: "Desk",
						matter: "Everything still open",
						preview: deskLine,
						time: deskTime ? formatListTime(deskTime, now) : "",
						status: "",
						tone: "muted",
						selected: selectedId === null,
						icon: true,
						onClick: () => onSelect(null)
					}) : null,
					rows.map((client) => {
						const summary = summarizeClient(entries, client.id);
						const last = latest(entries, client.id);
						const due = hasDue(entries, client.id, now);
						const status = summary.outstanding > 0 ? formatINR(summary.outstanding) : due ? "Due" : summary.billed > 0 ? "Settled" : "";
						const tone = summary.outstanding > 0 || due ? "danger" : summary.billed > 0 ? "ok" : "muted";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatRow, {
							title: client.name,
							matter: client.matter,
							preview: last ? entryPreview(last) : "No messages yet",
							time: last ? formatListTime(last.createdAt, now) : "",
							status,
							tone,
							selected: selectedId === client.id,
							initials: initials(client.name),
							onClick: () => onSelect(client.id)
						}, client.id);
					}),
					rows.length === 0 && !showDesk ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-4 py-8 text-sm text-muted",
						children: "No chats in this view."
					}) : null
				]
			})
		]
	});
}
function ChatRow({ title, matter, preview, time, status, tone, selected, initials: mark, icon, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		"aria-current": selected ? "true" : void 0,
		className: cn("flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition-colors duration-150", selected ? "bg-paper-2" : "hover:bg-paper-2"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-medium", icon ? "bg-accent text-accent-fg" : "border border-line bg-sheet text-ink"),
			children: icon ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "size-5" }) : mark
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0 flex-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-baseline justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate font-medium",
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "shrink-0 text-xs text-muted",
						children: time
					})]
				}),
				matter ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate text-xs text-muted",
					children: matter
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "mt-1 flex items-baseline justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate text-sm text-ink-soft",
						children: preview
					}), status ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("shrink-0 text-xs font-medium tabular-nums lining-nums", tone === "danger" && "text-danger", tone === "ok" && "text-ok", tone === "muted" && "text-muted"),
						children: status
					}) : null]
				})
			]
		})]
	});
}
var MONTHS = {
	jan: 0,
	january: 0,
	feb: 1,
	february: 1,
	mar: 2,
	march: 2,
	apr: 3,
	april: 3,
	may: 4,
	jun: 5,
	june: 5,
	jul: 6,
	july: 6,
	aug: 7,
	august: 7,
	sep: 8,
	sept: 8,
	september: 8,
	oct: 9,
	october: 9,
	nov: 10,
	november: 10,
	dec: 11,
	december: 11
};
var WEEKDAYS = [
	"sunday",
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday"
];
var MONTH_ALT = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
function startOfDay(d) {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d, n) {
	const next = new Date(d);
	next.setDate(next.getDate() + n);
	return next;
}
function at(day, hour, minute) {
	return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0);
}
function blankSpans(input, spans) {
	const mask = Array(input.length).fill(false);
	for (const span of spans) for (let i = Math.max(0, span.start); i < Math.min(input.length, span.end); i++) mask[i] = true;
	let out = "";
	for (let i = 0; i < input.length; i++) out += mask[i] ? " " : input[i];
	return out.replace(/\s+/g, " ").trim();
}
function overlaps(span, spans) {
	return spans.some((other) => span.start < other.end && other.start < span.end);
}
function to24(hour, ampm) {
	if (ampm) {
		if (ampm.toLowerCase() === "am") return hour === 12 ? 0 : hour;
		return hour === 12 ? 12 : hour + 12;
	}
	if (hour >= 1 && hour <= 7) return hour + 12;
	return hour;
}
function matchClock(input) {
	const patterns = [
		/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i,
		/\bat\s+(\d{1,2}):(\d{2})\b/i,
		/\b([01]?\d|2[0-3]):([0-5]\d)\b/,
		new RegExp(`\\bat\\s+(\\d{1,2})\\b(?!\\s*(?:am|pm|${MONTH_ALT})\\b)`, "i")
	];
	const hits = [];
	for (const re of patterns) {
		const match = re.exec(input);
		if (!match || match.index === void 0) continue;
		const hourRaw = Number(match[1]);
		const minute = match[2] ? Number(match[2]) : 0;
		const hour = to24(hourRaw, match[3]);
		if (hourRaw > 23 || hour > 23 || minute > 59) continue;
		let start = match.index;
		if (input.slice(Math.max(0, start - 3), start).toLowerCase() === "at ") start -= 3;
		hits.push({
			start,
			end: match.index + match[0].length,
			hour,
			minute
		});
	}
	hits.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
	return hits[0] ?? null;
}
function calendarDay(day, monthIndex, year, now) {
	let y = year ?? now.getFullYear();
	if (year != null && year < 100) y = 2e3 + year;
	if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null;
	const date = new Date(y, monthIndex, day);
	if (date.getMonth() !== monthIndex || date.getDate() !== day) return null;
	if (year == null && date.getTime() < startOfDay(now).getTime()) date.setFullYear(date.getFullYear() + 1);
	return date;
}
function matchDate(input, now) {
	const prefix = "(?:(?:on|by|before|due)\\s+)?";
	const hits = [];
	const push = (match, build) => {
		if (!match || match.index === void 0) return;
		const built = build(match);
		if (!built) return;
		hits.push({
			start: match.index,
			end: match.index + match[0].length,
			...built
		});
	};
	push(new RegExp(`\\b${prefix}day after tomorrow\\b`, "i").exec(input), () => ({
		day: addDays(startOfDay(now), 2),
		explicit: true,
		defaultHour: 10
	}));
	push(new RegExp(`\\b${prefix}(?:tomorrow|tmrw|tomm?orow)\\b`, "i").exec(input), () => ({
		day: addDays(startOfDay(now), 1),
		explicit: true,
		defaultHour: 10
	}));
	push(new RegExp(`\\b${prefix}tonight\\b`, "i").exec(input), () => ({
		day: startOfDay(now),
		explicit: true,
		defaultHour: 19
	}));
	push(new RegExp(`\\b${prefix}today\\b`, "i").exec(input), () => ({
		day: startOfDay(now),
		explicit: true,
		defaultHour: 10
	}));
	push(new RegExp(`\\b${prefix}yesterday\\b`, "i").exec(input), () => ({
		day: addDays(startOfDay(now), -1),
		explicit: true,
		defaultHour: 10
	}));
	push(new RegExp(`\\b${prefix}next week\\b`, "i").exec(input), () => ({
		day: addDays(startOfDay(now), 7),
		explicit: true,
		defaultHour: 10
	}));
	push(new RegExp(`\\b${prefix}in\\s+(?:a|one)\\s+week\\b`, "i").exec(input), () => ({
		day: addDays(startOfDay(now), 7),
		explicit: true,
		defaultHour: 10
	}));
	push(new RegExp(`\\b${prefix}in\\s+(\\d+|a|one)\\s+days?\\b`, "i").exec(input), (match) => {
		const token = match[1].toLowerCase();
		const n = token === "a" || token === "one" ? 1 : Number(token);
		if (!Number.isFinite(n) || n > 365) return null;
		return {
			day: addDays(startOfDay(now), n),
			explicit: true,
			defaultHour: 10
		};
	});
	push(new RegExp(`\\b${prefix}(next\\s+)?(${WEEKDAYS.join("|")})\\b`, "i").exec(input), (match) => {
		const forceNext = Boolean(match[1]);
		const target = WEEKDAYS.indexOf(match[2].toLowerCase());
		const base = startOfDay(now);
		const delta = (target - base.getDay() + 7) % 7;
		return {
			day: addDays(base, delta === 0 ? forceNext ? 7 : 0 : delta),
			explicit: true,
			defaultHour: 10
		};
	});
	push(new RegExp(`\\b${prefix}(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_ALT})(?:\\s+(\\d{2,4}))?\\b`, "i").exec(input), (match) => {
		const month = MONTHS[match[2].toLowerCase()];
		const year = match[3] ? Number(match[3]) : null;
		const day = calendarDay(Number(match[1]), month, year, now);
		if (!day) return null;
		return {
			day,
			explicit: true,
			defaultHour: 10
		};
	});
	push(new RegExp(`\\b${prefix}(${MONTH_ALT})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{2,4}))?\\b`, "i").exec(input), (match) => {
		const month = MONTHS[match[1].toLowerCase()];
		const year = match[3] ? Number(match[3]) : null;
		const day = calendarDay(Number(match[2]), month, year, now);
		if (!day) return null;
		return {
			day,
			explicit: true,
			defaultHour: 10
		};
	});
	push(new RegExp(`\\b${prefix}(\\d{1,2})[\\/\\-.](\\d{1,2})(?:[\\/\\-.](\\d{2,4}))?\\b`).exec(input), (match) => {
		const year = match[3] ? Number(match[3]) : null;
		const day = calendarDay(Number(match[1]), Number(match[2]) - 1, year, now);
		if (!day) return null;
		return {
			day,
			explicit: true,
			defaultHour: 10
		};
	});
	hits.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
	return hits[0] ?? null;
}
function matchDaypart(input, taken) {
	const parts = [
		{
			re: /\b(?:this evening|evening|eod|end of day)\b/i,
			hour: 18,
			minute: 0
		},
		{
			re: /\bafternoon\b/i,
			hour: 15,
			minute: 0
		},
		{
			re: /\bnoon\b/i,
			hour: 12,
			minute: 0
		},
		{
			re: /\bmorning\b/i,
			hour: 9,
			minute: 0
		}
	];
	const hits = [];
	for (const part of parts) {
		const match = part.re.exec(input);
		if (!match || match.index === void 0) continue;
		const span = {
			start: match.index,
			end: match.index + match[0].length
		};
		if (overlaps(span, taken)) continue;
		hits.push({
			...span,
			hour: part.hour,
			minute: part.minute
		});
	}
	hits.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
	return hits[0] ?? null;
}
function extractWhen(input, now) {
	const spans = [];
	const clock = matchClock(input);
	if (clock) spans.push(clock);
	const date = matchDate(input, now);
	if (date) spans.push(date);
	const daypart = matchDaypart(input, spans);
	if (daypart) spans.push(daypart);
	if (!clock && !date && !daypart) return null;
	let hour = clock?.hour ?? daypart?.hour ?? null;
	let minute = clock?.minute ?? daypart?.minute ?? null;
	let day = date?.day ?? null;
	const defaultHour = date?.defaultHour ?? 10;
	if (!day) {
		const h = hour ?? defaultHour;
		const m = minute ?? 0;
		let base = startOfDay(now);
		if (at(base, h, m).getTime() < now.getTime() - 6e4) base = addDays(base, 1);
		day = base;
		hour = h;
		minute = m;
	}
	return {
		dueAt: at(day, hour ?? defaultHour, minute ?? 0).getTime(),
		rest: blankSpans(input, spans)
	};
}
var MAX_PAISE = 1e11;
var STOP = /* @__PURE__ */ new Set([
	"pvt",
	"ltd",
	"llp",
	"huf",
	"and",
	"the",
	"co",
	"mr",
	"mrs",
	"ms",
	"private",
	"limited",
	"company",
	"associates",
	"sons",
	"bros",
	"brothers",
	"of",
	"for"
]);
var NOTE_RE = /^(?:\/)?note\b[:\s-]*/i;
var COMMANDS = [
	{
		kind: "new-client",
		re: /^(?:\/)?(?:new\s+client|add\s+client)\b[:\s-]*/i
	},
	{
		kind: "bill",
		re: /^(?:\/)?(?:raise\s+)?(?:a\s+)?(?:bill|billed|invoice)\b[:\s-]*/i
	},
	{
		kind: "receipt",
		re: /^(?:\/)?(?:fee\s+in|fees\s+in|fee\s+received|fees\s+received|fees?\s+of|received|receipt|collected|payment|fees?)\b[:\s-]*/i
	},
	{
		kind: "todo",
		re: /^(?:\/)?(?:to-?do|task|to\s+do)\b[:\s-]*/i
	},
	{
		kind: "reminder",
		re: /^(?:\/)?(?:reminder|remind|follow(?:\s*|-)?up|ping)\b[:\s-]*/i
	}
];
var CHIP_PREFIX = /^(?:note|new\s+client|add\s+client|raise\s+a\s+bill|raise\s+bill|raise|a\s+bill|bill|billed|invoice|fee\s+in|fees\s+in|fee\s+received|fees\s+received|fees?\s+of|received|receipt|collected|payment|fees?|to-?do|task|to\s+do|reminder|remind|follow(?:\s*|-)?up|ping)\b[:\s-]*/i;
function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function cleanBody(value) {
	return value.replace(/\s+/g, " ").replace(/^[\s,.;:\-–—]+|[\s,.;:\-–—]+$/g, "").replace(/^(?:for|about|re|regarding|against|towards)\s+/i, "").replace(/\s+(?:for|about|re|regarding|against|towards)$/i, "").trim();
}
function anchorWord(name) {
	return name.split(/\s+/).map((word) => word.replace(/[^A-Za-z0-9]/g, "")).filter((word) => word.length >= 3 && !STOP.has(word.toLowerCase()))[0] ?? null;
}
function mentionOf(text, clients) {
	const hay = text.toLowerCase();
	const scored = [];
	for (const client of clients) {
		const name = client.name.toLowerCase();
		if (name && hay.includes(name)) {
			scored.push({
				id: client.id,
				score: 1e3 + name.length
			});
			continue;
		}
		const anchor = anchorWord(client.name);
		if (anchor && new RegExp(`\\b${escapeRegExp(anchor)}\\b`, "i").test(text)) scored.push({
			id: client.id,
			score: anchor.length
		});
	}
	if (scored.length === 0) return { type: "none" };
	scored.sort((a, b) => b.score - a.score);
	const top = scored.filter((item) => item.score === scored[0].score);
	const ids = [...new Set(top.map((item) => item.id))];
	if (ids.length > 1) return {
		type: "many",
		ids
	};
	const client = clients.find((item) => item.id === ids[0]);
	if (!client) return { type: "none" };
	const fullAt = hay.indexOf(client.name.toLowerCase());
	if (fullAt !== -1) return {
		type: "one",
		id: client.id,
		start: fullAt,
		end: fullAt + client.name.length
	};
	const anchor = anchorWord(client.name);
	if (anchor) {
		const match = new RegExp(`\\b${escapeRegExp(anchor)}\\b`, "i").exec(text);
		if (match && match.index !== void 0) return {
			type: "one",
			id: client.id,
			start: match.index,
			end: match.index + match[0].length
		};
	}
	return {
		type: "one",
		id: client.id,
		start: 0,
		end: 0
	};
}
var MULT = {
	k: 1e3,
	thousand: 1e3,
	l: 1e5,
	lac: 1e5,
	lakh: 1e5,
	lakhs: 1e5,
	cr: 1e7,
	crore: 1e7,
	crores: 1e7
};
function pullAmount(input) {
	const match = /(?:₹|rs\.?|inr)?\s*(\d[\d,]*(?:\.\d{1,2})?)\s*(k|thousand|l|lac|lakh|lakhs|cr|crore|crores)?\b/i.exec(input);
	if (!match || match.index === void 0) return null;
	const value = Number(match[1].replace(/,/g, ""));
	if (!Number.isFinite(value)) return null;
	const rupees = value * (MULT[match[2]?.toLowerCase() ?? ""] ?? 1);
	const paise = Math.round(rupees * 100);
	if (paise <= 0) return null;
	return {
		paise,
		rest: cleanBody(`${input.slice(0, match.index)} ${input.slice(match.index + match[0].length)}`)
	};
}
function parseMoney(input) {
	const got = pullAmount(input.trim());
	if (!got || got.rest) return null;
	if (got.paise > MAX_PAISE) return null;
	return got.paise;
}
function pullBillNo(input) {
	const match = /\b(DF-\d{2}-\d{3,})\b/i.exec(input);
	if (!match || match.index === void 0) return {
		billNo: void 0,
		rest: input
	};
	return {
		billNo: match[1].toUpperCase(),
		rest: cleanBody(`${input.slice(0, match.index)} ${input.slice(match.index + match[0].length)}`)
	};
}
function leadingCommand(text) {
	const trimmed = text.trim();
	if (!trimmed) return null;
	if (NOTE_RE.test(trimmed)) return "note";
	for (const command of COMMANDS) if (command.re.test(trimmed)) return command.kind;
	return null;
}
function applyChip(text, insert) {
	const rest = text.trim().replace(CHIP_PREFIX, "").trim();
	return rest ? `${insert}${rest}` : insert;
}
function clientName(clients, id) {
	if (!id) return null;
	return clients.find((client) => client.id === id)?.name ?? null;
}
function idle() {
	return {
		tone: "muted",
		preview: "Try bill 45000 GST audit",
		canSend: false,
		choices: [],
		routedAway: false,
		action: { type: "none" }
	};
}
function invalid(preview, choices = []) {
	return {
		tone: "warn",
		preview,
		canSend: false,
		choices,
		routedAway: false,
		action: { type: "none" }
	};
}
function interpret(text, ctx) {
	const now = ctx.now ?? /* @__PURE__ */ new Date();
	const trimmed = text.trim();
	if (!trimmed) return idle();
	const forced = ctx.forceNote || NOTE_RE.test(trimmed);
	let kind = forced ? "note" : null;
	let rest = trimmed;
	if (forced) {
		rest = trimmed.replace(NOTE_RE, "").trim() || trimmed;
		kind = "note";
	} else {
		for (const command of COMMANDS) if (command.re.test(trimmed)) {
			kind = command.kind;
			rest = trimmed.replace(command.re, "").trim();
			break;
		}
		if (!kind) kind = "note";
	}
	if (kind === "new-client") {
		const [rawName, ...matterParts] = rest.split(/\s*[-–—]\s+|\s*,\s+/);
		const name = cleanBody(rawName ?? "");
		const matter = cleanBody(matterParts.join(" — "));
		if (name.length < 2) return invalid("Add a client name");
		const existing = ctx.clients.find((client) => client.name.toLowerCase() === name.toLowerCase());
		if (existing) return {
			tone: "ok",
			preview: `Open ${existing.name}`,
			canSend: true,
			choices: [],
			routedAway: false,
			action: {
				type: "open-client",
				clientId: existing.id
			}
		};
		return {
			tone: "ok",
			preview: matter ? `New client · ${name} · ${matter}` : `New client · ${name}`,
			canSend: true,
			choices: [],
			routedAway: false,
			action: {
				type: "create-client",
				name,
				matter
			}
		};
	}
	let dueAt;
	let assumedWhen = false;
	if (kind === "reminder" || kind === "todo") {
		const when = extractWhen(rest, now);
		if (when) {
			dueAt = when.dueAt;
			rest = when.rest;
		} else if (kind === "reminder") {
			const tomorrow = new Date(now);
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(10, 0, 0, 0);
			dueAt = tomorrow.getTime();
			assumedWhen = true;
		}
	}
	let amountPaise;
	let receiptBillNo;
	if (kind === "bill" || kind === "receipt") {
		const billToken = kind === "receipt" ? pullBillNo(rest) : {
			billNo: void 0,
			rest
		};
		const amount = pullAmount(billToken.rest);
		if (!amount) return invalid(kind === "bill" ? "Add an amount, e.g. bill 45000 GST audit" : "Add an amount, e.g. received 20000");
		if (amount.paise > MAX_PAISE) return invalid("That amount looks too large");
		amountPaise = amount.paise;
		rest = amount.rest;
		receiptBillNo = billToken.billNo;
	}
	const linked = receiptBillNo ? findBillByNo(ctx.entries, receiptBillNo) : void 0;
	const mention = mentionOf(rest, ctx.clients);
	const chosen = ctx.chosenClientId ? ctx.clients.find((client) => client.id === ctx.chosenClientId) : void 0;
	const stick = Boolean(ctx.stickToActive && ctx.activeClientId);
	let clientId = null;
	let ambiguous = null;
	let usedMention = false;
	if (chosen) clientId = chosen.id;
	else if (linked?.clientId) clientId = linked.clientId;
	else if (stick) clientId = ctx.activeClientId;
	else if (mention.type === "one") {
		clientId = mention.id;
		usedMention = true;
	} else if (mention.type === "many") ambiguous = mention.ids;
	else if (ctx.activeClientId) clientId = ctx.activeClientId;
	else if ((kind === "bill" || kind === "receipt") && ctx.clients.length === 1) clientId = ctx.clients[0].id;
	rest = cleanBody(rest);
	const needsClient = kind === "bill" || kind === "receipt";
	if (needsClient && ambiguous) return invalid("Which client?", ctx.clients.filter((client) => ambiguous?.includes(client.id)));
	if (needsClient && !clientId) {
		if (ctx.clients.length === 0) return invalid("Add a client first — try new client Apex Forge");
		return invalid(kind === "bill" ? "Which client is this bill for?" : "Which client paid this fee?", ctx.clients);
	}
	const routedAway = Boolean(usedMention && ctx.activeClientId && clientId && clientId !== ctx.activeClientId && !linked && !chosen && !stick);
	const name = clientName(ctx.clients, clientId);
	let body = rest;
	if (!body) {
		if (kind === "bill") body = "Professional fees";
		else if (kind === "receipt") body = "Fee received";
		else if (kind === "reminder") return invalid("Add what to remember");
		else if (kind === "todo") return invalid("Add the to-do");
		else return invalid("Write a note");
	}
	const where = name ?? "the desk";
	let preview = "";
	if (kind === "note") preview = name ? `Note · ${name}` : "Note on the desk";
	if (kind === "bill") preview = `Bill · ${formatINR(amountPaise ?? 0)} · ${name}`;
	if (kind === "receipt") {
		const against = linked?.billNo ?? (receiptBillNo ? `${receiptBillNo} not found` : "on account");
		preview = `Fee in · ${formatINR(amountPaise ?? 0)} · ${name} · ${against}`;
	}
	if (kind === "todo") preview = dueAt ? `To-do · ${formatWhen(dueAt, now)} · ${where}` : `To-do · ${where}`;
	if (kind === "reminder") preview = `Reminder · ${formatWhen(dueAt ?? now.getTime(), now)}${assumedWhen ? " · assumed" : ""} · ${where}`;
	const entry = {
		clientId,
		kind,
		body,
		done: false,
		amountPaise,
		dueAt,
		billId: linked?.id
	};
	return {
		tone: "ok",
		preview,
		canSend: true,
		choices: [],
		routedAway,
		action: {
			type: "entry",
			entry
		}
	};
}
var CHIPS = [
	{
		id: "bill",
		label: "Bill",
		insert: "bill "
	},
	{
		id: "receipt",
		label: "Fee in",
		insert: "received "
	},
	{
		id: "todo",
		label: "To-do",
		insert: "todo "
	},
	{
		id: "reminder",
		label: "Remind",
		insert: "remind "
	},
	{
		id: "new-client",
		label: "Client",
		insert: "new client "
	}
];
function Composer({ clientId, draft, setDraft, forceNote, setForceNote, stick, setStick, showHints, onNavigate }) {
	const clients = useDaftar((state) => state.clients);
	const entries = useDaftar((state) => state.entries);
	const addEntry = useDaftar((state) => state.addEntry);
	const addClient = useDaftar((state) => state.addClient);
	const box = (0, import_react.useRef)(null);
	const active = clients.find((client) => client.id === clientId);
	const result = interpret(draft, {
		clients,
		entries,
		activeClientId: clientId,
		forceNote,
		stickToActive: stick
	});
	const command = forceNote ? null : leadingCommand(draft);
	(0, import_react.useEffect)(() => {
		const el = box.current;
		if (!el) return;
		el.style.height = "0px";
		el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
	}, [draft]);
	function apply(action) {
		if (action.type === "create-client") onNavigate(addClient(action.name, action.matter));
		else if (action.type === "open-client") onNavigate(action.clientId);
		else if (action.type === "entry") {
			addEntry(action.entry);
			if (action.entry.clientId && action.entry.clientId !== clientId) onNavigate(action.entry.clientId);
		}
		setDraft("");
		setForceNote(false);
		setStick(false);
	}
	function send(chosenId) {
		const next = interpret(draft, {
			clients,
			entries,
			activeClientId: clientId,
			forceNote,
			stickToActive: stick,
			chosenClientId: chosenId
		});
		if (!next.canSend) return;
		apply(next.action);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pb-safe shrink-0 border-t border-line bg-paper px-3 pt-2",
		children: [
			showHints && !draft.trim() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-2 flex flex-col gap-2",
				children: [
					"bill 25000 ITR filing",
					"todo Collect bank statements",
					"remind tomorrow Call for documents"
				].map((hint) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						setDraft(hint);
						setForceNote(false);
						box.current?.focus();
					},
					className: "h-11 truncate rounded-full border border-line px-4 text-left text-sm text-ink-soft",
					children: hint
				}, hint))
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-2 flex flex-wrap gap-2",
				children: CHIPS.map((chip) => {
					const on = command === chip.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-pressed": on,
						onClick: () => {
							setDraft(applyChip(draft, chip.insert));
							setForceNote(false);
							setStick(false);
							box.current?.focus();
						},
						className: cn("h-11 rounded-full px-4 text-sm", on ? "bg-accent text-accent-fg" : "border border-line text-ink"),
						children: chip.label
					}, chip.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				"aria-live": "polite",
				className: cn("mb-2 text-sm text-pretty", result.tone === "warn" && "text-warn", result.tone === "muted" && "text-muted", result.tone === "ok" && "text-ink-soft"),
				children: result.preview
			}),
			result.choices.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-2 flex gap-2 overflow-x-auto",
				children: result.choices.map((client) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => send(client.id),
					className: "h-11 shrink-0 rounded-full border border-line px-4 text-sm",
					children: client.name
				}, client.id))
			}) : null,
			command && !forceNote || result.routedAway && active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-2 flex flex-wrap gap-2",
				children: [command && !forceNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setForceNote(true),
					className: "h-11 px-1 text-sm text-ink-soft",
					children: "Save as note"
				}) : null, result.routedAway && active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setStick(true),
					className: "h-11 px-1 text-sm text-ink-soft",
					children: ["Keep in ", active.name]
				}) : null]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-end gap-2 pb-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "sr-only",
						htmlFor: "composer",
						children: "Log a bill, fee, to-do, or reminder"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						id: "composer",
						ref: box,
						rows: 1,
						value: draft,
						placeholder: "bill 45000 GST audit",
						enterKeyHint: "send",
						className: "max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-line bg-sheet px-4 py-3 text-base text-ink placeholder:text-muted",
						onChange: (event) => {
							const next = event.target.value;
							setDraft(next);
							if (!next.trim()) {
								setForceNote(false);
								setStick(false);
							}
						},
						onKeyDown: (event) => {
							if (event.key === "Enter" && !event.shiftKey) {
								event.preventDefault();
								send();
							}
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Log entry",
						disabled: !result.canSend,
						onClick: () => send(),
						className: "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-accent-fg disabled:opacity-40",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-5" })
					})
				]
			})
		]
	});
}
function Thread({ clientId, focusId, onBack, onOpenClient, onOpenEntry, onOpenBills, onRename, onRemove, onSettings }) {
	const clients = useDaftar((state) => state.clients);
	const entries = useDaftar((state) => state.entries);
	const practiceName = useDaftar((state) => state.practiceName);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [forceNote, setForceNote] = (0, import_react.useState)(false);
	const [stick, setStick] = (0, import_react.useState)(false);
	const [menu, setMenu] = (0, import_react.useState)(false);
	const scroller = (0, import_react.useRef)(null);
	const bottomRef = (0, import_react.useRef)(null);
	const client = clients.find((item) => item.id === clientId) ?? null;
	const visible = entries.filter((entry) => clientId === null ? true : entry.clientId === clientId).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
	const summary = clientId ? summarizeClient(entries, clientId) : null;
	const totals = practiceTotals(clients, entries);
	const now = /* @__PURE__ */ new Date();
	const bills = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const item of clients) for (const bill of summarizeClient(entries, item.id).bills) map.set(bill.entry.id, bill);
		return map;
	}, [clients, entries]);
	(0, import_react.useEffect)(() => {
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
	}, [
		clientId,
		visible.length,
		focusId
	]);
	const groups = [];
	for (const entry of visible) {
		const key = dayKey(entry.createdAt);
		const last = groups[groups.length - 1];
		if (!last || last.key !== key) groups.push({
			key,
			label: dayLabel(entry.createdAt, now),
			entries: [entry]
		});
		else last.entries.push(entry);
	}
	const openReminders = entries.filter((entry) => entry.kind === "reminder" && !entry.done && entry.dueAt).sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));
	const openTodos = entries.filter((entry) => entry.kind === "todo" && !entry.done).sort((a, b) => (a.dueAt ?? Number.MAX_SAFE_INTEGER) - (b.dueAt ?? Number.MAX_SAFE_INTEGER));
	const owing = totals.owing.sort((a, b) => b.summary.outstanding - a.summary.outstanding);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full min-h-0 w-full min-w-0 flex-col bg-paper",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "pt-safe relative shrink-0 border-b border-line px-2 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Back to chats",
							onClick: onBack,
							className: "grid h-11 w-11 place-items-center rounded-full text-ink md:hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1 px-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "truncate font-display text-xl",
								children: client ? client.name : "Desk"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm text-muted",
								children: client ? client.matter || "Client chat" : practiceName
							})]
						}),
						client ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Client actions",
							"aria-expanded": menu,
							onClick: () => setMenu((open) => !open),
							className: "grid h-11 w-11 place-items-center rounded-full text-ink",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "size-5" })
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onSettings,
							className: "h-11 px-3 text-sm font-medium",
							children: "Practice"
						})
					]
				}), menu && client ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Close menu",
					className: "fixed inset-0 z-20",
					onClick: () => setMenu(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute top-14 right-3 z-30 w-44 rounded-xl border border-line bg-sheet p-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-11 w-full rounded-lg px-3 text-left text-sm",
						onClick: () => {
							setMenu(false);
							onRename();
						},
						children: "Rename"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-11 w-full rounded-lg px-3 text-left text-sm text-danger",
						onClick: () => {
							setMenu(false);
							onRemove();
						},
						children: "Remove client"
					})]
				})] }) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				ref: scroller,
				className: "min-h-0 flex-1 overflow-y-auto px-4 py-4",
				children: [
					clientId === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "sticky top-0 z-10 mb-4 bg-paper pb-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-w-xl rounded-3xl border border-line bg-sheet p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-end justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "Fees still to come in"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-3xl tabular-nums lining-nums",
									children: totals.outstanding > 0 ? formatINR(totals.outstanding) : "Settled"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-right text-sm text-muted",
									children: [
										openReminders.length,
										" open reminder",
										openReminders.length === 1 ? "" : "s",
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "block",
											children: [
												openTodos.length,
												" open to-do",
												openTodos.length === 1 ? "" : "s"
											]
										})
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2",
								children: [owing.slice(0, 4).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => onOpenClient(row.client.id),
									className: "flex h-11 w-full items-center justify-between gap-3 text-left",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate",
										children: row.client.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 text-danger tabular-nums lining-nums",
										children: formatINR(row.summary.outstanding)
									})]
								}, row.client.id)), owing.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "py-2 text-sm text-ink-soft",
									children: "Nothing outstanding."
								}) : null]
							})]
						})
					}) : summary && (summary.billed > 0 || summary.received > 0) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "sticky top-0 z-10 mb-4 bg-paper pb-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-end justify-between gap-3 border-b border-line pb-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: summary.outstanding > 0 ? "Due" : summary.credit > 0 ? "Credit" : "Fees"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-2xl tabular-nums lining-nums",
								children: summary.outstanding > 0 ? formatINR(summary.outstanding) : summary.credit > 0 ? formatINR(summary.credit) : "Settled"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-right",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted tabular-nums lining-nums",
										children: ["Billed ", formatINR(summary.billed)]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted tabular-nums lining-nums",
										children: ["Received ", formatINR(summary.received)]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => onOpenBills(clientId),
										className: "mt-1 h-11 text-sm font-medium",
										children: "All bills"
									})
								]
							})]
						})
					}) : null,
					visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-6 text-sm text-muted",
						children: "Nothing logged for this client yet."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-col gap-4",
						children: groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "self-center rounded-full bg-paper-2 px-3 py-1 text-xs text-muted",
								children: group.label
							}), group.entries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EntryBubble, {
								entry,
								desk: clientId === null,
								clientName: entry.clientId ? clients.find((item) => item.id === entry.clientId)?.name ?? "Client" : "Desk",
								bill: entry.kind === "bill" ? bills.get(entry.id) : void 0,
								linkedNo: entry.billId ? entries.find((item) => item.id === entry.billId)?.billNo : void 0,
								focused: focusId === entry.id,
								now
							}, entry.id))]
						}, group.key))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: bottomRef })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Composer, {
				clientId,
				draft,
				setDraft,
				forceNote,
				setForceNote,
				stick,
				setStick,
				showHints: visible.length === 0 && clientId !== null,
				onNavigate: onOpenClient
			})
		]
	});
}
function EntryBubble({ entry, desk, clientName, bill, linkedNo, focused, now }) {
	const deleteEntry = useDaftar((state) => state.deleteEntry);
	const toggleDone = useDaftar((state) => state.toggleDone);
	const addEntry = useDaftar((state) => state.addEntry);
	const [more, setMore] = (0, import_react.useState)(false);
	const [armed, setArmed] = (0, import_react.useState)(false);
	const [recording, setRecording] = (0, import_react.useState)(false);
	const [amount, setAmount] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
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
			done: false
		});
		setRecording(false);
		setAmount("");
		setError("");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		id: `entry-${entry.id}`,
		className: cn("flex max-w-md flex-col gap-1 self-end", focused && "w-full"),
		children: [
			desk && entry.clientId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "self-end text-xs text-muted",
				children: clientName
			}) : null,
			entry.kind === "note" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl rounded-br-md bg-accent px-4 py-3 text-accent-fg",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-pretty whitespace-pre-wrap break-words",
					children: entry.body
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full rounded-3xl border border-line bg-sheet p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								entry.kind === "bill" && `Bill${entry.billNo ? ` · ${entry.billNo}` : ""}`,
								entry.kind === "receipt" && "Fee in",
								entry.kind === "todo" && "To-do",
								entry.kind === "reminder" && "Reminder"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "More actions",
							"aria-expanded": more,
							onClick: () => {
								setMore((open) => !open);
								setArmed(false);
							},
							className: "grid h-11 w-11 place-items-center rounded-lg text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "size-5" })
						})]
					}),
					entry.kind === "todo" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-pressed": Boolean(entry.done),
							"aria-label": entry.done ? "Mark not done" : "Mark done",
							onClick: () => toggleDone(entry.id),
							className: "grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line",
							children: entry.done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-5" }) : null
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: cn("pt-2 text-pretty break-words", entry.done && "text-muted line-through"),
							children: entry.body
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("text-pretty break-words", entry.done && "text-muted line-through"),
						children: entry.body
					}),
					entry.kind === "bill" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-2xl tabular-nums lining-nums",
								children: formatINR(entry.amountPaise ?? 0)
							}),
							bill && bill.received > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted tabular-nums lining-nums",
								children: ["Received ", formatINR(bill.received)]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: cn("text-sm tabular-nums lining-nums", bill && bill.due > 0 ? "text-danger" : "text-ok"),
								children: bill && bill.due > 0 ? `Due ${formatINR(bill.due)}` : "Paid"
							}),
							bill && bill.due > 0 && !recording ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => {
									setRecording(true);
									setAmount(paiseToInput(bill.due));
									setError("");
								},
								className: "mt-3 h-11 rounded-lg border border-line px-4 text-sm font-medium",
								children: "Record fee"
							}) : null,
							recording ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "mt-3 space-y-2",
								onSubmit: (event) => {
									event.preventDefault();
									saveFee();
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										"aria-label": "Amount received",
										inputMode: "decimal",
										value: amount,
										onChange: (event) => setAmount(event.target.value),
										className: fieldClass
									}),
									error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm text-danger",
										children: error
									}) : null,
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "submit",
											className: "h-11 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg",
											children: "Save fee"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setRecording(false),
											className: "h-11 px-3 text-sm text-muted",
											children: "Cancel"
										})]
									})
								]
							}) : null
						]
					}) : null,
					entry.kind === "receipt" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl tabular-nums lining-nums",
							children: formatINR(entry.amountPaise ?? 0)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: linkedNo ? `Against ${linkedNo}` : entry.billId ? "Against a removed bill" : "On account"
						})]
					}) : null,
					entry.kind === "reminder" && entry.dueAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("mt-2 text-sm", overdue ? "text-danger" : "text-ink-soft"),
						children: formatWhen(entry.dueAt, now)
					}) : null,
					entry.kind === "todo" && entry.dueAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: formatWhen(entry.dueAt, now)
					}) : null,
					(entry.kind === "reminder" || entry.kind === "todo") && entry.kind === "reminder" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => toggleDone(entry.id),
						className: "mt-3 h-11 text-sm font-medium",
						children: entry.done ? "Mark open" : "Mark done"
					}) : null,
					more ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							if (!armed) {
								setArmed(true);
								return;
							}
							deleteEntry(entry.id);
						},
						className: "mt-2 h-11 text-sm text-danger",
						children: armed ? "Confirm delete" : "Delete"
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted",
					children: formatClock(entry.createdAt)
				}), entry.kind === "note" ? more ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						if (!armed) {
							setArmed(true);
							return;
						}
						deleteEntry(entry.id);
					},
					className: "h-11 text-sm text-danger",
					children: armed ? "Confirm delete" : "Delete"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "More actions",
					onClick: () => setMore(true),
					className: "grid h-11 w-11 place-items-center text-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "size-5" })
				}) : null]
			})
		]
	});
}
function DaftarApp() {
	const [booted, setBooted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let live = true;
		(async () => {
			try {
				await useDaftar.persist.rehydrate();
			} catch {}
			if (!live) return;
			useDaftar.getState().finishBoot();
			setBooted(true);
		})();
		return () => {
			live = false;
		};
	}, []);
	if (!booted) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex h-dvh items-center justify-center bg-paper px-6 text-ink",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-3xl",
			children: "Daftar"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: "Opening your practice"
		})] })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, {});
}
function Shell() {
	const clients = useDaftar((state) => state.clients);
	const clearSample = useDaftar((state) => state.clearSample);
	const removeClient = useDaftar((state) => state.removeClient);
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	const [mobilePane, setMobilePane] = (0, import_react.useState)("list");
	const [mainView, setMainView] = (0, import_react.useState)("thread");
	const [focusId, setFocusId] = (0, import_react.useState)(null);
	const [billsClient, setBillsClient] = (0, import_react.useState)(null);
	const [dialog, setDialog] = (0, import_react.useState)(null);
	function openClient(id) {
		setSelectedId(id);
		setFocusId(null);
		setMainView("thread");
		setMobilePane("main");
	}
	const listVisible = mobilePane === "list" && mainView === "thread";
	const client = clients.find((item) => item.id === (dialog?.kind === "rename" || dialog?.kind === "remove" ? dialog.id : ""));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		"data-ready": "true",
		className: "h-dvh overflow-hidden bg-paper text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-full min-h-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
					className: cn("h-full min-h-0 w-full md:w-96 md:shrink-0 md:border-r md:border-line", listVisible ? "flex" : "hidden md:flex"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-full min-h-0 w-full flex-col",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Inbox, {
							selectedId,
							mainView,
							onSelect: (id) => {
								setSelectedId(id);
								setFocusId(null);
								setMainView("thread");
								setMobilePane("main");
							},
							onView: (view) => {
								setMainView(view);
								if (view === "thread") setMobilePane("list");
								else setMobilePane("main");
							},
							onAdd: () => setDialog({ kind: "create" }),
							onSettings: () => setDialog({ kind: "settings" }),
							onClearSample: () => {
								clearSample();
								setSelectedId(null);
								setMobilePane("list");
								setMainView("thread");
							}
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: cn("h-full min-h-0 min-w-0 flex-1", listVisible ? "hidden md:flex" : "flex"),
					children: mainView === "bills" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bills, {
						focusClientId: billsClient,
						mainView,
						onView: (view) => {
							setMainView(view);
							if (view === "thread") setMobilePane("list");
						},
						onOpenClient: openClient
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thread, {
						clientId: selectedId,
						focusId,
						onBack: () => setMobilePane("list"),
						onOpenClient: openClient,
						onOpenEntry: (entry) => {
							setSelectedId(entry.clientId);
							setFocusId(entry.id);
							setMainView("thread");
							setMobilePane("main");
						},
						onOpenBills: (id) => {
							setBillsClient(id);
							setMainView("bills");
							setMobilePane("main");
						},
						onRename: () => {
							if (selectedId) setDialog({
								kind: "rename",
								id: selectedId
							});
						},
						onRemove: () => {
							if (selectedId) setDialog({
								kind: "remove",
								id: selectedId
							});
						},
						onSettings: () => setDialog({ kind: "settings" })
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: dialog?.kind === "create",
				title: "New client",
				onClose: () => setDialog(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientForm, {
					submitLabel: "Add client",
					onSave: (name, matter) => {
						const id = useDaftar.getState().addClient(name, matter);
						setDialog(null);
						openClient(id);
					}
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: dialog?.kind === "rename",
				title: "Rename client",
				onClose: () => setDialog(null),
				children: dialog?.kind === "rename" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientForm, {
					submitLabel: "Save",
					initial: {
						name: client?.name ?? "",
						matter: client?.matter ?? ""
					},
					onSave: (name, matter) => {
						useDaftar.getState().updateClient(dialog.id, {
							name,
							matter
						});
						setDialog(null);
					}
				}, dialog.id) : null
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
				open: dialog?.kind === "remove",
				title: "Remove client",
				onClose: () => setDialog(null),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-pretty text-ink-soft",
					children: [
						"Remove ",
						client?.name ?? "this client",
						"? Their bills, fees, notes, to-dos, and reminders will leave this device."
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: quietClass,
						onClick: () => setDialog(null),
						autoFocus: true,
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-11 rounded-lg border border-line px-4 text-sm font-medium text-danger",
						onClick: () => {
							if (dialog?.kind === "remove") {
								removeClient(dialog.id);
								if (selectedId === dialog.id) setSelectedId(null);
							}
							setDialog(null);
							setMobilePane("list");
						},
						children: "Remove"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sheet, {
				open: dialog?.kind === "settings",
				title: "Practice",
				onClose: () => setDialog(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsForm, {
					onDone: () => setDialog(null),
					onClear: () => {
						clearSample();
						setSelectedId(null);
						setMobilePane("list");
						setMainView("thread");
						setDialog(null);
					}
				})
			})
		]
	});
}
function ClientForm({ initial, submitLabel, onSave }) {
	const [name, setName] = (0, import_react.useState)(initial?.name ?? "");
	const [matter, setMatter] = (0, import_react.useState)(initial?.matter ?? "");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		onSubmit: (event) => {
			event.preventDefault();
			if (name.trim().length < 2) return;
			onSave(name.trim(), matter.trim());
		},
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "block text-sm text-muted",
				htmlFor: "client-name",
				children: "Client name"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id: "client-name",
				value: name,
				onChange: (event) => setName(event.target.value),
				className: fieldClass,
				autoFocus: true,
				required: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "block text-sm text-muted",
				htmlFor: "client-matter",
				children: "Matter"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id: "client-matter",
				value: matter,
				onChange: (event) => setMatter(event.target.value),
				placeholder: "Statutory audit, GST, ITR",
				className: fieldClass
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "submit",
				className: cn(primaryClass, "w-full"),
				disabled: name.trim().length < 2,
				children: submitLabel
			})
		]
	});
}
function SettingsForm({ onDone, onClear }) {
	const practiceName = useDaftar((state) => state.practiceName);
	const sample = useDaftar((state) => state.sample);
	const setPracticeName = useDaftar((state) => state.setPracticeName);
	const [name, setName] = (0, import_react.useState)(practiceName);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "space-y-4",
		onSubmit: (event) => {
			event.preventDefault();
			setPracticeName(name);
			onDone();
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				className: "block text-sm text-muted",
				htmlFor: "practice-name",
				children: "Practice name"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id: "practice-name",
				value: name,
				onChange: (event) => setName(event.target.value),
				className: fieldClass,
				autoFocus: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "From any chat"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-2 space-y-1 font-mono text-sm text-ink-soft",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "bill 150000 GST audit" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "received 50000" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "todo Collect bank statements" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "remind tomorrow Call for invoices" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "new client Apex Forge" })
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-pretty text-muted",
				children: "Add Daftar to your phone home screen and it opens like an app. What you log stays on this device."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "submit",
				className: cn(primaryClass, "w-full"),
				children: "Save"
			}),
			sample ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onClear,
				className: "h-11 w-full text-sm text-danger",
				children: "Clear sample clients"
			}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DaftarApp, {});
}
//#endregion
export { Home as component };
