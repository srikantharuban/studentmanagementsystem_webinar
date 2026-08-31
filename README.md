# Student Management System

A REST API for managing students, courses, enrollments, attendance, and grades. Built with Python FastAPI and SQLite — no external database server required.

---

## Prerequisites

- Python 3.11 or newer
- pip

---

## Installation

```bash
# 1. Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt
```

---

## Running the Application

```bash
uvicorn app.main:app --reload --port 8000
```

On first start, `students.db` is created automatically in the project root and all tables are provisioned.

---

## Seeding Sample Data

```bash
python seed.py
```

Inserts 5 students, 4 courses, 11 enrollments, 20 attendance records, and 12 grade records. Safe to run multiple times — skips if data already exists.

---

## API Documentation

Once the server is running:

| UI | URL |
|----|-----|
| Swagger (interactive) | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Health check | http://localhost:8000/ |

---

## Running Tests

Tests use an in-memory SQLite database — the `students.db` file is never touched.

```bash
# Run all tests
pytest

# Verbose output
pytest -v

# Single file
pytest tests/test_students.py -v

# Single test
pytest tests/test_grades.py::test_average_single_course -v
```

---

## API Endpoint Reference

### Students `/students`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/students/` | Create a student |
| GET | `/students/` | List all students |
| GET | `/students/{id}` | Get a student |
| PUT | `/students/{id}` | Full update |
| PATCH | `/students/{id}` | Partial update |
| DELETE | `/students/{id}` | Delete a student |
| GET | `/students/{id}/courses` | List courses a student is enrolled in |

### Courses `/courses`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/courses/` | Create a course |
| GET | `/courses/` | List all courses |
| GET | `/courses/{id}` | Get a course |
| PUT | `/courses/{id}` | Full update |
| PATCH | `/courses/{id}` | Partial update |
| DELETE | `/courses/{id}` | Delete a course |
| POST | `/courses/{id}/enroll` | Enroll a student (body: `{"student_id": N}`) |
| DELETE | `/courses/{id}/enroll/{student_id}` | Unenroll a student |
| GET | `/courses/{id}/students` | List students enrolled in a course |

### Enrollments `/enrollments`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/enrollments/` | List enrollments (filter: `?student_id=N&course_id=N`) |
| GET | `/enrollments/{id}` | Get a single enrollment |
| DELETE | `/enrollments/{id}` | Delete an enrollment |

### Attendance `/attendance`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/attendance/` | Mark attendance |
| GET | `/attendance/` | List records (filter: `?student_id=N&course_id=N&date=YYYY-MM-DD`) |
| GET | `/attendance/{id}` | Get a record |
| PUT | `/attendance/{id}` | Update status |
| DELETE | `/attendance/{id}` | Delete a record |

Valid status values: `present`, `absent`, `late`

### Grades `/grades`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/grades/` | Record a grade |
| GET | `/grades/` | List grades (filter: `?student_id=N&course_id=N`) |
| GET | `/grades/{id}` | Get a grade |
| PUT | `/grades/{id}` | Update a grade |
| DELETE | `/grades/{id}` | Delete a grade |
| GET | `/grades/average` | Compute average (`?student_id=N`, optional `&course_id=N`) |

---

## Project Structure

```
StudentManagementSystem/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app, startup hook
│   ├── database.py      # SQLAlchemy engine and session
│   ├── models.py        # ORM models
│   ├── schemas.py       # Pydantic schemas and validation
│   └── routers/
│       ├── __init__.py
│       ├── students.py
│       ├── courses.py
│       ├── enrollments.py
│       ├── attendance.py
│       └── grades.py
├── tests/
│   ├── conftest.py      # In-memory test DB, fixtures
│   ├── test_students.py
│   ├── test_courses.py
│   ├── test_enrollments.py
│   ├── test_attendance.py
│   └── test_grades.py
├── seed.py              # Sample data loader
├── requirements.txt
└── README.md
```

---

## Validation Rules

| Rule | Detail |
|------|--------|
| Required string fields | Non-empty (min length 1) |
| Email | Must be a valid email address |
| Course credits | 1–12 inclusive |
| Grade score | Must be ≥ 0 and ≤ `max_score` |
| Attendance status | Must be `present`, `absent`, or `late` |
| Unique email | One account per email address (409 on duplicate) |
| Unique course code | (409 on duplicate) |
| Unique enrollment | Student can only be enrolled once per course (409 on duplicate) |
| Unique attendance | One record per student per course per date (409 on duplicate) |
