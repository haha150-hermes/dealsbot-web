#!/usr/bin/env python3
"""Read-only internal HTTP API for Dealsbot."""

from __future__ import annotations

import json
import os
import re
import sqlite3
from functools import partial
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

MAX_DEALS = 50
MAX_CANDIDATES = 500
AMAZON_HOSTS = {"amazon.se", "www.amazon.se"}
_CONTROL_CHARACTERS = re.compile(r"[\x00-\x1f\x7f-\x9f]")


def _format_sek(value: str) -> str | None:
    match = re.search(r"\d[\d\s]*", value)
    if not match:
        return None
    digits = re.sub(r"\D", "", match.group(0)).lstrip("0") or "0"
    groups: list[str] = []
    while digits:
        groups.append(digits[-3:])
        digits = digits[:-3]
    return " ".join(reversed(groups)) + " kr"


def parse_price(raw: str | None) -> dict[str, str | None]:
    if not isinstance(raw, str):
        return {"price": "Se aktuellt pris", "previous_price": None}
    text = raw.strip()
    if not text or len(text) > 128:
        return {"price": "Se aktuellt pris", "previous_price": None}

    parts = re.split(r"\s+instead\s+of\s+", text, maxsplit=1, flags=re.IGNORECASE)
    current = _format_sek(parts[0])
    previous = _format_sek(parts[1]) if len(parts) == 2 else None
    if current:
        return {"price": current, "previous_price": previous}
    return {"price": text, "previous_price": None}


def build_deal_url(raw_url: str | None, affiliate_tag: str) -> str | None:
    if not isinstance(raw_url, str) or not raw_url:
        return None
    parsed = urlparse(raw_url.strip())
    if parsed.scheme != "https" or (parsed.hostname or "").lower() not in AMAZON_HOSTS:
        return None

    query = parse_qs(parsed.query, keep_blank_values=True)
    query.pop("tag", None)
    query["tag"] = [affiliate_tag]
    normalized_query = urlencode(query, doseq=True)
    return urlunparse(parsed._replace(query=normalized_query, fragment=""))


def resolve_static_request(request_path: str, directory: str) -> str:
    """Retained for frontend routing tests; nginx performs this routing in production."""
    path = urlparse(request_path).path
    if path == "/" or path.startswith("/api/") or path == "/healthz":
        return path

    root = Path(directory).resolve()
    candidate = (root / path.lstrip("/")).resolve()
    if candidate != root and root not in candidate.parents:
        return path
    if not candidate.exists() and not Path(path).suffix:
        return "/"
    return path


class DealRepository:
    def __init__(self, db_path: str, affiliate_tag: str):
        self.db_path = Path(db_path).resolve()
        self.affiliate_tag = affiliate_tag

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(
            f"{self.db_path.as_uri()}?mode=ro",
            uri=True,
            timeout=5,
        )
        connection.execute("PRAGMA query_only=ON")
        connection.execute("PRAGMA busy_timeout=5000")
        return connection

    def list_deals(self, limit: int = MAX_DEALS) -> list[dict[str, Any]]:
        bounded_limit = max(1, min(int(limit), MAX_DEALS))
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT id, name, price, url
                FROM adealsweden
                WHERE posted = 1
                  AND (url LIKE 'https://www.amazon.se/%'
                       OR url LIKE 'https://amazon.se/%')
                ORDER BY id DESC
                LIMIT ?
                """,
                (MAX_CANDIDATES,),
            )

            deals: list[dict[str, Any]] = []
            for deal_id, title, raw_price, raw_url in rows:
                if (
                    not isinstance(deal_id, int)
                    or isinstance(deal_id, bool)
                    or not isinstance(title, str)
                    or not title.strip()
                    or not (raw_price is None or isinstance(raw_price, str))
                    or not isinstance(raw_url, str)
                ):
                    continue
                url = build_deal_url(raw_url, self.affiliate_tag)
                if not url:
                    continue
                price = parse_price(raw_price)
                deals.append(
                    {
                        "id": deal_id,
                        "title": title.strip(),
                        "price": price["price"],
                        "previous_price": price["previous_price"],
                        "url": url,
                    }
                )
                if len(deals) == bounded_limit:
                    break
        return deals


class DealsRequestHandler(BaseHTTPRequestHandler):
    server_version = "Dealsbot"
    sys_version = ""
    protocol_version = "HTTP/1.0"

    def __init__(self, *args: Any, repository: DealRepository, **kwargs: Any):
        self.repository = repository
        super().__init__(*args, **kwargs)

    def version_string(self) -> str:
        return self.server_version

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/healthz":
            try:
                self.repository.list_deals(1)
                self._send_json(200, {"status": "ok"})
            except (sqlite3.Error, OSError):
                self._send_json(503, {"status": "unavailable"})
            return

        if parsed.path == "/api/deals":
            try:
                raw_limit = parse_qs(parsed.query).get("limit", [str(MAX_DEALS)])[0]
                limit = int(raw_limit)
            except (TypeError, ValueError):
                self._send_json(400, {"error": "limit must be an integer"})
                return
            try:
                items = self.repository.list_deals(limit)
                self._send_json(200, {"items": items, "count": len(items)})
            except (sqlite3.Error, OSError):
                self._send_json(503, {"error": "deal data is temporarily unavailable"})
            return

        self._send_json(404, {"error": "not found"})

    def log_message(self, format: str, *args: Any) -> None:
        message = _CONTROL_CHARACTERS.sub("?", format % args)
        address = _CONTROL_CHARACTERS.sub("?", str(self.client_address[0]))
        print(f"{address} - {message}", flush=True)


def run_server() -> None:
    db_path = os.environ.get("DB_PATH", "/data/deals.db")
    affiliate_tag = os.environ.get("AMAZON_ASSOCIATE_TAG", "").strip()
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8080"))

    if not re.fullmatch(r"[A-Za-z0-9_-]{2,64}", affiliate_tag):
        raise SystemExit("AMAZON_ASSOCIATE_TAG is required and contains invalid characters")
    if not Path(db_path).is_file():
        raise SystemExit(f"required database does not exist: {db_path}")

    repository = DealRepository(db_path, affiliate_tag)
    repository.list_deals(1)
    handler = partial(DealsRequestHandler, repository=repository)
    server = HTTPServer((host, port), handler)
    print(f"Dealsbot internal API listening on {host}:{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    run_server()
