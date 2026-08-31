COURSE_PAYLOAD = {
    "name": "Introduction to Programming",
    "code": "CS101",
    "credits": 3,
}


def test_create_course_success(client):
    resp = client.post("/courses/", json=COURSE_PAYLOAD)
    assert resp.status_code == 201
    data = resp.json()
    assert data["code"] == "CS101"
    assert "id" in data


def test_create_course_duplicate_code(client):
    client.post("/courses/", json=COURSE_PAYLOAD)
    resp = client.post("/courses/", json=COURSE_PAYLOAD)
    assert resp.status_code == 409


def test_create_course_invalid_credits_zero(client):
    resp = client.post("/courses/", json={**COURSE_PAYLOAD, "credits": 0})
    assert resp.status_code == 422


def test_create_course_invalid_credits_too_high(client):
    resp = client.post("/courses/", json={**COURSE_PAYLOAD, "credits": 13})
    assert resp.status_code == 422


def test_list_courses(client):
    client.post("/courses/", json=COURSE_PAYLOAD)
    client.post("/courses/", json={**COURSE_PAYLOAD, "code": "CS102"})
    resp = client.get("/courses/")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_course_success(client):
    created = client.post("/courses/", json=COURSE_PAYLOAD).json()
    resp = client.get(f"/courses/{created['id']}")
    assert resp.status_code == 200
    assert resp.json()["code"] == "CS101"


def test_get_course_not_found(client):
    resp = client.get("/courses/9999")
    assert resp.status_code == 404


def test_update_course_partial(client):
    created = client.post("/courses/", json=COURSE_PAYLOAD).json()
    resp = client.patch(f"/courses/{created['id']}", json={"name": "Intro to CS"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Intro to CS"


def test_delete_course(client):
    created = client.post("/courses/", json=COURSE_PAYLOAD).json()
    resp = client.delete(f"/courses/{created['id']}")
    assert resp.status_code == 204
    assert client.get(f"/courses/{created['id']}").status_code == 404
