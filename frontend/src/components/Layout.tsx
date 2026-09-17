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
    <div className="min-h-screen bg-[#0E1712]">
      <header className="border-b border-white/10 bg-[#16211C]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            {/* <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#2B6E56] font-mono font-bold text-white">
              S
            </div> */}

            <span className="text-lg font-semibold text-[#F2F0E6]">
              Smart Appointment System
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-[#F2F0E6]">
                {user.name}
              </p>

              <p className="text-xs text-[#93A69B]">{user.role}</p>
            </div>

            <button
              onClick={logout}
              className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-[#F2F0E6] transition hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#F2F0E6]">{title}</h1>

          <p className="mt-1 text-sm text-[#93A69B]">
            Manage appointments and queues from one place.
          </p>
        </div>

        {children}
      </main>
    </div>
  );
}