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
   # The migrations will be applied when the server starts
   npm run dev
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
| **Auth** | `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/refresh` |
| **Branches** | `GET /api/branches`, `POST /api/branches` |
| **Services** | `GET /api/services`, `POST /api/services` |
| **Business Hours** | `GET /api/business-hours`, `POST /api/business-hours` |
| **Availability** | `GET /api/availability/slots` |
| **Appointments** | `GET /api/appointments`, `POST /api/appointments`, `PATCH /api/appointments/:id` |
| **Reservations** | `POST /api/reservations`, `GET /api/reservations/:id` |
| **Waitlist** | `GET /api/waitlist`, `POST /api/waitlist`, `PATCH /api/waitlist/:id` |
| **Queue** | `GET /api/queue`, `POST /api/queue/check-in`, `PATCH /api/queue/:id` |
| **Admin** | `GET /api/admin/stats`, `GET /api/admin/audit-logs` |

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

- **Reservation Expiry**: Automatically expires reservations after TTL
- **Waitlist Processing**: Matches available slots to waitlisted customers
- **Notification Dispatch**: Sends notifications to users
- **Appointment Reminders**: Sends reminders before appointments

### Starting the Worker

```bash
npm run worker
```

The worker monitors Redis job queues and processes jobs automatically.

## WebSocket Events

Real-time updates via Socket.io:

```javascript
// Queue Updates
socket.on('queue:updated', (data) => {
  // Queue status changed
})

socket.on('queue:called', (data) => {
  // Customer called from queue
})

// Appointment Updates
socket.on('appointment:status-changed', (data) => {
  // Appointment status updated
})

socket.on('appointment:confirmed', (data) => {
  // Appointment confirmed
})

// Waitlist Updates
socket.on('waitlist:slot-offered', (data) => {
  // Slot offered to waitlisted customer
})
```

## Key Modules

### Authentication Module
- User registration with role-based signup keys
- JWT token generation and refresh
- Password hashing with bcrypt
- Token revocation via refresh token storage

### Appointment Module
- Full appointment lifecycle management
- Status tracking (PENDING → CONFIRMED → CHECKED_IN → COMPLETED)
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
- Automatic slot matching
- Priority levels for waitlist entries
- Automatic offer generation
- Expiry management

### Reservation Module
- Temporary slot reservations
- TTL-based expiry
- Conversion to appointments
- Idempotent reservation creation

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
