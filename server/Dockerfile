FROM python:3.8

RUN pip install Flask gunicorn

COPY src/ app/
WORKDIR /app
ENV PORT 5000

CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 app:app