import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";

// Investigation-only Round 4K browser acceptance. Playwright is CI-only and
// deliberately not in package.json/package-lock.json.
const dir = "browser-evidence";
await fs.mkdir(dir, { recursive: true });
const evidence = {
  sha: process.env.GITHUB_SHA ?? "unknown",
  browser: "",
  checkpoints: [],
  pageErrors: [],
  consoleErrors: [],
  errors: [],
};
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
evidence.browser = "Chromium " + browser.version();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "no-preference",
});
page.setDefaultTimeout(45000);
page.on("pageerror", error => evidence.pageErrors.push(error.message));
page.on("console", msg => {
  if (msg.type() === "error") evidence.consoleErrors.push(msg.text());
});

const nap = ms => page.waitForTimeout(ms);
const time = async () => parseFloat(
  await page.locator(".simple-time-rail > strong").textContent()
);
const shot = async name =>
  page.screenshot({ path: dir + "/" + name + ".png", fullPage: false });

async function observe(label) {
  const a = (await page.locator(".actor-state-counts .actor-count strong")
    .allTextContents()).map(Number);
  const q = (await page.locator(".qpu-state-grid > div > strong")
    .allTextContents()).map(Number);
  const observation = { label, time: await time(), actors: a, qpu: q };
  assert.equal(a.length, 3, "actor view missing: " + label);
  assert.equal(q.length, 3, "QPU view missing: " + label);
  assert.equal(a.reduce((x, y) => x + y, 0), 1000, "actor conservation: " + label);
  evidence.checkpoints.push(observation);
  console.log("BROWSER_CHECKPOINT", JSON.stringify(observation));
  return observation;
}
function verify(actual, actors, qpu) {
  assert.deepEqual(actual.actors, actors, actual.label + " actor W/B/I");
  if (qpu) assert.deepEqual(actual.qpu, qpu, actual.label + " QPU running/queued/held");
}
async function runPreset(key) {
  await page.locator(".primary-nav").getByRole("button", { name: "Builder" }).click();
  await page.locator("#preset-select").selectOption(key);
  const start = Date.now();
  const button = page.getByRole("button", { name: "Simulate", exact: true });
  assert.equal(await button.isDisabled(), false, key + " unexpectedly invalid");
  await button.click();
  await page.locator('section[aria-label="Simulation playback"]').waitFor();
  console.log("BROWSER_SIM_MS", key, Date.now() - start);
}
async function seek(target) {
  const slider = page.getByRole("slider", { name: "Simulation time" });
  const step = Number(await slider.getAttribute("step"));
  await slider.evaluate((input, seconds) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(input, String(seconds));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, target);
  await nap(120);
  assert.ok(Math.abs((await time()) - target) <= step + 0.025,
    "slider could not seek " + target + ", actual " + (await time()));
}
async function stepTo(target, max = 280) {
  for (let i = 0; i < max; i++) {
    const now = await time();
    if (now >= target - 0.001) return now;
    const next = page.getByRole("button", { name: "Next", exact: true });
    assert.equal(await next.isDisabled(), false, "Next disabled at " + now);
    await next.click();
    await nap(12);
  }
  throw new Error("keyframe stepping did not reach " + target);
}
async function advance(target, max) {
  const found = await stepTo(target, max);
  assert.ok(Math.abs(found - target) < 0.01,
    "keyframe skipped critical boundary " + target + ", got " + found);
}
async function advanced() {
  await page.locator("details.explore-advanced > summary").click();
  await nap(120);
}

try {
  await page.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Pre-execution workflow planning" }).waitFor();

  await runPreset("scenario-a");
  await seek(0.5); verify(await observe("A@0.5"), [1000, 0, 0], [0, 0, 0]);
  await seek(1.5); verify(await observe("A@1.5"), [999, 1, 0], [1, 0, 0]);
  await seek(4); verify(await observe("A@4"), [1000, 0, 0], [0, 0, 0]);
  await shot("A-overlap");
  const play = page.getByRole("button", { name: "Play", exact: true });
  assert.equal(await play.isDisabled(), false, "Play unexpectedly disabled");
  await play.click();
  await page.getByRole("button", { name: "Pause", exact: true }).waitFor();
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  evidence.checkpoints.push({ label: "A-play-pause", result: "passed" });

  await runPreset("scenario-b");
  await seek(1); verify(await observe("B@1"), [0, 200, 800], [1, 0, 199]);
  await seek(2); verify(await observe("B@2"), [0, 1000, 0], [1, 0, 198]);
  const prepText = await page.locator(".simple-explorer .react-flow__node")
    .filter({ hasText: "Submitting-rank preparation" }).first().textContent();
  evidence.checkpoints.push({ label: "B-preparation-visual-status", text: prepText });
  console.log("BROWSER_LOGICAL_NODE", prepText);

  await shot("B-global-wall");
  const startAdvanced = Date.now();
  await advanced();
  await page.locator("details.explore-advanced[open] .react-flow")
    .first().waitFor({ timeout: 45000 });
  await nap(700);
  const nodes = await page.locator("details.explore-advanced[open] .react-flow__node").count();
  evidence.checkpoints.push({
    label: "B401-advanced",
    openMs: Date.now() - startAdvanced,
    renderedNodes: nodes,
  });
  assert.ok(nodes > 0, "B Advanced expanded graph not rendered");
  await shot("B-advanced-open");
  await advanced();
  await advance(201, 280);
  verify(await observe("B@201"), [1000, 0, 0]);

  await runPreset("scenario-c");
  await seek(4.5); verify(await observe("C@4.5"), [0, 1000, 0], [0, 0, 0]);
  await shot("C-transfer-wall");
  await seek(8.5); verify(await observe("C@8.5"), [200, 800, 0], [0, 0, 0]);
  await shot("C-independent-return");

  await runPreset("scenario-d");
  await advance(1, 15);
  verify(await observe("D@1"), [0, 50, 950], [1, 49, 950]);
  await shot("D-admission");
  await advance(2, 15);
  verify(await observe("D@2"), [1, 50, 949], [1, 49, 949]);
  await shot("D-local-continuation");
  await advanced();
  await page.getByText("Expanded task-level views omitted").waitFor();
  assert.equal(await page.locator("details.explore-advanced[open] .react-flow").count(),
    0, "D3000 expanded graph must not be mounted");
  evidence.checkpoints.push({ label: "D3000-advanced-guard", result: "omitted" });
  await shot("D-advanced-guard");
  await advanced();
  await advance(1001.5, 150);
  verify(await observe("D@1001.5"), [0, 0, 1000], [0, 0, 0]);
  await shot("D-terminal");

  await page.locator(".primary-nav").getByRole("button", { name: "Builder" }).click();
  await page.locator(".react-flow__node")
    .filter({ hasText: "Rate-limited quantum request" }).first().click();
  await page.locator(".inspector-surface")
    .getByLabel("Modeled wall time / instance (s)").fill("0.5");
  await page.getByRole("button", { name: "Simulate", exact: true }).click();
  await page.locator('section[aria-label="Simulation playback"]').waitFor();
  const endLabel = await page.locator(".simple-time-rail > span").textContent();
  assert.ok(endLabel.includes("501.50"), "edited D makespan wrong: " + endLabel);
  await page.locator(".primary-nav").getByRole("button", { name: "Compare" }).click();
  await page.getByRole("heading", { name: "Metric comparison" }).waitFor();
  const row = page.locator(".compare-row")
    .filter({ has: page.getByText("Makespan", { exact: true }) });
  const cells = await row.locator('[role="cell"]').allTextContents();
  assert.ok(cells.includes("16.69 min") && cells.includes("8.36 min"),
    "Compare makespan wrong: " + JSON.stringify(cells));
  evidence.checkpoints.push({ label: "D-edit-rerun-compare", cells });
  await shot("D-compare");

  await page.locator(".primary-nav").getByRole("button", { name: "Builder" }).click();
  await page.locator(".inspector-surface").getByLabel("Multiplicity").fill("0");
  await nap(100);
  assert.equal(await page.getByRole("button", { name: "Simulate", exact: true })
    .isDisabled(), true, "invalid multiplicity did not block simulation");
  await page.getByRole("heading", { name: "Validation" }).waitFor();
  evidence.checkpoints.push({ label: "invalid-input", result: "blocked" });
  await shot("invalid-input");

  // A directed cycle must be rejected without silent graph repair.
  await page.locator("#preset-select").selectOption("scenario-d");
  const add = page.locator(".dependency-add-row");
  await add.getByLabel("Source").selectOption("consumer");
  await add.getByLabel("Target").selectOption("prepare");
  await add.getByRole("button", { name: "Add edge" }).click();
  await nap(120);
  const validationText = await page.locator(".validation-surface").textContent();
  assert.equal(await page.getByRole("button", { name: "Simulate", exact: true })
    .isDisabled(), true, "cycle did not block simulation");
  assert.match(validationText, /cycle|acyclic|DAG/i, "cycle not explained");
  evidence.checkpoints.push({ label: "invalid-DAG-cycle", validationText });
  await shot("invalid-dag-cycle");

  // Actual browser reduced-motion media preference, not inferred from source code.
  const reduced = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  try {
    await reduced.goto("http://127.0.0.1:5173", { waitUntil: "networkidle" });
    await reduced.locator("#preset-select").selectOption("scenario-a");
    await reduced.getByRole("button", { name: "Simulate", exact: true }).click();
    await reduced.locator('section[aria-label="Simulation playback"]').waitFor();
    assert.equal(await reduced.getByRole("button", { name: "Play", exact: true })
      .isDisabled(), true, "reduced-motion should disable auto animation");
    assert.equal(await reduced.getByRole("button", { name: "Next", exact: true })
      .isDisabled(), false, "manual step must remain possible");
    evidence.checkpoints.push({ label: "prefers-reduced-motion", result: "Play disabled, Next available" });
  } finally {
    await reduced.close();
  }

  assert.deepEqual(evidence.pageErrors, [], "uncaught page errors");
} catch (error) {
  evidence.errors.push(error.stack ?? String(error));
  console.error("BROWSER_SMOKE_FAILURE", error.stack ?? String(error));
  try { await shot("failure"); } catch { /* preserve original failure */ }
  process.exitCode = 1;
} finally {
  await fs.writeFile(dir + "/browser-smoke.json",
    JSON.stringify(evidence, null, 2) + "\n");
  console.log("BROWSER_SUMMARY", JSON.stringify({
    sha: evidence.sha, browser: evidence.browser,
    checkpoints: evidence.checkpoints.length,
    pageErrors: evidence.pageErrors.length,
    errors: evidence.errors.length
  }));
  await browser.close();
}
