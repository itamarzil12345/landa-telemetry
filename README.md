# Industrial Real-Time System

A distributed industrial telemetry platform built with:

- React + TypeScript + Vite UI (3 pages, SignalR live feed)
- C# REST API (.NET 9) with SignalR + RabbitMQ consumer
- C# SQL Data service (.NET 9, Entity Framework + gRPC)
- C# IoT Telemetry worker (.NET 9)
- Redis (live cache), RabbitMQ (event bus), PostgreSQL (durable history)

## Run the full system

```bash
docker compose up --build
```

To stop:

```bash
docker compose down -v
```

After startup:

- UI: http://localhost:4173
- REST API: http://localhost:5100
- RabbitMQ management: http://localhost:15672

## Project layout

- `frontend/` — React + Vite UI with 3 pages (Dashboard, Sensor Details, System Status)
- `services/rest-api/` — REST API, SignalR hub, RabbitMQ consumer, admin reset endpoint
- `services/sql-service/` — gRPC persistence service (SaveTelemetry, GetSensorHistory, ClearTelemetry)
- `services/telemetry-service/` — IoT worker simulating 20 sensors
- `tests/` — xUnit projects per service + integration tests
- `docker-compose.yml` — full stack orchestration
- `.github/workflows/ci.yml` — CI build/test pipeline
- `prompts/` — documented AI prompt usage

## Architecture

### Data flow (per spec: `Redis → API → UI`)

```
sensors (×20)
    │  (one reading / sec, shuffled order)
    ▼
telemetry-service
    │
    ├──► Redis HSET sensor:{id} = { timestamp, value }   ← cache write (source of truth for "now")
    │
    └──► RabbitMQ publish (full payload, durable queue)  ← trigger / fallback / fan-out
                                            │
                                            ▼
                                  rest-api consumer
                                            │
                       ┌────────────────────┼─────────────────────┐
                       │                    │                     │
                       ▼ HashGetAll         ▼ SignalR push        ▼ gRPC SaveTelemetry
                     Redis                Frontend             sql-service
                       │ (on miss/err: fallback to rabbit payload)            │
                       │                                                      ▼
                       │                                              Postgres INSERT
                       ▼
            (value used for both SignalR push and gRPC save)
```

- **Telemetry origin = Redis.** Telemetry-service writes every reading to Redis as `sensor:{id}` hash and publishes a copy on RabbitMQ.
- **RabbitMQ is the trigger.** The REST API consumes a message, then `HashGetAll`s Redis for the actual value, and pushes that to SignalR + persists via gRPC. If the Redis read misses or fails, the rabbit payload is used as fallback so the UI keeps updating.
- **No polling.** RabbitMQ delivery is the only "tap on the shoulder."
- **Postgres is the historical store**, queried by the `GET /api/sensors/{id}/history` endpoint via gRPC.

### Why these technologies

- **Redis** — the live read-cache that satisfies "telemetry must originate in Redis" and the `Redis → API → UI` flow. Holds only the latest value per sensor.
- **RabbitMQ** — durable, decoupled notification channel. Satisfies "no polling," buffers messages when the consumer is slow or restarting, enables competing-consumer scaling, and acts as the canonical extension point for future async subscribers (alerting, analytics, archival).
- **gRPC** — strongly-typed contract between REST API and SQL service (`SaveTelemetry`, `GetSensorHistory`, `ClearTelemetry`).
- **SignalR** — push to browser without polling; the only channel between API and UI besides REST.

### Stability and evolution

- **Stable**: service boundaries, the Redis-as-cache / Rabbit-as-bus / Postgres-as-store split, REST + SignalR boundary for the UI.
- **Likely to change**: persistence schema (time-series partitioning), telemetry partitioning across multiple workers, batched ingest under higher rates.

### Failure scenarios

- **Redis down**: rest-api's `HashGetAll` returns a miss; it falls back to the RabbitMQ payload. UI keeps updating, you'll see `redis_read_miss` events in the log panel.
- **RabbitMQ down**: telemetry-service publish fails. Both SignalR pushes and gRPC saves to Postgres stop. Redis writes continue, so the latest-state cache stays current. Recovery: reconnect, messages resume.
- **sql-service / Postgres down**: live UI feed continues; gRPC saves fail and historical data is lost for that window (mitigation: outbox pattern, not implemented).
- **rest-api restart**: queued messages remain in RabbitMQ; processed on reconnect. SignalR clients reconnect via the automatic-reconnect handler.

### Operational signals to add (not yet wired)

- RabbitMQ queue depth + consumer lag
- Redis hit/miss rate (we already publish `redis_read_miss` events; promote to a counter)
- gRPC latency + error rate per RPC
- SignalR client count + push latency
- Telemetry publish rate vs. expected (20/sec)

## Admin: Reset Data

The UI exposes a **Reset Data** button (top right of the dashboard) that:

1. Calls `POST /api/admin/reset` on the REST API
2. REST API deletes every `sensor:*` key from Redis
3. REST API calls `ClearTelemetry` over gRPC; sql-service issues `DELETE FROM Telemetry`
4. Frontend then clears its in-memory state (events, particles, stored records, latest values, chart history)

After reset, the system is empty for ~1 second and then re-populates as telemetry-service emits the next batch.

## Tests

```bash
dotnet test IndustrialRealTime.sln
cd frontend && npm install && npm run build
```

CI runs both via `.github/workflows/ci.yml`.

## Notes

- All UI ↔ backend communication: REST + SignalR only.
- All backend ↔ backend communication: gRPC + RabbitMQ only. Redis is shared infrastructure (cache), not service-to-service messaging.
- Exactly 20 sensors, one reading per second per sensor, shuffled order so visual traces don't always start with sensor-01.
- Detailed architecture rationale, alternatives, and scaling discussion lives in [architecture.md](architecture.md).
