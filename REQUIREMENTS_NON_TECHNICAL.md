# Student Management System — User Requirements Guide

> This document explains what the Student Management System does, who it is for, and how it works — written in plain language without technical jargon.

---

## 1. What Is This System?

The **Student Management System (SMS)** is a web-based application that helps schools, colleges, or training centres manage their students, courses, and academic records — all in one place.

You can use it to:
- Keep a record of all students and their details
- Manage courses and track which students are enrolled in them
- Mark and view daily attendance
- Record grades for assessments and track student performance
- Log in securely and sign out when done

Everything is accessible through a web browser — no software installation needed for users.

---

## 2. Who Is This For?

The system has four types of users. Each user type has a different login account and can only access the parts of the system that are relevant to their role.

| User Type | What they can do |
|-----------|-----------------|
| **Administrator** | Has full access — can manage everything: students, courses, enrollments, attendance, and grades |
| **Student Admin** | Can manage students and enrollments only |
| **Course Admin** | Can manage courses and enrollments only |
| **Teacher** | Can view the Dashboard and mark attendance only — cannot edit or delete attendance records |

When a user tries to open a section they are not allowed to access, the system shows an **Access Restricted** message and does not show any data.

---

## 3. User Accounts and Login Credentials

Each user type has a separate account. Use the credentials below to sign in:

| User Type | Username | Password | What they can access |
|-----------|----------|----------|----------------------|
| Administrator | `admin` | `admin123` | Everything |
| Student Admin | `studentadmin` | `student123` | Dashboard, Students, Enrollments |
| Course Admin | `courseadmin` | `course123` | Dashboard, Courses, Enrollments |
| Teacher | `teacher` | `teacher123` | Dashboard, Attendance (mark only) |

> These are demo accounts for testing. In a real system, passwords would be set by your IT team.

---

## 4. How to Access the System

1. Open a web browser (e.g. Chrome, Edge, Firefox).
2. Go to the application address provided by your IT team (e.g. `http://localhost:8000`).
3. You will be taken to the **Login Page** automatically.
4. Enter your username and password, then click **Sign In**.
5. The system redirects you to the **Dashboard** once logged in.
6. Click **Sign Out** in the bottom-left corner when you are finished.

> The login page shows all demo accounts and their passwords for easy reference during testing.

---

## 5. Pages and Features

### 5.1 Dashboard

The first page you see after logging in.

**What it shows:**
- Total number of students in the system
- Total number of courses available
- Total number of enrollments
- Total attendance records
- Total grade records

**Quick action buttons** allow you to jump directly to any section without using the sidebar menu.

**Charts:**

| Chart | What it shows |
|-------|--------------|
| Students Enrolled per Course | A doughnut chart showing how many students are enrolled in each course. Each slice represents one course — hovering over a slice shows the exact student count. |
| Average Grade per Course (%) | A doughnut chart showing the average grade percentage achieved in each course. Only courses that have at least one grade recorded are shown. |

The two charts are displayed side by side on wide screens and stack vertically on smaller screens (tablets and phones).

---

### 5.2 Students

This section stores the personal details of every student.

**Information stored per student:**
- First name and last name
- Email address (must be unique — no two students can share an email)
- Date of birth
- Enrollment date

**What you can do:**
| Action | How |
|--------|-----|
| View all students | Open the Students page — all students are listed in a table |
| Add a new student | Click **Add Student**, fill in the form, and save |
| Edit a student's details | Click the **Edit** button next to the student |
| Remove a student | Click the **Delete** button next to the student |

> Deleting a student also removes all their enrollment, attendance, and grade records automatically.

---

### 5.3 Courses

This section manages the courses offered by your institution.

**Information stored per course:**
- Course name (e.g. "Introduction to Mathematics")
- Course code (e.g. "MATH101") — must be unique
- Number of credits (between 1 and 12)

**What you can do:**
| Action | How |
|--------|-----|
| View all courses | Open the Courses page |
| Add a new course | Click **Add Course** and fill in the details |
| Edit a course | Click **Edit** next to the course |
| Remove a course | Click **Delete** next to the course |

> Deleting a course also removes all related enrollment, attendance, and grade records.

---

### 5.4 Enrollments

This section tracks which students are enrolled in which courses.

**Information stored per enrollment:**
- Student name
- Course name
- Date of enrollment

**What you can do:**
| Action | How |
|--------|-----|
| View all enrollments | Open the Enrollments page |
| Enroll a student in a course | Click **Enroll Student**, choose the student and course, and save |
| Remove an enrollment | Click **Delete** next to the enrollment record |

> A student cannot be enrolled in the same course more than once. The system will show a warning if you try.

---

### 5.5 Attendance

This section records whether each student was present, absent, or late on a given day for a particular course.

**Information stored per attendance record:**
- Student name
- Course name
- Date
- Status: **Present**, **Absent**, or **Late**

**What you can do:**
| Action | How |
|--------|-----|
| View all attendance records | Open the Attendance page |
| Filter records | Filter by student, course, or date |
| Mark attendance | Click **Mark Attendance**, choose the student, course, date, and status |
| Update a record | Click **Edit** to change the status |
| Delete a record | Click **Delete** to remove the entry |

> Only one attendance record is allowed per student per course per day. If you try to add a duplicate, the system will warn you.

**Status colour guide:**

| Status | Colour |
|--------|--------|
| Present | Green |
| Absent | Red |
| Late | Amber |

---

### 5.6 Grades

This section records assessment results for students and automatically calculates their average performance.

**Information stored per grade record:**
- Student name
- Course name
- Assessment name (e.g. "Midterm Exam", "Assignment 1")
- Score achieved
- Maximum possible score
- Date of assessment

**What you can do:**
| Action | How |
|--------|-----|
| View all grade records | Open the Grades page |
| Filter by student or course | Use the filter options at the top |
| Record a grade | Click **Record Grade** and fill in the details |
| Edit a grade | Click **Edit** next to the record |
| Delete a grade | Click **Delete** next to the record |
| View average performance | An average score card is shown for each student based on all their recorded grades |

> The system will not allow you to enter a score higher than the maximum possible score.

---

## 6. Navigation

The **sidebar menu** on the left side of the screen lets you switch between sections at any time.

Sections your account **cannot access** are shown in a faded/greyed-out style. Clicking them will show an **Access Restricted** message instead of any data.

**Example — Administrator (full access):**
```
SMS  Student MS
─────────────────
● Dashboard
  Students
  Courses
  Enrollments
  Attendance
  Grades
─────────────────
  admin
  Administrator   [Sign Out]
```

**Example — Teacher (attendance only):**
```
SMS  Student MS
─────────────────
● Dashboard
  Students        ← greyed out (no access)
  Courses         ← greyed out (no access)
  Enrollments     ← greyed out (no access)
  Attendance
  Grades          ← greyed out (no access)
─────────────────
  teacher
  Teacher         [Sign Out]
```

- The currently active section is highlighted in the menu.
- Your username and role title are shown at the bottom of the sidebar.
- Clicking **Sign Out** logs you out and returns you to the login screen.

---

## 7. Notifications and Feedback

The system gives you instant feedback for every action:

| Situation | What happens |
|-----------|-------------|
| Record saved successfully | A **green notification** appears briefly at the top |
| An error occurred | A **red notification** appears with a description of the issue |
| Duplicate entry detected | A **warning message** appears before any data is lost |

---

## 8. Data Validation — What the System Checks

The system automatically checks your input before saving to make sure data is accurate:

| Rule | Example |
|------|---------|
| Names cannot be blank | First name and last name must be filled in |
| Email must be a valid address | `john@example.com` is valid; `johnexample` is not |
| Course credits must be between 1 and 12 | You cannot enter 0 or 15 |
| Score cannot exceed maximum score | A score of 95 with a max of 100 is fine; 105 is not |
| Attendance status must be Present, Absent, or Late | No other values are accepted |
| Student email must be unique | Two students cannot share the same email address |
| Course code must be unique | Two courses cannot have the same code |

---

## 9. Sample Data Available

When the system is first set up, sample data can be loaded so you can explore all features right away without entering data manually:

| What | How many |
|------|----------|
| Students | 5 (Alice, Bob, Carol, David, Eva) |
| Courses | 4 (CS101, CS201, MATH101, ENG101) |
| Enrollments | 11 |
| Attendance records | 20 |
| Grade records | 12 |

---

## 10. Security and Privacy

- The system requires a **username and password** to access.
- Your session is automatically cleared when you close the browser tab — no one else can access your session.
- Clicking **Sign Out** immediately ends your session and redirects to the login page.

---

## 11. Frequently Asked Questions

**Q: What happens if I delete a student by mistake?**
All of that student's enrollment, attendance, and grade records are also deleted. There is no undo — please confirm before deleting.

**Q: Can two students have the same email address?**
No. The system enforces unique email addresses. You will see an error if you try to add a duplicate.

**Q: Can a student be enrolled in the same course twice?**
No. The system prevents duplicate enrollments and will show a warning.

**Q: What does the average percentage on the Grades page mean?**
It is the student's total score across all recorded assessments divided by the total maximum possible score, expressed as a percentage.

**Q: What if I enter the wrong attendance status?**
Administrators and Student Admins can edit any attendance record at any time by clicking the **Edit** button. Teachers cannot edit existing records — they can only mark new ones.

**Q: I can see a section in the sidebar but it is greyed out — why?**
Your account does not have permission to access that section. Contact your administrator if you believe you need access.

**Q: Can a Teacher see the Students or Grades pages?**
No. Teachers can only access the Dashboard and the Attendance page. Attempting to open any other section will show an Access Restricted message.

**Q: Can I use this on my phone or tablet?**
Yes. The application is designed to work on any screen size — desktop, tablet, or mobile.

**Q: What browser should I use?**
Any modern browser works: Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari.

---

## 12. Glossary

| Term | Plain-language meaning |
|------|----------------------|
| **Enrollment** | A record that links a student to a course they are studying |
| **Attendance** | A record of whether a student showed up to a class on a given day |
| **Grade** | A score a student received on a specific assessment (e.g. test, assignment) |
| **Assessment** | Any graded activity — exam, quiz, assignment, project, etc. |
| **Credits** | A number that represents how much weight a course carries in a study programme |
| **Average percentage** | A summary of a student's overall performance across all their graded assessments |
| **Session** | Your active login period; it ends when you sign out or close the browser |
| **Dashboard** | The home page that gives a quick summary of all records in the system |
| **Role** | The type of user account you have, which determines what sections of the system you can use |
| **Access Restricted** | The message shown when you try to open a section your role is not permitted to view |
| **Administrator** | A user with full access to every section of the system |
| **Student Admin** | A user who can manage students and enrollments but not courses, attendance, or grades |
| **Course Admin** | A user who can manage courses and enrollments but not students, attendance, or grades |
| **Teacher** | A user who can only mark attendance — cannot view students, courses, enrollments, or grades |
