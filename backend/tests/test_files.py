from uuid import UUID, uuid4

from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.models import File


def upload(client: TestClient, filename: str = "note.txt") -> str:
    response = client.post(
        "/files/", files={"file": (filename, b"hello", "text/plain")}
    )
    assert response.status_code == 201
    return response.json()["id"]


def get_file(engine, file_id: str) -> File:
    with Session(engine) as session:
        return session.exec(select(File).where(File.id == UUID(file_id))).one()


def test_all_file_routes_require_authentication(file_client):
    test_client, _ = file_client
    file_id = uuid4()

    assert test_client.get("/files/").status_code == 401
    assert test_client.get(f"/files/{file_id}").status_code == 401
    response = test_client.post("/files/", files={"file": ("note.txt", b"hello")})
    assert response.status_code == 401
    assert test_client.delete(f"/files/{file_id}").status_code == 401


def test_upload_records_authenticated_owner(as_user, regular_user):
    test_client, engine = as_user

    file_id = upload(test_client)

    assert get_file(engine, file_id).owner_id == regular_user.id


def test_regular_user_lists_only_own_files(as_user, other_user):
    test_client, engine = as_user
    own_file_id = upload(test_client, "own.txt")
    with Session(engine) as session:
        session.add(
            File(
                id=uuid4(),
                owner_id=other_user.id,
                filename="other.txt",
                content_type="text/plain",
                filesize=5,
            )
        )
        session.commit()

    response = test_client.get("/files/")

    assert response.status_code == 200
    assert [file["id"] for file in response.json()] == [own_file_id]


def test_other_user_cannot_download_or_delete_file(
    as_other_user, authenticate_as, regular_user, other_user
):
    test_client, _ = as_other_user
    authenticate_as(regular_user)
    owned_file_id = upload(test_client)
    authenticate_as(other_user)

    assert test_client.get(f"/files/{owned_file_id}").status_code == 404
    assert test_client.delete(f"/files/{owned_file_id}").status_code == 404


def test_superuser_can_list_and_delete_any_file(
    as_superuser, authenticate_as, regular_user, superuser
):
    test_client, _ = as_superuser
    authenticate_as(regular_user)
    owned_file_id = upload(test_client)
    authenticate_as(superuser)

    response = test_client.get("/files/")

    assert response.status_code == 200
    assert [file["id"] for file in response.json()] == [owned_file_id]
    assert test_client.delete(f"/files/{owned_file_id}").status_code == 204


def test_unowned_legacy_files_are_superuser_only(
    as_user, tmp_path, authenticate_as, superuser
):
    test_client, engine = as_user
    legacy_file = File(
        id=uuid4(),
        filename="legacy.txt",
        content_type="text/plain",
        filesize=6,
    )
    legacy_file_id = str(legacy_file.id)
    with Session(engine) as session:
        session.add(legacy_file)
        session.commit()
    (tmp_path / "uploads").mkdir()
    (tmp_path / "uploads" / f"{legacy_file_id}.txt").write_bytes(b"legacy")

    assert test_client.get("/files/").json() == []
    assert test_client.get(f"/files/{legacy_file_id}").status_code == 404
    authenticate_as(superuser)
    response = test_client.get("/files/")
    assert response.status_code == 200
    assert [file["id"] for file in response.json()] == [legacy_file_id]
    assert test_client.get(f"/files/{legacy_file_id}").content == b"legacy"
