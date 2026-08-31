from typing import Optional

from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.models import Enrollment
from app.schemas import EnrollmentResponse

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


@router.get("/", response_model=list[EnrollmentResponse])
def list_enrollments(
    student_id: Optional[int] = None,
    course_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Enrollment)
    if student_id is not None:
        query = query.filter(Enrollment.student_id == student_id)
    if course_id is not None:
        query = query.filter(Enrollment.course_id == course_id)
    return query.all()


@router.get("/{enrollment_id}", response_model=EnrollmentResponse)
def get_enrollment(enrollment_id: int, db: Session = Depends(get_db)):
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    return enrollment


@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enrollment(enrollment_id: int, db: Session = Depends(get_db)):
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    db.delete(enrollment)
    db.commit()
