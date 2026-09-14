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
        <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Overview */}
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
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-500">
            Loading dashboard...
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Appointments"
            value={stats.totalAppointments}
          />

          <StatCard
            label="Today's Appointments"
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
            label="Active Queue"
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
            <p className="text-sm font-medium text-indigo-600">
              Operational analytics
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Performance overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track booking, queue and resource performance.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">
              Period
            </label>

            <select
              value={days}
              onChange={(e) =>
                setDays(Number(e.target.value))
              }
              className="mt-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {analyticsLoading ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-100">
            <p className="text-sm text-slate-500">
              Loading analytics...
            </p>
          </div>
        ) : analytics ? (
          <>
            {/* Analytics summary */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <p className="text-sm text-slate-500">
                  Average waiting time
                </p>

                <div className="mt-2 flex items-end gap-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {analytics.summary.averageWaitingMinutes}
                  </span>

                  <span className="pb-1 text-sm text-slate-500">
                    minutes
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Check-in to being called
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <p className="text-sm text-slate-500">
                  Average service time
                </p>

                <div className="mt-2 flex items-end gap-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {analytics.summary.averageServiceMinutes}
                  </span>

                  <span className="pb-1 text-sm text-slate-500">
                    minutes
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Service start to completion
                </p>
              </div>
            </div>

            {/* Appointment trend */}
            <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Appointment trend
                </h3>

                <p className="mt-1 text-sm text-slate-500">
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
                        <span className="text-xs font-semibold text-slate-600">
                          {bookings}
                        </span>

                        <div className="flex h-44 w-full items-end">
                          <div
                            className="w-full rounded-t-lg bg-indigo-500 transition-all"
                            style={{
                              height: `${height}%`,
                            }}
                          />
                        </div>

                        <span className="text-[10px] text-slate-400">
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
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <h3 className="font-semibold text-slate-900">
                  Popular services
                </h3>

                <p className="mt-1 text-sm text-slate-500">
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
                            <span className="font-medium text-slate-700">
                              {service.name}
                            </span>

                            <span className="font-semibold text-slate-900">
                              {service.bookings}
                            </span>
                          </div>

                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-indigo-500"
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
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <h3 className="font-semibold text-slate-900">
                  Appointment status
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Distribution during the selected period
                </p>

                <div className="mt-6 space-y-4">
                  {analytics.statusDistribution.map(
                    (item: any) => (
                      <div
                        key={item.status}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          {formatStatus(item.status)}
                        </span>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
                          {item.count}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Branch performance */}
            <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <h3 className="font-semibold text-slate-900">
                Branch performance
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Appointment performance by branch
              </p>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-162.5 text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
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
                          className="border-b border-slate-50 last:border-0"
                        >
                          <td className="py-4 font-semibold text-slate-800">
                            {branch.name}
                          </td>

                          <td className="py-4 text-center text-slate-600">
                            {branch.bookings}
                          </td>

                          <td className="py-4 text-center font-semibold text-emerald-600">
                            {branch.completed}
                          </td>

                          <td className="py-4 text-center text-red-500">
                            {branch.cancelled}
                          </td>

                          <td className="py-4 text-center text-amber-600">
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
            <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <h3 className="font-semibold text-slate-900">
                Resource utilization
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Usage of rooms and other assigned resources
              </p>

              <div className="mt-6 space-y-5">
                {analytics.resourceUtilization.map(
                  (resource: any) => (
                    <div key={resource.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {resource.name}
                          </p>

                          <p className="text-xs text-slate-400">
                            {resource.resourceType}
                          </p>
                        </div>

                        <span className="text-sm font-bold text-indigo-600">
                          {resource.utilizationPercent}%
                        </span>
                      </div>

                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{
                            width: `${Math.min(
                              resource.utilizationPercent,
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
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