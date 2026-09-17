// AdminDashboard.tsx
import { useEffect, useState } from "react";

import api from "../../api";
import Layout from "../Layout";
import { StatCard } from "../StatCard";
import { MetricCard } from "../MetricCard";

import type { User } from "../../types";


export default function AdminDashboard({
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
    noShowAppointments: 0,
    activeQueue: 0,
    customers: 0,
    branches: 0,
    services: 0,
  });

  const [analytics, setAnalytics] = useState<any | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  const loadDashboard = async () => {
    try {
      const response = await api.get("/admin/dashboard");
      setStats(response.data.stats);
    } catch (error: any) {
      console.error(
        "Admin dashboard error:",
        error.response?.data || error
      );

      setError(
        error.response?.data?.message ||
        "Could not load dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);

      const response = await api.get("/admin/analytics", {
        params: { days },
      });

      setAnalytics(response.data);
    } catch (error: any) {
      console.error(
        "Admin analytics error:",
        error.response?.data || error
      );

      setError(
        error.response?.data?.message ||
        "Could not load analytics"
      );
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const formatStatus = (status: string) => {
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const maxBookings =
    analytics?.appointmentTrend?.length > 0
      ? Math.max(
        ...analytics.appointmentTrend.map(
          (item: any) => Number(item.bookings)
        ),
        1
      )
      : 1;

  return (
    <Layout
      user={user}
      logout={logout}
      title="Admin Dashboard"
    >
      {error && (
        <div className="mb-6 rounded-md border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Overview */}
      <div className="mb-8">
        <p className="text-sm text-[#93A69B]">
          System overview
        </p>

        <h2 className="mt-1 text-2xl font-semibold text-[#F2F0E6]">
          Welcome back, {user.name}
        </h2>

        <p className="mt-1 text-sm text-[#93A69B]">
          Monitor appointments, customers and queue activity.
        </p>
      </div>

      {loading ? (
        <div className="rounded-md border border-white/10 bg-[#16211C] p-10 text-center">
          <p className="text-sm text-[#93A69B]">
            Loading dashboard...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 divide-x divide-y divide-white/10 rounded-md border border-white/10 bg-[#16211C] lg:grid-cols-4">
          <StatCard
            label="Total appointments"
            value={stats.totalAppointments}
          />

          <StatCard
            label="Today's appointments"
            value={stats.todayAppointments}
          />

          <StatCard
            label="Completed"
            value={stats.completedAppointments}
          />

          <StatCard
            label="Cancelled"
            value={stats.cancelledAppointments}
          />

          <StatCard
            label="No-shows"
            value={stats.noShowAppointments}
          />

          <StatCard
            label="Active queue"
            value={stats.activeQueue}
          />

          <StatCard
            label="Customers"
            value={stats.customers}
          />

          <StatCard
            label="Services"
            value={stats.services}
          />
        </div>
      )}

      {/* Analytics */}
      <section className="mt-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#7FD9B6]">
              Operational analytics
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#F2F0E6]">
              Performance overview
            </h2>

            <p className="mt-1 text-sm text-[#93A69B]">
              Track booking, queue and resource performance.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-[#93A69B]">
              Period
            </label>

            <select
              value={days}
              onChange={(e) =>
                setDays(Number(e.target.value))
              }
              className="mt-1 rounded-md border border-white/10 bg-[#16211C] px-4 py-2.5 text-sm font-medium text-[#F2F0E6] outline-none transition focus:border-[#2B6E56]"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {analyticsLoading ? (
          <div className="rounded-md border border-white/10 bg-[#16211C] p-12 text-center">
            <p className="text-sm text-[#93A69B]">
              Loading analytics...
            </p>
          </div>
        ) : analytics ? (
          <>
            {/* Analytics summary */}
            <div className="grid grid-cols-2 divide-x divide-y divide-white/10 rounded-md border border-white/10 bg-[#16211C] lg:grid-cols-4">
              <MetricCard
                label="Bookings"
                value={analytics.summary.totalBookings}
              />

              <MetricCard
                label="Completed"
                value={analytics.summary.completed}
              />

              <MetricCard
                label="Cancellations"
                value={analytics.summary.cancelled}
              />

              <MetricCard
                label="No-shows"
                value={analytics.summary.noShows}
              />
            </div>

            {/* Time metrics */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-white/10 bg-[#16211C] p-6">
                <p className="text-sm text-[#93A69B]">
                  Average waiting time
                </p>

                <div className="mt-2 flex items-end gap-2">
                  <span className="font-mono text-3xl font-semibold tabular-nums text-[#F2F0E6]">
                    {analytics.summary.averageWaitingMinutes}
                  </span>

                  <span className="pb-1 text-sm text-[#93A69B]">
                    minutes
                  </span>
                </div>

                <p className="mt-2 text-xs text-[#93A69B]/80">
                  Check-in to being called
                </p>
              </div>

              <div className="rounded-md border border-white/10 bg-[#16211C] p-6">
                <p className="text-sm text-[#93A69B]">
                  Average service time
                </p>

                <div className="mt-2 flex items-end gap-2">
                  <span className="font-mono text-3xl font-semibold tabular-nums text-[#F2F0E6]">
                    {analytics.summary.averageServiceMinutes}
                  </span>

                  <span className="pb-1 text-sm text-[#93A69B]">
                    minutes
                  </span>
                </div>

                <p className="mt-2 text-xs text-[#93A69B]/80">
                  Service start to completion
                </p>
              </div>
            </div>

            {/* Appointment trend */}
            <div className="mt-6 rounded-md border border-white/10 bg-[#16211C] p-6">
              <div>
                <h3 className="font-semibold text-[#F2F0E6]">
                  Appointment trend
                </h3>

                <p className="mt-1 text-sm text-[#93A69B]">
                  Daily bookings for the selected period
                </p>
              </div>

              <div className="mt-8 flex h-64 items-end gap-2 overflow-x-auto">
                {analytics.appointmentTrend.map(
                  (item: any) => {
                    const bookings = Number(item.bookings);

                    const height =
                      bookings === 0
                        ? 4
                        : Math.max(
                          (bookings / maxBookings) * 100,
                          8
                        );

                    return (
                      <div
                        key={item.date}
                        className="flex min-w-10.5 flex-1 flex-col items-center justify-end gap-2"
                      >
                        <span className="font-mono text-xs font-semibold tabular-nums text-[#F2F0E6]">
                          {bookings}
                        </span>

                        <div className="flex h-44 w-full items-end">
                          <div
                            className="w-full rounded-t-sm bg-[#2B6E56] transition-all"
                            style={{
                              height: `${height}%`,
                            }}
                          />
                        </div>

                        <span className="font-mono text-[10px] text-[#93A69B]">
                          {item.date}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Services + status */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Popular services */}
              <div className="rounded-md border border-white/10 bg-[#16211C] p-6">
                <h3 className="font-semibold text-[#F2F0E6]">
                  Popular services
                </h3>

                <p className="mt-1 text-sm text-[#93A69B]">
                  Services ranked by bookings
                </p>

                <div className="mt-6 space-y-5">
                  {analytics.popularServices.map(
                    (service: any) => {
                      const maxServiceBookings =
                        Math.max(
                          ...analytics.popularServices.map(
                            (item: any) =>
                              Number(item.bookings)
                          ),
                          1
                        );

                      const width =
                        (Number(service.bookings) /
                          maxServiceBookings) *
                        100;

                      return (
                        <div key={service.id}>
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-[#F2F0E6]">
                              {service.name}
                            </span>

                            <span className="font-mono font-semibold tabular-nums text-[#F2F0E6]">
                              {service.bookings}
                            </span>
                          </div>

                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-[#2B6E56]"
                              style={{
                                width: `${width}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Status distribution */}
              <div className="rounded-md border border-white/10 bg-[#16211C] p-6">
                <h3 className="font-semibold text-[#F2F0E6]">
                  Appointment status
                </h3>

                <p className="mt-1 text-sm text-[#93A69B]">
                  Distribution during the selected period
                </p>

                <div className="mt-6 space-y-4">
                  {analytics.statusDistribution.map(
                    (item: any) => (
                      <div
                        key={item.status}
                        className="flex items-center justify-between rounded-md bg-white/5 px-4 py-3"
                      >
                        <span className="text-sm font-medium text-[#F2F0E6]">
                          {formatStatus(item.status)}
                        </span>

                        <span className="rounded-full border border-white/10 bg-[#0E1712] px-3 py-1 font-mono text-xs font-bold tabular-nums text-[#F2F0E6]">
                          {item.count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Branch performance */}
            <div className="mt-6 rounded-md border border-white/10 bg-[#16211C] p-6">
              <h3 className="font-semibold text-[#F2F0E6]">
                Branch performance
              </h3>

              <p className="mt-1 text-sm text-[#93A69B]">
                Appointment performance by branch
              </p>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-162.5 text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs tracking-wide text-[#93A69B]">
                      <th className="pb-3 font-medium">
                        Branch
                      </th>

                      <th className="pb-3 text-center font-medium">
                        Bookings
                      </th>

                      <th className="pb-3 text-center font-medium">
                        Completed
                      </th>

                      <th className="pb-3 text-center font-medium">
                        Cancelled
                      </th>

                      <th className="pb-3 text-center font-medium">
                        No-shows
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {analytics.branchPerformance.map(
                      (branch: any) => (
                        <tr
                          key={branch.id}
                          className="border-b border-white/5 last:border-0"
                        >
                          <td className="py-4 font-semibold text-[#F2F0E6]">
                            {branch.name}
                          </td>

                          <td className="py-4 text-center font-mono tabular-nums text-[#93A69B]">
                            {branch.bookings}
                          </td>

                          <td className="py-4 text-center font-mono font-semibold tabular-nums text-emerald-400">
                            {branch.completed}
                          </td>

                          <td className="py-4 text-center font-mono tabular-nums text-red-400">
                            {branch.cancelled}
                          </td>

                          <td className="py-4 text-center font-mono tabular-nums text-amber-400">
                            {branch.no_shows}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resource utilization */}
            <div className="mt-6 rounded-md border border-white/10 bg-[#16211C] p-6">
              <h3 className="font-semibold text-[#F2F0E6]">
                Resource utilization
              </h3>

              <p className="mt-1 text-sm text-[#93A69B]">
                Usage of rooms and other assigned resources
              </p>

              <div className="mt-6 space-y-5">
                {analytics.resourceUtilization.map(
                  (resource: any) => (
                    <div key={resource.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#F2F0E6]">
                            {resource.name}
                          </p>

                          <p className="text-xs text-[#93A69B]/80">
                            {resource.resourceType}
                          </p>
                        </div>

                        <span className="font-mono text-sm font-bold tabular-nums text-[#F0A672]">
                          {resource.utilizationPercent}%
                        </span>
                      </div>

                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-[#A6572E] transition-all"
                          style={{
                            width: `${Math.min(
                              resource.utilizationPercent,
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="mt-1 text-xs text-[#93A69B]/80">
                        {resource.bookedMinutes} min booked /{" "}
                        {resource.availableMinutes} min available
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </>
        ) : null}
      </section>
    </Layout>
  );
}