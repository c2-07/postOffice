# Postoffice API

Postoffice stores file metadata in SQLite and file contents on local storage. User
accounts, passwords, sessions, and access tokens are managed by Supabase Auth.
The API does not store passwords or create its own tokens.

## Local setup

1. Create a Supabase project.
2. In **Authentication → Providers**, enable email/password sign-in.
3. In **Authentication → Signing Keys**, configure an asymmetric signing key:
   **ES256** or **RS256**. This API verifies access tokens through Supabase's
   public JWKS endpoint; it does not accept shared-secret (HS256) tokens.
4. Copy [`.env.example`](.env.example) to `.env` and provide the values from
   your Supabase project:

   ```dotenv
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_ANON_KEY=your-publishable-or-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret
   SUPABASE_JWT_AUDIENCE=authenticated
   BACKEND_CORS_ORIGINS=["http://localhost:3000"]
   DATABASE_URL=sqlite:///database.db
   UPLOAD_DIR=uploads
   ```

   To use PostgreSQL instead of SQLite, set `DATABASE_URL` with the Psycopg 3
   SQLAlchemy dialect, for example:

   ```dotenv
   DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/postoffice
   ```

   `BACKEND_CORS_ORIGINS` is a JSON list of browser origins allowed to call the
   API. Leave it empty to deny browser origins. The API uses bearer headers, not
   cookies, so CORS credentials remain disabled.
5. Install and run the API:

   ```bash
   uv sync
   uv run fastapi dev app/main.py
   ```

Never put `.env` in version control. In particular,
`SUPABASE_SERVICE_ROLE_KEY` is server-only: never send it to a browser, mobile
app, or any untrusted client. The anon/publishable key is the only Supabase key
that may be used in a frontend.

## Authentication flow

Create an account:

```bash
curl -X POST http://localhost:8000/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"choose-a-long-password"}'
```

If Supabase email confirmation is enabled, signup returns a user but no session.
Confirm the email, then log in:

```bash
curl -X POST http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"choose-a-long-password"}'
```

The login response includes `access_token` and `refresh_token`. Send the access
token as a bearer token to `/auth/me` and every `/files` endpoint:

```bash
curl http://localhost:8000/auth/me \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

The API validates `exp`, `sub`, `aud`, and `iss`, then verifies the signature
against the Supabase JWKS. A token must have an `authenticated` audience unless
you change `SUPABASE_JWT_AUDIENCE` on both sides.

## Users and superusers

Every newly uploaded file is owned by the user ID in the verified token. A normal
user can list, download, and delete only their own files. A superuser can manage
every file.

Roles are read only from the token's server-controlled
`app_metadata.role`. Never use `user_metadata.role`: users can change their own
user metadata.

To bootstrap the first superuser, update that user's `app_metadata` from a
server-only environment with the service-role key. For example, run this on a
trusted machine after substituting the user UUID and values from `.env`:

```bash
curl -X PUT "$SUPABASE_URL/auth/v1/admin/users/USER_UUID" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"app_metadata":{"role":"superuser"}}'
```

Do not call that Admin API from a frontend. After the role update, log in again
or refresh the session to receive a new token carrying the role. A current
superuser may later use `PATCH /auth/users/{user_id}/role` with
`{"role":"user"}` or `{"role":"superuser"}`; the API performs that action
with its server-side service-role client.

## Existing files

On startup, the API safely adds a nullable `owner_id` column to existing SQLite
`files` tables. Existing rows stay unowned (`owner_id = NULL`) and are visible
only to superusers. Assign ownership deliberately before making those files
available to regular users.

## Tests

```bash
uv run pytest
```
