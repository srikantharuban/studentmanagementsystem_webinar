---
name: playwright-execution-reporting
description: Standards for executing Playwright test suites and generating consistent, traceable, CI-ready reports. Apply whenever running, triggering, or reporting on Playwright test runs.
---

# Playwright Test Execution & Reporting

## Purpose
Define how Playwright test suites are executed and how results are reported, so every run — local, agent-triggered, or CI — produces consistent, traceable, and actionable output.

---

## 1. Execution Standards

### Run Configuration
- Always execute via the project's `playwright.config.ts` — never bypass it with ad-hoc CLI flags that change baseURL, timeout, or retries without explicit reason.
- Default retries: 1 locally, 2 in CI. Flaky tests are not silently retried into a "pass" without being logged as flaky.
- Run in headless mode by default; headed mode only for local debugging.
- Target browsers per config's `projects` array (e.g. chromium, firefox, webkit) — do not skip a configured browser unless explicitly scoped.

### Scoping a Run
- Full suite: `npx playwright test`
- Single feature: `npx playwright test tests/login.spec.js`
- By tag: `npx playwright test --grep @smoke` (use tags: `@smoke`, `@regression`, `@critical`)
- By test ID: `npx playwright test --grep "TC_LOGIN_P01"`

### Environment Handling
- Never hardcode environment URLs or credentials in spec files.
- Load environment config from `.env.<environment>` (e.g. `.env.staging`) via `dotenv`.
- Log which environment a run targeted at the top of every report.

### Parallelization
- Use Playwright's built-in worker parallelization; do not force `workers: 1` unless tests have shared-state issues that should instead be fixed at the test level.
- Tests must be independent — no test may depend on execution order or another test's side effects.

---

## 2. Reporting Standards

### Required Reporters
Every run must produce all three:
1. **HTML report** — human-readable, for local review and stakeholder sharing (`playwright.config.ts`: `reporter: [['html', { open: 'never' }]]`)
2. **JSON report** — machine-readable, for dashboards/CI parsing
3. **JUnit XML** — for CI systems that consume JUnit format (Jenkins, Azure DevOps, GitHub Actions annotations)

### Report Contents — Minimum Fields Per Test
| Field | Description |
|---|---|
| Test ID | e.g. `TC_LOGIN_P01` — must match the ID from the test plan |
| Title | Human-readable test name |
| Status | Passed / Failed / Flaky / Skipped / Healed |
| Duration | Execution time in ms |
| Browser | Which project/browser it ran under |
| Failure reason | Stack trace + assertion diff, if failed |
| Screenshot | Attached on failure |
| Trace file | Attached on failure (`trace.zip`, viewable via `npx playwright show-trace`) |
| Video | Attached on failure if `video: 'retain-on-failure'` is configured |

### Summary Block
Every report run must open with a summary:
- Total tests run
- Passed / Failed / Skipped / Flaky / Healed counts
- Pass rate %
- Total duration
- Environment targeted
- Git commit SHA / branch (if run in CI)

### Naming & Storage
- Save reports to `/reports/<feature>/<yyyy-mm-dd>-<HHmm>/`
- HTML: `index.html`
- JSON: `results.json`
- JUnit: `results.xml`
- Never overwrite a previous run's report — each run gets its own timestamped folder.

---

## 3. Failure Handling & Triage

- A test that fails on first attempt but passes on retry is marked **Flaky**, not silently green — flaky tests must appear in the summary, not be hidden by retry success.
- A test that fails consistently across all retries is marked **Failed** and is a candidate for the Healer agent (selector drift, assertion drift) or a real defect (if the underlying feature is actually broken — do not auto-heal a genuine bug).
- Before healing, confirm failure category:
  - **Locator/selector drift** → Healer agent candidate
  - **Assertion text/value changed intentionally** → Healer agent candidate (update expected value)
  - **Feature actually broken** → Report as a defect, do not modify the test to force a pass
- Every healed test must retain a link in the report back to its original failure (before/after diff), never silently replaced.

---

## 4. CI/CD Integration

- Exit code must be non-zero on any failed test — CI pipelines must fail the build.
- Publish JUnit XML to the CI's native test-report integration (e.g. GitHub Actions test summary, Jenkins JUnit plugin).
- Upload the HTML report and trace/screenshot artifacts to CI artifact storage with a retention policy (e.g. 14 days).
- On failure, post a summary comment/notification (PR comment, Slack message) with: pass/fail counts, failing test IDs, and a link to the full report — not the entire raw log.

---

## 5. Historical Tracking

- Maintain a rolling trend log (`/reports/trend.json` or a dashboard-fed table) recording, per run: date, pass rate, flaky count, average duration.
- Use this trend to flag tests that are flaky across 3+ consecutive runs — these should be escalated for manual review rather than repeatedly auto-healed.

---

## 6. Quality Rules

- Every report entry must be traceable to a specific test ID defined in the test plan — no orphaned or unlabeled test results.
- No test result may be manually edited in a report; if a test needs to be excluded, it must be explicitly skipped in code with a documented reason (`test.skip(..., 'reason')`), visible in the report as Skipped, not omitted.
- Reports must never include real credentials, PII, or financial account data in screenshots/traces — mask sensitive fields before capture where the app supports it.
- Reporting must run even if execution partially fails (e.g. one test crashes the worker) — a broken run must still produce a report showing what did and didn't complete.