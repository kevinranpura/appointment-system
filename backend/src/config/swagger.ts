import swaggerJSDoc from "swagger-jsdoc";

const swaggerOptions: swaggerJSDoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Smart Appointment & Queue Management API",
            version: "1.0.0",
            description: `
REST API for appointment booking, availability, reservations, waitlists, queue management, and administration.

## Key Features
- Multi-branch appointment management
- Real-time availability checking
- Queue management with priority levels
- Waitlist with automatic slot matching
- Role-based access control (CUSTOMER, STAFF, ADMIN)
- JWT authentication with refresh tokens

## Authentication
All endpoints (except register/login) require a Bearer token in the Authorization header.
      `,
            contact: {
                name: "Support",
                email: "support@example.com",
            },
            license: {
                name: "ISC",
            },
        },
        servers: [
            {
                url: "http://localhost:5000",
                description: "Local development server",
            },
            {
                url: "https://api.example.com",
                description: "Production server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "JWT Bearer token for authentication",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        email: { type: "string", format: "email" },
                        phone: { type: "string" },
                        role: {
                            type: "string",
                            enum: ["CUSTOMER", "STAFF", "ADMIN"],
                        },
                        is_active: { type: "boolean" },
                        created_at: { type: "string", format: "date-time" },
                        updated_at: { type: "string", format: "date-time" },
                    },
                },
                Branch: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        name: { type: "string" },
                        address: { type: "string" },
                        phone: { type: "string" },
                        is_active: { type: "boolean" },
                        created_at: { type: "string", format: "date-time" },
                        updated_at: { type: "string", format: "date-time" },
                    },
                },
                Service: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        name: { type: "string" },
                        description: { type: "string" },
                        duration_minutes: { type: "integer" },
                        price: { type: "number", format: "decimal" },
                        capacity: { type: "integer" },
                        is_active: { type: "boolean" },
                        created_at: { type: "string", format: "date-time" },
                        updated_at: { type: "string", format: "date-time" },
                    },
                },
                Appointment: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        appointment_number: { type: "string" },
                        customer_id: { type: "string", format: "uuid" },
                        branch_id: { type: "integer" },
                        service_id: { type: "integer" },
                        start_time: { type: "string", format: "date-time" },
                        end_time: { type: "string", format: "date-time" },
                        status: {
                            type: "string",
                            enum: [
                                "PENDING",
                                "CONFIRMED",
                                "CHECKED_IN",
                                "IN_PROGRESS",
                                "COMPLETED",
                                "CANCELLED",
                                "NO_SHOW",
                            ],
                        },
                        checked_in_at: { type: "string", format: "date-time" },
                        started_at: { type: "string", format: "date-time" },
                        completed_at: { type: "string", format: "date-time" },
                        cancelled_at: { type: "string", format: "date-time" },
                        created_at: { type: "string", format: "date-time" },
                        updated_at: { type: "string", format: "date-time" },
                    },
                },
                Reservation: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        user_id: { type: "string", format: "uuid" },
                        branch_id: { type: "integer" },
                        service_id: { type: "integer" },
                        start_time: { type: "string", format: "date-time" },
                        end_time: { type: "string", format: "date-time" },
                        status: {
                            type: "string",
                            enum: ["ACTIVE", "EXPIRED", "CONVERTED", "CANCELLED"],
                        },
                        expires_at: { type: "string", format: "date-time" },
                        created_at: { type: "string", format: "date-time" },
                    },
                },
                QueueEntry: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        branch_id: { type: "integer" },
                        customer_id: { type: "string", format: "uuid" },
                        appointment_id: { type: "integer" },
                        customer_name: { type: "string" },
                        customer_phone: { type: "string" },
                        service_id: { type: "integer" },
                        priority: {
                            type: "string",
                            enum: ["NORMAL", "PRIORITY", "EMERGENCY"],
                        },
                        queue_number: { type: "string" },
                        status: {
                            type: "string",
                            enum: [
                                "WAITING",
                                "CALLED",
                                "IN_PROGRESS",
                                "COMPLETED",
                                "SKIPPED",
                                "CANCELLED",
                            ],
                        },
                        checked_in_at: { type: "string", format: "date-time" },
                        called_at: { type: "string", format: "date-time" },
                        started_at: { type: "string", format: "date-time" },
                        completed_at: { type: "string", format: "date-time" },
                        created_at: { type: "string", format: "date-time" },
                    },
                },
                Waitlist: {
                    type: "object",
                    properties: {
                        id: { type: "integer" },
                        customer_id: { type: "string", format: "uuid" },
                        branch_id: { type: "integer" },
                        service_id: { type: "integer" },
                        requested_date: { type: "string", format: "date" },
                        requested_start_time: { type: "string", format: "time" },
                        requested_end_time: { type: "string", format: "time" },
                        status: {
                            type: "string",
                            enum: ["WAITING", "OFFERED", "BOOKED", "EXPIRED", "CANCELLED"],
                        },
                        priority: {
                            type: "string",
                            enum: ["NORMAL", "PRIORITY", "EMERGENCY"],
                        },
                        joined_at: { type: "string", format: "date-time" },
                        offered_at: { type: "string", format: "date-time" },
                        expires_at: { type: "string", format: "date-time" },
                    },
                },
                AvailableSlot: {
                    type: "object",
                    properties: {
                        branch_id: { type: "integer" },
                        service_id: { type: "integer" },
                        start_time: { type: "string", format: "date-time" },
                        end_time: { type: "string", format: "date-time" },
                        available_capacity: { type: "integer" },
                    },
                },
                Error: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        error: { type: "string" },
                        statusCode: { type: "integer" },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["./src/modules/**/*.routes.ts", "./src/config/swagger-docs.ts"],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);