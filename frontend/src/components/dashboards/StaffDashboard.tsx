import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import api from "../../api";
import Layout from "../Layout";
import { StatCard } from "../StatCard";

import type { User, QueueEntry, Service } from "../../types";


export default function StaffDashboard({
  user,
  logout,
}: {
  user: User;
  logout: () => void;
}) {
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInService, setWalkInService] = useState(1);
  const [walkInPriority, setWalkInPriority] =
    useState<"NORMAL" | "PRIORITY" | "EMERGENCY">("NORMAL");

  const [services, setServices] = useState<Service[]>([]);

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

    api
      .get("/services")
      .then((response) => {
        setServices(response.data.services || []);
      })
      .catch((error) => {
        console.error("Failed to load services:", error);
      });

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

  const addWalkIn = async () => {
    try {
      if (!walkInName.trim()) {
        setMessage("Customer name is required.");
        return;
      }

      await api.post("/queue/walk-in", {
        branchId: 1,
        customerName: walkInName.trim(),
        customerPhone: walkInPhone.trim() || undefined,
        serviceId: walkInService,
        priority: walkInPriority,
      });

      setMessage("Walk-in added to the queue.");

      setWalkInName("");
      setWalkInPhone("");
      setWalkInService(services[0]?.id || 1);
      setWalkInPriority("NORMAL");
      setWalkInOpen(false);

      await loadQueue();
    } catch (error: any) {
      console.error(
        "Walk-in error:",
        error.response?.data || error
      );

      setMessage(
        error.response?.data?.message ||
        "Could not add walk-in"
      );
    }
  };

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

        <div className="flex gap-3">
          <button
            onClick={() => setWalkInOpen(true)}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            + Add Walk-in
          </button>

          <button
            onClick={callNext}
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Calling..." : "Call next"}
          </button>
        </div>
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

      {walkInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add Walk-in
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a customer directly to the queue.
                </p>
              </div>

              <button
                onClick={() => setWalkInOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Customer name
                </label>

                <input
                  value={walkInName}
                  onChange={(e) =>
                    setWalkInName(e.target.value)
                  }
                  placeholder="John Doe"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Phone number
                </label>

                <input
                  value={walkInPhone}
                  onChange={(e) =>
                    setWalkInPhone(e.target.value)
                  }
                  placeholder="9876543210"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Service
                </label>

                <select
                  value={walkInService}
                  onChange={(e) =>
                    setWalkInService(Number(e.target.value))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
                >
                  {services.map((service) => (
                    <option
                      key={service.id}
                      value={Number(service.id)}
                    >
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Priority
                </label>

                <select
                  value={walkInPriority}
                  onChange={(e) =>
                    setWalkInPriority(
                      e.target.value as
                      | "NORMAL"
                      | "PRIORITY"
                      | "EMERGENCY"
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="PRIORITY">Priority</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>

              <button
                onClick={addWalkIn}
                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                Add to Queue
              </button>

            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}