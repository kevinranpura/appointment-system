import { useEffect, useState } from "react";
import api from "../../api";

import Layout from "../Layout";

import type {
    User,
    Service,
    Appointment,
    WaitlistEntry,
} from "../../types";


export default function CustomerDashboard({
    user,
    logout,
}: {
    user: User;
    logout: () => void;
}) {
    const [services, setServices] = useState<Service[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [date, setDate] = useState("2026-09-15");
    const [serviceId, setServiceId] = useState(1);
    const [slots, setSlots] = useState<any[]>([]);
    const [message, setMessage] = useState("");
    const [reservation, setReservation] = useState<any | null>(null);
    const [reservationSeconds, setReservationSeconds] = useState(0);
    const [reserving, setReserving] = useState(false);
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [waitlistOpen, setWaitlistOpen] = useState(false);
    const [waitlistPriority, setWaitlistPriority] =
        useState<"NORMAL" | "PRIORITY" | "EMERGENCY">("NORMAL");
    const [waitlistStartTime, setWaitlistStartTime] = useState("");
    const [waitlistEndTime, setWaitlistEndTime] = useState("");
    const [waitlistLoading, setWaitlistLoading] = useState(false);

    const loadData = async () => {
        try {
            const servicesResponse = await api.get("/services");

            setServices(servicesResponse.data.services || []);
        } catch (error) {
            console.error("Failed to load services:", error);
        }

        try {
            const appointmentsResponse = await api.get("/appointments/my");

            setAppointments(
                appointmentsResponse.data.appointments || []
            );
        } catch (error) {
            console.error("Failed to load appointments:", error);
        }

        try {
            const waitlistResponse = await api.get("/waitlist/my");

            setWaitlist(waitlistResponse.data.waitlist || []);
        } catch (error) {
            console.error("Failed to load waitlist:", error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!reservation?.expires_at) return;

        const updateTimer = () => {
            const remaining = Math.max(
                0,
                Math.floor(
                    (new Date(reservation.expires_at).getTime() -
                        Date.now()) /
                    1000
                )
            );

            setReservationSeconds(remaining);

            if (remaining === 0) {
                setReservation(null);
                setMessage("Your reservation has expired.");
            }
        };

        updateTimer();

        const timer = setInterval(updateTimer, 1000);

        return () => clearInterval(timer);
    }, [reservation]);

    const formatCountdown = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${String(minutes).padStart(2, "0")}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    };

    const findAvailability = async () => {
        try {
            const response = await api.get("/availability", {
                params: {
                    branchId: 1,
                    serviceId,
                    date,
                },
            });

            setSlots(response.data.slots || response.data.availability || []);
            setMessage("");
        } catch (error: any) {
            setMessage(
                error.response?.data?.message || "Could not load availability"
            );
        }
    };

    const getSlotStart = (slot: any) =>
        slot.start_time || slot.startTime || slot.start;

    const getSlotEnd = (slot: any) =>
        slot.end_time || slot.endTime || slot.end;

    const formatSlotTime = (time: string) => {
        if (!time) return "Invalid time";

        const [hours, minutes] = String(time).slice(0, 5).split(":").map(Number);

        if (Number.isNaN(hours) || Number.isNaN(minutes)) {
            return "Invalid time";
        }

        const date = new Date();
        date.setHours(hours, minutes, 0, 0);

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatWaitlistDate = (dateValue: string) => {
        if (!dateValue) return "Invalid Date";

        const datePart = String(dateValue).slice(0, 10);

        const [year, month, day] = datePart.split("-").map(Number);

        if (!year || !month || !day) return "Invalid Date";

        return new Date(year, month - 1, day).toLocaleDateString(
            undefined,
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    const getSlotDateTime = (date: string, time: string) => {
        return new Date(`${date}T${time}`).toISOString();
    };

    const holdSlot = async (slot: any) => {
        try {
            setReserving(true);
            setMessage("");

            const startTime = getSlotStart(slot);

            if (!startTime) {
                setMessage("This slot does not have a valid start time.");
                return;
            }

            const startDateTime = getSlotDateTime(date, startTime);

            const service = services.find(
                (item) => Number(item.id) === serviceId
            );

            if (!service) {
                setMessage("Service not found.");
                return;
            }

            const endDateTime = new Date(
                new Date(startDateTime).getTime() +
                service.duration_minutes * 60 * 1000
            ).toISOString();

            const response = await api.post("/reservations", {
                branchId: 1,
                serviceId,
                startTime: startDateTime,
                endTime: endDateTime,
            });

            setReservation(response.data.data);

            setMessage(
                "Slot held temporarily. Confirm your appointment before it expires."
            );

        } catch (error: any) {
            console.error(
                "Reservation error:",
                error.response?.data || error
            );

            setMessage(
                error.response?.data?.message ||
                "Could not reserve this slot"
            );
        } finally {
            setReserving(false);
        }
    };

    const confirmReservation = async () => {
        if (!reservation) return;

        try {
            setReserving(true);

            await api.post(
                `/reservations/${reservation.id}/confirm`
            );

            setReservation(null);
            setReservationSeconds(0);

            setMessage("Appointment booked successfully.");

            await loadData();
            await findAvailability();
        } catch (error: any) {
            console.error(
                "Confirmation error:",
                error.response?.data || error
            );

            setMessage(
                error.response?.data?.message ||
                "Could not confirm appointment"
            );
        } finally {
            setReserving(false);
        }
    };

    const cancelReservation = async () => {
        if (!reservation) return;

        try {
            await api.delete(
                `/reservations/${reservation.id}`
            );

            setReservation(null);
            setReservationSeconds(0);

            setMessage("Reservation cancelled.");

            await findAvailability();
        } catch (error: any) {
            setMessage(
                error.response?.data?.message ||
                "Could not cancel reservation"
            );
        }
    };

    const checkIn = async (appointmentId: number) => {
        try {
            await api.post("/queue/check-in", {
                appointmentId,
            });

            setMessage("You're checked in and added to the queue.");
            await loadData();
        } catch (error: any) {
            setMessage(error.response?.data?.message || "Check-in failed");
        }
    };

    const joinWaitlistHandler = async () => {
        try {
            setWaitlistLoading(true);
            setMessage("");

            await api.post("/waitlist", {
                branchId: 1,
                serviceId,
                requestedDate: date,
                requestedStartTime: waitlistStartTime || undefined,
                requestedEndTime: waitlistEndTime || undefined,
                priority: waitlistPriority,
            });

            setMessage("You have been added to the waitlist.");

            setWaitlistOpen(false);
            setWaitlistPriority("NORMAL");
            setWaitlistStartTime("");
            setWaitlistEndTime("");

            await loadData();
        } catch (error: any) {
            setMessage(
                error.response?.data?.message ||
                "Could not join the waitlist"
            );
        } finally {
            setWaitlistLoading(false);
        }
    };

    const cancelWaitlist = async (id: number) => {
        try {
            await api.delete(`/waitlist/${id}`);

            setMessage("Waitlist entry cancelled.");

            await loadData();
        } catch (error: any) {
            setMessage(
                error.response?.data?.message ||
                "Could not cancel waitlist entry"
            );
        }
    };

    return (
        <Layout user={user} logout={logout} title="Customer Dashboard">
            {message && (
                <div className="mb-6 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                    {message}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl bg-indigo-600 p-6 text-white shadow-sm lg:col-span-2">
                    <p className="text-sm text-indigo-200">Welcome back</p>
                    <h2 className="mt-2 text-2xl font-bold">
                        Book your next appointment
                    </h2>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div>
                            <label className="text-xs text-indigo-200">Service</label>

                            <select
                                value={serviceId}
                                onChange={(e) => setServiceId(Number(e.target.value))}
                                className="mt-1 w-full rounded-xl border-0 bg-white px-3 py-3 text-sm text-slate-900"
                            >
                                {services.map((service) => (
                                    <option key={service.id} value={Number(service.id)}>
                                        {service.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-indigo-200">Date</label>

                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="mt-1 w-full rounded-xl border-0 bg-white px-3 py-3 text-sm text-slate-900"
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                onClick={findAvailability}
                                className="flex-1 rounded-xl bg-white px-4 py-3 font-semibold text-indigo-600 hover:bg-indigo-50"
                            >
                                Find slots
                            </button>

                            <button
                                onClick={() => setWaitlistOpen(true)}
                                className="rounded-xl border border-white/30 bg-indigo-500 px-4 py-3 font-semibold text-white hover:bg-indigo-400"
                            >
                                Waitlist
                            </button>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <p className="text-sm text-slate-500">Appointments</p>
                    <p className="mt-2 text-4xl font-bold text-slate-900">
                        {appointments.length}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                        Your scheduled appointments
                    </p>
                </div>
            </div>

            {reservation && (
                <section className="mt-8 rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
                    <div className="flex flex-col gap-6">

                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-indigo-600">
                                    Slot Reserved
                                </p>

                                <h2 className="mt-1 text-xl font-bold text-slate-900">
                                    Complete your booking
                                </h2>

                                <p className="mt-1 text-sm text-slate-600">
                                    This slot is temporarily held for you.
                                </p>
                            </div>

                            <div className="rounded-xl bg-white px-4 py-3 text-center shadow-sm">
                                <p className="text-xs text-slate-500">
                                    Expires in
                                </p>

                                <p className="text-2xl font-bold text-indigo-600">
                                    {formatCountdown(reservationSeconds)}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl bg-white p-4">
                            <p className="text-sm font-semibold text-slate-900">
                                {services.find(
                                    (service) =>
                                        Number(service.id) ===
                                        Number(reservation.service_id)
                                )?.name || "Appointment"}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                {new Date(
                                    reservation.start_time
                                ).toLocaleString([], {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                })}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">

                            <button
                                onClick={cancelReservation}
                                disabled={reserving}
                                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel Reservation
                            </button>

                            <button
                                onClick={confirmReservation}
                                disabled={reserving || reservationSeconds <= 0}
                                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {reserving
                                    ? "Confirming..."
                                    : "Confirm Appointment →"}
                            </button>

                        </div>

                    </div>
                </section>
            )}

            {slots.length > 0 && (
                <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                    <h2 className="font-semibold text-slate-900">Available slots</h2>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {slots
                            .filter((slot) => slot.available)
                            .map((slot, index) => {
                                const start = getSlotStart(slot);
                                const end = getSlotEnd(slot);

                                return (
                                    <button
                                        key={index}
                                        onClick={() => holdSlot(slot)}
                                        className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-500 hover:bg-indigo-50"
                                    >
                                        <p className="font-semibold text-slate-900">
                                            {formatSlotTime(start)}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            until {formatSlotTime(end)}
                                        </p>

                                        <p className="mt-2 text-xs font-medium text-indigo-600">
                                            Reserve this slot →
                                        </p>
                                    </button>
                                );
                            })}
                    </div>
                </section>
            )}

            <section className="mt-8">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">
                    My appointments
                </h2>

                <div className="space-y-3">
                    {appointments.length === 0 ? (
                        <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">
                            No appointments yet.
                        </div>
                    ) : (
                        appointments.map((appointment) => (
                            <div
                                key={appointment.id}
                                className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 md:flex-row md:items-center"
                            >
                                <div>
                                    <p className="font-semibold text-slate-900">
                                        {appointment.appointment_number}
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {appointment.service_name || "Appointment"}
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {new Date(appointment.start_time).toLocaleString()}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                                        {appointment.status}
                                    </span>

                                    {appointment.status === "CONFIRMED" && (
                                        <button
                                            onClick={() => checkIn(appointment.id)}
                                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                        >
                                            Check in
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            <section className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            My waitlist
                        </h2>

                        <p className="text-sm text-slate-500">
                            Track your requests for unavailable slots.
                        </p>
                    </div>

                    <button
                        onClick={() => setWaitlistOpen(true)}
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        + Join Waitlist
                    </button>
                </div>

                <div className="space-y-3">
                    {waitlist.length === 0 ? (
                        <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
                            You are not currently on any waitlists.
                        </div>
                    ) : (
                        waitlist.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 md:flex-row md:items-center"
                            >
                                <div>
                                    <p className="font-semibold text-slate-900">
                                        {entry.service_name ||
                                            `Service #${entry.service_id}`}
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {entry.branch_name || "Branch #1"} ·{" "}
                                        {formatWaitlistDate(entry.requested_date)}
                                    </p>

                                    {entry.requested_start_time && (
                                        <p className="mt-1 text-xs text-slate-400">
                                            Preferred time:{" "}
                                            {formatSlotTime(entry.requested_start_time)}
                                            {entry.requested_end_time &&
                                                ` - ${formatSlotTime(
                                                    entry.requested_end_time
                                                )}`}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${entry.priority === "EMERGENCY"
                                            ? "bg-red-50 text-red-700"
                                            : entry.priority === "PRIORITY"
                                                ? "bg-amber-50 text-amber-700"
                                                : "bg-slate-100 text-slate-600"
                                            }`}
                                    >
                                        {entry.priority}
                                    </span>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${entry.status === "OFFERED"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : entry.status === "CANCELLED"
                                                ? "bg-red-50 text-red-700"
                                                : "bg-indigo-50 text-indigo-700"
                                            }`}
                                    >
                                        {entry.status}
                                    </span>

                                    {entry.status === "OFFERED" &&
                                        entry.expires_at && (
                                            <span className="text-xs text-slate-500">
                                                Expires{" "}
                                                {new Date(
                                                    entry.expires_at
                                                ).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        )}

                                    {entry.status === "WAITING" && (
                                        <button
                                            onClick={() => cancelWaitlist(entry.id)}
                                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {waitlistOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    Join Waitlist
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    We'll place you in line for this service.
                                </p>
                            </div>

                            <button
                                onClick={() => setWaitlistOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">
                                    Service
                                </p>

                                <p className="mt-1 font-semibold text-slate-900">
                                    {services.find(
                                        (service) =>
                                            Number(service.id) === Number(serviceId)
                                    )?.name || `Service #${serviceId}`}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    {new Date(
                                        `${date}T00:00:00`
                                    ).toLocaleDateString()}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Preferred start time
                                </label>

                                <input
                                    type="time"
                                    value={waitlistStartTime}
                                    onChange={(e) =>
                                        setWaitlistStartTime(e.target.value)
                                    }
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                                />

                                <p className="mt-1 text-xs text-slate-400">
                                    Optional
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Preferred end time
                                </label>

                                <input
                                    type="time"
                                    value={waitlistEndTime}
                                    onChange={(e) =>
                                        setWaitlistEndTime(e.target.value)
                                    }
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                                />

                                <p className="mt-1 text-xs text-slate-400">
                                    Optional
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700">
                                    Priority
                                </label>

                                <select
                                    value={waitlistPriority}
                                    onChange={(e) =>
                                        setWaitlistPriority(
                                            e.target.value as
                                            | "NORMAL"
                                            | "PRIORITY"
                                            | "EMERGENCY"
                                        )
                                    }
                                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                                >
                                    <option value="NORMAL">Normal</option>
                                    <option value="PRIORITY">Priority</option>
                                    <option value="EMERGENCY">Emergency</option>
                                </select>
                            </div>

                            <button
                                onClick={joinWaitlistHandler}
                                disabled={waitlistLoading}
                                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {waitlistLoading
                                    ? "Joining..."
                                    : "Join Waitlist"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}