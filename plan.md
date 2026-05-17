# Industrial Real-Time System Assignment Plan

## Goal

Build a real-time distributed system that simulates industrial press telemetry and meets all assignment requirements.

## Task Summary

This assignment requires a Docker Compose-based distributed application with a React + TypeScript UI, a C# REST API, a C# SQL data service using Entity Framework, and a C# IoT telemetry service. The system must simulate exactly 20 sensors emitting telemetry once per second, originate telemetry in Redis, deliver live telemetry to the UI through SignalR, and use gRPC and RabbitMQ only for backend-to-backend communication.

## System Overview

The system will consist of the following services:

1. **React + TypeScript UI**
   - Exactly 3 pages
   - Consumes REST API endpoints
   - Receives live telemetry updates via SignalR

2. **REST API service**
   - Implemented in C#
   - Exposes REST endpoints for the UI
   - Hosts SignalR hub for real-time telemetry pushes
   - Communicates with backend services via gRPC and RabbitMQ only

3. **SQL Data service**
   - Implemented in C# with Entity Framework
   - Provides the SQL database abstraction and data persistence
   - Communicates with the other services through gRPC and/or RabbitMQ as required

4. **IoT Telemetry service**
   - Implemented in C#
   - Simulates exactly 20 sensors, each emitting telemetry once per second
   - Writes telemetry into Redis as the origin source
   - Sends telemetry events to the rest of the backend via RabbitMQ and/or gRPC

5. **Supporting infrastructure**
   - Redis
   - RabbitMQ
   - SQL Database

## Communication & Data Flow

**As implemented (post-Redis refactor):**

- Telemetry-service writes each reading to **Redis** (`HSET sensor:{id}`) AND publishes the full message on **RabbitMQ**.
- The REST API service consumes the RabbitMQ message (the *trigger*, satisfying "no polling"), then **reads the actual value from Redis** (`HashGetAll`) to honor the spec's `Redis → API → UI` data path.
- The REST API pushes that value to the UI via SignalR, and persists it to PostgreSQL via gRPC to the SQL service.
- If the Redis read misses or fails, the REST API falls back to the RabbitMQ payload so the UI keeps updating.
- The UI uses REST only for metadata (`/api/sensors`, `/api/sensors/{id}/history`, `/api/health`, `/api/admin/reset`) and SignalR for live updates.
- Backend services communicate only through gRPC and RabbitMQ. Redis is shared infrastructure (cache), not a service-to-service messaging channel.

## Pages in UI

The React app will include exactly 3 pages:

1. Dashboard
   - Live telemetry stream from all 20 sensors
   - Summary metrics and charts
2. Sensor details
   - Per-sensor telemetry history and current state
3. System status / logs
   - Service health indicators
   - Redis/RabbitMQ/SQL connectivity status

## Requirements Checklist

- [ ] AI prompt documentation under `/prompts`
- [ ] Dockerfile for each service
- [ ] `docker-compose.yml` for full stack
- [ ] GitHub Actions CI pipeline
- [ ] Unit tests for each backend service
- [ ] Integration tests validating end-to-end behavior and all 20 sensors
- [ ] README with architecture explanation and usage instructions

## Implementation Phases

1. **Design and architecture discussion**
   - Confirm service boundaries and communication patterns
   - Define gRPC contracts and RabbitMQ event flows
   - Finalize C# service design for API, data, and telemetry components

2. **Service scaffolding**
   - Create UI skeleton and pages
   - Scaffold REST API service
   - Scaffold SQL Data service with EF
   - Scaffold IoT Telemetry service

3. **Infrastructure with Docker Compose**
   - Add Redis, RabbitMQ, and SQL containers
   - Wire all services into compose network

4. **Telemetry flow implementation**
   - Simulate 20 sensors in IoT Telemetry service
   - Store telemetry in Redis
   - Route events through RabbitMQ/gRPC to REST API
   - Push live updates over SignalR to UI

5. **Testing**
   - Add backend unit tests
   - Add integration tests for full real-time flow
   - Verify CI pipeline runs tests and builds images

6. **Documentation**
   - Complete README with architecture, scaling, failure handling, and operational notes
   - Add AI prompt logs under `/prompts`

## Coding and UI Constraints

- Use **React + Vite + TypeScript** for the UI.
- Keep every file in the project to **no more than 100 lines of code**.
- Avoid literal strings in application code; use constants for message text, route paths, labels, and error text.
- Write modular, composable code with small focused components and services.
- Favor clear separation of concerns between UI, API, SQL data, and telemetry services.
- Use shared type definitions and DTOs for consistent contracts across services.
- Keep service implementations idiomatic and maintainable, while staying within the line limit.

## Architecture Notes for Discussion

- Use Redis as the telemetry origin store and fast cache.
- Use RabbitMQ for event distribution and service decoupling.
- Use gRPC for structured backend service communication and command/query exchange.
- Use SignalR only between REST API and UI for real-time push updates.
- Keep REST strictly between UI and REST API.

## Risks and Constraints

- Must avoid polling; real-time update path must be push-based.
- Service communication limited to gRPC and RabbitMQ.
- Exactly 20 sensors at one update per second must be supported.
- Integration tests must cover all 20 sensor flows.

## Next Step

Discuss the implementation approach and finalize the service choice split before writing code.
