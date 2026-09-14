import type { ReactNode } from "react";
import type { User } from "../types";

type LayoutProps = {
  user: User;
  logout: () => void;
  children: ReactNode;
  title: string;
};

export default function Layout({
  user,
  logout,
  children,
  title,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
                S
              </div>

              <span className="text-lg font-bold text-slate-900">
                Smart Appointment System
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