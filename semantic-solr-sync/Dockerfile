FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY index_to_solr.py .

CMD ["python", "index_to_solr.py"]