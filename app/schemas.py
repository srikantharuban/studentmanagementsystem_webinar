from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Student
# ---------------------------------------------------------------------------

class StudentCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    date_of_birth: date
    enrollment_date: date = Field(default_factory=date.today)

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def strip_name(cls, v):
        return v.strip() if isinstance(v, str) else v


class StudentUpdate(BaseModel):
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    date_of_birth: Optional[date] = None
    enrollment_date: Optional[date] = None

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def strip_name(cls, v):
        return v.strip() if isinstance(v, str) else v


class StudentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    email: str
    date_of_birth: date
    enrollment_date: date


# ---------------------------------------------------------------------------
# Course
# ---------------------------------------------------------------------------

class CourseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    code: str = Field(min_length=1, max_length=20)
    credits: int = Field(ge=1, le=12)

    @field_validator("code", mode="before")
    @classmethod
    def normalize_code(cls, v):
        return v.strip().upper() if isinstance(v, str) else v


class CourseUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    code: Optional[str] = Field(default=None, min_length=1, max_length=20)
    credits: Optional[int] = Field(default=None, ge=1, le=12)

    @field_validator("code", mode="before")
    @classmethod
    def normalize_code(cls, v):
        return v.strip().upper() if isinstance(v, str) else v


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    credits: int


# ---------------------------------------------------------------------------
# Enrollment
# ---------------------------------------------------------------------------

class EnrollmentCreate(BaseModel):
    student_id: int = Field(gt=0)
    course_id: int = Field(gt=0)
    enrollment_date: date = Field(default_factory=date.today)


class EnrollCourseBody(BaseModel):
    student_id: int = Field(gt=0)
    enrollment_date: date = Field(default_factory=date.today)


class EnrollmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    course_id: int
    enrollment_date: date


# ---------------------------------------------------------------------------
# Attendance
# ---------------------------------------------------------------------------

class AttendanceStatus(str, Enum):
    present = "present"
    absent = "absent"
    late = "late"


class AttendanceCreate(BaseModel):
    student_id: int = Field(gt=0)
    course_id: int = Field(gt=0)
    date: date
    status: AttendanceStatus


class AttendanceUpdate(BaseModel):
    status: AttendanceStatus


class AttendanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    course_id: int
    date: date
    status: str


# ---------------------------------------------------------------------------
# Grade
# ---------------------------------------------------------------------------

class GradeCreate(BaseModel):
    student_id: int = Field(gt=0)
    course_id: int = Field(gt=0)
    assessment_name: str = Field(min_length=1, max_length=200)
    score: float = Field(ge=0)
    max_score: float = Field(gt=0)
    date: date

    @field_validator("assessment_name", mode="before")
    @classmethod
    def strip_assessment(cls, v):
        return v.strip() if isinstance(v, str) else v

    @model_validator(mode="after")
    def score_within_max(self):
        if self.score > self.max_score:
            raise ValueError("score must not exceed max_score")
        return self


class GradeUpdate(BaseModel):
    assessment_name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    score: Optional[float] = Field(default=None, ge=0)
    max_score: Optional[float] = Field(default=None, gt=0)
    date: Optional[date] = None

    @field_validator("assessment_name", mode="before")
    @classmethod
    def strip_assessment(cls, v):
        return v.strip() if isinstance(v, str) else v

    @model_validator(mode="after")
    def score_within_max(self):
        if self.score is not None and self.max_score is not None:
            if self.score > self.max_score:
                raise ValueError("score must not exceed max_score")
        return self


class GradeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    course_id: int
    assessment_name: str
    score: float
    max_score: float
    date: date


class StudentAverageResponse(BaseModel):
    student_id: int
    course_id: Optional[int]
    average_percentage: float
    total_assessments: int
