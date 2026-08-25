# Dealsbot

Dealsbot is a Swedish content-first buying-guide and deals site. An event-driven nginx service terminates TLS and serves the compiled React frontend; it proxies API requests to a separate internal, read-only Python service.

## Runtime architecture

- nginx listens on container port `8443` (published as host port `443`), serves the React build, and proxies `/api/` and `/healthz` over an internal Compose network.
- nginx disables version tokens, limits each client IP to 20 concurrent connections, limits request bodies to 16 KiB, and applies header, body, send, keepalive, and upstream timeouts.
- The Python API listens only on the internal network at port `8080`, runs as UID/GID `10001`, and mounts only `/data/deals.db` read-only.
- `GET /api/deals?limit=50` returns the newest valid, posted rows from `adealsweden`, up to 50.
- The API returns only `id`, `title`, `price`, `previous_price`, and a normalized Amazon.se URL. Malformed SQLite value types and invalid rows are skipped safely.
- Both `https://amazon.se/...` and `https://www.amazon.se/...` are accepted; other hosts and non-HTTPS URLs are rejected.
- SQLite is opened with `mode=ro` and `PRAGMA query_only=ON`, and SQL enforces `posted = 1`.
- The Associates tag is supplied with `AMAZON_ASSOCIATE_TAG` and replaces any existing `tag` query parameter.
- nginx handles React deep links with an `index.html` fallback and serves TLS 1.2 or newer.

## AdSense integration

- Auto ads are enabled with the publisher client `ca-pub-1526341836163709` in `frontend/public/index.html`.
- The authorized seller record is published at `/ads.txt` from `frontend/public/ads.txt`.
- Ad placement and personalization settings remain controlled in the AdSense account; the application does not place ads inside affiliate call-to-action buttons.
- For visitors in Sweden and other EEA regions, publish a Google-certified consent message in AdSense before serving personalized ads.
- The production certificate covers both `symeri.se` and `deals.symeri.se`; the same application and `ads.txt` file are served for both hostnames.

## Development and tests

```bash
python3 -m unittest tests.test_server -v
cd frontend
npm ci
CI=true npm test -- --watchAll=false --runInBand
npm run build
```

The frontend expects `/api/deals` on the same origin. For local frontend-only development, proxy that route to a running backend.

## Container build and validation

```bash
docker build --target api -t deals-api:latest .
docker build --target web -t deals-web:latest .
AMAZON_ASSOCIATE_TAG='example-21' docker compose -f compose.yml config
```

The runtime expects these host paths:

```text
/mnt/dealsbot/deals.db
/etc/letsencrypt/live/deals.symeri.se
/etc/letsencrypt/archive/deals.symeri.se
```

The two certificate directories are mounted separately at matching read-only container paths so Certbot's `live` symlinks can resolve without exposing all of `/etc/letsencrypt`.

## Production deployment

On the host that owns the database and certificates:

```bash
export AMAZON_ASSOCIATE_TAG='your-current-tag-21'
sudo -E docker compose -f compose.yml up -d --build
sudo docker inspect --format '{{.State.Health.Status}}' deals-api deals-web
curl --resolve deals.symeri.se:443:127.0.0.1 https://deals.symeri.se/healthz
```

### Certificate renewal

nginx loads certificates at process startup. Restart the web service after Certbot renews them:

```bash
sudo docker compose -f compose.yml restart web
```

### Rollback

Stop and remove the replacement services, then restart the previous frontend container:

```bash
sudo docker compose -f compose.yml down
sudo docker start pensive_aryabhata
```

## Content and Associates review notes

- Keep at least ten public, original guides available during review.
- Refresh guide dates and editorial content regularly.
- Keep the affiliate disclosure visible and unambiguous.
- Verify that `AMAZON_ASSOCIATE_TAG` belongs to the current application; rejected account tags should not be reused.
- Product prices and availability come from the local feed and must still be verified at Amazon before purchase.
- Dealsbot must not imply Amazon endorsement. Amazon and Amazon.se are trademarks of Amazon.com, Inc. or its affiliates.
