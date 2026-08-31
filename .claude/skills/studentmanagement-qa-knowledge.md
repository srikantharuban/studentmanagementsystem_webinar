---
name: student-management-qa-knowledge
description: Apply Student Management System QA knowledge — risk categories, boundary values, and test case format across Login, Student, Course, Enrollment, Attendance, Grade, and Dashboard workflows
---

## Application Domain Facts — Source of Truth for Role/Access and Business-Rule Scenarios

Pulled from `REQUIREMENTS_NON_TECHNICAL.md`. Use these concrete facts when generating RBAC, cascading-delete, and computed-value test cases instead of guessing at roles or formulas.

### Roles & Access Matrix (demo accounts)

| Role | Username | Password | Accessible sections |
|---|---|---|---|
| Administrator | `admin` | `admin123` | Dashboard, Students, Courses, Enrollments, Attendance, Grades (full access) |
| Student Admin | `studentadmin` | `student123` | Dashboard, Students, Enrollments only |
| Course Admin | `courseadmin` | `course123` | Dashboard, Courses, Enrollments only |
| Teacher | `teacher` | `teacher123` | Dashboard, Attendance — **mark only**, cannot edit/delete existing attendance records |

A role opening a section it cannot access must see an **"Access Restricted"** message with no data — this is the concrete assertion for the generic "unauthorized role accessing restricted pages" risk below (there is no "student" login role in this app — don't invent one).

### Confirmed cascading-delete behaviour
- Deleting a **student** automatically deletes all of that student's enrollment, attendance, and grade records (no orphaned rows, no undo).
- Deleting a **course** automatically deletes all enrollment, attendance, and grade records tied to it.
- Treat this as expected/correct behavior to assert, not a defect — the risk to test is that cascade *doesn't* happen (orphaned rows survive) or that it over-deletes unrelated records.

### Computed/derived values
- **Grade average %** = (sum of `score` across a student's recorded grades) ÷ (sum of `max_score` across the same records) × 100. Assert against this exact formula, not just "changed from before."
- Dashboard stat cards (Students/Courses/Enrollments/Attendance/Grades counts) must equal the live record counts — mismatches are a Dashboard/Data Integrity risk (see category 7).

### Fixed value sets
- Attendance `status`: exactly `Present` / `Absent` / `Late` — no other values accepted (Present=green, Absent=red, Late=amber in the UI, useful for visual-regression checks).
- Seed baseline (via `seed.py`, idempotent): 5 students, 4 courses, 11 enrollments, 20 attendance records, 12 grade records — useful as a known-good starting point for Dashboard assertions.

### Exact Validation Constraints & Expected Status Codes
Assert these precisely — "some error shown" is not enough, assert the specific status/behaviour:

| Field / Entity | Rule | Expected on violation |
|---|---|---|
| Required string fields (name, code, etc.) | Non-empty, min length 1 | 422 validation error |
| Student email | Must be a valid email format; unique per student | 422 (bad format) / 409 (duplicate) |
| Course credits | 1–12 inclusive | 422 |
| Course code | Unique; normalized to uppercase before comparison | 409 on duplicate |
| Grade score | `score <= max_score`, both ≥ 0 | 422 |
| Attendance status | One of `present` / `absent` / `late` (lowercase in the API; UI displays Title Case) | 422 on any other value |
| Enrollment | Unique on `(student_id, course_id)` | 409 on duplicate |
| Attendance | Unique on `(student_id, course_id, date)` | 409 on duplicate |

---

## Risk Categories — Always Evaluate All of These

### 1. Authentication & Access Risks (Login)
- Valid credentials succeed; invalid credentials fail with generic error (no user enumeration)
- Empty username/password submission
- Session timeout not enforced / session persists after logout
- Session fixation or replay using an expired token
- Unauthorized role accessing restricted pages via direct URL — use the actual Roles & Access Matrix above (e.g. `teacher` opening `/students` should show "Access Restricted", not student data)
- Account lockout after repeated failed attempts (if applicable)
- Password field masking / no credentials in logs or URL

### 2. Student Record Risks
- Duplicate student creation (same ID, email, or roll number)
- Delete a student who has active enrollments, attendance, or grades — confirm cascade delete removes all of them (see Confirmed cascading-delete behaviour above), not that it's blocked
- Update student record with invalid data (e.g. letters in phone/DOB field)
- Search returns incorrect or partial matches; special characters in search break query

### 3. Course Management Risks
- Duplicate course code creation (code is unique, normalized to uppercase — e.g. `math101` and `MATH101` must collide)
- Credits outside the valid 1–12 range (see boundary table)
- Delete a course with existing enrollment/attendance/grade history tied to it — confirm cascade delete removes all of them (this app has no active/inactive or capacity concept, so don't test for those)

### 4. Enrollment Risks
- Duplicate enrollment: same student enrolled twice in same course (unique on student_id + course_id, 409 expected)
- Remove enrollment that has associated attendance/grade records — confirm the app's actual behavior (no documented block on this; this app has no course-capacity/max-course-per-student rule, so don't test for those)
- Enrollment count not reflected correctly in course/dashboard stats

### 5. Attendance Risks
- Duplicate attendance entry for same student + course + date
- Mark attendance for a student not enrolled in that course
- Mark attendance for a future date
- Update/correct a past attendance record — audit trail expectations
- Status must be restricted to `Present` / `Absent` / `Late` (see Fixed value sets above) — no attendance-percentage field exists in this app; don't test for one

### 6. Grade Risks
- Grade entered for a student not enrolled in that subject/course
- Score exceeds `max_score` (must reject — see boundary table); this app has no letter-grade conversion, only a computed average %
- Overwriting an existing grade — should it version/log the change?
- Average % calculation accuracy across multiple assessments/courses (see the exact formula under Application Domain Facts above)

### 7. Dashboard / Data Integrity Risks
- Dashboard stats stale or not updating after underlying data change
- Student/course/enrollment counts mismatch against actual records
- Attendance and grade summaries on dashboard don't match detail pages
- Dashboard accessible without authentication (direct URL bypass)

### Cross-Cutting Validation Risks
- SQL/script injection in any text input field
- Non-numeric characters in numeric fields (ID, score/max_score, credits)
- Mandatory field omission on all create/update forms
- Invalid formats: email, phone, date fields
- Client-side validation bypass (submit via API directly without server-side check)

### Concurrency Risks
- Two admins editing the same student/course record simultaneously
- Two enrollments racing for the last available course seat
- Simultaneous grade updates for the same student/subject by different faculty

---

## Boundary Values — Always Test for Numeric/Score Fields

| Value | Field Type | Expected Behaviour |
|---|---|---|
| 0 | Grade/marks | Reject or accept per scale minimum — validate |
| -1 | Grade/marks | Reject — invalid |
| 0.01 | Minimum valid grade | Accept |
| 100 | Max grade/marks | Accept |
| 100.01 | Over max grade | Reject or cap |
| 59.999 | Grade boundary precision | Validate correct average-% rounding |
| 1 | Course credits (min) | Accept |
| 12 | Course credits (max) | Accept |
| 0 | Course credits | Reject — below minimum |
| 13 | Course credits | Reject — above maximum |
| Today's date | Attendance date | Accept |
| Future date | Attendance date | Reject — invalid |
| Empty string | Any mandatory field | Reject with validation message |
| 256+ chars | Name/text fields | Reject or truncate per field limit |

---

## Test Case Output Format — Always Use This Structure

# Default test case format

 - Test cases should be aligned with devops output format. 
 - Test case steps should be detailed enough that any entry level QA engineers should able to read and understand. 
 
# If requested follow the below customized format. 

 - Every test case generated must include all columns below. Never omit a column — use `N/A` if a value does not apply.

| Column | Description | Example Values |
|---|---|---|
| **Test Case ID** | Unique identifier — prefix reflects workflow (TC_LOGIN_, TC_STU_, TC_CRS_, TC_ENR_, TC_ATT_, TC_GRD_, TC_DASH_) | `TC_LOGIN_P01` |
| **User Story ID** | Linked user story or epic from backlog | `US_AUTH_01` / `N/A` |
| **Feature / Module** | One of the 7 core workflows | `Login`, `Student Registration`, `Course Management`, `Enrollment`, `Attendance`, `Grade Management`, `Dashboard` |
| **Requirement ID** | Linked functional requirement | `FR_LOGIN_01` / `N/A` |
| **Acceptance Criteria ID** | Linked acceptance criterion | `AC_LOGIN_01` / `N/A` |
| **Test Case Title** | Short descriptive title stating what is being validated | `Successful admin login with valid credentials` |
| **Test Objective** | One sentence — what this test proves or disproves | `Verify that a valid admin user is authenticated and redirected to the dashboard` |
| **Preconditions** | System state required before execution | `Server running at http://localhost:8000; admin account exists; user is not logged in` |
| **Test Steps** | Numbered action steps | `1. Navigate to /ui/login.html  2. Enter username 'admin'  3. Enter password 'admin123'  4. Click Sign In` |
| **Test Data** | Exact input values used | `username: admin, password: admin123` |
| **Expected Result** | Precise observable outcome | `Redirected to /ui/; sessionStorage contains sms_auth=true, sms_role=admin, sms_user=admin, sms_label=Administrator; sidebar shows 'Administrator'` |
| **Test Category** | Functional / Non-Functional / Regression / Smoke / Integration | `Functional` |
| **Scenario Type** | Positive / Negative / Boundary | `Positive` |
| **Priority** | How soon this must be run | `High` / `Medium` / `Low` |
| **Severity** | Impact if this test finds a defect | `Critical` / `Major` / `Minor` / `Trivial` |
| **Automation Candidate** | Whether this test is suitable for automation | `Yes` / `No` |
| **Automation Priority** | Order in which automation should be implemented | `P1` / `P2` / `P3` / `N/A` |
| **Status** | Current state of the test case | `Draft` / `Ready` / `In Progress` / `Passed` / `Failed` / `Blocked` / `Skipped` |
| **Defect ID** | Linked defect if test is failing | `BUG_001` / `N/A` |
| **Comments** | Any notes, known limitations, or context | `Depends on seed data; re-run after each deployment` |



### Example Test Case Row

| Test Case ID | User Story ID | Feature / Module | Requirement ID | Acceptance Criteria ID | Test Case Title | Test Objective | Preconditions | Test Steps | Test Data | Expected Result | Test Category | Scenario Type | Priority | Severity | Automation Candidate | Automation Priority | Status | Defect ID | Comments |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TC_LOGIN_P01 | US_AUTH_01 | Login | FR_LOGIN_01 | AC_LOGIN_01 | Successful admin login with valid credentials | Verify that a valid admin user is authenticated and redirected to the dashboard | Server running; admin account exists; user not logged in | 1. Navigate to /ui/login.html 2. Enter username 'admin' 3. Enter password 'admin123' 4. Click Sign In | username: admin, password: admin123 | Redirected to /ui/; sms_auth=true, sms_role=admin, sms_user=admin, sms_label=Administrator in sessionStorage; sidebar shows 'Administrator' | Functional | Positive | High | Critical | Yes | P1 | Ready | N/A | Core smoke test — run on every deployment |