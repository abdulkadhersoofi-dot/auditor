// Offline smoke test for the Android web bundle. Usage: node android-web/test/offline.mjs <url>
import { chromium } from "playwright";
const url = process.argv[2] ?? "http://127.0.0.1:4173/";
const shots = "screenshots/android";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 } });
const page = await ctx.newPage();
const blocked = [];
await page.route("**/*", (route) => {
  const u = new URL(route.request().url());
  if (u.hostname === "127.0.0.1" || u.hostname === "localhost") return route.continue();
  blocked.push(route.request().url());
  return route.abort();
});
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(url);
await page.waitForSelector('[data-ready="true"]');
await page.screenshot({ path: `${shots}/1-seed.png` });
const seedText = await page.innerText("body");
console.log("seed data visible:", /Mehta/.test(seedText));
const styled = await page.evaluate(() => {
  const h = document.querySelector("main");
  const cs = getComputedStyle(h);
  return { bg: cs.backgroundColor, h: Math.round(h.getBoundingClientRect().height), vh: innerHeight, display: getComputedStyle(document.querySelector(".font-display")).fontFamily };
});
console.log("styling:", JSON.stringify(styled));
if (styled.bg !== "rgb(246, 243, 236)" || styled.h !== styled.vh || !styled.display.includes("Fraunces")) { console.log("FAIL: unstyled"); process.exit(1); }

await page.getByLabel("Add client").click();
await page.fill("#client-name", "Offline Test Client");
await page.fill("#client-matter", "Tax audit");
await page.getByRole("button", { name: /add|save|create/i }).last().click();
if (!(await page.locator("#composer").isVisible())) await page.getByText("Offline Test Client").first().click();
await page.fill("#composer", "bill 45000 GST audit");
await page.getByLabel("Log entry").click();
await page.fill("#composer", "call about the notice");
await page.getByLabel("Log entry").click();
await page.screenshot({ path: `${shots}/2-after-add.png` });

await page.reload();
await page.waitForSelector('[data-ready="true"]');
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("daftar-v1") ?? "null"));
const client = stored?.state?.clients?.find((c) => c.name === "Offline Test Client");
const mine = stored?.state?.entries?.filter((e) => e.clientId === client?.id) ?? [];
console.log("client persisted:", !!client, "| entries for it:", mine.length, mine.map((e) => e.kind));
await page.screenshot({ path: `${shots}/3-after-reload.png` });
const fontOk = await page.evaluate(async () => {
  await document.fonts.ready;
  return ["Source Sans 3", "Fraunces Variable"].map((f) => [f, document.fonts.check(`16px "${f}"`)]);
});
console.log("fonts loaded:", JSON.stringify(fontOk));
console.log("blocked external requests:", blocked.length, blocked);
console.log("page errors:", errors);
await browser.close();
const pass = !!client && mine.length >= 2 && blocked.length === 0 && errors.length === 0;
console.log(pass ? "PASS" : "FAIL");
process.exit(pass ? 0 : 1);
