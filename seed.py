from datetime import date

from app.database import engine, SessionLocal, Base
from app.models import Student, Course, Enrollment, Attendance, Grade

Base.metadata.create_all(bind=engine)


def seed():
    db = SessionLocal()
    try:
        if db.query(Student).count() > 0:
            print("Database already seeded — skipping.")
            return

        # --- Students ---
        students = [
            Student(
                first_name="Alice", last_name="Johnson",
                email="alice.johnson@example.com",
                date_of_birth=date(2000, 3, 15),
                enrollment_date=date(2023, 9, 1),
            ),
            Student(
                first_name="Bob", last_name="Martinez",
                email="bob.martinez@example.com",
                date_of_birth=date(1999, 7, 22),
                enrollment_date=date(2023, 9, 1),
            ),
            Student(
                first_name="Carol", last_name="Chen",
                email="carol.chen@example.com",
                date_of_birth=date(2001, 1, 10),
                enrollment_date=date(2023, 9, 1),
            ),
            Student(
                first_name="David", last_name="Okonkwo",
                email="david.okonkwo@example.com",
                date_of_birth=date(2000, 11, 5),
                enrollment_date=date(2023, 9, 1),
            ),
            Student(
                first_name="Eva", last_name="Rosenberg",
                email="eva.rosenberg@example.com",
                date_of_birth=date(1998, 9, 18),
                enrollment_date=date(2023, 9, 1),
            ),
        ]
        db.add_all(students)
        db.flush()
        print(f"  Inserted {len(students)} students")

        # --- Courses ---
        courses = [
            Course(name="Introduction to Programming", code="CS101", credits=3),
            Course(name="Data Structures", code="CS201", credits=4),
            Course(name="Linear Algebra", code="MATH101", credits=3),
            Course(name="English Composition", code="ENG101", credits=3),
        ]
        db.add_all(courses)
        db.flush()
        print(f"  Inserted {len(courses)} courses")

        alice, bob, carol, david, eva = students
        cs101, cs201, math101, eng101 = courses

        # --- Enrollments ---
        enrollments = [
            Enrollment(student_id=alice.id, course_id=cs101.id, enrollment_date=date(2023, 9, 1)),
            Enrollment(student_id=alice.id, course_id=cs201.id, enrollment_date=date(2023, 9, 1)),
            Enrollment(student_id=alice.id, course_id=math101.id, enrollment_date=date(2023, 9, 1)),
            Enrollment(student_id=bob.id, course_id=cs101.id, enrollment_date=date(2023, 9, 1)),
            Enrollment(student_id=bob.id, course_id=eng101.id, enrollment_date=date(2023, 9, 1)),
            Enrollment(student_id=carol.id, course_id=cs201.id, enrollment_date=date(2023, 9, 1)),
            Enrollment(student_id=carol.id, course_id=math101.id, enrollment_date=date(2023, 9, 1)),
            Enrollment(student_id=carol.id, course_id=eng101.id, enrollment_date=date(2023, 9, 1)),
            Enrollment(student_id=david.id, course_id=cs101.id, enrollment_date=date(2023, 9, 1)),
            Enrollment(student_id=eva.id, course_id=cs201.id, enrollment_date=date(2023, 9, 1)),
            Enrollment(student_id=eva.id, course_id=eng101.id, enrollment_date=date(2023, 9, 1)),
        ]
        db.add_all(enrollments)
        db.flush()
        print(f"  Inserted {len(enrollments)} enrollments")

        # --- Attendance ---
        attendance_data = [
            # Alice in CS101
            Attendance(student_id=alice.id, course_id=cs101.id, date=date(2023, 9, 4), status="present"),
            Attendance(student_id=alice.id, course_id=cs101.id, date=date(2023, 9, 11), status="present"),
            Attendance(student_id=alice.id, course_id=cs101.id, date=date(2023, 9, 18), status="late"),
            # Bob in CS101
            Attendance(student_id=bob.id, course_id=cs101.id, date=date(2023, 9, 4), status="present"),
            Attendance(student_id=bob.id, course_id=cs101.id, date=date(2023, 9, 11), status="absent"),
            Attendance(student_id=bob.id, course_id=cs101.id, date=date(2023, 9, 18), status="present"),
            # Carol in CS201
            Attendance(student_id=carol.id, course_id=cs201.id, date=date(2023, 9, 5), status="present"),
            Attendance(student_id=carol.id, course_id=cs201.id, date=date(2023, 9, 12), status="present"),
            Attendance(student_id=carol.id, course_id=cs201.id, date=date(2023, 9, 19), status="present"),
            # David in CS101
            Attendance(student_id=david.id, course_id=cs101.id, date=date(2023, 9, 4), status="absent"),
            Attendance(student_id=david.id, course_id=cs101.id, date=date(2023, 9, 11), status="present"),
            Attendance(student_id=david.id, course_id=cs101.id, date=date(2023, 9, 18), status="present"),
            # Eva in ENG101
            Attendance(student_id=eva.id, course_id=eng101.id, date=date(2023, 9, 6), status="present"),
            Attendance(student_id=eva.id, course_id=eng101.id, date=date(2023, 9, 13), status="late"),
            Attendance(student_id=eva.id, course_id=eng101.id, date=date(2023, 9, 20), status="present"),
            # Alice in MATH101
            Attendance(student_id=alice.id, course_id=math101.id, date=date(2023, 9, 6), status="present"),
            Attendance(student_id=alice.id, course_id=math101.id, date=date(2023, 9, 13), status="present"),
            Attendance(student_id=alice.id, course_id=math101.id, date=date(2023, 9, 20), status="absent"),
            # Bob in ENG101
            Attendance(student_id=bob.id, course_id=eng101.id, date=date(2023, 9, 6), status="present"),
            Attendance(student_id=bob.id, course_id=eng101.id, date=date(2023, 9, 13), status="present"),
        ]
        db.add_all(attendance_data)
        db.flush()
        print(f"  Inserted {len(attendance_data)} attendance records")

        # --- Grades ---
        grades_data = [
            # Alice in CS101
            Grade(student_id=alice.id, course_id=cs101.id, assessment_name="Midterm", score=85, max_score=100, date=date(2023, 10, 15)),
            Grade(student_id=alice.id, course_id=cs101.id, assessment_name="Final", score=90, max_score=100, date=date(2023, 12, 10)),
            # Alice in CS201
            Grade(student_id=alice.id, course_id=cs201.id, assessment_name="Quiz 1", score=18, max_score=20, date=date(2023, 10, 5)),
            # Bob in CS101
            Grade(student_id=bob.id, course_id=cs101.id, assessment_name="Midterm", score=72, max_score=100, date=date(2023, 10, 15)),
            Grade(student_id=bob.id, course_id=cs101.id, assessment_name="Final", score=78, max_score=100, date=date(2023, 12, 10)),
            # Bob in ENG101
            Grade(student_id=bob.id, course_id=eng101.id, assessment_name="Essay 1", score=82, max_score=100, date=date(2023, 10, 20)),
            # Carol in CS201
            Grade(student_id=carol.id, course_id=cs201.id, assessment_name="Quiz 1", score=19, max_score=20, date=date(2023, 10, 5)),
            Grade(student_id=carol.id, course_id=cs201.id, assessment_name="Project", score=47, max_score=50, date=date(2023, 11, 30)),
            # Carol in MATH101
            Grade(student_id=carol.id, course_id=math101.id, assessment_name="Midterm", score=88, max_score=100, date=date(2023, 10, 18)),
            # David in CS101
            Grade(student_id=david.id, course_id=cs101.id, assessment_name="Midterm", score=65, max_score=100, date=date(2023, 10, 15)),
            # Eva in CS201
            Grade(student_id=eva.id, course_id=cs201.id, assessment_name="Quiz 1", score=15, max_score=20, date=date(2023, 10, 5)),
            Grade(student_id=eva.id, course_id=cs201.id, assessment_name="Project", score=43, max_score=50, date=date(2023, 11, 30)),
        ]
        db.add_all(grades_data)
        db.commit()
        print(f"  Inserted {len(grades_data)} grade records")

        print(
            f"\nSeeded: {len(students)} students, {len(courses)} courses, "
            f"{len(enrollments)} enrollments, {len(attendance_data)} attendance records, "
            f"{len(grades_data)} grades"
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding database...")
    seed()
    print("Done.")
