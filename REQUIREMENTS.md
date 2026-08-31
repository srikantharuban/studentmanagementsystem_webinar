# Student Management System — Requirements Document

## 1. Overview

The Student Management System (SMS) is a web-based application for managing students, courses, enrollments, attendance, and grades. It provides a REST API backend and a single-page frontend UI for performing all academic management operations.

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend framework | Python FastAPI |
| ORM | SQLAlchemy 2.0 |
| Database | SQLite (`students.db`) |
| Schema validation | Pydantic v2 |
| Test framework | Pytest + HTTPX |
| Frontend | Vanilla HTML / CSS / JavaScript (SPA) |
| Server | Uvicorn (ASGI) |

---

## 3. System Architecture

```
StudentManagementSystem/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app, startup, router registration
│   ├── database.py       # SQLAlchemy engine, session, Base, get_db
│   ├── models.py         # ORM models
│   ├── schemas.py        # Pydantic schemas + enums
│   └── routers/
│       ├── __init__.py
│       ├── students.py
│       ├── courses.py
│       ├── enrollments.py
│       ├── attendance.py
│       └── grades.py
├── static/
│   ├── index.html        # SPA shell
│   ├── login.html        # Standalone login page
│   ├── style.css         # Global styles
│   └── app.js            # SPA logic and API calls
├── tests/
│   ├── conftest.py       # In-memory SQLite, fixtures
│   ├── test_students.py
│   ├── test_courses.py
│   ├── test_enrollments.py
│   ├── test_attendance.py
│   └── test_grades.py
├── seed.py               # Idempotent sample data loader
├── requirements.txt
└── README.md
```

---

## 4. Data Models

### 4.1 Student

| Field | Type | Constraints |
|-------|------|-------------|
| id | Integer | Primary key, auto-increment |
| first_name | String | Not null, min length 1 |
| last_name | String | Not null, min length 1 |
| email | String | Not null, unique |
| date_of_birth | Date | Not null |
| enrollment_date | Date | Not null |

- Cascade delete: removes all related enrollments, attendance records, and grades when a student is deleted.

### 4.2 Course

| Field | Type | Constraints |
|-------|------|-------------|
| id | Integer | Primary key, auto-increment |
| name | String | Not null |
| code | String | Not null, unique |
| credits | Integer | Not null, range 1–12 |

- Cascade delete: removes all related enrollments, attendance records, and grades when a course is deleted.

### 4.3 Enrollment

| Field | Type | Constraints |
|-------|------|-------------|
| id | Integer | Primary key, auto-increment |
| student_id | Integer | Foreign key → students.id (CASCADE) |
| course_id | Integer | Foreign key → courses.id (CASCADE) |
| enrollment_date | Date | Not null |

- Unique constraint: `(student_id, course_id)` — a student may not enroll in the same course twice.

### 4.4 Attendance

| Field | Type | Constraints |
|-------|------|-------------|
| id | Integer | Primary key, auto-increment |
| student_id | Integer | Foreign key → students.id (CASCADE) |
| course_id | Integer | Foreign key → courses.id (CASCADE) |
| date | Date | Not null |
| status | String(10) | One of: `present`, `absent`, `late` |

- Unique constraint: `(student_id, course_id, date)` — one record per student per course per day.

### 4.5 Grade

| Field | Type | Constraints |
|-------|------|-------------|
| id | Integer | Primary key, auto-increment |
| student_id | Integer | Foreign key → students.id (CASCADE) |
| course_id | Integer | Foreign key → courses.id (CASCADE) |
| assessment_name | String | Not null, min length 1 |
| score | Float | Not null, ≥ 0 |
| max_score | Float | Not null, > 0 |
| date | Date | Not null |

- Cross-field validation: `score` must not exceed `max_score`.

---

## 5. API Endpoints

### 5.1 Students — `/students`

| Method | Path | Description | Success |
|--------|------|-------------|---------|
| POST | `/students` | Create a student | 201 |
| GET | `/students` | List all students | 200 |
| GET | `/students/{id}` | Get student by ID | 200 |
| PUT | `/students/{id}` | Full update | 200 |
| PATCH | `/students/{id}` | Partial update | 200 |
| DELETE | `/students/{id}` | Delete student | 204 |
| GET | `/students/{id}/courses` | List courses a student is enrolled in | 200 |

### 5.2 Courses — `/courses`

| Method | Path | Description | Success |
|--------|------|-------------|---------|
| POST | `/courses` | Create a course | 201 |
| GET | `/courses` | List all courses | 200 |
| GET | `/courses/{id}` | Get course by ID | 200 |
| PUT | `/courses/{id}` | Full update | 200 |
| PATCH | `/courses/{id}` | Partial update | 200 |
| DELETE | `/courses/{id}` | Delete course | 204 |
| POST | `/courses/{id}/enroll` | Enroll a student (body: `{student_id}`) | 201 |
| DELETE | `/courses/{id}/enroll/{student_id}` | Unenroll a student | 204 |
| GET | `/courses/{id}/students` | List students in a course | 200 |

### 5.3 Enrollments — `/enrollments`

| Method | Path | Description | Success |
|--------|------|-------------|---------|
| GET | `/enrollments` | List enrollments (filters: `student_id`, `course_id`) | 200 |
| GET | `/enrollments/{id}` | Get enrollment by ID | 200 |
| DELETE | `/enrollments/{id}` | Delete enrollment | 204 |

### 5.4 Attendance — `/attendance`

| Method | Path | Description | Success |
|--------|------|-------------|---------|
| POST | `/attendance` | Mark attendance | 201 |
| GET | `/attendance` | List records (filters: `student_id`, `course_id`, `date`) | 200 |
| GET | `/attendance/{id}` | Get record by ID | 200 |
| PUT | `/attendance/{id}` | Update attendance status | 200 |
| DELETE | `/attendance/{id}` | Delete record | 204 |

### 5.5 Grades — `/grades`

| Method | Path | Description | Success |
|--------|------|-------------|---------|
| POST | `/grades` | Record a grade | 201 |
| GET | `/grades` | List grades (filters: `student_id`, `course_id`) | 200 |
| GET | `/grades/average` | Get average percentage for a student (optional: per course) | 200 |
| GET | `/grades/{id}` | Get grade by ID | 200 |
| PUT | `/grades/{id}` | Update grade | 200 |
| DELETE | `/grades/{id}` | Delete grade | 204 |

> **Note:** `/grades/average` must be registered before `/{id}` to prevent FastAPI path collision.

### 5.6 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK — GET / PUT / PATCH success |
| 201 | Created — POST success |
| 204 | No Content — DELETE success |
| 404 | Not Found — resource does not exist |
| 409 | Conflict — uniqueness constraint violated |
| 422 | Unprocessable Entity — Pydantic validation failure |

---

## 6. Validation Rules

| Field | Rule |
|-------|------|
| `first_name`, `last_name`, `assessment_name` | Non-empty string after whitespace strip |
| `email` | Valid email format (`EmailStr`) |
| `credits` | Integer in range 1–12 |
| `score` | Float ≥ 0 |
| `max_score` | Float > 0 |
| `score` vs `max_score` | `score` must not exceed `max_score` |
| `status` (attendance) | One of `present`, `absent`, `late` |

---

## 7. User Roles and Access Control

### 7.1 Role Definitions

The system supports four user roles with different levels of access. Roles are enforced entirely on the frontend — each role is stored in `sessionStorage` on login.

| Role | Username | Password | Accessible Sections |
|------|----------|----------|---------------------|
| **Administrator** | `admin` | `admin123` | All sections — Dashboard, Students, Courses, Enrollments, Attendance, Grades |
| **Student Admin** | `studentadmin` | `student123` | Dashboard, Students, Enrollments |
| **Course Admin** | `courseadmin` | `course123` | Dashboard, Courses, Enrollments |
| **Teacher** | `teacher` | `teacher123` | Dashboard, Attendance (mark-only — no Edit or Delete) |

### 7.2 Role-Based Access Control (RBAC) Behaviour

- **Permitted pages** are defined in the `ROLE_PAGES` map in `app.js`. Each role maps to an array of allowed page keys.
- **Navigation guard** — `navigate(page)` calls `canAccess(page)` before rendering. If the role does not permit the page, a 🔒 **Access Restricted** screen is shown instead, displaying the user's role name.
- **Sidebar** — nav items the current role cannot access are rendered with the `nav-restricted` CSS class (opacity dimmed to 35%, tooltip shown on hover). They remain clickable and trigger the access denied screen.
- **Teacher attendance restrictions** — the attendance history table conditionally omits the Edit and Delete action buttons when `currentRole === 'teacher'`. Teachers can mark new attendance records but cannot modify or remove existing ones.
- **Sidebar footer** — displays the logged-in username and a role badge (e.g. `Student Admin`) below it.

### 7.3 Session Storage Keys

| Key | Value |
|-----|-------|
| `sms_auth` | `"true"` when authenticated |
| `sms_user` | Username string (e.g. `"teacher"`) |
| `sms_role` | Role key (e.g. `"teacher"`) |
| `sms_label` | Human-readable role label (e.g. `"Teacher"`) |

All keys are cleared on Sign Out and when the browser tab is closed.

---

## 8. Frontend UI Requirements

### 8.1 Authentication

- Standalone login page (`/ui/login.html`) with gradient background and SMS branding.
- Multi-user credential store hardcoded in `login.html` (demo purposes); see Section 7.1 for accounts.
- Auth state stored in `sessionStorage` — cleared on tab/browser close.
- Auth guard on the main SPA: unauthenticated users are redirected to the login page.
- Login page displays all demo accounts and their access levels as a hint.
- "Sign Out" button in sidebar footer clears the session and redirects to login.

### 8.2 Navigation

- Persistent sidebar with links: Dashboard, Students, Courses, Enrollments, Attendance, Grades.
- Active page highlighted in the sidebar.
- Restricted nav items are visually dimmed based on the logged-in role.
- Sidebar footer shows the logged-in username, role badge, and Sign Out button.

### 8.3 Dashboard

- Summary cards showing counts of: Students, Courses, Enrollments, Attendance Records, Grade Records.
- Quick-action buttons for each main section.
- **Students Enrolled per Course** — doughnut chart showing the number of enrolled students per course, one segment per course. Tooltip shows count with "students" label.
- **Average Grade per Course (%)** — doughnut chart showing the average grade percentage per course (calculated as mean of `score / max_score × 100` across all grade records for that course). Only courses with at least one grade record are shown.
- Charts are rendered using Chart.js (CDN) inside a responsive two-column grid; collapses to single column on screens narrower than 768 px.

### 8.4 Students Page

- Table listing all students (name, email, date of birth, enrollment date).
- Add Student button — opens modal form.
- Edit button per row — opens pre-filled modal form.
- Delete button per row — removes student with confirmation toast.
- Form fields: First Name, Last Name, Email, Date of Birth, Enrollment Date.

### 8.5 Courses Page

- Table listing all courses (name, code, credits).
- Add / Edit / Delete operations via modal.
- Form fields: Name, Code, Credits.

### 8.6 Enrollments Page

- Table listing enrollments with student name, course name, and enrollment date.
- Enroll Student button — modal with student and course dropdowns.
- Delete button to unenroll.

### 8.7 Attendance Page

- Table listing attendance records with student name, course name, date, and status badge.
- Status badges: green (present), red (absent), amber (late).
- Mark Attendance button — modal with student, course, date, and status fields.
- Edit and Delete per row.

### 8.8 Grades Page

- Table listing grades with student name, course name, assessment, score / max score, and date.
- Average score card showing overall average percentage per student.
- Record Grade button — modal form.
- Edit and Delete per row.

### 8.9 General UI Behaviour

- Toast notifications for success and error feedback.
- Modal overlay for all create/edit forms.
- Clicking outside a modal closes it.
- All data fetched from the backend API (`/students`, `/courses`, etc.).

---

## 9. Non-Functional Requirements

| Requirement | Detail |
|-------------|--------|
| Auto table creation | Tables created automatically on app startup via `Base.metadata.create_all` |
| Database | SQLite file `students.db` in project root; no external DB server required |
| API documentation | Auto-generated Swagger UI at `/docs`; ReDoc at `/redoc` |
| Seed data | Idempotent seed script (`seed.py`) — skips insert if data already exists |
| Frontend serving | FastAPI serves static files at `/ui/` via `StaticFiles` mount |
| Root redirect | `GET /` redirects to `/ui/` |
| Thread safety | SQLite engine uses `connect_args={"check_same_thread": False}` |
| Test isolation | Tests use in-memory SQLite with `StaticPool`; tables reset before each test |
| Test coverage | Minimum 49 automated tests across all 5 domains |

---

## 10. Seed Data

The `seed.py` script inserts the following sample data (idempotent — safe to run multiple times):

| Entity | Count | Details |
|--------|-------|---------|
| Students | 5 | Alice Johnson, Bob Smith, Carol White, David Brown, Eva Martinez |
| Courses | 4 | CS101, CS201, MATH101, ENG101 |
| Enrollments | 11 | Cross-enrolled across students and courses |
| Attendance records | 20 | Spread across 3 dates with varied statuses |
| Grade records | 12 | 2 assessments per student for first 3 students |

---

## 11. Test Coverage

| Test file | Scenarios covered |
|-----------|------------------|
| `test_students.py` | Create, list, get, full update, partial update, delete; duplicate email → 409; not found → 404 |
| `test_courses.py` | CRUD; duplicate code → 409; credits out of range → 422 |
| `test_enrollments.py` | Enroll success; duplicate → 409; nonexistent student/course → 404; unenroll; list by student; list by course |
| `test_attendance.py` | Mark; duplicate → 409; invalid status → 422; filter by student/course/date; update; delete |
| `test_grades.py` | Record; score > max → 422; list by student/course; update; delete; average for one course; average across courses; average with no grades → 0 |

---

## 12. Setup and Running

### Prerequisites

- Python 3.11 or higher
- pip

### Installation

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Start the server

```bash
uvicorn app.main:app --reload --port 8000
```

### Load sample data

```bash
python seed.py
```

### Access the application

| URL | Description |
|-----|-------------|
| `http://localhost:8000/ui/` | Frontend SPA (requires login) |
| `http://localhost:8000/ui/login.html` | Login page |
| `http://localhost:8000/docs` | Swagger UI (API documentation) |
| `http://localhost:8000/redoc` | ReDoc API documentation |

### Run tests

```bash
pytest -v
```

---

## 13. Dependencies

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
pydantic[email]==2.7.1
pytest==8.2.0
httpx==0.27.0
aiofiles>=23.2.1
```

**Frontend (CDN):**

| Library | Version | Purpose |
|---------|---------|---------|
| Chart.js | 4.4.4 | Dashboard doughnut charts |

Loaded via `<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>` in `index.html`.

---

## 14. Security Considerations

> These are known limitations acceptable for a demo/testing system. Production use would require:

- Replace hardcoded credentials with a proper user store and hashed passwords.
- Replace `sessionStorage` auth with server-side sessions or JWT tokens.
- Add HTTPS / TLS termination.
- Restrict CORS origins.
- Use a production-grade database (PostgreSQL, MySQL) instead of SQLite.
- Add rate limiting and input sanitisation beyond Pydantic validation.
