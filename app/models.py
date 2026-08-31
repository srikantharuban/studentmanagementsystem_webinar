from datetime import date

from sqlalchemy import (
    Column, Date, Float, ForeignKey, Integer, String, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    date_of_birth = Column(Date, nullable=False)
    enrollment_date = Column(Date, nullable=False, default=date.today)

    enrollments = relationship(
        "Enrollment", back_populates="student", cascade="all, delete-orphan"
    )
    attendances = relationship(
        "Attendance", back_populates="student", cascade="all, delete-orphan"
    )
    grades = relationship(
        "Grade", back_populates="student", cascade="all, delete-orphan"
    )


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    code = Column(String(20), nullable=False, unique=True, index=True)
    credits = Column(Integer, nullable=False)

    enrollments = relationship(
        "Enrollment", back_populates="course", cascade="all, delete-orphan"
    )
    attendances = relationship(
        "Attendance", back_populates="course", cascade="all, delete-orphan"
    )
    grades = relationship(
        "Grade", back_populates="course", cascade="all, delete-orphan"
    )


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (UniqueConstraint("student_id", "course_id"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(
        Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False
    )
    course_id = Column(
        Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    enrollment_date = Column(Date, nullable=False, default=date.today)

    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("student_id", "course_id", "date"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(
        Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False
    )
    course_id = Column(
        Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    date = Column(Date, nullable=False)
    status = Column(String(10), nullable=False)

    student = relationship("Student", back_populates="attendances")
    course = relationship("Course", back_populates="attendances")


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(
        Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False
    )
    course_id = Column(
        Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    assessment_name = Column(String(200), nullable=False)
    score = Column(Float, nullable=False)
    max_score = Column(Float, nullable=False)
    date = Column(Date, nullable=False)

    student = relationship("Student", back_populates="grades")
    course = relationship("Course", back_populates="grades")
