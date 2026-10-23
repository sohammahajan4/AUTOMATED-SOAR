# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set work directory
WORKDIR /app

# Install system dependencies (e.g., gcc for building wheels)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application source code
COPY backend/ ./backend/

# Expose the FastAPI port
EXPOSE 8000

# Command to run the API
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]