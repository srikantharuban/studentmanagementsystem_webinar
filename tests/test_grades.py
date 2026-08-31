STUDENT_PAYLOAD = {
    "first_name": "Alice",
    "last_name": "Johnson",
    "email": "alice@example.com",
    "date_of_birth": "2000-03-15",
    "enrollment_date": "2023-09-01",
}

COURSE_PAYLOAD = {
    "name": "Introduction to Programming",
    "code": "CS101",
    "credits": 3,
}


def _setup(client):
    student = client.post("/students/", json=STUDENT_PAYLOAD).json()
    course = client.post("/courses/", json=COURSE_PAYLOAD).json()
    return student, course


def _grade(client, student_id, course_id, score=85, max_score=100, name="Midterm"):
    return client.post(
        "/grades/",
        json={
            "student_id": student_id,
            "course_id": course_id,
            "assessment_name": name,
            "score": score,
            "max_score": max_score,
            "date": "2023-10-15",
        },
    )


def test_record_grade_success(client):
    student, course = _setup(client)
    resp = _grade(client, student["id"], course["id"])
    assert resp.status_code == 201
    data = resp.json()
    assert data["score"] == 85.0
    assert data["assessment_name"] == "Midterm"


def test_record_grade_score_exceeds_max(client):
    student, course = _setup(client)
    resp = _grade(client, student["id"], course["id"], score=95, max_score=90)
    assert resp.status_code == 422


def test_record_grade_negative_score(client):
    student, course = _setup(client)
    resp = _grade(client, student["id"], course["id"], score=-1)
    assert resp.status_code == 422


def test_list_grades_by_student(client):
    student, course = _setup(client)
    _grade(client, student["id"], course["id"], name="Midterm")
    _grade(client, student["id"], course["id"], name="Final")
    resp = client.get("/grades/", params={"student_id": student["id"]})
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_list_grades_by_course(client):
    student, course = _setup(client)
    s2 = client.post("/students/", json={**STUDENT_PAYLOAD, "email": "bob@example.com"}).json()
    _grade(client, student["id"], course["id"])
    _grade(client, s2["id"], course["id"])
    resp = client.get("/grades/", params={"course_id": course["id"]})
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_update_grade(client):
    student, course = _setup(client)
    created = _grade(client, student["id"], course["id"]).json()
    resp = client.put(f"/grades/{created['id']}", json={"score": 92})
    assert resp.status_code == 200
    assert resp.json()["score"] == 92.0


def test_update_grade_score_exceeds_max(client):
    student, course = _setup(client)
    created = _grade(client, student["id"], course["id"], score=85, max_score=100).json()
    # Try to set score above existing max_score
    resp = client.put(f"/grades/{created['id']}", json={"score": 110})
    assert resp.status_code == 422


def test_delete_grade(client):
    student, course = _setup(client)
    created = _grade(client, student["id"], course["id"]).json()
    resp = client.delete(f"/grades/{created['id']}")
    assert resp.status_code == 204
    assert client.get(f"/grades/{created['id']}").status_code == 404


def test_average_single_course(client):
    student, course = _setup(client)
    _grade(client, student["id"], course["id"], score=80, max_score=100, name="Midterm")
    _grade(client, student["id"], course["id"], score=90, max_score=100, name="Final")
    resp = client.get("/grades/average", params={"student_id": student["id"], "course_id": course["id"]})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_assessments"] == 2
    assert data["average_percentage"] == 85.0


def test_average_all_courses(client):
    student, course1 = _setup(client)
    course2 = client.post("/courses/", json={**COURSE_PAYLOAD, "code": "CS201"}).json()
    _grade(client, student["id"], course1["id"], score=100, max_score=100, name="A")
    _grade(client, student["id"], course2["id"], score=50, max_score=100, name="B")
    resp = client.get("/grades/average", params={"student_id": student["id"]})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_assessments"] == 2
    assert data["average_percentage"] == 75.0


def test_average_no_grades(client):
    student, course = _setup(client)
    resp = client.get("/grades/average", params={"student_id": student["id"]})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_assessments"] == 0
    assert data["average_percentage"] == 0.0
