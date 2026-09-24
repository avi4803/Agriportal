# AgriPortal Production Backend

Clean-architecture IoT gateway and agronomic intelligence backend built with Node.js, TypeScript 5, Express, Prisma ORM, PostgreSQL, and Socket.io.

---

## Architectural Principles & Trade-offs

### 1. Ingestion Buffer & Batching (No Redis / BullMQ)
Incoming telemetry from IoT edge nodes carries an `x-device-token` header and reaches `POST /api/v1/telemetry`.
- To avoid saturating the database with per-packet `INSERT` operations under high load, packets are placed into an in-memory queue (`IngestionBufferService`) and immediately acknowledged with **HTTP 202 Accepted**.
- Batches are flushed every **300ms** or when reaching **50 packets**.
- Batches are inserted using `createMany({ skipDuplicates: true })` relying on PostgreSQL's `@@unique([deviceId, recordedAt])` constraint for idempotency.
- In-flight batches feature exponential backoff retry (**200ms -> 800ms -> 3200ms**) on transient connection disconnects.

> **CRITICAL ARCHITECTURAL TRADE-OFF:**
> - The in-memory buffer is **not durable across a process crash or sudden restart**. This is an intentional design choice to eliminate external infrastructure like Redis for this phase.
> - **This backend is designed to run as a single instance; horizontal scaling requires revisiting the buffer and socket adapter.**

---

### 2. Multi-Tenant Team Security & Access Control
Access to telemetry, devices, parcels, and rules is strictly governed through the farm membership graph:
```
User ---> FarmMember (OWNER | ADMIN | VIEWER) ---> Farm ---> Device ---> Telemetry
```
- Devices are never created floating or directly attached to a user.
- Device tokens are hashed using **SHA-256** prior to persistence; raw tokens are shown only once upon initial provisioning or token rotation.
- Every farm-scoped endpoint enforces `requireFarmRole(minRole)`.

---

### 3. Pure-Function Agronomic Engine
All formulas in `src/services/agronomy/` are pure, dependency-free mathematical functions:
- **Level 1 (VPD & Dew Point):** Tetens equation ($VPD = e_s - e_a$).
- **Level 2 (Soil Hydrology):** Weighted infiltration / root-zone deficit.
- **Level 3 (CWSI):** Normalized canopy thermal depression ($T_{canopy} - T_{air}$).
- **Level 4 (Fungal Disease Risk):** Wallin / Mills incubation model.
- **Level 5 (NPK Status):** Configurable per-crop nutrient adequacy index.

The cascading predictor dispatcher (`LEVELS` array) dynamically matches incoming JSONB keys to execute only unlocked formulas and powers the `GET /api/v1/devices/:id/capabilities` endpoint.

---

## Getting Started

### Local Development Setup
```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env

# 3. Generate Prisma client & apply migrations
npx prisma generate
npx prisma migrate dev --name init

# 4. Run development server (with hot reload)
npm run dev
```

The server will listen at `http://localhost:4000`.
Interactive Swagger API documentation is available at:
`http://localhost:4000/api/v1/docs`

---

## IoT Edge Simulator
A realistic Python simulator is included in `scripts/simulate_nodes.py`:
```bash
python scripts/simulate_nodes.py
```
