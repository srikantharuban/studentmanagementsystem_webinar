from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.models import Course, Enrollment, Student
from app.schemas import (
    CourseCreate, CourseUpdate, CourseResponse,
    EnrollCourseBody, EnrollmentResponse, StudentResponse,
)

router = APIRouter(prefix="/courses", tags=["Courses"])


def _get_course_or_404(course_id: int, db: Session) -> Course:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def _get_student_or_404(student_id: int, db: Session) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(payload: CourseCreate, db: Session = Depends(get_db)):
    course = Course(**payload.model_dump())
    db.add(course)
    try:
        db.commit()
        db.refresh(course)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Course code already exists")
    return course


@router.get("/", response_model=list[CourseResponse])
def list_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Course).offset(skip).limit(limit).all()


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    return _get_course_or_404(course_id, db)


@router.put("/{course_id}", response_model=CourseResponse)
def update_course_full(course_id: int, payload: CourseCreate, db: Session = Depends(get_db)):
    course = _get_course_or_404(course_id, db)
    for field, value in payload.model_dump().items():
        setattr(course, field, value)
    try:
        db.commit()
        db.refresh(course)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Course code already exists")
    return course


@router.patch("/{course_id}", response_model=CourseResponse)
def update_course_partial(course_id: int, payload: CourseUpdate, db: Session = Depends(get_db)):
    course = _get_course_or_404(course_id, db)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(course, field, value)
    try:
        db.commit()
        db.refresh(course)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Course code already exists")
    return course


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = _get_course_or_404(course_id, db)
    db.delete(course)
    db.commit()


@router.post(
    "/{course_id}/enroll",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def enroll_student(course_id: int, body: EnrollCourseBody, db: Session = Depends(get_db)):
    _get_course_or_404(course_id, db)
    _get_student_or_404(body.student_id, db)
    enrollment = Enrollment(
        student_id=body.student_id,
        course_id=course_id,
        enrollment_date=body.enrollment_date,
    )
    db.add(enrollment)
    try:
        db.commit()
        db.refresh(enrollment)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Student already enrolled in this course")
    return enrollment


@router.delete("/{course_id}/enroll/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def unenroll_student(course_id: int, student_id: int, db: Session = Depends(get_db)):
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.course_id == course_id, Enrollment.student_id == student_id)
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    db.delete(enrollment)
    db.commit()


@router.get("/{course_id}/students", response_model=list[StudentResponse])
def list_course_students(course_id: int, db: Session = Depends(get_db)):
    _get_course_or_404(course_id, db)
    enrollments = (
        db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    )
    return [e.student for e in enrollments]
