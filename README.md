# Smart Appointment System

A comprehensive appointment and queue management system built with Express.js, React, PostgreSQL, and Redis. Designed for managing appointments, waitlists, queues, and branch operations across multiple locations.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema & ER Diagram](#database-schema--er-diagram)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running Locally](#running-locally)
  - [Production Build](#production-build)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Queue & Background Jobs](#queue--background-jobs)
- [WebSocket Events](#websocket-events)
- [Key Modules](#key-modules)
- [Contributing](#contributing)

## Features

- **Multi-Branch Management**: Support for multiple branches with independent schedules
- **Appointment Booking**: Reserve appointments with real-time availability checking
- **Waitlist Management**: Smart waitlist with priority levels and automatic offers
- **Queue System**: Real-time queue management with priority queuing (NORMAL, PRIORITY, EMERGENCY)
- **Resource Allocation**: Assign physical resources (rooms, counters) to appointments
- **Business Hours**: Configure flexible business hours and breaks per branch
- **Authentication & Authorization**: Role-based access control (CUSTOMER, STAFF, ADMIN)
- **JWT & Refresh Tokens**: Secure authentication with token rotation
- **Real-time Updates**: WebSocket support for live queue and appointment updates
- **Background Jobs**: BullMQ integration for async task processing
- **Audit Logging**: Track all system changes for compliance
- **Swagger API Documentation**: Interactive API explorer

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL 16
- **Caching & Queue**: Redis 7 + BullMQ
- **Authentication**: JWT with bcrypt
- **Real-time**: Socket.io
- **Validation**: Zod
- **Security**: Helmet, CORS
- **API Docs**: Swagger/OpenAPI

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Real-time**: Socket.io-client
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Smart Appointment System                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐         ┌─────────────────┐           │
│  │   React SPA     │         │  Mobile Client  │           │
│  │   (Vite + TS)   │         │   (Socket.io)   │           │
│  └────────┬────────┘         └────────┬────────┘           │
│           │                          │                      │
│           └──────────┬───────────────┘                      │
│                      │ REST API + WebSocket                 │
│           ┌──────────▼──────────┐                           │
│           │  Express.js Server  │                           │
│           │  (Node.js + TS)     │                           │
│           └──────────┬──────────┘                           │
│                      │                                      │
│      ┌───────────────┼───────────────┐                      │
│      │               │               │                      │
│  ┌───▼───┐      ┌───▼────┐    ┌──────▼────┐               │
│  │  Pg   │      │ Redis  │    │  Job      │               │
│  │(Data) │      │(Cache) │    │  Queue    │               │
│  └───────┘      └────────┘    │(BullMQ)   │               │
│                                └──────┬────┘               │
│                                       │                    │
│                                ┌──────▼────────┐           │
│                                │ Worker Process│           │
│                                │ (Async Tasks) │           │
│                                └───────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema & ER Diagram

### Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        SMART APPOINTMENT SYSTEM - ER DIAGRAM                   │
└──────────────────────────────────────────────────────────────────────────────┘

                            ┌─────────────────┐
                            │     USERS       │
                            ├─────────────────┤
                            │ id (UUID) PK    │
                            │ name            │
                            │ email (UNIQUE)  │
                            │ phone           │
                            │ password_hash   │
                            │ role (ENUM)     │
                            │ is_active       │
                            │ created_at      │
                            └────────┬────────┘
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
                  │ (1:N)            │ (1:N)            │ (1:N)
                  ▼                  ▼                  ▼
        ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐
        │  APPOINTMENTS  │  │ RESERVATIONS │  │ WAITLIST     │
        ├─────────────────┤  ├──────────────┤  ├──────────────┤
        │ id (BIGINT) PK  │  │ id (UUID) PK │  │ id (BIGINT)PK│
        │ customer_id FK  │  │ user_id FK   │  │ customer_id  │
        │ branch_id FK    │  │ branch_id FK │  │ branch_id FK │
        │ service_id FK   │  │ service_id FK│  │ service_id FK│
        │ start_time      │  │ start_time   │  │ requested_dt │
        │ end_time        │  │ end_time     │  │ status (ENUM)│
        │ status (ENUM)   │  │ status (ENUM)│  │ priority     │
        │ appointment_num │  │ expires_at   │  │ joined_at    │
        │ checked_in_at   │  │ created_at   │  │ offered_at   │
        │ started_at      │  │              │  │ expires_at   │
        │ completed_at    │  │              │  └──────────────┘
        │ cancelled_at    │  └──────────────┘
        │ created_at      │
        └────────┬────────┘
                 │
    ┌────────────┼────────────┐
    │ (1:N)      │ (1:N)      │
    ▼            ▼            ▼
  ┌─────────────────────────────┐      ┌──────────────────────┐
  │ APPOINTMENT_RESOURCES       │      │  APPOINTMENT_HISTORY │
  ├─────────────────────────────┤      ├──────────────────────┤
  │ appointment_id FK           │      │ id (BIGINT) PK       │
  │ resource_id FK              │      │ appointment_id FK    │
  │ PRIMARY KEY (appt, resource)│      │ old_status (ENUM)    │
  └──────┬──────────────────────┘      │ new_status (ENUM)    │
         │                             │ changed_by FK        │
         │ (N:1)                       │ reason               │
         ▼                             │ created_at           │
  ┌──────────────────┐                 └──────────────────────┘
  │   RESOURCES      │
  ├──────────────────┤
  │ id (BIGINT) PK   │
  │ name             │
  │ resource_type    │
  │ is_active        │
  │ created_at       │
  └────────┬─────────┘
           │
           │ (N:M through BRANCH_RESOURCES)
           ▼
  ┌──────────────────────────────┐
  │    BRANCH_RESOURCES          │
  ├──────────────────────────────┤
  │ branch_id FK                 │
  │ resource_id FK               │
  │ PRIMARY KEY (branch, resource)
  └──────────┬───────────────────┘
             │
             │ (N:1)
             ▼
  ┌──────────────────────────────┐
  │      BRANCHES                │
  ├──────────────────────────────┤
  │ id (BIGINT) PK               │
  │ name                         │
  │ address                      │
  │ phone                        │
  │ is_active                    │
  │ created_at                   │
  └────────┬──────────────────────┘
           │
    ┌──────┴─────┬──────────────┐
    │ (1:N)      │ (1:N)        │ (1:N)
    ▼            ▼              ▼
┌──────────────┐ ┌────────────┐ ┌──────────────┐
│BUSINESS_HOUR │ │BRANCH_BREAK│ │  HOLIDAYS    │
├──────────────┤ ├────────────┤ ├──────────────┤
│ id (BIGINT)PK│ │ id (BIGINT)│ │ id (BIGINT)PK│
│ branch_id FK │ │ branch_idFK│ │ branch_id FK │
│ day_of_week  │ │ day_of_week│ │ holiday_date │
│ open_time    │ │ start_time │ │ name         │
│ close_time   │ │ end_time   │ └──────────────┘
└──────────────┘ └────────────┘

  ┌──────────────────────────────────────┐
  │        SERVICES                      │
  ├──────────────────────────────────────┤
  │ id (BIGINT) PK                       │
  │ name                                 │
  │ description                          │
  │ duration_minutes                     │
  │ price                                │
  │ capacity                             │
  │ is_active                            │
  │ created_at                           │
  └────────┬──────────────────────────────┘
           │
           │ (1:N)
           ▼
  ┌──────────────────────────────┐
  │SERVICE_RESOURCE_REQUIREMENTS │
  ├──────────────────────────────┤
  │ service_id FK                │
  │ resource_type (VARCHAR)      │
  │ quantity                     │
  │ PRIMARY KEY (service, rsrc_type)
  └──────────────────────────────┘

  ┌──────────────────────────────┐       ┌──────────────────────┐
  │    QUEUE_ENTRIES             │       │   REFRESH_TOKENS     │
  ├──────────────────────────────┤       ├──────────────────────┤
  │ id (BIGINT) PK               │       │ id (BIGINT) PK       │
  │ branch_id FK                 │       │ user_id FK           │
  │ customer_id FK               │       │ token_hash (UNIQUE)  │
  │ appointment_id FK            │       │ expires_at           │
  │ service_id FK                │       │ revoked_at           │
  │ customer_name                │       │ created_at           │
  │ customer_phone               │       └──────────────────────┘
  │ queue_number                 │
  │ priority (ENUM)              │       ┌──────────────────────┐
  │ status (ENUM)                │       │  NOTIFICATIONS       │
  │ checked_in_at                │       ├──────────────────────┤
  │ called_at                    │       │ id (BIGINT) PK       │
  │ started_at                   │       │ user_id FK           │
  │ completed_at                 │       │ type (ENUM)          │
  │ created_at                   │       │ title                │
  └──────────────────────────────┘       │ message              │
                                         │ is_read              │
  ┌──────────────────────────────┐       │ created_at           │
  │     AUDIT_LOGS               │       └──────────────────────┘
  ├──────────────────────────────┤
  │ id (BIGINT) PK               │       ┌──────────────────────┐
  │ user_id FK                   │       │ IDEMPOTENCY_KEYS     │
  │ action (VARCHAR)             │       ├──────────────────────┤
  │ entity_type (VARCHAR)        │       │ id (BIGINT) PK       │
  │ entity_id (VARCHAR)          │       │ idempotency_key      │
  │ details (JSONB)              │       │ user_id FK           │
  │ created_at                   │       │ endpoint             │
  └──────────────────────────────┘       │ request_hash         │
                                         │ response_status      │
                                         │ response_body (JSONB)│
                                         │ created_at           │
                                         │ expires_at           │
                                         └──────────────────────┘
```

### Key Enums

| Enum | Values |
|------|--------|
| **user_role** | CUSTOMER, STAFF, ADMIN |
| **appointment_status** | PENDING, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW |
| **reservation_status** | ACTIVE, EXPIRED, CONVERTED, CANCELLED |
| **queue_priority** | NORMAL, PRIORITY, EMERGENCY |
| **queue_status** | WAITING, CALLED, IN_PROGRESS, COMPLETED, SKIPPED, CANCELLED |
| **waitlist_status** | WAITING, OFFERED, BOOKED, EXPIRED, CANCELLED |
| **notification_type** | APPOINTMENT_CONFIRMED, APPOINTMENT_CANCELLED, APPOINTMENT_RESCHEDULED, APPOINTMENT_REMINDER, WAITLIST_AVAILABLE, QUEUE_POSITION_CHANGED, CUSTOMER_CALLED, APPOINTMENT_COMPLETED |

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Docker & Docker Compose (for easy database setup)
- Git
- PostgreSQL 16+ (if running without Docker)
- Redis 7+ (if running without Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smart-appointment-system.git
   cd smart-appointment-system
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Running Locally

#### Option 1: With Docker (Recommended)

1. **Start PostgreSQL and Redis**
   ```bash
   docker-compose up -d
   ```

   This starts:
   - PostgreSQL (port 5432)
   - Redis (port 6379)

2. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   ```

3. **Run database migrations**
   ```bash
   cd backend

    # Apply database migrations
        psql -U appointment_user -d appointment_db -f database/migrations/001_initial_schema.sql
        psql -U appointment_user -d appointment_db -f database/migrations/002_refresh_tokens.sql

    # Load sample data
        psql -U appointment_user -d appointment_db -f database/seed.sql
   cd ..
   ```

4. **Start the backend server** (in a new terminal)
   ```bash
   cd backend
   npm run dev
   ```
   Server runs on http://localhost:5000

5. **Start the worker process** (in another terminal for async jobs)
   ```bash
   cd backend
   npm run worker
   ```

6. **Start the frontend** (in another terminal)
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on http://localhost:5173

#### Option 2: Manual Setup (Without Docker)

1. **Set up PostgreSQL**
   ```bash
   # Create database and user
   createdb appointment_db
   createuser -P appointment_user
   # Set password: appointment_password
   
   # Grant privileges
   psql appointment_db
   GRANT ALL PRIVILEGES ON DATABASE appointment_db TO appointment_user;
   ```

2. **Set up Redis**
   ```bash
   # On macOS with Homebrew
   brew install redis
   brew services start redis
   
   # On Linux
   sudo apt-get install redis-server
   sudo systemctl start redis-server
   ```

3. **Initialize database schema**
   ```bash
   cd backend
   psql -U appointment_user -d appointment_db -f database/migrations/001_initial_schema.sql
   psql -U appointment_user -d appointment_db -f database/migrations/002_refresh_tokens.sql
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Start the application**
   ```bash
   # Terminal 1: Backend
   npm run dev
   
   # Terminal 2: Worker
   npm run worker
   
   # Terminal 3: Frontend
   cd ../frontend
   npm run dev
   ```

### Production Build

1. **Build backend**
   ```bash
   cd backend
   npm run build
   NODE_ENV=production npm start
   ```

2. **Build frontend**
   ```bash
   cd frontend
   npm run build
   # Serve dist/ with your web server (Nginx, Apache, etc.)
   ```

## API Documentation

### Interactive Swagger Documentation

Once the backend is running, visit:
```
http://localhost:5000/api-docs
```

### Main API Endpoints

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me` |
| **Branches** | `GET /api/branches`, `POST /api/branches` |
| **Services** | `GET /api/services`, `POST /api/services` |
| **Business Hours** | `GET /api/business-hours/:branchId`, `PUT /api/business-hours/:branchId` |
| **Availability** | `GET /api/availability?branchId=&serviceId=&date=` |
| **Appointments** | `GET /api/appointments/my`, `POST /api/appointments`, `PATCH /api/appointments/:id/status` |
| **Reservations** | `GET /api/reservations`, `POST /api/reservations`, `POST /api/reservations/:id/confirm`, `DELETE /api/reservations/:id` |
| **Waitlist** | `POST /api/waitlist`, `GET /api/waitlist/my`, `DELETE /api/waitlist/:id`, `POST /api/waitlist/offer-next` |
| **Queue** | `GET /api/queue`, `POST /api/queue/check-in`, `POST /api/queue/walk-in`, `POST /api/queue/call-next`, `PATCH /api/queue/:id/start`, `PATCH /api/queue/:id/complete`, `PATCH /api/queue/:id/no-show` |
| **Admin** | `GET /api/admin/dashboard`, `GET /api/admin/analytics` |

## Booking, Concurrency & Idempotency

### Booking Flow

1. Customer requests available slots for a branch, service and date.
2. Availability is calculated using:
   - Branch business hours
   - Breaks
   - Holidays
   - Service duration
   - Service capacity
   - Existing appointments
   - Active temporary reservations
   - Required resources
3. Customer can temporarily reserve a slot.
4. The reservation expires automatically after the configured TTL.
5. The customer confirms the reservation to create an appointment.
6. Appointment creation performs a final availability re-check before committing.

### Concurrency Control

Appointment and reservation creation use PostgreSQL transactions and branch-level advisory locks.

The booking flow:
- Starts a database transaction
- Acquires a PostgreSQL advisory transaction lock for the branch
- Re-checks slot availability
- Validates capacity and resource availability
- Creates the appointment and resource assignments
- Records appointment history
- Commits the transaction

This prevents concurrent booking requests from creating conflicting appointments for the same branch.

### Idempotency

The database includes an `idempotency_keys` table as the foundation for idempotent request handling. Critical identifiers such as appointment numbers and refresh-token hashes also use unique database constraints.

> Current limitation: full idempotency-key middleware is not yet wired into every write endpoint.


## Waitlist Logic

Customers can join a waitlist for a specific branch, service and requested date.

Each entry can optionally include:
- Preferred start time
- Preferred end time
- Priority level

Supported priorities:
- `NORMAL`
- `PRIORITY`
- `EMERGENCY`

Waitlist ordering is determined by priority first and join time second:

`EMERGENCY → PRIORITY → NORMAL`

Within the same priority, earlier entries are processed first.

Staff/Admin users can use the `offer-next` operation to select the next eligible waiting customer. The selected entry changes from `WAITING` to `OFFERED` and receives a 15-minute offer expiry.

Customers can view and cancel their waitlist entries from the customer dashboard.


## Queue Prioritization & Resource Allocation

### Queue Prioritization

Queue entries are ordered using:

1. Priority level
2. Check-in time

Priority order:

`EMERGENCY → PRIORITY → NORMAL`

Queue entries progress through:

`WAITING → CALLED → IN_PROGRESS → COMPLETED`

Entries can also be marked as `SKIPPED` or `CANCELLED`.

Staff can:
- Check in scheduled customers
- Add walk-in customers
- Call the next customer
- Start service
- Complete service
- Mark customers as no-show/skip

### Resource Allocation

Services define their required resource types and quantities.

Examples:
- General Consultation → 1 ROOM
- Quick Service → 1 COUNTER
- Extended Consultation → 1 ROOM

During booking, the system:
- Finds resources assigned to the selected branch
- Checks existing appointment resource allocations
- Verifies overlapping bookings
- Assigns available resources to the new appointment

Resource assignments are stored in the `appointment_resources` table.

## Project Structure

```
smart-appointment-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts              # PostgreSQL connection
│   │   │   └── swagger.ts         # API documentation
│   │   ├── modules/               # Feature modules
│   │   │   ├── auth/
│   │   │   ├── appointments/
│   │   │   ├── availability/
│   │   │   ├── branches/
│   │   │   ├── queue/
│   │   │   ├── reservations/
│   │   │   ├── services/
│   │   │   ├── waitlist/
│   │   │   └── admin/
│   │   ├── middlewares/
│   │   │   └── auth.middleware.ts # JWT authentication
│   │   ├── jobs/
│   │   │   ├── reservation.queue.ts    # BullMQ queue setup
│   │   │   └── reservation.worker.ts   # Background job processor
│   │   ├── sockets/
│   │   │   └── socket.ts          # WebSocket handlers
│   │   ├── utils/
│   │   │   └── auth.ts            # Auth utilities
│   │   ├── app.ts                 # Express app setup
│   │   ├── server.ts              # Server entry point
│   │   └── worker.ts              # Worker entry point
│   ├── database/
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql
│   │   │   └── 002_refresh_tokens.sql
│   │   └── seed.sql               # Sample data
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/            # React components
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API client
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   │   └── icons.svg
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── docker-compose.yml
└── README.md
```

## Environment Variables

### Backend (.env)

```env
# Server
PORT=5000

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=appointment_user
DB_PASSWORD=appointment_password
DB_NAME=appointment_db

# JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Reservation Configuration
RESERVATION_TTL_SECONDS=300  # 5 minutes

# Security Keys
ADMIN_SIGNUP_KEY=your-admin-password
STAFF_SIGNUP_KEY=your-staff-password
```

## Queue & Background Jobs

The system uses **BullMQ** for async job processing:

### Job Types

- **Reservation Expiry**: Automatically expires active temporary reservations after the configured TTL.

The reservation workflow creates a delayed BullMQ job when a reservation is created. The worker processes the job after the TTL and marks the reservation as `EXPIRED` if it is still active.

Redis is used as the BullMQ job backend rather than as an application cache.

### Starting the Worker

```bash
npm run worker
```

The worker monitors Redis job queues and processes jobs automatically.

## WebSocket Events

The system uses Socket.IO for real-time queue updates.

Clients join a branch-specific room:

```javascript
socket.emit("join-branch", branchId);
```

## Key Modules

### Authentication Module
- User registration with role-based signup keys
- JWT token generation and refresh
- Password hashing with bcrypt
- Token revocation via refresh token storage

### Appointment Module
- Full appointment lifecycle management
- Valid status transitions:
  `PENDING → CONFIRMED → CHECKED_IN → IN_PROGRESS → COMPLETED`
- Cancellation and no-show handling
- Appointment history tracking
- Resource assignment to appointments

### Availability Module
- Real-time slot availability checking
- Considers business hours, breaks, holidays, and existing appointments
- Resource availability verification

### Queue Module
- Priority-based queue system
- Queue position tracking
- Real-time queue updates via WebSocket
- Call management for queue entries

### Waitlist Module
- Waitlist entries by branch, service and date
- Priority-based ordering
- Optional preferred time range
- Staff/Admin waitlist offer generation
- 15-minute offer expiry
- Customer waitlist cancellation

### Reservation Module
- Temporary slot reservations
- Configurable TTL-based expiry
- PostgreSQL transaction and advisory-lock protection
- Conversion to appointments
- Reservation cancellation
- BullMQ-based expiry processing

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

ISC License - See LICENSE file for details

---

**Need Help?**
- Check the [API Documentation](http://localhost:5000/api-docs)
- Review database schema in `backend/database/migrations/`
- Check application logs in backend terminal

**For Issues:**
- Create an issue on GitHub
- Include error logs and steps to reproduce
