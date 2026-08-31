# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

### Run the server
```powershell
# Activate venv first (Windows)
.\venv\Scripts\activate

uvicorn app.main:app --reload --port 8000
```

### Seed sample data
```powershell
python seed.py
```
Safe to run multiple times — skips records that already exist.

### Run tests
```powershell
# All tests
pytest

# Verbose
pytest -v

# Single file
pytest tests/test_grades.py -v

# Single test
pytest tests/test_grades.py::test_average_single_course -v
```

Tests use an in-memory SQLite database; `students.db` is never touched.

---

## Architecture

### Stack
- **FastAPI** — HTTP layer, routing, OpenAPI docs
- **SQLAlchemy** — ORM (synchronous, SQLite)
- **Pydantic v2** — request/response validation via schemas
- **SQLite** — `students.db` in the project root, created automatically on first startup

### Request flow
```
HTTP request
  → FastAPI router (app/routers/*.py)
      → Pydantic schema validates input (app/schemas.py)
      → SQLAlchemy session via get_db() dependency (app/database.py)
      → ORM model read/write (app/models.py)
  → Pydantic response schema serializes output
```

### Key wiring points

**`app/main.py`** — creates the `FastAPI` instance, registers all five routers, mounts the static frontend at `/ui`, and creates all DB tables on startup via `Base.metadata.create_all`.

**`app/database.py`** — defines the engine, `SessionLocal`, and the `get_db()` dependency (yielding a session, closing in `finally`). All routers depend on `get_db`.

**`app/models.py`** — five ORM models: `Student`, `Course`, `Enrollment`, `Attendance`, `Grade`. Deleting a `Student` or `Course` cascades to all child records (`cascade="all, delete-orphan"`). Uniqueness constraints live here: email (Student), code (Course), student+course (Enrollment), student+course+date (Attendance).

**`app/schemas.py`** — Pydantic models following the `<Entity>Create / <Entity>Update / <Entity>Response` pattern. `Update` schemas make every field `Optional` so PATCH works with partial payloads (routers call `model_dump(exclude_none=True)`). `GradeCreate` and `GradeUpdate` include a `@model_validator` that enforces `score ≤ max_score`.

**`app/routers/`** — one file per resource. Each router has a private `_get_<entity>_or_404()` helper. Integrity violations (duplicate email/code/enrollment/attendance) are caught from `IntegrityError` and re-raised as HTTP 409. The grades router registers `/average` **before** `/{grade_id}` to avoid FastAPI path-matching ambiguity.

### Frontend

`static/` holds a vanilla-JS single-page app served by FastAPI's `StaticFiles` mount at `/ui`. The root `/` redirects there. The frontend implements:
- Role-based access: four hardcoded accounts (`admin`, `studentadmin`, `courseadmin`, `teacher`) stored client-side in `sessionStorage`
- All CRUD via `fetch()` calls to the REST API
- Dashboard charts rendered with Chart.js (loaded from CDN)

The frontend does **not** share auth with the API — the API itself has no authentication middleware.

### Test setup (`tests/conftest.py`)
- Creates a **shared in-memory SQLite engine** (using `StaticPool`) once at import time.
- The `reset_db` fixture is `autouse=True`: it drops and recreates all tables before every individual test, ensuring full isolation.
- The `client` fixture overrides FastAPI's `get_db` dependency with one pointing at the test engine.

---

## Role permissions (frontend only)

| Role | Username | Accessible sections |
|---|---|---|
| Administrator | `admin` | All |
| Student Admin | `studentadmin` | Dashboard, Students, Enrollments |
| Course Admin | `courseadmin` | Dashboard, Courses, Enrollments |
| Teacher | `teacher` | Dashboard, Attendance (mark only — no edit/delete) |

Access control is enforced in `static/app.js` — the API endpoints themselves are unprotected.
