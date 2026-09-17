// StaffDashboard.tsx
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
    WAITING: "bg-amber-400/10 text-amber-300",
    CALLED: "bg-[#2B6E56]/15 text-[#7FD9B6]",
    IN_PROGRESS: "bg-blue-400/10 text-blue-300",
    COMPLETED: "bg-emerald-400/10 text-emerald-300",
    SKIPPED: "bg-red-400/10 text-red-300",
  };

  return (
    <Layout user={user} logout={logout} title="Staff Queue Dashboard">
      {message && (
        <div className="mb-6 rounded-md border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 divide-y divide-white/10 rounded-md border border-white/10 bg-[#16211C] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
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
          <h2 className="text-lg font-semibold text-[#F2F0E6]">
            Live queue
          </h2>
          <p className="text-sm text-[#93A69B]">
            Updates automatically in real time
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setWalkInOpen(true)}
            className="rounded-md border border-white/10 bg-white/5 px-5 py-3 font-semibold text-[#F2F0E6] transition hover:bg-white/10"
          >
            + Add walk-in
          </button>

          <button
            onClick={callNext}
            disabled={loading}
            className="rounded-md bg-[#A6572E] px-5 py-3 font-semibold text-white transition hover:bg-[#8f4a26] disabled:opacity-50"
          >
            {loading ? "Calling..." : "Call next"}
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-md border border-white/10 bg-[#16211C]">
        {queue.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg font-semibold text-[#F2F0E6]">
              Queue is empty
            </p>
            <p className="mt-1 text-sm text-[#93A69B]">
              New check-ins and walk-ins will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {queue.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white/10 font-mono font-bold text-[#F2F0E6]">
                    {entry.queue_number.replace("Q-", "")}
                  </div>

                  <div>
                    <p className="font-semibold text-[#F2F0E6]">
                      {entry.customer_name}
                    </p>

                    <p className="text-sm text-[#93A69B]">
                      {entry.service_name || `Service #${entry.service_id}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[entry.status] ||
                      "bg-white/5 text-[#93A69B]"
                      }`}
                  >
                    {entry.status}
                  </span>

                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-[#93A69B]">
                    {entry.priority}
                  </span>

                  {entry.status === "CALLED" && (
                    <button
                      onClick={() => updateQueue(entry.id, "start")}
                      className="rounded-md bg-white/10 px-3 py-2 text-xs font-semibold text-[#F2F0E6] transition hover:bg-white/15"
                    >
                      Start
                    </button>
                  )}

                  {entry.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => updateQueue(entry.id, "complete")}
                      className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
                    >
                      Complete
                    </button>
                  )}

                  {(entry.status === "WAITING" ||
                    entry.status === "CALLED") && (
                      <button
                        onClick={() => updateQueue(entry.id, "no-show")}
                        className="rounded-md border border-red-400/20 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-400/10"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-md border border-white/10 bg-[#16211C] p-6">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#F2F0E6]">
                  Add walk-in
                </h2>

                <p className="mt-1 text-sm text-[#93A69B]">
                  Add a customer directly to the queue.
                </p>
              </div>

              <button
                onClick={() => setWalkInOpen(false)}
                className="text-[#93A69B] transition hover:text-[#F2F0E6]"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">

              <div>
                <label className="text-sm font-medium text-[#F2F0E6]">
                  Customer name
                </label>

                <input
                  value={walkInName}
                  onChange={(e) =>
                    setWalkInName(e.target.value)
                  }
                  placeholder="John Doe"
                  className="mt-1 w-full rounded-md border border-white/10 bg-[#0E1712] px-4 py-3 text-[#F2F0E6] outline-none transition placeholder:text-white/30 focus:border-[#2B6E56]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#F2F0E6]">
                  Phone number
                </label>

                <input
                  value={walkInPhone}
                  onChange={(e) =>
                    setWalkInPhone(e.target.value)
                  }
                  placeholder="9876543210"
                  className="mt-1 w-full rounded-md border border-white/10 bg-[#0E1712] px-4 py-3 text-[#F2F0E6] outline-none transition placeholder:text-white/30 focus:border-[#2B6E56]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#F2F0E6]">
                  Service
                </label>

                <select
                  value={walkInService}
                  onChange={(e) =>
                    setWalkInService(Number(e.target.value))
                  }
                  className="mt-1 w-full rounded-md border border-white/10 bg-[#0E1712] px-4 py-3 text-[#F2F0E6] outline-none"
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
                <label className="text-sm font-medium text-[#F2F0E6]">
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
                  className="mt-1 w-full rounded-md border border-white/10 bg-[#0E1712] px-4 py-3 text-[#F2F0E6] outline-none"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="PRIORITY">Priority</option>
                  <option value="EMERGENCY">Emergency</option>
                </select>
              </div>

              <button
                onClick={addWalkIn}
                className="w-full rounded-md bg-[#A6572E] py-3 font-semibold text-white transition hover:bg-[#8f4a26]"
              >
                Add to queue
              </button>

            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}