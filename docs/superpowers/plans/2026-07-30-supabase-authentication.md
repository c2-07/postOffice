# Supabase Authentication and Roles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase email/password signup and login endpoints, verify Supabase access tokens in FastAPI, and enforce user ownership plus a superuser role for files.

**Architecture:** Supabase Auth remains the only user store and password authority; this API never persists passwords or mints its own tokens. The API proxies signup/login to Supabase, verifies bearer JWTs against the project JWKS, and derives authorization from the verified token's `sub` and `app_metadata.role`. Files get a nullable `owner_id` so existing records remain accessible only to superusers after migration.

**Tech Stack:** FastAPI, SQLModel/SQLite, Supabase Auth (`supabase-py`), PyJWT with cryptography/JWKS, pytest and FastAPI TestClient.

---

## File structure

- Create: `backend/app/auth/__init__.py` — makes the auth package importable.
- Create: `backend/app/auth/schemas.py` — API request/response and authenticated-user Pydantic models.
- Create: `backend/app/auth/service.py` — narrow wrapper around Supabase signup, password login, and admin role updates.
- Create: `backend/app/auth/deps.py` — bearer-token validation and current-user/superuser dependencies.
- Create: `backend/app/api/routes/auth.py` — `/auth/signup`, `/auth/login`, `/auth/me`, and role-management routes.
- Modify: `backend/app/core/config.py` — Supabase configuration and fail-fast validation for required secrets.
- Modify: `backend/app/models.py` — nullable `File.owner_id` with an index.
- Modify: `backend/app/core/file_service.py` — assign an owner at upload and enforce ownership for fetch/delete.
- Modify: `backend/app/api/routes/file.py` — require the authenticated user on every file operation.
- Modify: `backend/app/api/routes/__init__.py` — register the auth router.
- Modify: `backend/app/main.py` — use configured, non-wildcard CORS origins.
- Modify: `backend/pyproject.toml` and `backend/uv.lock` — add Supabase and JWT dependencies.
- Create: `backend/.env.example` — document every environment variable without including secrets.
- Create: `backend/tests/test_auth.py` — test auth routes and dependency behavior without a real Supabase project.
- Modify: `backend/tests/test_files.py` — provide overridden users and test ownership boundaries.
- Modify: `backend/README.md` — onboarding steps, token flow, role bootstrap, and curl examples.

### Task 1: Add configuration and dependencies

**Files:**
- Modify: `backend/pyproject.toml`
- Modify: `backend/uv.lock`
- Modify: `backend/app/core/config.py`
- Create: `backend/.env.example`

- [ ] **Step 1: Write the configuration test**

Create `backend/tests/test_config.py` with this test, which asserts the JWKS and issuer are derived from the single public project URL:

```python
from app.core.config import Settings


def test_supabase_urls_are_derived_from_project_url():
    settings = Settings(
        SUPABASE_URL="https://example.supabase.co",
        SUPABASE_ANON_KEY="anon-key",
        SUPABASE_SERVICE_ROLE_KEY="service-key",
    )

    assert settings.supabase_jwks_url == "https://example.supabase.co/auth/v1/.well-known/jwks.json"
    assert settings.supabase_issuer == "https://example.supabase.co/auth/v1"
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && uv run pytest tests/test_config.py -v`

Expected: FAIL because `Settings` has no Supabase fields or derived properties.

- [ ] **Step 3: Add required libraries and settings**

Add these project dependencies:

```toml
"pyjwt[crypto]>=2.10.0",
"supabase>=2.0.0",
```

Add these fields to `Settings` (use `SecretStr` for all keys) and properties that remove one trailing slash from `SUPABASE_URL` before deriving URLs:

```python
SUPABASE_URL: str
SUPABASE_ANON_KEY: SecretStr
SUPABASE_SERVICE_ROLE_KEY: SecretStr
SUPABASE_JWT_AUDIENCE: str = "authenticated"
BACKEND_CORS_ORIGINS: list[str] = []

@property
def supabase_issuer(self) -> str:
    return f"{self.SUPABASE_URL.rstrip('/')}/auth/v1"

@property
def supabase_jwks_url(self) -> str:
    return f"{self.supabase_issuer}/.well-known/jwks.json"
```

Create `backend/.env.example`:

```dotenv
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret
SUPABASE_JWT_AUDIENCE=authenticated
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
DATABASE_URL=sqlite:///database.db
UPLOAD_DIR=uploads
```

Run `cd backend && uv lock` to update the lockfile. Do not put `.env` or any real Supabase secret in Git.

- [ ] **Step 4: Run the configuration test**

Run: `cd backend && uv run pytest tests/test_config.py -v`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/pyproject.toml backend/uv.lock backend/app/core/config.py backend/.env.example backend/tests/test_config.py
git commit -m "chore: configure Supabase authentication"
```

### Task 2: Add Supabase signup and login routes

**Files:**
- Create: `backend/app/auth/__init__.py`
- Create: `backend/app/auth/schemas.py`
- Create: `backend/app/auth/service.py`
- Create: `backend/app/api/routes/auth.py`
- Modify: `backend/app/api/routes/__init__.py`
- Test: `backend/tests/test_auth.py`

- [ ] **Step 1: Write failing route tests using a fake auth service**

Use FastAPI dependency overrides so tests make no network request. Test successful signup, successful login, invalid Supabase credentials mapped to 401, and `GET /auth/me` requiring a token:

```python
def test_signup_returns_supabase_user_and_optional_session(client, fake_auth_service):
    response = client.post("/auth/signup", json={"email": "ada@example.com", "password": "safe-password-123"})
    assert response.status_code == 201
    assert response.json()["user"]["email"] == "ada@example.com"


def test_login_returns_access_and_refresh_tokens(client, fake_auth_service):
    response = client.post("/auth/login", json={"email": "ada@example.com", "password": "safe-password-123"})
    assert response.status_code == 200
    assert response.json()["access_token"] == "access-token"
    assert response.json()["refresh_token"] == "refresh-token"


def test_me_without_bearer_token_is_401(client):
    assert client.get("/auth/me").status_code == 401
```

- [ ] **Step 2: Run the auth tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_auth.py -v`

Expected: FAIL because the auth route and service do not exist.

- [ ] **Step 3: Implement strict schemas, service, and routes**

Define the input schemas so passwords are write-only, constrained to 8–72 characters, and email is `EmailStr`:

```python
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class LoginRequest(SignUpRequest):
    pass


class RoleUpdateRequest(BaseModel):
    role: Literal["user", "superuser"]
```

Make `SupabaseAuthService` create two clients: an anon-key client for `sign_up` and `sign_in_with_password`, and a service-role client exclusively for `auth.admin.update_user_by_id`. Convert Supabase response objects to explicit Pydantic responses; never return a provider object or password. Map known `AuthApiError` failures to `HTTPException(401, "Invalid email or password")` for login and `HTTPException(400, "Unable to create account")` for signup.

Implement the routes:

```python
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", status_code=status.HTTP_201_CREATED, response_model=AuthResponse)
def signup(payload: SignUpRequest, service: AuthServiceDeps):
    return service.signup(payload)

@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, service: AuthServiceDeps):
    return service.login(payload)

@router.get("/me", response_model=CurrentUser)
def me(user: CurrentUserDeps):
    return user

@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_role(user_id: UUID, payload: RoleUpdateRequest, _: SuperuserDeps, service: AuthServiceDeps):
    return service.update_role(user_id, payload.role)
```

Register `auth.router` before `file.router`. Signup may correctly return a null session when Supabase email confirmation is enabled; document this instead of bypassing confirmation.

- [ ] **Step 4: Run auth tests**

Run: `cd backend && uv run pytest tests/test_auth.py -v`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/auth backend/app/api/routes/auth.py backend/app/api/routes/__init__.py backend/tests/test_auth.py
git commit -m "feat: add Supabase signup and login routes"
```

### Task 3: Verify access tokens and distinguish superusers

**Files:**
- Create: `backend/app/auth/deps.py`
- Modify: `backend/tests/test_auth.py`

- [ ] **Step 1: Write failing dependency tests**

Test that missing/malformed bearer credentials result in 401, a valid decoded claim yields a `CurrentUser`, and an ordinary user is rejected by `require_superuser`:

```python
def test_current_user_reads_subject_and_role_from_verified_claims(monkeypatch):
    monkeypatch.setattr("app.auth.deps.decode_access_token", lambda token: {
        "sub": "f97ee6be-3f49-40b5-bd63-8db32d6385bf",
        "email": "ada@example.com",
        "app_metadata": {"role": "superuser"},
    })
    user = get_current_user(HTTPAuthorizationCredentials(scheme="Bearer", credentials="token"))
    assert user.is_superuser is True


def test_regular_user_cannot_use_superuser_dependency():
    with pytest.raises(HTTPException) as error:
        require_superuser(CurrentUser(id=uuid4(), email="ada@example.com", is_superuser=False))
    assert error.value.status_code == 403
```

- [ ] **Step 2: Run the dependency tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_auth.py -v`

Expected: FAIL because token decoding and role dependencies do not exist.

- [ ] **Step 3: Implement JWKS-based validation**

Use `HTTPBearer(auto_error=False)` and reject absent credentials with `401` plus `WWW-Authenticate: Bearer`. In `decode_access_token`, retrieve the signing key from a cached `jwt.PyJWKClient(settings.supabase_jwks_url)` and call:

```python
jwt.decode(
    token,
    signing_key.key,
    algorithms=["ES256", "RS256"],
    audience=settings.SUPABASE_JWT_AUDIENCE,
    issuer=settings.supabase_issuer,
    options={"require": ["exp", "sub"]},
)
```

Catch every `jwt.PyJWTError` and turn it into `401 "Invalid or expired access token"`; do not expose parsing errors. Build `CurrentUser` from the validated `sub` UUID and optional email. Set `is_superuser` only when `claims.get("app_metadata", {}).get("role") == "superuser"`; never read role from `user_metadata`, because users can edit that metadata. Implement `require_superuser` as a separate dependency that returns 403 for authenticated, non-superuser callers.

Require a Supabase project using asymmetric signing keys (ES256 or RS256) so the API can safely validate against its public JWKS. Do not add a shared JWT secret to this API.

- [ ] **Step 4: Run dependency tests**

Run: `cd backend && uv run pytest tests/test_auth.py -v`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/auth/deps.py backend/app/auth/schemas.py backend/tests/test_auth.py
git commit -m "feat: verify Supabase bearer tokens and roles"
```

### Task 4: Restrict files to their owner or a superuser

**Files:**
- Modify: `backend/app/models.py`
- Modify: `backend/app/core/file_service.py`
- Modify: `backend/app/api/routes/file.py`
- Modify: `backend/tests/test_files.py`

- [ ] **Step 1: Replace public-file tests with authorization tests**

Override `get_current_user` with two stable users and assert all file routes reject missing credentials, regular users see only their files, and only a superuser can access another user's file:

```python
def test_upload_records_authenticated_owner(client, as_user):
    response = client.post("/files/", files={"file": ("note.txt", b"hello", "text/plain")})
    assert response.status_code == 201
    assert get_file(response.json()["id"]).owner_id == USER_ID


def test_other_user_cannot_download_or_delete_file(client, as_other_user, owned_file_id):
    assert client.get(f"/files/{owned_file_id}").status_code == 404
    assert client.delete(f"/files/{owned_file_id}").status_code == 404


def test_superuser_can_list_and_delete_any_file(client, as_superuser, owned_file_id):
    assert client.get("/files/").status_code == 200
    assert client.delete(f"/files/{owned_file_id}").status_code == 204
```

- [ ] **Step 2: Run the file tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_files.py -v`

Expected: FAIL because files have no owner and routes are public.

- [ ] **Step 3: Add ownership model and service checks**

Add this field to `File`:

```python
owner_id: UUID | None = Field(default=None, index=True, nullable=True)
```

Extend `FileService.upload_file` and `build_metadata` to require `owner_id: UUID`, then persist it in new file metadata. Add `get_authorized_file(id, user)` that loads a record, raises `FileRecordNotFoundError` when it does not exist, and raises that same error when `not user.is_superuser and file.owner_id != user.id`. This intentionally returns 404 to non-owners and avoids exposing another user's file IDs. Make `delete_file` use this authorization method before removing bytes.

Make every `files` route depend on `CurrentUserDeps`. List with `select(File)` for superusers and `select(File).where(File.owner_id == user.id)` for regular users. Pass the caller's ID to upload; use `get_authorized_file` before streaming or deletion. Existing rows with `owner_id=None` are visible only to superusers; assign owners manually before enabling the API for users.

- [ ] **Step 4: Run the file tests**

Run: `cd backend && uv run pytest tests/test_files.py -v`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/models.py backend/app/core/file_service.py backend/app/api/routes/file.py backend/tests/test_files.py
git commit -m "feat: enforce file ownership and superuser access"
```

### Task 5: Document and validate the complete flow

**Files:**
- Modify: `backend/app/main.py`
- Modify: `backend/README.md`
- Modify: `backend/tests/test_auth.py`

- [ ] **Step 1: Add an end-to-end no-network test**

Add a test that logs in through the fake service, passes the returned token through an override of `get_current_user`, uploads a file, and verifies a different regular user receives 404 while a superuser can delete it.

- [ ] **Step 2: Run it to verify it fails until the full flow is wired**

Run: `cd backend && uv run pytest tests/test_auth.py tests/test_files.py -v`

Expected: PASS only after Tasks 2–4 are complete; if it fails, fix the route/dependency boundary before continuing.

- [ ] **Step 3: Make production behavior explicit**

Set CORS origins from `settings.BACKEND_CORS_ORIGINS`, not a wildcard. Keep `allow_credentials=False` because this flow uses bearer headers rather than cookies.

Document these required Supabase dashboard actions in `backend/README.md`:

1. Create a Supabase project and enable email/password authentication.
2. Configure an asymmetric JWT signing key (ES256 or RS256) under Auth signing keys.
3. Copy the project URL, publishable/anon key, and service-role key to a local `.env` based on `.env.example`.
4. Sign up the first account, then make it a superuser once with a server-side script or Supabase Admin API call that sets `app_metadata: {"role": "superuser"}`. Never set `user_metadata.role` and never expose the service-role key to a frontend.
5. Use `POST /auth/login`; send the returned access token as `Authorization: Bearer <access_token>` to all protected file routes.

Include these curl examples:

```bash
curl -X POST http://localhost:8000/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"choose-a-long-password"}'

curl -X POST http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"choose-a-long-password"}'

curl http://localhost:8000/auth/me \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

- [ ] **Step 4: Run all checks**

Run: `cd backend && uv run pytest -v`

Expected: all tests pass and total coverage remains at or above the configured 80% threshold.

Run: `cd backend && uv run ruff check .`

Expected: no lint errors; if Ruff is not installed, either add it to the dev group or record that this repository currently has no linter.

- [ ] **Step 5: Commit**

```bash
git add backend/app/main.py backend/README.md backend/tests/test_auth.py
git commit -m "docs: document Supabase authentication setup"
```

## Self-review

- **Spec coverage:** Tasks 2 and 3 provide signup, login, bearer authentication, user identity, and a superuser role. Task 4 applies those roles to the API's existing file resources. Task 5 documents Supabase project setup and secure bootstrap.
- **No placeholders:** Every route, dependency, configuration value, authorization decision, test command, and role bootstrap mechanism is specified above.
- **Type consistency:** `CurrentUser.id` is the UUID parsed from JWT `sub`; `File.owner_id` is the same UUID type; `app_metadata.role` holds only `"user"` or `"superuser"`; and all superuser checks use `CurrentUser.is_superuser`.
