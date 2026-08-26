FROM node:22-alpine AS frontend-build

WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/public ./public
COPY frontend/src ./src
RUN npm run build

FROM python:3.12-slim AS api

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DB_PATH=/data/deals.db \
    HOST=0.0.0.0 \
    PORT=8080

RUN groupadd --gid 10001 dealsbot \
    && useradd --uid 10001 --gid dealsbot --no-create-home --shell /usr/sbin/nologin dealsbot
WORKDIR /app
COPY --chown=dealsbot:dealsbot server.py ./server.py
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/healthz', timeout=3).read()"]
CMD ["python", "/app/server.py"]

FROM nginx:1.27-alpine AS web

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=frontend-build /src/frontend/build /usr/share/nginx/html
RUN chmod 644 /usr/share/nginx/html/ads.txt

EXPOSE 8443
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["wget", "--no-check-certificate", "--quiet", "--spider", "https://127.0.0.1:8443/healthz"]
CMD ["nginx", "-g", "daemon off;"]
