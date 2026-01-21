FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Pasta para persistência do SQLite (Monte volume aqui no Easypanel)
RUN mkdir -p /app/dados

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
