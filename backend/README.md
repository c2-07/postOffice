### Todo
- Implement Authentication System for passwords.
- Rate Limiter (Token Bucket Algorithm)
- Implement CORS
- Implement Worker which looks for expired files and delete them.
  - Create a new FastAPI route (e.g., DELETE /admin/cleanup) that loops through the database, finds all expired files, deletes them from the disk, and deletes them from the database. You can trigger this route manually, or look into FastAPI Background Tasks to run it automatically.

A. View vs. Download (Content-Disposition)
Right now, if I upload a .txt file or a .png image and share the link, the browser will likely force my friend to download it to their "Downloads" folder. A pastebin should let you view the text or image right in the browser!
*   How to improve: In your routes_download.py, the FileResponse takes a parameter called content_disposition_type. By default, it acts like an "attachment" (forces a download). If you change it to "inline", the browser will try to display the image/text on the screen instead of downloading it. You could add a query parameter to your route like ?download=true to let the frontend decide!
B. Content-Type Trust
In file_service.py, you save content_type=file.content_type. This trusts whatever the user's browser tells you the file is. A malicious user could rename a virus hack.exe to cute_cat.png, and upload it.
*   How to improve (Optional): Look into a Python library called python-magic. It reads the first few bytes of a file (the "file signature") to prove it's actually an image and not a disguised executable.
