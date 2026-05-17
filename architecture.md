# Architecture Overview

This system is a distributed industrial real-time telemetry platform built to meet the assignment requirements exactly.

## High-Level Architecture

The architecture includes the following components:

- **React + TypeScript UI**
  - Exactly 3 pages
  - Uses REST to request metadata and status
  - Uses SignalR to receive live telemetry updates

- **REST API service (C#)**
  - Exposes REST endpoints to the UI only
  - Hosts a SignalR hub for real-time telemetry pushes
  - Subscribes to telemetry events from backend services
  - Uses gRPC and RabbitMQ to communicate with backend services

- **SQL Data service (C# + Entity Framework)**
  - Manages persistent storage in the SQL database
  - Provides data model and repository logic
  - Communicates with the REST API or telemetry service via /RabbitMQ

- **IoT Telemetry service (C#)**
  - Simulates exactly 20 sensors
  - Emits telemetry once per second from each sensor
  - Writes telemetry into Redis as the origin store
  - Publishes telemetry via RabbitMQ and/or gRPC to the REST API service

- **Supporting infrastructure**
  - **Redis**: origin source and fast telemetry cache
  - **RabbitMQ**: event bus for backend service communication
  - **SQL Database**: persistent storage for historical data and metadata

## Data Flow

1. The IoT Telemetry service simulates 20 sensors and writes each reading into Redis.
2. Telemetry events are published on RabbitMQ and optionally surfaced via gRPC for structured backend communication.
3. The REST API service receives telemetry events, enriches them if needed, and pushes live updates to the UI through SignalR.
4. The UI displays live data on the dashboard, sensor details, and system status pages.
5. The SQL Data service stores persistent records and answers queries from the REST API.

## Why each technology is used

- **C# for backend services**: provides strong tooling for ASP.NET Core, gRPC, SignalR, and Entity Framework.
- **React + TypeScript UI**: provides a modern front-end that can consume REST and SignalR cleanly.
- **Redis**: fast origin store for streaming telemetry and transient sensor state.
- **RabbitMQ**: decouples services and enables reliable asynchronous telemetry delivery.
- **gRPC**: ensures structured, strongly typed service-to-service communication.
- **SignalR**: provides real-time push updates to the UI without polling.

## Component Responsibilities

- **UI**
  - Presents live telemetry
  - Fetches system metadata over REST
  - Subscribes to SignalR updates for sensor changes

- **REST API service**
  - Acts as the UI gateway
  - Coordinates real-time telemetry distribution
  - Translates backend streams into live client events

- **SQL Data service**
  - Manages persistence and history
  - Serves metadata and archival queries to the REST API

- **IoT Telemetry service**
  - Simulates sensors
  - Writes telemetry into Redis
  - Publishes telemetry events for downstream services

## Scaling, Performance, and Operational Considerations

### High-level boundaries

- The UI is a read-only frontend that uses REST for fetch requests and SignalR for live telemetry.
- The REST API is the gateway for client traffic and the event processor for telemetry.
- The telemetry worker is the ingestion source, writing origin state to Redis and emitting events via RabbitMQ.
- The SQL service is a persistence boundary for history and queries.
- Redis and RabbitMQ are infrastructure boundaries that provide fast state caching and decoupled event delivery.

### Data flow summary

- Telemetry starts in the IoT worker, which writes each sensor reading to Redis and publishes events to RabbitMQ.
- The REST API consumes events from RabbitMQ, forwards live updates to the UI via SignalR, and sends storage requests to the SQL service via gRPC.
- The SQL service persists history to PostgreSQL and answers history/metadata queries for the REST API.
- The UI shows live data and retrieves additional detail using REST from the API.

### Why gRPC, RabbitMQ, and SignalR

- **gRPC** is used for structured, typed communication between the REST API and SQL service. It keeps the storage API contract explicit and reduces plumbing code.
- **RabbitMQ** decouples telemetry ingestion from downstream processing. It allows the telemetry worker and REST API to scale independently and recover from temporary load spikes.
- **SignalR** is used for browser push updates because it avoids polling and delivers low-latency telemetry changes to clients.

### Trade-offs and constraints

- Using both RabbitMQ and gRPC adds complexity, but it keeps event ingestion and persistence responsibilities separated.
- Redis is treated as a transient origin store rather than the source of truth; PostgreSQL is the durable store.
- The current design assumes moderate throughput (20 sensors/sec) and prioritizes correctness, C# stack compliance, and real-time UX over extreme streaming optimization.
- Service boundaries are chosen to keep the UI reactive while allowing backend services to change independently.

### Scaling for more sensors or higher update rates

- Increase telemetry worker instances and partition sensor feeds across multiple workers.
- Scale RabbitMQ horizontally using additional nodes, mirrored queues, or exchanges for higher fan-out.
- Add Redis sharding or use Redis Cluster for larger origin state volumes.
- Increase REST API replicas behind a load balancer, with session-affinity only for SignalR connection management if required.
- Move persistent storage to a time-series optimized store or partition PostgreSQL tables by sensor/time range.
- Batch writes to SQL or use a dedicated ingest worker if write latency becomes a bottleneck.

### Failure scenarios and behavior

- If **Redis is unavailable**, the worker cannot write origin state, but event delivery via RabbitMQ can still continue if the worker is designed to tolerate failed cache writes. The REST API can still deliver live updates if RabbitMQ remains healthy.
- If **RabbitMQ is delayed**, real-time updates slow down; the system should keep the current Redis values and recover when RabbitMQ catches up.
- On **service restarts**, the worker resumes telemetry generation and the REST API reconnects to RabbitMQ and SignalR clients. Persistent storage is preserved in PostgreSQL.
- If **SQL persistence is unavailable**, the REST API can still serve live data from Redis and SignalR, while storage calls fail gracefully and can be retried.

### Operational signals to add

- Request latency and error rates for REST and gRPC endpoints.
- SignalR connection count, disconnects, and message publish duration.
- RabbitMQ queue depth, consumer lag, and publish/ack failures.
- Redis hit/miss rates and connection health.
- Telemetry worker publish rate, sensor update rate, and write failure counts.
- SQL write latency, DB connection pool usage, and migration status.
- Alerts for repeated service restarts, queue backlog growth, and Redis/RabbitMQ unreachable errors.

### Sensor behavior and performance optimization

- For **frequently changing sensors**, use event coalescing, incremental deltas, or selective UI updates to reduce churn.
- For **slow or constant sensors**, avoid sending unchanged values downstream; cache and suppress redundant updates.
- If performance becomes a concern, batch sensor writes, compress or aggregate older data, and use a time-series storage engine.
- Most optimization would happen in the ingestion and persistence pipeline, while leaving the live UI push model intact.

### Stable versus likely-to-change parts

- Stable: UI gateway pattern, REST + SignalR boundary, service separation, and use of Redis/RabbitMQ as decoupling layers.
- Likely to change: the exact persistence backend, telemetry partitioning strategy, and how sensor data is aggregated or downsampled under load.

### Alternative design choices

- A more scalable version could use Kafka or a dedicated time-series ingestion bus instead of RabbitMQ.
- Direct streaming from the telemetry worker to the UI would reduce latency but couple services more tightly.
- If the system needed much higher throughput, a time-series database and a dedicated ingestion pipeline would be preferable.

## Diagram

```mermaid
flowchart TD
    UI[React + TypeScript UI]
    REST[REST API Service (CSharp)]
    SQL[SQL Data Service (CSharp + EF)]
    IOT[IoT Telemetry Service (CSharp)]
    Redis[Redis]
    Rabbit[RabbitMQ]
    Database[SQL Database]

    UI -->|REST calls| REST
    REST -->|SignalR push| UI
    IOT -->|writes telemetry| Redis
    IOT -->|publishes events| Rabbit
    REST -->|subscribes| Rabbit
    REST -->|gRPC/query| SQL
    SQL -->|persistent data| Database
    REST -->|reads/writes| Database
    Redis -->|fast telemetry cache| REST

    classDef infra fill:#f5f5f5,stroke:#999,stroke-width:1px;
    class Redis,Rabbit,Database infra;
    classDef service fill:#eef,stroke:#333,stroke-width:1px;
    class UI,REST,SQL,IOT service;
```
