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


def _create_student(client, email="alice@example.com"):
    return client.post("/students/", json={**STUDENT_PAYLOAD, "email": email}).json()


def _create_course(client, code="CS101"):
    return client.post("/courses/", json={**COURSE_PAYLOAD, "code": code}).json()


def test_enroll_student_success(client):
    student = _create_student(client)
    course = _create_course(client)
    resp = client.post(
        f"/courses/{course['id']}/enroll",
        json={"student_id": student["id"], "enrollment_date": "2023-09-01"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["student_id"] == student["id"]
    assert data["course_id"] == course["id"]


def test_enroll_student_duplicate(client):
    student = _create_student(client)
    course = _create_course(client)
    client.post(f"/courses/{course['id']}/enroll", json={"student_id": student["id"]})
    resp = client.post(f"/courses/{course['id']}/enroll", json={"student_id": student["id"]})
    assert resp.status_code == 409


def test_enroll_nonexistent_student(client):
    course = _create_course(client)
    resp = client.post(f"/courses/{course['id']}/enroll", json={"student_id": 9999})
    assert resp.status_code == 404


def test_enroll_nonexistent_course(client):
    student = _create_student(client)
    resp = client.post("/courses/9999/enroll", json={"student_id": student["id"]})
    assert resp.status_code == 404


def test_unenroll_student_success(client):
    student = _create_student(client)
    course = _create_course(client)
    client.post(f"/courses/{course['id']}/enroll", json={"student_id": student["id"]})
    resp = client.delete(f"/courses/{course['id']}/enroll/{student['id']}")
    assert resp.status_code == 204
    # Verify gone
    enrollments = client.get("/enrollments/", params={"student_id": student["id"]}).json()
    assert enrollments == []


def test_unenroll_not_enrolled(client):
    student = _create_student(client)
    course = _create_course(client)
    resp = client.delete(f"/courses/{course['id']}/enroll/{student['id']}")
    assert resp.status_code == 404


def test_list_students_in_course(client):
    s1 = _create_student(client, "s1@example.com")
    s2 = _create_student(client, "s2@example.com")
    course = _create_course(client)
    client.post(f"/courses/{course['id']}/enroll", json={"student_id": s1["id"]})
    client.post(f"/courses/{course['id']}/enroll", json={"student_id": s2["id"]})
    resp = client.get(f"/courses/{course['id']}/students")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_list_courses_for_student(client):
    student = _create_student(client)
    c1 = _create_course(client, "CS101")
    c2 = _create_course(client, "CS201")
    client.post(f"/courses/{c1['id']}/enroll", json={"student_id": student["id"]})
    client.post(f"/courses/{c2['id']}/enroll", json={"student_id": student["id"]})
    resp = client.get(f"/students/{student['id']}/courses")
    assert resp.status_code == 200
    assert len(resp.json()) == 2
