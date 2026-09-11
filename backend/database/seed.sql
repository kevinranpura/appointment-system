-- ============================================================
-- SMART APPOINTMENT SYSTEM - DEVELOPMENT SEED DATA
-- ============================================================

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------

INSERT INTO users (name, email, phone, password_hash, role)
VALUES
(
    'System Admin',
    'admin@example.com',
    '9000000001',
    '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012',
    'ADMIN'
),
(
    'Staff User',
    'staff@example.com',
    '9000000002',
    '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012',
    'STAFF'
),
(
    'Test Customer',
    'customer@example.com',
    '9000000003',
    '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012',
    'CUSTOMER'
);

-- ------------------------------------------------------------
-- BRANCH
-- ------------------------------------------------------------

INSERT INTO branches (name, address, phone)
VALUES
(
    'Ahmedabad Main Branch',
    '123 Example Road, Ahmedabad, Gujarat',
    '07940000000'
);

-- ------------------------------------------------------------
-- SERVICES
-- ------------------------------------------------------------

INSERT INTO services
    (name, description, duration_minutes, price, capacity)
VALUES
(
    'General Consultation',
    'Standard customer consultation',
    30,
    500.00,
    1
),
(
    'Quick Service',
    'Short-duration service',
    15,
    250.00,
    2
),
(
    'Extended Consultation',
    'Long-form consultation',
    60,
    1000.00,
    1
);

-- ------------------------------------------------------------
-- RESOURCES
-- ------------------------------------------------------------

INSERT INTO resources (name, resource_type)
VALUES
('Consultation Room 1', 'ROOM'),
('Consultation Room 2', 'ROOM'),
('Service Counter 1', 'COUNTER'),
('Service Counter 2', 'COUNTER');

-- ------------------------------------------------------------
-- BRANCH RESOURCES
-- ------------------------------------------------------------

INSERT INTO branch_resources (branch_id, resource_id)
SELECT
    b.id,
    r.id
FROM branches b
CROSS JOIN resources r
WHERE b.name = 'Ahmedabad Main Branch';

-- ------------------------------------------------------------
-- SERVICE RESOURCE REQUIREMENTS
-- ------------------------------------------------------------

INSERT INTO service_resource_requirements
    (service_id, resource_type, quantity)
SELECT
    id,
    'ROOM',
    1
FROM services
WHERE name IN (
    'General Consultation',
    'Extended Consultation'
);

INSERT INTO service_resource_requirements
    (service_id, resource_type, quantity)
SELECT
    id,
    'COUNTER',
    1
FROM services
WHERE name = 'Quick Service';

-- ------------------------------------------------------------
-- BUSINESS HOURS
-- Monday - Friday: 09:00 - 17:00
-- Saturday:        09:00 - 13:00
-- Sunday:          Closed
-- ------------------------------------------------------------

INSERT INTO business_hours
    (branch_id, day_of_week, open_time, close_time)
SELECT
    id,
    day,
    '09:00',
    CASE
        WHEN day = 6 THEN '13:00'::TIME
        ELSE '17:00'::TIME
    END
FROM branches
CROSS JOIN generate_series(1, 6) AS day;

-- ------------------------------------------------------------
-- BREAK
-- Monday - Friday: 13:00 - 14:00
-- ------------------------------------------------------------

INSERT INTO branch_breaks
    (branch_id, day_of_week, start_time, end_time)
SELECT
    id,
    day,
    '13:00',
    '14:00'
FROM branches
CROSS JOIN generate_series(1, 5) AS day;