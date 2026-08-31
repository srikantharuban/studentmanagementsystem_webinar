from datetime import date as date_type
from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.models import Attendance, Student, Course
from app.schemas import AttendanceCreate, AttendanceUpdate, AttendanceResponse

router = APIRouter(prefix="/attendance", tags=["Attendance"])


def _get_attendance_or_404(attendance_id: int, db: Session) -> Attendance:
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return record


@router.post("/", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def mark_attendance(payload: AttendanceCreate, db: Session = Depends(get_db)):
    if not db.query(Student).filter(Student.id == payload.student_id).first():
        raise HTTPException(status_code=404, detail="Student not found")
    if not db.query(Course).filter(Course.id == payload.course_id).first():
        raise HTTPException(status_code=404, detail="Course not found")
    record = Attendance(**payload.model_dump())
    db.add(record)
    try:
        db.commit()
        db.refresh(record)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Attendance already marked for this student on this date in this course",
        )
    return record


@router.get("/", response_model=list[AttendanceResponse])
def list_attendance(
    student_id: Optional[int] = None,
    course_id: Optional[int] = None,
    date: Optional[date_type] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Attendance)
    if student_id is not None:
        query = query.filter(Attendance.student_id == student_id)
    if course_id is not None:
        query = query.filter(Attendance.course_id == course_id)
    if date is not None:
        query = query.filter(Attendance.date == date)
    return query.all()


@router.get("/{attendance_id}", response_model=AttendanceResponse)
def get_attendance(attendance_id: int, db: Session = Depends(get_db)):
    return _get_attendance_or_404(attendance_id, db)


@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: int, payload: AttendanceUpdate, db: Session = Depends(get_db)
):
    record = _get_attendance_or_404(attendance_id, db)
    record.status = payload.status.value
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(attendance_id: int, db: Session = Depends(get_db)):
    record = _get_attendance_or_404(attendance_id, db)
    db.delete(record)
    db.commit()
