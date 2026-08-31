from typing import Optional

from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.models import Grade, Student, Course
from app.schemas import GradeCreate, GradeUpdate, GradeResponse, StudentAverageResponse

router = APIRouter(prefix="/grades", tags=["Grades"])


def _get_grade_or_404(grade_id: int, db: Session) -> Grade:
    grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    return grade


# /grades/average must be registered before /{grade_id} to avoid path collision
@router.get("/average", response_model=StudentAverageResponse)
def get_student_average(
    student_id: int,
    course_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    if not db.query(Student).filter(Student.id == student_id).first():
        raise HTTPException(status_code=404, detail="Student not found")
    query = db.query(Grade).filter(Grade.student_id == student_id)
    if course_id is not None:
        query = query.filter(Grade.course_id == course_id)
    grades = query.all()
    if not grades:
        return StudentAverageResponse(
            student_id=student_id,
            course_id=course_id,
            average_percentage=0.0,
            total_assessments=0,
        )
    total = sum(g.score / g.max_score * 100 for g in grades)
    return StudentAverageResponse(
        student_id=student_id,
        course_id=course_id,
        average_percentage=round(total / len(grades), 2),
        total_assessments=len(grades),
    )


@router.post("/", response_model=GradeResponse, status_code=status.HTTP_201_CREATED)
def record_grade(payload: GradeCreate, db: Session = Depends(get_db)):
    if not db.query(Student).filter(Student.id == payload.student_id).first():
        raise HTTPException(status_code=404, detail="Student not found")
    if not db.query(Course).filter(Course.id == payload.course_id).first():
        raise HTTPException(status_code=404, detail="Course not found")
    grade = Grade(**payload.model_dump())
    db.add(grade)
    db.commit()
    db.refresh(grade)
    return grade


@router.get("/", response_model=list[GradeResponse])
def list_grades(
    student_id: Optional[int] = None,
    course_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Grade)
    if student_id is not None:
        query = query.filter(Grade.student_id == student_id)
    if course_id is not None:
        query = query.filter(Grade.course_id == course_id)
    return query.all()


@router.get("/{grade_id}", response_model=GradeResponse)
def get_grade(grade_id: int, db: Session = Depends(get_db)):
    return _get_grade_or_404(grade_id, db)


@router.put("/{grade_id}", response_model=GradeResponse)
def update_grade(grade_id: int, payload: GradeUpdate, db: Session = Depends(get_db)):
    grade = _get_grade_or_404(grade_id, db)
    updates = payload.model_dump(exclude_none=True)
    # Check score <= max_score using current values merged with updates
    new_score = updates.get("score", grade.score)
    new_max = updates.get("max_score", grade.max_score)
    if new_score > new_max:
        raise HTTPException(status_code=422, detail="score must not exceed max_score")
    for field, value in updates.items():
        setattr(grade, field, value)
    db.commit()
    db.refresh(grade)
    return grade


@router.delete("/{grade_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grade(grade_id: int, db: Session = Depends(get_db)):
    grade = _get_grade_or_404(grade_id, db)
    db.delete(grade)
    db.commit()
