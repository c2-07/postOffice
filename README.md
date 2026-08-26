# PostOffice

PostOffice is a full-stack web application designed for storing and managing file metadata and contents securely. It features a React (Vite) frontend and a Python (FastAPI) backend. The backend manages file storage locally and stores metadata in a database (default SQLite, but supports PostgreSQL), leveraging Supabase Auth for user authentication.

## Previews

<img width="3140" height="2046" alt="Screenshot 2" src="https://github.com/user-attachments/assets/fbc51dd1-6781-475a-a00e-2a6d183edfcd" />
<img width="3140" height="2046" alt="Screenshot 3" src="https://github.com/user-attachments/assets/0fa89133-8e20-4e9b-b81e-7c9f135b681c" />
<img width="3140" height="2046" alt="Screenshot 4" src="https://github.com/user-attachments/assets/b3bc81fb-247f-4900-8030-33b50a41ec7b" />
<img width="3140" height="2046" alt="Screenshot 5" src="https://github.com/user-attachments/assets/5825a8e5-0324-4908-9666-444069dd1736" />


## Tech Stack

- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Python, FastAPI, SQLModel (SQLite/PostgreSQL)
- **Authentication:** Supabase Auth (JWT via JWKS)
- **Infrastructure:** Docker, NGINX

## Running with Docker

The easiest way to run the entire application is via Docker and Docker Compose. This starts up the frontend, the API backend, and an NGINX reverse proxy.

1. Create a `.env` file in the `backend/` directory following the instructions in `backend/README.md` to configure your Supabase instance.
2. Build and start the containers from the root directory:

   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - **Frontend UI:** [http://localhost](http://localhost)
   - **Backend API:** [http://localhost/api/](http://localhost/api/)

## Project Structure

- `frontend/` - React application. Includes proxy setup to map `/api` to the backend.
- `backend/` - FastAPI service using `uv` for dependency management. See `backend/README.md` for detailed Supabase configuration, DB setup, and endpoints.
- `nginx/` - NGINX configuration for routing HTTP traffic correctly between the frontend container and the backend API container.

## Local Development

If you prefer to run services individually outside of Docker:

**Backend:**
```bash
cd backend
uv sync
uv run fastapi dev app/main.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
