FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port (Hugging Face Spaces will use PORT environment variable)
EXPOSE 7860

# Set environment variables
ENV PYTHONPATH=/app/src

# Run the application with uvicorn
CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port $PORT"]