import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API,
});

type User = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
};

type QueueEntry = {
  id: number;
  branch_id: number;
  customer_name: string;
  customer_phone?: string;
  service_id: number;
  service_name?: string;
  priority: "NORMAL" | "PRIORITY" | "EMERGENCY";
  queue_number: string;
  status: string;
  checked_in_at: string;
};

type Service = {
  id: number;
  name: string;
  duration_minutes: number;
  price: number;
  capacity: number;
};

type Appointment = {
  id: number;
  appointment_number: string;
  branch_id: number;
  service_id: number;
  start_time: string;
  end_time: string;
  status: string;
  service_name?: string;
  branch_name?: string;
};

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("accessToken") || ""
  );

  const [user, setUser] = useState<User | null>(null);

  const [email, setEmail] = useState("customer@example.com");
  const [password, setPassword] = useState("CustomerPassword123!");
  const [loginError, setLoginError] = useState("");

  const login = async () => {
    try {
      setLoginError("");

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const accessToken = response.data.accessToken;

      localStorage.setItem("accessToken", accessToken);
      setToken(accessToken);
    } catch (error: any) {
      setLoginError(
        error.response?.data?.message || "Invalid email or password"
      );
    }
  };

  useEffect(() => {
    if (!token) return;

    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    api
      .get("/auth/me")
      .then((response) => setUser(response.data.user))
      .catch(() => {
        localStorage.removeItem("accessToken");
        setToken("");
      });
  }, [token]);

  const logout = () => {
    localStorage.removeItem("accessToken");
    delete api.defaults.headers.common.Authorization;
    setToken("");
    setUser(null);
  };

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center text-white">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-2xl font-bold">
              Q
            </div>

            <h1 className="text-3xl font-bold">QueueCare</h1>
            <p className="mt-2 text-slate-400">
              Smart Appointment & Queue Management
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">
              Sign in
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Access your appointment dashboard
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") login();
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </div>

              {loginError && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {loginError}
                </div>
              )}

              <button
                onClick={login}
                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                Sign in
              </button>
            </div>

            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
              <p className="font-semibold text-slate-700">Demo accounts</p>
              <p className="mt-1">Customer: customer@example.com</p>
              <p>Staff: staff@example.com</p>
              <p>Admin: admin@example.com</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === "CUSTOMER") {
    return <CustomerDashboard user={user} logout={logout} />;
  }

  if (user.role === "STAFF") {
    return <StaffDashboard user={user} logout={logout} />;
  }

  if (user.role === "ADMIN") {
    return <AdminDashboard user={user} logout={logout} />;
  }

}

function Layout({
  user,
  logout,
  children,
  title,
}: {
  user: User;
  logout: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
                Q
              </div>

              <span className="text-lg font-bold text-slate-900">
                QueueCare
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">
                {user.name}
              </p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>

            <button
              onClick={logout}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage appointments and queues from one place.
          </p>
        </div>

        {children}
      </main>
    </div>
  );
}

function CustomerDashboard({
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
  };

  useEffect(() => {
    loadData();
  }, []);

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

    const [hours, minutes] = time.split(":").map(Number);

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSlotDateTime = (date: string, time: string) => {
    return new Date(`${date}T${time}`).toISOString();
  };

  const bookAppointment = async (slot: any) => {
    try {
      const startTime = getSlotStart(slot);

      if (!startTime) {
        setMessage("This slot does not have a valid start time.");
        return;
      }

      const appointmentStart = getSlotDateTime(date, startTime);

      await api.post("/appointments", {
        branchId: 1,
        serviceId,
        startTime: appointmentStart,
      });

      setMessage("Appointment booked successfully.");

      await loadData();
      await findAvailability();
    } catch (error: any) {
      console.error(
        "Booking error:",
        error.response?.data || error
      );

      setMessage(
        error.response?.data?.message ||
        "Could not book appointment"
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

            <div className="flex items-end">
              <button
                onClick={findAvailability}
                className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-indigo-600 hover:bg-indigo-50"
              >
                Find slots
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
                    onClick={() => bookAppointment(slot)}
                    className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-500 hover:bg-indigo-50"
                  >
                    <p className="font-semibold text-slate-900">
                      {formatSlotTime(start)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      until {formatSlotTime(end)}
                    </p>

                    <p className="mt-2 text-xs font-medium text-indigo-600">
                      Book this slot →
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
    </Layout>
  );
}

function StaffDashboard({
  user,
  logout,
}: {
  user: User;
  logout: () => void;
}) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadQueue = async () => {
    try {
      const response = await api.get("/queue", {
        params: {
          branchId: 1,
        },
      });

      setQueue(response.data.queue || []);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Could not load queue"
      );
    }
  };

  useEffect(() => {
    loadQueue();

    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Connected to live queue");
      socket.emit("join-branch", 1);
    });

    socket.on("queue-updated", () => {
      loadQueue();
    });

    return () => {
      socket.emit("leave-branch", 1);
      socket.disconnect();
    };
  }, []);

  const callNext = async () => {
    try {
      setLoading(true);

      await api.post("/queue/call-next", {
        branchId: 1,
      });

      await loadQueue();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Could not call next"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateQueue = async (
    id: number,
    action: "start" | "complete" | "no-show"
  ) => {
    try {
      await api.patch(`/queue/${id}/${action}`);
      await loadQueue();
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Queue update failed"
      );
    }
  };

  const statusStyles: Record<string, string> = {
    WAITING: "bg-amber-50 text-amber-700",
    CALLED: "bg-indigo-50 text-indigo-700",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
    SKIPPED: "bg-red-50 text-red-700",
  };

  return (
    <Layout user={user} logout={logout} title="Staff Queue Dashboard">
      {message && (
        <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Waiting"
          value={queue.filter((q) => q.status === "WAITING").length}
        />

        <StatCard
          label="In service"
          value={queue.filter((q) => q.status === "IN_PROGRESS").length}
        />

        <StatCard
          label="Total active"
          value={queue.length}
        />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Live queue
          </h2>
          <p className="text-sm text-slate-500">
            Updates automatically in real time
          </p>
        </div>

        <button
          onClick={callNext}
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Calling..." : "Call next"}
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        {queue.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg font-semibold text-slate-700">
              Queue is empty
            </p>
            <p className="mt-1 text-sm text-slate-500">
              New check-ins and walk-ins will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {queue.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 font-bold text-white">
                    {entry.queue_number.replace("Q-", "")}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      {entry.customer_name}
                    </p>

                    <p className="text-sm text-slate-500">
                      {entry.service_name || `Service #${entry.service_id}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[entry.status] ||
                      "bg-slate-100 text-slate-600"
                      }`}
                  >
                    {entry.status}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {entry.priority}
                  </span>

                  {entry.status === "CALLED" && (
                    <button
                      onClick={() => updateQueue(entry.id, "start")}
                      className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Start
                    </button>
                  )}

                  {entry.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => updateQueue(entry.id, "complete")}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Complete
                    </button>
                  )}

                  {(entry.status === "WAITING" ||
                    entry.status === "CALLED") && (
                      <button
                        onClick={() => updateQueue(entry.id, "no-show")}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                      >
                        Skip
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function AdminDashboard({
  user,
  logout,
}: {
  user: User;
  logout: () => void;
}) {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    activeQueue: 0,
    customers: 0,
    branches: 0,
    services: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // useEffect(() => {
  //   loadDashboard();
  // }, []);

  // const loadDashboard = async () => {
  //   try {
  //     setError("");

  //     const response = await api.get("/admin/dashboard");

  //     setStats(response.data.stats);
  //   } catch (error: any) {
  //     console.error(
  //       "Admin dashboard error:",
  //       error.response?.data || error
  //     );

  //     setError(
  //       error.response?.data?.message ||
  //         "Could not load dashboard"
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const cards = [
    {
      label: "Total Appointments",
      value: stats.totalAppointments,
    },
    {
      label: "Today's Appointments",
      value: stats.todayAppointments,
    },
    {
      label: "Completed",
      value: stats.completedAppointments,
    },
    {
      label: "Cancelled",
      value: stats.cancelledAppointments,
    },
    {
      label: "Active Queue",
      value: stats.activeQueue,
    },
    {
      label: "Customers",
      value: stats.customers,
    },
    {
      label: "Branches",
      value: stats.branches,
    },
    {
      label: "Services",
      value: stats.services,
    },
  ];

  return (
    <Layout
      user={user}
      logout={logout}
      title="Admin Dashboard"
    >
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mb-8">
        <p className="text-sm text-slate-500">
          System overview
        </p>

        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Welcome back, {user.name}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Monitor appointments, customers and queue activity.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-100">
          <p className="text-sm text-slate-500">
            Loading dashboard...
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <StatCard
                key={card.label}
                label={card.label}
                value={card.value}
              />
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">
                Appointment Summary
              </h3>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Today's appointments
                  </span>

                  <span className="font-semibold text-slate-900">
                    {stats.todayAppointments}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Completed
                  </span>

                  <span className="font-semibold text-emerald-600">
                    {stats.completedAppointments}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Cancelled
                  </span>

                  <span className="font-semibold text-red-600">
                    {stats.cancelledAppointments}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">
                System Resources
              </h3>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Customers
                  </span>

                  <span className="font-semibold text-slate-900">
                    {stats.customers}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Branches
                  </span>

                  <span className="font-semibold text-slate-900">
                    {stats.branches}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Services
                  </span>

                  <span className="font-semibold text-slate-900">
                    {stats.services}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Active queue
                  </span>

                  <span className="font-semibold text-indigo-600">
                    {stats.activeQueue}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}


function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default App;