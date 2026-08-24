FROM python:3-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install system dependencies (libmagic is required for python-magic)
RUN apt-get update && apt-get install -y libmagic1 && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Sync dependencies
RUN uv sync --frozen --no-install-project --no-dev

# Copy the rest of the application
COPY . .

EXPOSE 8000

# Run the application
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
