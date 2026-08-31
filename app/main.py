from fastapi import FastAPI
from fastapi.openapi.docs import get_redoc_html
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.database import engine, Base
from app.routers import students, courses, enrollments, attendance, grades

app = FastAPI(
    title="Student Management System",
    description="REST API for managing students, courses, enrollments, attendance, and grades.",
    version="1.0.0",
    redoc_url=None,
)


@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)


app.include_router(students.router)
app.include_router(courses.router)
app.include_router(enrollments.router)
app.include_router(attendance.router)
app.include_router(grades.router)


@app.get("/redoc", include_in_schema=False)
def redoc_html() -> HTMLResponse:
    return get_redoc_html(
        openapi_url="/openapi.json",
        title="Student Management System - ReDoc",
        redoc_js_url="https://cdn.jsdelivr.net/npm/redoc/bundles/redoc.standalone.js",
    )


@app.get("/", tags=["Health"], include_in_schema=False)
def root():
    return RedirectResponse(url="/ui/")


app.mount("/ui", StaticFiles(directory="static", html=True), name="static")
