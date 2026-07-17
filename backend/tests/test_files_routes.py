from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_file():
    response = client.get("/files")

    assert response.status_code == 200

    files = response.json()

    assert isinstance(files, list)

    for file in files:
        assert isinstance(file["id"], str)
        assert isinstance(file["filename"], str)
        assert isinstance(file["content_type"], str)
        assert isinstance(file["filesize"], int)
        assert isinstance(file["is_deleted"], bool)
        assert isinstance(file["is_expired"], bool)
