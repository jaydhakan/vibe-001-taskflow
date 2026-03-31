"""Integration tests — full HTTP round-trips via httpx TestClient.

Asserts status code, envelope shape, and key data fields for every endpoint.
"""


class TestCreateTask:
    def test_success(self, client):
        res = client.post("/api/tasks", json={"title": "New task"})
        assert res.status_code == 201
        body = res.json()
        assert body["success"] is True
        assert body["data"]["title"] == "New task"
        assert body["data"]["status"] == "todo"
        assert "id" in body["data"]

    def test_missing_title(self, client):
        res = client.post("/api/tasks", json={})
        assert res.status_code == 422

    def test_blank_title(self, client):
        res = client.post("/api/tasks", json={"title": ""})
        assert res.status_code == 422

    def test_invalid_priority(self, client):
        res = client.post("/api/tasks", json={"title": "t", "priority": "urgent"})
        assert res.status_code == 422


class TestGetTask:
    def test_found(self, client, task):
        res = client.get(f"/api/tasks/{task['id']}")
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert body["data"]["id"] == task["id"]

    def test_unknown_id(self, client):
        res = client.get("/api/tasks/nonexistent")
        assert res.status_code == 404


class TestUpdateTask:
    def test_success(self, client, task):
        res = client.put(f"/api/tasks/{task['id']}", json={"title": "Updated"})
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert body["data"]["title"] == "Updated"

    def test_invalid_transition(self, client, task):
        res = client.put(f"/api/tasks/{task['id']}", json={"status": "done"})
        assert res.status_code == 422

    def test_unknown_id(self, client):
        res = client.put("/api/tasks/nonexistent", json={"title": "x"})
        assert res.status_code == 404


class TestDeleteTask:
    def test_success(self, client, task):
        res = client.delete(f"/api/tasks/{task['id']}")
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert body["data"] is None

    def test_unknown_id(self, client):
        res = client.delete("/api/tasks/nonexistent")
        assert res.status_code == 404


class TestCompleteTask:
    def test_from_todo_rejected(self, client, task):
        res = client.post(f"/api/tasks/{task['id']}/complete")
        assert res.status_code == 422

    def test_from_in_progress_succeeds(self, client, in_progress_task):
        res = client.post(f"/api/tasks/{in_progress_task['id']}/complete")
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert body["data"]["status"] == "done"

    def test_from_done_rejected(self, client, in_progress_task):
        client.post(f"/api/tasks/{in_progress_task['id']}/complete")
        res = client.post(f"/api/tasks/{in_progress_task['id']}/complete")
        assert res.status_code == 422


class TestStats:
    def test_shape(self, client):
        res = client.get("/api/tasks/stats")
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        data = body["data"]
        assert "by_status" in data
        assert "by_priority" in data
        assert "total" in data

    def test_not_swallowed_by_id_route(self, client):
        """Regression: /stats must resolve before /{id} pattern."""
        res = client.get("/api/tasks/stats")
        assert res.status_code == 200
        assert "by_status" in res.json()["data"]


class TestListFilters:
    def test_filter_by_status(self, client):
        client.post("/api/tasks", json={"title": "a"})
        client.post("/api/tasks", json={"title": "b"})
        res = client.get("/api/tasks", params={"status": "todo"})
        assert res.status_code == 200
        items = res.json()["data"]["items"]
        assert len(items) == 2
        assert all(t["status"] == "todo" for t in items)

    def test_filter_by_priority(self, client):
        client.post("/api/tasks", json={"title": "a", "priority": "high"})
        client.post("/api/tasks", json={"title": "b", "priority": "low"})
        res = client.get("/api/tasks", params={"priority": "high"})
        items = res.json()["data"]["items"]
        assert len(items) == 1
        assert items[0]["priority"] == "high"
