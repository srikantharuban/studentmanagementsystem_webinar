STUDENT_PAYLOAD = {
    "first_name": "Alice",
    "last_name": "Johnson",
    "email": "alice@example.com",
    "date_of_birth": "2000-03-15",
    "enrollment_date": "2023-09-01",
}


def test_create_student_success(client):
    resp = client.post("/students/", json=STUDENT_PAYLOAD)
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "alice@example.com"
    assert data["first_name"] == "Alice"
    assert "id" in data


def test_create_student_missing_field(client):
    payload = {k: v for k, v in STUDENT_PAYLOAD.items() if k != "email"}
    resp = client.post("/students/", json=payload)
    assert resp.status_code == 422


def test_create_student_invalid_email(client):
    resp = client.post("/students/", json={**STUDENT_PAYLOAD, "email": "notanemail"})
    assert resp.status_code == 422


def test_create_student_duplicate_email(client):
    client.post("/students/", json=STUDENT_PAYLOAD)
    resp = client.post("/students/", json=STUDENT_PAYLOAD)
    assert resp.status_code == 409


def test_list_students_empty(client):
    resp = client.get("/students/")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_students(client):
    client.post("/students/", json=STUDENT_PAYLOAD)
    client.post("/students/", json={**STUDENT_PAYLOAD, "email": "bob@example.com"})
    resp = client.get("/students/")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_student_success(client):
    created = client.post("/students/", json=STUDENT_PAYLOAD).json()
    resp = client.get(f"/students/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["id"] == created["id"]


def test_get_student_not_found(client):
    resp = client.get("/students/9999")
    assert resp.status_code == 404


def test_update_student_partial(client):
    created = client.post("/students/", json=STUDENT_PAYLOAD).json()
    resp = client.patch(f"/students/{created['id']}", json={"last_name": "Smith"})
    assert resp.status_code == 200
    assert resp.json()["last_name"] == "Smith"


def test_update_student_not_found(client):
    resp = client.patch("/students/9999", json={"last_name": "Smith"})
    assert resp.status_code == 404


def test_delete_student_success(client):
    created = client.post("/students/", json=STUDENT_PAYLOAD).json()
    resp = client.delete(f"/students/{created['id']}")
    assert resp.status_code == 204
    assert client.get(f"/students/{created['id']}").status_code == 404


def test_delete_student_not_found(client):
    resp = client.delete("/students/9999")
    assert resp.status_code == 404
