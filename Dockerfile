FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM python:3.9-slim
WORKDIR /app

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY --from=frontend-build /app/dist ./dist/

WORKDIR /app/backend

ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py

CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:3914", "wsgi:app"]
