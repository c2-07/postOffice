from datetime import datetime

from fastapi import APIRouter, Depends, Form, UploadFile
from sqlmodel import Session

from app.database import get_session
from app.services.file_service import FileService

router = APIRouter(tags=["Upload File"])


@router.post("/uploadfile")
async def upload_file(
    file: UploadFile,
    expiry: datetime = Form(...),
    session: Session = Depends(get_session),
):
    file_service = FileService(session)
    file_id = await file_service.upload(file, expiry)

    return {"message": "File Successfully Uploaded To The Server", "file_id": file_id}


# @router.post("/uploadfiles")
# async def upload_batch(
#     files: List[UploadFile],
#     expiry_date: datetime = Form(...),
#     session: Session = Depends(get_session),
# ):
#     results = []

#     for file in files:
#         validate_file(file, expiry_date)

#         record = File(
#             filename=file.filename,
#             filesize=file.size,
#             content_type=file.content_type,
#             created_on=datetime.now(timezone.utc),
#             expiry_date=expiry_date,
#         )

#         temp_path, final_path = build_paths(str(record.id))

#         try:
#             size = await stream_to_disk(file, temp_path)
#             os.replace(temp_path, final_path)

#             record.filesize = size
#             session.add(record)

#             results.append({"file_id": record.id})

#         except Exception:
#             safe_delete(temp_path)
#             safe_delete(final_path)
#             raise

#     session.commit()
#     return results
