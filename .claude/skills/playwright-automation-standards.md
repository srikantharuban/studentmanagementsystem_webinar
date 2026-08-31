---
name: playwright-automation-standards
description: General-purpose Playwright test automation standards. Use whenever writing, reviewing, or refactoring Playwright tests, locators, assertions, page objects, or fixtures on ANY project — including when a test is flaky, when adding coverage for a new feature. Applies regardless of the application's domain (e-commerce, admin dashboards, SaaS tools, internal systems, etc.). Enforces locator priority, assertion strictness, wait strategy, stability rules, and framework structure so the suite stays maintainable at scale.
compatibility: "@playwright/test (TypeScript or JavaScript)"
---

# Playwright Automation Standards

These are house rules for a Playwright suite, meant to apply to any project regardless of domain. The goal isn't ceremony — it's a suite that doesn't rot: locators survive refactors, assertions catch real regressions instead of noise, and nobody adds a `waitForTimeout` at 11pm to make CI green.

Treat the concrete file paths, snippets, and starting points below as defaults — adapt them to the specific project's `playwright.config.ts`, entry point, and domain, but keep the underlying rules.

## Locator Strategy - Priority Order

Locators fail in one of two ways: they're too tied to markup (break on every CSS refactor) or too vague (match the wrong element). Prefer locators that describe *what the element means to a user*, not *where it sits in the DOM* — that's what survives a redesign.

Priority order, highest to lowest:

1. **`getByRole`** — mirrors how assistive tech and real users identify elements (button, link, heading, textbox). Most resilient to markup changes; use this by default for anything interactive.
2. **`getByLabel`** — for form fields. Ties the locator to the field's actual label text, which is also what a QA/product person would use to describe the field.
3. **`getByPlaceholder`** — only when there's no real label (rare; flag it as a UX gap if you're reaching for this).
4. **`getByText`** — for static content, headings, confirmation copy. Fine for assertions, weaker for interaction targets since text changes with copy edits.
5. **`getByTestId`** — use when the element has no meaningful role/label/text (e.g. an icon-only button, a repeated row in a table). Requires a `data-testid` on the component — add one rather than falling back to CSS.
6. **CSS / XPath selectors** — last resort only. If you're about to write `.locator('div > div:nth-child(3) > span')`, stop and either add a `data-testid` or ask why the element isn't addressable.

**Example:**

```ts
// Prefer
page.getByRole('button', { name: 'Submit' })

// Over
page.locator('.btn.btn-primary.submit-action')
```

## Assertion Standards - Always Assert Specifically

A passing test that didn't check anything meaningful is worse than no test — it gives false confidence.

* **Use web-first assertions** (`expect(locator).toBeVisible()`, `.toHaveText()`, `.toHaveValue()`, `.toHaveCount()`) instead of pulling a value out and asserting on it separately. Web-first assertions auto-retry until the condition holds or times out, which eliminates a huge class of flaky failures that manual assertions create.
* **Assert the exact expected value, not just presence.** `toBeVisible()` on its own answers "does something render here" — if the test cares about *what* renders, assert `toHaveText('Changes saved')`, not just that some text node exists.
* **Assert both the UI feedback and the underlying effect** on any mutation (create/update/delete/submit/any state-changing action). A toast saying "Saved" and the record actually persisting after reload are two different failure modes — check both when the feature has both.
* **One assertion intent per test.** A test named `creates a record` should fail for exactly one reason. If you need to check several independent things, either split the test or use `expect.soft()` so one failure doesn't hide the others.
* **Never assert on implementation details** — class names, DOM depth, internal state shape. Assert on what a user or the API contract would observe.

## Wait Strategy

Playwright auto-waits for actionability before every interaction and every web-first assertion retries until timeout — lean on that instead of fighting it.

* **Default to locator actions and web-first assertions.** `await expect(locator).toBeVisible()` before interacting is usually all the "waiting" you need.
* **`page.waitForTimeout()` is banned outside of prototyping.** A fixed sleep either wastes time (waiting longer than necessary) or is too short (flaky under load) — it never actually waits for the right condition. If you're reaching for it, there's a real wait condition you haven't identified yet; find it.
* **Network-dependent steps** — wait on the actual response (`page.waitForResponse(...)`) or on the resulting UI state, not on a timer guessing how long the request takes.
* **Custom/derived app state** (e.g. a computed value, a background job finishing) — use `expect.poll()` or `page.waitForFunction()` rather than sleeping and hoping.
* **Animations/transitions** — prefer disabling them in test config (see Stability Rules) over waiting them out.

## Stability Rules

Flakiness is usually a symptom of shared state, timing assumptions, or brittle locators — not "bad luck." Each rule below closes off one common source.

* **No inter-test dependencies.** Every test sets up its own data and cleans up after itself (or runs against isolated data). A test should pass in isolation and in any run order.
* **Unique, disposable test data.** Generate identifiers (IDs, emails, codes, names) with a timestamp or UUID suffix so parallel runs and repeated runs don't collide on uniqueness constraints.
* **Disable animations and reduce motion** in the Playwright config/browser context — animated transitions are a classic source of "element not stable" failures that have nothing to do with the feature under test.
* **Parallel-safe by default.** Don't rely on global/shared browser context between tests; use fixtures for setup so tests can run concurrently without stepping on each other.
* **Mock or stub genuinely external dependencies** (third-party APIs, email/SMS providers, payment gateways) rather than depending on their real availability; keep true integration points to a small, explicitly-tagged subset of the suite.
* **Retry-safe locators only** — this is why the Locator Strategy priority order exists. A brittle CSS selector isn't a "flaky test," it's a locator that was wrong from the start.

## Framework Structure

Organize by role, not by feature-of-the-week, so new tests know exactly where to live. The root folder matches `testDir` in `playwright.config.js` — `tests/` for this project.

```
tests/
├── *.spec.js        # Test specs — one file per feature/flow (e.g. login.spec.js)
├── pages/           # Page Object classes — one per page/major component
├── fixtures/        # Custom Playwright fixtures: auth state, seeded data, test users
├── utils/           # Shared helpers (data generators, API setup/teardown)
└── test-data/       # JSON files with externalised test data — no hardcoded values in specs
```

* **Page Object Model**: every page/component a test interacts with gets a class exposing locators and actions (e.g. `loginPage.login(user)`), not raw locators scattered across spec files. This is what makes a locator change a one-line fix instead of a find-and-replace across the suite.
* **Fixtures over `beforeEach` boilerplate**: use Playwright fixtures (`test.extend()`) for anything reused across specs — authenticated session, cleared storage, seeded data. `beforeEach` is a smell; if more than one test needs the same setup, it belongs in `tests/fixtures/`. Example:
  ```js
  // tests/fixtures/auth.js
  const base = require('@playwright/test');
  exports.test = base.test.extend({
    freshPage: async ({ page }, use) => {
      await page.goto('/'); // replace with the project's actual entry/login URL
      await page.evaluate(() => sessionStorage.clear());
      await use(page);
    }
  });
  ```
* **Specs stay thin**: a test file reads as a sequence of user actions and assertions; the "how" lives in page objects and fixtures. Specs must not call raw `page.locator()` or `page.fill()` — those belong in the POM.
* **utils/ for shared non-fixture helpers**: data generators, API seed helpers, and date/ID utilities live in `tests/utils/` — not inline in specs or page objects.

## Generator Output Contract

Every time a generator produces tests for a new feature, it must create all four of these artefacts. Nothing is optional. Fill in the project-specific placeholders (entry URL, feature name, domain fields) rather than leaving them literal.

### `tests/fixtures/auth.js` (create once, shared across features)
If the file does not already exist, create it. If it exists, do not overwrite it.
Provides the `freshPage` fixture — navigates to the project's actual starting URL (login page, home page, or whatever the app's entry point is) and clears storage once (avoids `addInitScript` when it would fire on every navigation, including post-login redirects):

```js
// @ts-check
'use strict';
const base = require('@playwright/test');
/** @typedef {import('@playwright/test').PlaywrightTestArgs & import('@playwright/test').PlaywrightTestOptions & { freshPage: import('@playwright/test').Page }} AuthFixtures */
exports.test = /** @type {import('@playwright/test').TestType<AuthFixtures, import('@playwright/test').PlaywrightWorkerArgs & import('@playwright/test').PlaywrightWorkerOptions>} */ (
  base.test.extend({
    freshPage: async ({ page }, use) => {
      await page.goto('/'); // replace with this project's entry point, e.g. '/login', '/ui/login.html'
      await page.evaluate(() => sessionStorage.clear());
      await use(page);
    },
  })
);
exports.expect = base.expect;
```

### `tests/pages/<Feature>Page.js`
Page Object Model class (CommonJS, `// @ts-check`).
- All locators follow the Locator Strategy priority order above
- Expose action helpers (e.g. `login()`, `submit()`, `create()`) so specs never call raw `fill()`/`click()`
- Helper methods that assert absence use `not.toBeVisible()` — never `toHaveClass(/hidden/)` or other implementation-detail checks

### `tests/test-data/<feature>.json`
All test data externalised to JSON — no hardcoded strings, URLs, or credentials in specs or page objects.

### `tests/<feature>.spec.js`
CommonJS spec file (`// @ts-check`, or TypeScript if the project's config specifies `.ts`).
- **Import `{ test, expect }` from `./fixtures/auth`** — NOT from `@playwright/test`
- Use `{ freshPage }` as the test fixture argument — **never `{ page }` directly**, unless the feature genuinely needs an unauthenticated context
- **No `beforeEach` for shared setup** — shared setup belongs in a fixture
- Specs stay thin: call POM action helpers, then assert — no raw `fill()`/`click()` in spec files
- No `waitForTimeout` anywhere
- One assertion intent per test; use `expect.soft()` for multiple independent checks on the same mutation

## Domain-Specific Assertion Rules

The general Assertion Standards above cover the mechanics (web-first assertions, exact values, one intent per test). This section is where a project encodes *its own* data-integrity rules on top of that — most real applications have some version of these patterns, even though the specifics differ by domain. Treat the list below as a checklist of patterns to instantiate for the current project, not literal rules to copy in as-is:

* **Every mutation to a core entity asserts persistence, not just the success toast.** After create/update/delete/submit, reload or re-fetch and assert the change actually stuck — a toast is UI feedback, not proof of a write. Identify the project's core entities (orders, users, documents, tickets, whatever the domain's primary objects are) and apply this consistently.
* **Identity/key fields are asserted for uniqueness and immutability** wherever the business rule says they shouldn't change — e.g. a test that edits a record's name should also assert its ID or key didn't move.
* **Boundary and limit rules are asserted at the edge**, not just the happy path: if a feature has a cap, quota, or threshold (max items, rate limit, capacity), assert the last allowed action succeeds and the next one is rejected with the expected message.
* **Cross-entity consistency**: actions that touch more than one entity (e.g. cancelling an order updates both the order record and an inventory count) assert both sides, not just the screen currently visible.
* **Destructive actions require an explicit assertion of the confirmation step**, not just the end state — assert the confirm dialog appears before the delete, and assert the record is gone after.
* **Computed/derived values are asserted against a known expected value**, not just "changed from before" — compute the expected result in the test setup and assert equality, so a wrong formula or calculation fails loudly instead of matching whatever the app happened to produce.

When starting on a new project, spend a few minutes identifying that project's actual entities, boundaries, and calculated fields, and write this section's project-specific version before generating the rest of the suite.

## Healing Standards - Playwright Healer Agent Rules

The Healer agent restores failing tests to a passing state by correcting drift between the test and the live application. It realigns locators, values, and assertions to match current application behaviour — without altering what the test is designed to verify or lowering the bar of what counts as a pass.

### What the Healer MAY fix autonomously

These are mechanical mismatches between the test and the live application where the intent is unchanged:

- **Locator drift** — an element's role, label, placeholder, or accessible name changed in a refactor. Fix by inspecting the live DOM and updating the locator to the current value using the same priority order (`getByRole` → `getByLabel` → … → CSS).
- **URL/route changes** — a redirect target or page path was renamed (e.g. `/ui/home` → `/ui/`). Fix by asserting the actual observed URL.
- **Text/copy changes** — a button label, heading, error message, or success toast was reworded. Fix by asserting the current text observed in the live DOM.
- **sessionStorage/localStorage key renames** — a key was renamed in the application code. Fix by using the key name the application actually writes.
- **Selector ID changes** — a CSS ID on a non-interactive element changed (last-resort locators only). Fix by updating to the current ID and flagging in a comment.
- **Test data value drift** — a seed value changed (e.g. a user's role label changed from `"Admin"` to `"Administrator"`). Fix by updating `test-data/*.json` — never hardcode the new value directly in the spec.

### What REQUIRES human review before healing

Do NOT auto-fix these — flag them as `genuine-defect` or `needs-review` and hand off:

- **Business logic assertion failures** — the application produces a different *calculated* result (grade average, attendance %, enrollment count). The formula may be wrong. Never update the expected value to match bad output.
- **Security-related assertions** — any assertion involving auth state, roles, permissions, session tokens, or access control. A change here is a potential regression, not a cosmetic drift.
- **Failures on a test that has already failed 3+ consecutive runs** — escalate to manual review; repeated failure suggests a structural problem, not a locator drift.
- **Failures caused by a missing DOM element** — if the locator finds nothing (not a mismatch, but an absence), the feature may have been removed or broken. Do not substitute a different element.
- **Flaky tests** — tests that passed on retry. Mark as `flaky`, do not heal, escalate separately.
- **Multiple simultaneous failures across unrelated tests** — indicates a broken environment or upstream dependency, not individual test drift.

### What the Healer must NEVER do

- **Delete or skip a failing test** — a test that fails is either a drift to fix or a bug to report. Removing it destroys coverage.
- **Weaken an assertion** — replacing `toHaveText('exact value')` with `toBeVisible()` to make a test pass is not healing; it's hiding a real failure.
- **Change test intent** — the user actions, the data submitted, and the business outcome being verified must remain the same after healing.
- **Modify test data JSON to match wrong application output** — test data reflects expected correct values. Only update it when the application's correct behaviour has legitimately changed.
- **Add `waitForTimeout`** — a timing-based fix is never a real fix. Find the correct wait condition.
- **Heal across test boundaries** — fix each failing test independently. Do not share state, fixtures, or data between tests to paper over failures.

### Healing workflow — always follow this order

1. **Run the failing test** and capture the exact error: line number, expected vs received, locator used.
2. **Inspect the live DOM** at the point of failure — take a snapshot, use `getByRole`/`getByLabel` to find the element as it currently exists.
3. **Classify the failure** (locator drift / copy change / key rename / genuine defect / flaky) before touching the code.
4. **If auto-fixable**: apply the minimal change — update only the specific locator, URL, text, or key name that drifted. Do not refactor surrounding code.
5. **Re-run the test** to confirm it passes. If it still fails, re-classify — do not apply a second speculative fix.
6. **Log the diagnosis**: record the before/after diff, failure type, and what was observed in the live DOM. This diff goes into the execution report.
7. **If not auto-fixable**: mark the test `blocked`, attach the error and classification, and hand off to the execution report for manual escalation.

### Post-heal verification

After healing one or more tests:
- Re-run the **full spec file** (not just the healed test) to confirm no regressions were introduced.
- Confirm the healed test passes **twice** (two consecutive runs) before marking it resolved — one pass after a locator fix can still be flaky.
