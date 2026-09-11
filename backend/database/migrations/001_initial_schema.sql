-- ============================================================
-- SMART APPOINTMENT & QUEUE MANAGEMENT SYSTEM
-- Initial Database Schema
-- PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
    'CUSTOMER',
    'STAFF',
    'ADMIN'
);

CREATE TYPE appointment_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CHECKED_IN',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW'
);

CREATE TYPE reservation_status AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'CONVERTED',
    'CANCELLED'
);

CREATE TYPE queue_priority AS ENUM (
    'NORMAL',
    'PRIORITY',
    'EMERGENCY'
);

CREATE TYPE queue_status AS ENUM (
    'WAITING',
    'CALLED',
    'IN_PROGRESS',
    'COMPLETED',
    'SKIPPED',
    'CANCELLED'
);

CREATE TYPE waitlist_status AS ENUM (
    'WAITING',
    'OFFERED',
    'BOOKED',
    'EXPIRED',
    'CANCELLED'
);

CREATE TYPE notification_type AS ENUM (
    'APPOINTMENT_CONFIRMED',
    'APPOINTMENT_CANCELLED',
    'APPOINTMENT_RESCHEDULED',
    'APPOINTMENT_REMINDER',
    'WAITLIST_AVAILABLE',
    'QUEUE_POSITION_CHANGED',
    'CUSTOMER_CALLED',
    'APPOINTMENT_COMPLETED'
);


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    phone VARCHAR(20),

    password_hash TEXT NOT NULL,

    role user_role NOT NULL DEFAULT 'CUSTOMER',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role
    ON users(role);

CREATE INDEX idx_users_phone
    ON users(phone);


-- ============================================================
-- BRANCHES
-- ============================================================

CREATE TABLE branches (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    address TEXT NOT NULL,

    phone VARCHAR(20),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- SERVICES
-- ============================================================

CREATE TABLE services (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    duration_minutes INTEGER NOT NULL
        CHECK (duration_minutes > 0),

    price NUMERIC(10, 2) NOT NULL DEFAULT 0
        CHECK (price >= 0),

    capacity INTEGER NOT NULL DEFAULT 1
        CHECK (capacity > 0),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- RESOURCES
-- Examples:
-- Room 1, Counter 2, Desk 4, Bay 1
-- ============================================================

CREATE TABLE resources (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    resource_type VARCHAR(100) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- BRANCH RESOURCES
-- Which physical resources belong to which branch.
-- ============================================================

CREATE TABLE branch_resources (
    branch_id BIGINT NOT NULL,

    resource_id BIGINT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (branch_id, resource_id),

    FOREIGN KEY (branch_id)
        REFERENCES branches(id)
        ON DELETE CASCADE,

    FOREIGN KEY (resource_id)
        REFERENCES resources(id)
        ON DELETE CASCADE
);


-- ============================================================
-- SERVICE RESOURCE REQUIREMENTS
--
-- Example:
-- Dental Consultation requires:
--   1 resource of type "ROOM"
--
-- ============================================================

CREATE TABLE service_resource_requirements (
    service_id BIGINT NOT NULL,

    resource_type VARCHAR(100) NOT NULL,

    quantity INTEGER NOT NULL DEFAULT 1
        CHECK (quantity > 0),

    PRIMARY KEY (service_id, resource_type),

    FOREIGN KEY (service_id)
        REFERENCES services(id)
        ON DELETE CASCADE
);


-- ============================================================
-- BUSINESS HOURS
--
-- day_of_week:
-- 0 = Sunday
-- 1 = Monday
-- ...
-- 6 = Saturday
-- ============================================================

CREATE TABLE business_hours (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    branch_id BIGINT NOT NULL,

    day_of_week INTEGER NOT NULL
        CHECK (day_of_week BETWEEN 0 AND 6),

    open_time TIME NOT NULL,

    close_time TIME NOT NULL,

    CHECK (open_time < close_time),

    FOREIGN KEY (branch_id)
        REFERENCES branches(id)
        ON DELETE CASCADE,

    UNIQUE (branch_id, day_of_week, open_time, close_time)
);


-- ============================================================
-- BREAK PERIODS
-- ============================================================

CREATE TABLE branch_breaks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    branch_id BIGINT NOT NULL,

    day_of_week INTEGER NOT NULL
        CHECK (day_of_week BETWEEN 0 AND 6),

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    CHECK (start_time < end_time),

    FOREIGN KEY (branch_id)
        REFERENCES branches(id)
        ON DELETE CASCADE
);


-- ============================================================
-- HOLIDAYS
-- ============================================================

CREATE TABLE holidays (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    branch_id BIGINT NOT NULL,

    holiday_date DATE NOT NULL,

    name VARCHAR(150),

    FOREIGN KEY (branch_id)
        REFERENCES branches(id)
        ON DELETE CASCADE,

    UNIQUE (branch_id, holiday_date)
);


-- ============================================================
-- APPOINTMENTS
-- ============================================================

CREATE TABLE appointments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    appointment_number VARCHAR(30) NOT NULL UNIQUE,

    customer_id UUID NOT NULL,

    branch_id BIGINT NOT NULL,

    service_id BIGINT NOT NULL,

    start_time TIMESTAMPTZ NOT NULL,

    end_time TIMESTAMPTZ NOT NULL,

    status appointment_status NOT NULL DEFAULT 'PENDING',

    checked_in_at TIMESTAMPTZ,

    started_at TIMESTAMPTZ,

    completed_at TIMESTAMPTZ,

    cancelled_at TIMESTAMPTZ,

    no_show_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (start_time < end_time),

    FOREIGN KEY (customer_id)
        REFERENCES users(id),

    FOREIGN KEY (branch_id)
        REFERENCES branches(id),

    FOREIGN KEY (service_id)
        REFERENCES services(id)
);

CREATE INDEX idx_appointments_customer
    ON appointments(customer_id);

CREATE INDEX idx_appointments_branch_time
    ON appointments(branch_id, start_time);

CREATE INDEX idx_appointments_service_time
    ON appointments(service_id, start_time);

CREATE INDEX idx_appointments_status
    ON appointments(status);


-- ============================================================
-- APPOINTMENT RESOURCES
-- Actual physical resources assigned to an appointment.
-- ============================================================

CREATE TABLE appointment_resources (
    appointment_id BIGINT NOT NULL,

    resource_id BIGINT NOT NULL,

    PRIMARY KEY (appointment_id, resource_id),

    FOREIGN KEY (appointment_id)
        REFERENCES appointments(id)
        ON DELETE CASCADE,

    FOREIGN KEY (resource_id)
        REFERENCES resources(id)
        ON DELETE RESTRICT
);


-- ============================================================
-- APPOINTMENT HISTORY
-- Keeps lifecycle changes.
-- ============================================================

CREATE TABLE appointment_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    appointment_id BIGINT NOT NULL,

    old_status appointment_status,

    new_status appointment_status NOT NULL,

    changed_by UUID,

    reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (appointment_id)
        REFERENCES appointments(id)
        ON DELETE CASCADE,

    FOREIGN KEY (changed_by)
        REFERENCES users(id)
);


-- ============================================================
-- TEMPORARY RESERVATIONS
-- ============================================================

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    branch_id BIGINT NOT NULL,

    service_id BIGINT NOT NULL,

    start_time TIMESTAMPTZ NOT NULL,

    end_time TIMESTAMPTZ NOT NULL,

    status reservation_status NOT NULL DEFAULT 'ACTIVE',

    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id)
        REFERENCES users(id),

    FOREIGN KEY (branch_id)
        REFERENCES branches(id),

    FOREIGN KEY (service_id)
        REFERENCES services(id),

    CHECK (start_time < end_time)
);

CREATE INDEX idx_reservations_slot
    ON reservations(branch_id, service_id, start_time, end_time);

CREATE INDEX idx_reservations_expiry
    ON reservations(status, expires_at);


-- ============================================================
-- WAITLIST
-- ============================================================

CREATE TABLE waitlist (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    customer_id UUID NOT NULL,

    branch_id BIGINT NOT NULL,

    service_id BIGINT NOT NULL,

    requested_date DATE NOT NULL,

    requested_start_time TIME,

    requested_end_time TIME,

    status waitlist_status NOT NULL DEFAULT 'WAITING',

    priority queue_priority NOT NULL DEFAULT 'NORMAL',

    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    offered_at TIMESTAMPTZ,

    expires_at TIMESTAMPTZ,

    FOREIGN KEY (customer_id)
        REFERENCES users(id),

    FOREIGN KEY (branch_id)
        REFERENCES branches(id),

    FOREIGN KEY (service_id)
        REFERENCES services(id)
);

CREATE INDEX idx_waitlist_matching
    ON waitlist(
        branch_id,
        service_id,
        requested_date,
        status,
        priority,
        joined_at
);


-- ============================================================
-- QUEUE ENTRIES
-- ============================================================

CREATE TABLE queue_entries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    branch_id BIGINT NOT NULL,

    customer_id UUID,

    appointment_id BIGINT,

    customer_name VARCHAR(100) NOT NULL,

    customer_phone VARCHAR(20),

    service_id BIGINT NOT NULL,

    priority queue_priority NOT NULL DEFAULT 'NORMAL',

    queue_number VARCHAR(30) NOT NULL,

    status queue_status NOT NULL DEFAULT 'WAITING',

    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    called_at TIMESTAMPTZ,

    started_at TIMESTAMPTZ,

    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (branch_id)
        REFERENCES branches(id),

    FOREIGN KEY (customer_id)
        REFERENCES users(id),

    FOREIGN KEY (appointment_id)
        REFERENCES appointments(id),

    FOREIGN KEY (service_id)
        REFERENCES services(id)
);

CREATE INDEX idx_queue_branch_status
    ON queue_entries(branch_id, status, priority, checked_in_at);

CREATE INDEX idx_queue_appointment
    ON queue_entries(appointment_id);


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id UUID NOT NULL,

    type notification_type NOT NULL,

    title VARCHAR(200) NOT NULL,

    message TEXT NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user
    ON notifications(user_id, is_read, created_at DESC);


-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id UUID,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100) NOT NULL,

    entity_id VARCHAR(100),

    details JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
);


-- ============================================================
-- IDEMPOTENCY KEYS
-- Prevent duplicate operations when requests are retried.
-- ============================================================

CREATE TABLE idempotency_keys (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    idempotency_key VARCHAR(255) NOT NULL,

    user_id UUID NOT NULL,

    endpoint VARCHAR(255) NOT NULL,

    request_hash VARCHAR(64) NOT NULL,

    response_status INTEGER,

    response_body JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    expires_at TIMESTAMPTZ NOT NULL,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    UNIQUE (user_id, idempotency_key)
);

CREATE INDEX idx_idempotency_expiry
    ON idempotency_keys(expires_at);