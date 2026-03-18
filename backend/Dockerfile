FROM python:3.11-slim

WORKDIR /app

# System deps: gcc for some Python packages, libmupdf for PyMuPDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (Docker layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download bge-small-en-v1.5 at build time — baked into image,
# zero cold-start download on every new Render instance.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('BAAI/bge-small-en-v1.5')"

# Copy application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
