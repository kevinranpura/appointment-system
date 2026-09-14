/**
 * @swagger
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint
 *     description: Check if the API and database are running
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Smart Appointment API is running
 *                 databaseTime:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Database connection failed
 */

// ============================================================
// AUTH ENDPOINTS
// ============================================================

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Create a new user account with email and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, STAFF, ADMIN]
 *                 example: CUSTOMER
 *               adminSignupKey:
 *                 type: string
 *                 description: Required only if registering as ADMIN
 *               staffSignupKey:
 *                 type: string
 *                 description: Required only if registering as STAFF
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or email already exists
 *       401:
 *         description: Invalid signup key
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticate user and receive JWT tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token (expires in 15 minutes)
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token (expires in 7 days)
 *       400:
 *         description: Invalid email or password
 *       401:
 *         description: User is inactive
 */

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Get a new access token using the refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Invalid or expired refresh token
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user profile
 *     description: Retrieve the profile of the authenticated user
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout user
 *     description: Logout user and revoke refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */

// ============================================================
// BRANCHES ENDPOINTS
// ============================================================

/**
 * @swagger
 * /api/branches:
 *   get:
 *     tags:
 *       - Branches
 *     summary: List all branches
 *     description: Retrieve list of all active branches
 *     responses:
 *       200:
 *         description: Branches retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 branches:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Branch'
 *       401:
 *         description: Unauthorized
 *   post:
 *     tags:
 *       - Branches
 *     summary: Create new branch (Admin only)
 *     description: Create a new branch for the organization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 example: Main Branch
 *               address:
 *                 type: string
 *                 example: 123 Main Street, City, State
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *     responses:
 *       201:
 *         description: Branch created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 branch:
 *                   $ref: '#/components/schemas/Branch'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Insufficient permissions
 */

// ============================================================
// SERVICES ENDPOINTS
// ============================================================

/**
 * @swagger
 * /api/services:
 *   get:
 *     tags:
 *       - Services
 *     summary: List all services
 *     description: Retrieve list of all available services
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 services:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Service'
 *       401:
 *         description: Unauthorized
 *   post:
 *     tags:
 *       - Services
 *     summary: Create new service (Admin only)
 *     description: Create a new service offering
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - duration_minutes
 *             properties:
 *               name:
 *                 type: string
 *                 example: Consultation
 *               description:
 *                 type: string
 *                 example: 30-minute consultation session
 *               duration_minutes:
 *                 type: integer
 *                 minimum: 1
 *                 example: 30
 *               price:
 *                 type: number
 *                 format: decimal
 *                 example: 50.00
 *               capacity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *     responses:
 *       201:
 *         description: Service created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 service:
 *                   $ref: '#/components/schemas/Service'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Insufficient permissions
 */

// ============================================================
// BUSINESS HOURS ENDPOINTS
// ============================================================

/**
 * @swagger
 * /api/business-hours/{branchId}:
 *   get:
 *     tags:
 *       - Business Hours
 *     summary: Get branch business hours
 *     description: Retrieve business hours and breaks for a specific branch
 *     parameters:
 *       - name: branchId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Business hours retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 businessHours:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       day_of_week:
 *                         type: integer
 *                         description: 0=Sunday, 1=Monday, ..., 6=Saturday
 *                       open_time:
 *                         type: string
 *                         format: time
 *                         example: "09:00:00"
 *                       close_time:
 *                         type: string
 *                         format: time
 *                         example: "17:00:00"
 *                 breaks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       day_of_week:
 *                         type: integer
 *                       start_time:
 *                         type: string
 *                         format: time
 *                       end_time:
 *                         type: string
 *                         format: time
 *       404:
 *         description: Branch not found
 *   put:
 *     tags:
 *       - Business Hours
 *     summary: Set branch business hours (Admin only)
 *     description: Update business hours and breaks for a branch
 *     parameters:
 *       - name: branchId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessHours
 *             properties:
 *               businessHours:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - day_of_week
 *                     - open_time
 *                     - close_time
 *                   properties:
 *                     day_of_week:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 6
 *                     open_time:
 *                       type: string
 *                       format: time
 *                       example: "09:00:00"
 *                     close_time:
 *                       type: string
 *                       format: time
 *                       example: "17:00:00"
 *               breaks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day_of_week:
 *                       type: integer
 *                     start_time:
 *                       type: string
 *                       format: time
 *                     end_time:
 *                       type: string
 *                       format: time
 *     responses:
 *       200:
 *         description: Business hours updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Insufficient permissions
 */

// ============================================================
// AVAILABILITY ENDPOINTS
// ============================================================

/**
 * @swagger
 * /api/availability:
 *   get:
 *     tags:
 *       - Availability
 *     summary: Get available time slots
 *     description: Get available appointment slots for a service at a branch
 *     parameters:
 *       - name: branchId
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *         description: Branch ID
 *       - name: serviceId
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *         description: Service ID
 *       - name: date
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to check availability (YYYY-MM-DD)
 *       - name: includeTime
 *         in: query
 *         schema:
 *           type: string
 *           format: time
 *           description: Optional specific time (HH:mm)
 *     responses:
 *       200:
 *         description: Available slots retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 availableSlots:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AvailableSlot'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Branch or service not found
 */

// ============================================================
// APPOINTMENTS ENDPOINTS
// ============================================================

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     tags:
 *       - Appointments
 *     summary: Book an appointment
 *     description: Create a new appointment reservation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branchId
 *               - serviceId
 *               - start_time
 *               - end_time
 *             properties:
 *               branchId:
 *                 type: integer
 *               serviceId:
 *                 type: integer
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-20T10:00:00Z"
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-20T10:30:00Z"
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 appointment:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid input or slot unavailable
 *       409:
 *         description: Time slot conflict
 */

/**
 * @swagger
 * /api/appointments/my:
 *   get:
 *     tags:
 *       - Appointments
 *     summary: Get my appointments
 *     description: Get all appointments for the logged-in user
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Appointments retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 appointments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/appointments/{id}/status:
 *   patch:
 *     tags:
 *       - Appointments
 *     summary: Update appointment status (Staff/Admin only)
 *     description: Change appointment status in the workflow
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newStatus
 *             properties:
 *               newStatus:
 *                 type: string
 *                 enum: [CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW]
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation or change
 *     responses:
 *       200:
 *         description: Appointment status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 appointment:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Invalid status transition
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Appointment not found
 */

// ============================================================
// RESERVATIONS ENDPOINTS
// ============================================================

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     tags:
 *       - Reservations
 *     summary: Get my reservations
 *     description: Get all reservations for the authenticated user
 *     responses:
 *       200:
 *         description: Reservations retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 reservations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Reservation'
 *       401:
 *         description: Unauthorized
 *   post:
 *     tags:
 *       - Reservations
 *     summary: Create a temporary reservation
 *     description: Reserve a time slot temporarily (expires in 5 minutes)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branchId
 *               - serviceId
 *               - start_time
 *               - end_time
 *             properties:
 *               branchId:
 *                 type: integer
 *               serviceId:
 *                 type: integer
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Reservation created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 reservation:
 *                   $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Slot not available
 */

/**
 * @swagger
 * /api/reservations/{id}/confirm:
 *   post:
 *     tags:
 *       - Reservations
 *     summary: Confirm a reservation
 *     description: Convert a temporary reservation into an appointment
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 appointment:
 *                   $ref: '#/components/schemas/Appointment'
 *       400:
 *         description: Reservation expired
 *       404:
 *         description: Reservation not found
 */

/**
 * @swagger
 * /api/reservations/{id}:
 *   delete:
 *     tags:
 *       - Reservations
 *     summary: Cancel a reservation
 *     description: Cancel a temporary reservation
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Reservation cancelled
 *       404:
 *         description: Reservation not found
 */

// ============================================================
// QUEUE ENDPOINTS
// ============================================================

/**
 * @swagger
 * /api/queue:
 *   get:
 *     tags:
 *       - Queue
 *     summary: Get queue entries
 *     description: Get current queue for a branch or all queues
 *     parameters:
 *       - name: branchId
 *         in: query
 *         schema:
 *           type: integer
 *         description: Filter by branch
 *       - name: serviceId
 *         in: query
 *         schema:
 *           type: integer
 *         description: Filter by service
 *     responses:
 *       200:
 *         description: Queue entries retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 queueEntries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QueueEntry'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/queue/check-in:
 *   post:
 *     tags:
 *       - Queue
 *     summary: Check in for appointment
 *     description: Check in to queue for an existing appointment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointmentId
 *             properties:
 *               appointmentId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Successfully checked in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 queueEntry:
 *                   $ref: '#/components/schemas/QueueEntry'
 *       400:
 *         description: Invalid appointment or already checked in
 *       404:
 *         description: Appointment not found
 */

/**
 * @swagger
 * /api/queue/walk-in:
 *   post:
 *     tags:
 *       - Queue
 *     summary: Add walk-in customer (Staff/Admin only)
 *     description: Add a walk-in customer to the queue
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branchId
 *               - serviceId
 *               - customerName
 *               - customerPhone
 *             properties:
 *               branchId:
 *                 type: integer
 *               serviceId:
 *                 type: integer
 *               customerName:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [NORMAL, PRIORITY, EMERGENCY]
 *     responses:
 *       201:
 *         description: Walk-in added to queue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 queueEntry:
 *                   $ref: '#/components/schemas/QueueEntry'
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/queue/call-next:
 *   post:
 *     tags:
 *       - Queue
 *     summary: Call next customer (Staff/Admin only)
 *     description: Call the next customer in the queue based on priority and order
 *     parameters:
 *       - name: branchId
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Next customer called
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 queueEntry:
 *                   $ref: '#/components/schemas/QueueEntry'
 *       404:
 *         description: No customers in queue
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/queue/{id}/start:
 *   patch:
 *     tags:
 *       - Queue
 *     summary: Start serving customer (Staff/Admin only)
 *     description: Mark queue entry as in progress when service starts
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Service started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 queueEntry:
 *                   $ref: '#/components/schemas/QueueEntry'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Queue entry not found
 */

/**
 * @swagger
 * /api/queue/{id}/complete:
 *   patch:
 *     tags:
 *       - Queue
 *     summary: Complete service (Staff/Admin only)
 *     description: Mark customer service as completed
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Service completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 queueEntry:
 *                   $ref: '#/components/schemas/QueueEntry'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Queue entry not found
 */

/**
 * @swagger
 * /api/queue/{id}/no-show:
 *   patch:
 *     tags:
 *       - Queue
 *     summary: Mark as no-show (Staff/Admin only)
 *     description: Mark customer as no-show
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Marked as no-show
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 queueEntry:
 *                   $ref: '#/components/schemas/QueueEntry'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Queue entry not found
 */

// ============================================================
// WAITLIST ENDPOINTS
// ============================================================

/**
 * @swagger
 * /api/waitlist:
 *   post:
 *     tags:
 *       - Waitlist
 *     summary: Join waitlist
 *     description: Add yourself to the waitlist for a service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branchId
 *               - serviceId
 *               - requested_date
 *             properties:
 *               branchId:
 *                 type: integer
 *               serviceId:
 *                 type: integer
 *               requested_date:
 *                 type: string
 *                 format: date
 *               requested_start_time:
 *                 type: string
 *                 format: time
 *               requested_end_time:
 *                 type: string
 *                 format: time
 *               priority:
 *                 type: string
 *                 enum: [NORMAL, PRIORITY, EMERGENCY]
 *                 default: NORMAL
 *     responses:
 *       201:
 *         description: Added to waitlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 waitlistEntry:
 *                   $ref: '#/components/schemas/Waitlist'
 *       400:
 *         description: Invalid input
 */

/**
 * @swagger
 * /api/waitlist/my:
 *   get:
 *     tags:
 *       - Waitlist
 *     summary: Get my waitlist entries
 *     description: Get all waitlist entries for the authenticated user
 *     responses:
 *       200:
 *         description: Waitlist entries retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 waitlistEntries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Waitlist'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/waitlist/{id}:
 *   delete:
 *     tags:
 *       - Waitlist
 *     summary: Cancel waitlist entry
 *     description: Remove yourself from the waitlist
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Removed from waitlist
 *       404:
 *         description: Waitlist entry not found
 */

/**
 * @swagger
 * /api/waitlist/offer-next:
 *   post:
 *     tags:
 *       - Waitlist
 *     summary: Offer slot to next waitlist customer (Staff/Admin only)
 *     description: Find next available waitlist entry and offer an available slot
 *     parameters:
 *       - name: branchId
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *       - name: serviceId
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - start_time
 *               - end_time
 *             properties:
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Slot offered to waitlist customer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 waitlistEntry:
 *                   $ref: '#/components/schemas/Waitlist'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: No waitlist entries found
 */

// ============================================================
// ADMIN ENDPOINTS
// ============================================================

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get admin dashboard (Admin only)
 *     description: Get dashboard statistics and metrics for system monitoring
 *     responses:
 *       200:
 *         description: Dashboard data retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalAppointments:
 *                       type: integer
 *                       description: Total number of appointments
 *                     totalCustomers:
 *                       type: integer
 *                       description: Total number of customers
 *                     totalBranches:
 *                       type: integer
 *                       description: Total number of branches
 *                     totalServices:
 *                       type: integer
 *                       description: Total number of services
 *                     pendingAppointments:
 *                       type: integer
 *                       description: Pending appointments waiting confirmation
 *                     completedAppointments:
 *                       type: integer
 *                       description: Completed appointments
 *                     cancelledAppointments:
 *                       type: integer
 *                       description: Cancelled appointments
 *                     noShowAppointments:
 *                       type: integer
 *                       description: No-show appointments
 *                     averageAppointmentDuration:
 *                       type: number
 *                       description: Average duration in minutes
 *                     appointmentCompletionRate:
 *                       type: number
 *                       format: decimal
 *                       description: Completion rate as percentage
 *                     revenueThisMonth:
 *                       type: number
 *                       format: decimal
 *                       description: Revenue from completed appointments this month
 *       403:
 *         description: Insufficient permissions (Admin only)
 *       401:
 *         description: Unauthorized
 */
