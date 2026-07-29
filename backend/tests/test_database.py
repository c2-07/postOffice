from sqlalchemy import inspect, text
from sqlmodel import create_engine

import app.database as database


def test_init_db_adds_nullable_owner_id_to_legacy_sqlite_files_table(
    tmp_path, monkeypatch
):
    engine = create_engine(f"sqlite:///{tmp_path / 'legacy.db'}")
    with engine.begin() as connection:
        connection.execute(
            text(
                "CREATE TABLE files ("
                "id CHAR(32) PRIMARY KEY, "
                "filename VARCHAR"
                ")"
            )
        )

    monkeypatch.setattr(database, "engine", engine)
    database.init_db()

    owner_id = next(
        column
        for column in inspect(engine).get_columns("files")
        if column["name"] == "owner_id"
    )
    assert owner_id["nullable"] is True

    engine.dispose()
