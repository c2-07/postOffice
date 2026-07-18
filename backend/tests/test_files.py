import pytest
import uuid
import tempfile
import os
from fastapi.testclient import TestClient

from app.main import app
from app.database import init_db

# Shared state for sequential tests (upload → get → delete)
file_id = None


@pytest.fixture(scope="session")
def client():
    init_db()
    with TestClient(app) as c:
        yield c


def test_list_files(client):
    """GET /files/ - List all files"""
    response = client.get("/files/")
    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    for file in data:
        assert isinstance(file.get("id"), str)
        assert isinstance(file.get("filename"), str)
        assert isinstance(file.get("content_type"), str)
        assert isinstance(file.get("filesize"), int)
        assert isinstance(file.get("is_deleted"), bool)
        assert isinstance(file.get("is_expired"), bool)


def test_upload_file(client):
    """POST /files/ - Upload a new file"""
    global file_id

    # Create a temporary test file
    content = b"This is a test file for the Postoffice API unit tests.\nLine 2."
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name
        filename = os.path.basename(tmp_path)

    try:
        with open(tmp_path, "rb") as f:
            response = client.post(
                "/files/", files={"file": (filename, f, "text/plain")}
            )

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert isinstance(data["id"], str)

        file_id = data["id"]  # Save for subsequent tests

    finally:
        os.unlink(tmp_path)


@pytest.mark.depends(on=["test_upload_file"])
def test_get_file(client):
    """GET /files/{id} - Retrieve uploaded file"""
    global file_id
    assert file_id is not None, "File ID not set from upload test"

    response = client.get(f"/files/{file_id}")
    assert response.status_code == 200

    # The endpoint might return file content (binary) or metadata (JSON)
    content_type = response.headers.get("content-type", "")
    if "application/json" in content_type:
        data = response.json()
        assert data.get("id") == file_id
    else:
        # Likely serving the file directly
        assert len(response.content) > 0


@pytest.mark.depends(on=["test_get_file"])
def test_delete_file(client):
    """DELETE /files/{id} - Delete uploaded file"""
    global file_id
    assert file_id is not None, "File ID not set from upload test"

    response = client.delete(f"/files/{file_id}")
    assert response.status_code == 204  # No Content


@pytest.mark.depends(on=["test_delete_file"])
def test_file_is_deleted(client):
    """Verify file is marked as deleted or returns 404"""
    global file_id
    assert file_id is not None

    response = client.get(f"/files/{file_id}")
    # Either soft-delete (returns metadata with is_deleted=True) or hard-delete (404)
    if response.status_code == 200:
        data = response.json()
        assert data.get("is_deleted") is True
    else:
        assert response.status_code == 404


# Negative / Edge cases
def test_upload_without_file(client):
    """POST /files/ - Validation error when no file is provided"""
    response = client.post("/files/")
    assert response.status_code == 422


def test_get_nonexistent_file(client):
    """GET /files/{id} - Non-existent UUID"""
    fake_id = str(uuid.uuid4())
    response = client.get(f"/files/{fake_id}")
    assert response.status_code in (404, 422)


def test_delete_nonexistent_file(client):
    """DELETE /files/{id} - Non-existent UUID"""
    fake_id = str(uuid.uuid4())
    response = client.delete(f"/files/{fake_id}")
    # Many APIs return 204 for delete (idempotent) or 404
    assert response.status_code in (204, 404)
