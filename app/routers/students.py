from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.models import Student, Enrollment, Course
from app.schemas import StudentCreate, StudentUpdate, StudentResponse, CourseResponse

router = APIRouter(prefix="/students", tags=["Students"])


def _get_student_or_404(student_id: int, db: Session) -> Student:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    student = Student(**payload.model_dump())
    db.add(student)
    try:
        db.commit()
        db.refresh(student)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")
    return student


@router.get("/", response_model=list[StudentResponse])
def list_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Student).offset(skip).limit(limit).all()


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    return _get_student_or_404(student_id, db)


@router.put("/{student_id}", response_model=StudentResponse)
def update_student_full(student_id: int, payload: StudentCreate, db: Session = Depends(get_db)):
    student = _get_student_or_404(student_id, db)
    for field, value in payload.model_dump().items():
        setattr(student, field, value)
    try:
        db.commit()
        db.refresh(student)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")
    return student


@router.patch("/{student_id}", response_model=StudentResponse)
def update_student_partial(student_id: int, payload: StudentUpdate, db: Session = Depends(get_db)):
    student = _get_student_or_404(student_id, db)
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(student, field, value)
    try:
        db.commit()
        db.refresh(student)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")
    return student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = _get_student_or_404(student_id, db)
    db.delete(student)
    db.commit()


@router.get("/{student_id}/courses", response_model=list[CourseResponse])
def list_student_courses(student_id: int, db: Session = Depends(get_db)):
    _get_student_or_404(student_id, db)
    enrollments = (
        db.query(Enrollment).filter(Enrollment.student_id == student_id).all()
    )
    return [e.course for e in enrollments]
