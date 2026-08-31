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


def _mark(client, student_id, course_id, date="2023-09-04", status="present"):
    return client.post(
        "/attendance/",
        json={"student_id": student_id, "course_id": course_id, "date": date, "status": status},
    )


def test_mark_attendance_success(client):
    student, course = _setup(client)
    resp = _mark(client, student["id"], course["id"])
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "present"
    assert data["student_id"] == student["id"]


def test_mark_attendance_invalid_status(client):
    student, course = _setup(client)
    resp = _mark(client, student["id"], course["id"], status="missing")
    assert resp.status_code == 422


def test_mark_attendance_duplicate(client):
    student, course = _setup(client)
    _mark(client, student["id"], course["id"])
    resp = _mark(client, student["id"], course["id"])
    assert resp.status_code == 409


def test_get_attendance_by_student(client):
    student, course = _setup(client)
    _mark(client, student["id"], course["id"], date="2023-09-04")
    _mark(client, student["id"], course["id"], date="2023-09-11")
    resp = client.get("/attendance/", params={"student_id": student["id"]})
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_attendance_by_course(client):
    student, course = _setup(client)
    s2 = client.post("/students/", json={**STUDENT_PAYLOAD, "email": "bob@example.com"}).json()
    _mark(client, student["id"], course["id"])
    _mark(client, s2["id"], course["id"])
    resp = client.get("/attendance/", params={"course_id": course["id"]})
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_attendance_record(client):
    student, course = _setup(client)
    created = _mark(client, student["id"], course["id"]).json()
    resp = client.get(f"/attendance/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]


def test_update_attendance_status(client):
    student, course = _setup(client)
    created = _mark(client, student["id"], course["id"]).json()
    resp = client.put(f"/attendance/{created['id']}", json={"status": "absent"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "absent"


def test_update_attendance_not_found(client):
    resp = client.put("/attendance/9999", json={"status": "absent"})
    assert resp.status_code == 404


def test_delete_attendance(client):
    student, course = _setup(client)
    created = _mark(client, student["id"], course["id"]).json()
    resp = client.delete(f"/attendance/{created['id']}")
    assert resp.status_code == 204
    assert client.get(f"/attendance/{created['id']}").status_code == 404
