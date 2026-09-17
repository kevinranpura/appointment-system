import { useEffect, useState } from "react";
import api from "./api";
import type { User } from "./types";
import CustomerDashboard from "./components/dashboards/CustomerDashboard";
import StaffDashboard from "./components/dashboards/StaffDashboard";
import AdminDashboard from "./components/dashboards/AdminDashboard";


function App() {
  const [token, setToken] = useState(
    localStorage.getItem("accessToken") || ""
  );

  const [user, setUser] = useState<User | null>(null);

  const [isRegistering, setIsRegistering] = useState(false);

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  const [registerRole, setRegisterRole] = useState<
    "CUSTOMER" | "STAFF" | "ADMIN"
  >("CUSTOMER");

  const [registerRoleKey, setRegisterRoleKey] = useState("");

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

  const register = async () => {
    try {
      setRegisterError("");
      setRegisterSuccess("");

      if (!registerName.trim()) {
        setRegisterError("Name is required");
        return;
      }

      if (!registerEmail.trim()) {
        setRegisterError("Email is required");
        return;
      }

      if (registerPassword.length < 8) {
        setRegisterError("Password must be at least 8 characters");
        return;
      }

      if (registerPassword !== registerConfirmPassword) {
        setRegisterError("Passwords do not match");
        return;
      }

      await api.post("/auth/register", {
        name: registerName.trim(),
        email: registerEmail.trim(),
        phone: registerPhone.trim(),
        password: registerPassword,
        role: registerRole,
        roleKey: registerRole === "CUSTOMER" ? undefined : registerRoleKey,
      });

      setRegisterSuccess("Account created successfully. You can now sign in.");

      setRegisterName("");
      setRegisterEmail("");
      setRegisterPhone("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
      setRegisterRole("CUSTOMER");
      setRegisterRoleKey("");

      setTimeout(() => {
        setIsRegistering(false);
        setRegisterSuccess("");
      }, 1200);
    } catch (error: any) {
      setRegisterError(
        error.response?.data?.message || "Could not create account"
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
      <div className="h-screen overflow-hidden bg-[#0E1712] lg:flex">
        {/* Brand panel */}
        <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-[#12241D] px-12 py-12 lg:flex lg:w-1/2">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#2B6E56] font-mono text-xl font-bold text-white">
                S
              </div>

              <span className="text-xl font-semibold text-[#F2F0E6]">
                Smart Appointment System
              </span>
            </div>

            <h1 className="mt-14 max-w-sm text-4xl font-semibold leading-tight text-[#F2F0E6]">
              Every appointment, on time, in one queue.
            </h1>

            <p className="mt-4 max-w-sm text-[#93A69B]">
              Book, manage and track appointments and walk-ins across your
              branches, live.
            </p>
          </div>

          {/* Clock-face visual */}
          <div className="flex flex-1 items-center justify-center">
            <svg viewBox="0 0 320 320" className="h-64 w-64">
              {/* outer ring */}
              <circle
                cx="160"
                cy="160"
                r="140"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />

              {/* hour ticks */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const x1 = 160 + 128 * Math.sin(angle);
                const y1 = 160 - 128 * Math.cos(angle);
                const x2 = 160 + 140 * Math.sin(angle);
                const y2 = 160 - 140 * Math.cos(angle);

                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth={i % 3 === 0 ? 2 : 1}
                  />
                );
              })}

              {/* appointment markers around the dial */}
              {[
                { hour: 1.5, color: "#2B6E56" },
                { hour: 4, color: "#2B6E56" },
                { hour: 6, color: "#A6572E" },
                { hour: 8.5, color: "#2B6E56" },
                { hour: 10, color: "#2B6E56" },
              ].map((mark, i) => {
                const angle = (mark.hour * 30 * Math.PI) / 180;
                const x = 160 + 108 * Math.sin(angle);
                const y = 160 - 108 * Math.cos(angle);

                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="6"
                    fill={mark.color}
                  />
                );
              })}

              {/* center hub + hands */}
              <circle cx="160" cy="160" r="4" fill="#F2F0E6" />

              <line
                x1="160"
                y1="160"
                x2="160"
                y2="90"
                stroke="#F2F0E6"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <line
                x1="160"
                y1="160"
                x2="205"
                y2="160"
                stroke="#7FD9B6"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <circle
                cx="160"
                cy="160"
                r="140"
                fill="none"
                stroke="rgba(127,217,182,0.15)"
                strokeWidth="6"
                strokeDasharray="18 850"
                strokeDashoffset="-40"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="grid grid-cols-3 divide-x divide-white/10 rounded-md border border-white/10 bg-white/5">
            <div className="px-5 py-4">
              <p className="text-xs text-[#93A69B]">Today</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[#7FD9B6]">
                24
              </p>
            </div>

            <div className="px-5 py-4">
              <p className="text-xs text-[#93A69B]">Avg wait</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[#F2F0E6]">
                6m
              </p>
            </div>

            <div className="px-5 py-4">
              <p className="text-xs text-[#93A69B]">Branches</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-[#F0A672]">
                3
              </p>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex h-full flex-1 items-center justify-center overflow-y-auto px-4 py-8 lg:w-1/2">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center lg:hidden">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-[#2B6E56] font-mono text-xl font-bold text-white">
                S
              </div>

              <h1 className="text-2xl font-semibold text-[#F2F0E6]">
                Smart Appointment System
              </h1>
            </div>

            <div className="rounded-md border border-white/10 bg-[#16211C] p-8">
              {!isRegistering ? (
                <>
                  <h2 className="text-xl font-semibold text-[#F2F0E6]">
                    Sign in
                  </h2>

                  <p className="mt-1 text-sm text-[#93A69B]">
                    Access your appointment dashboard
                  </p>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-[#F2F0E6]">
                        Email
                      </label>

                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 w-full rounded-md border border-white/10 bg-[#0E1712] px-4 py-3 text-[#F2F0E6] outline-none transition focus:border-[#2B6E56]"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#F2F0E6]">
                        Password
                      </label>

                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") login();
                        }}
                        className="mt-1 w-full rounded-md border border-white/10 bg-[#0E1712] px-4 py-3 text-[#F2F0E6] outline-none transition focus:border-[#2B6E56]"
                      />
                    </div>

                    {loginError && (
                      <div className="rounded-md border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                        {loginError}
                      </div>
                    )}

                    <button
                      onClick={login}
                      className="w-full rounded-md bg-[#2B6E56] py-3 font-semibold text-white transition hover:bg-[#35836A]"
                    >
                      Sign in
                    </button>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-[#93A69B]">
                      Don't have an account?
                    </p>

                    <button
                      onClick={() => {
                        setIsRegistering(true);
                        setLoginError("");
                      }}
                      className="mt-1 text-sm font-semibold text-[#7FD9B6] hover:text-[#9CE6C7]"
                    >
                      Create an account
                    </button>
                  </div>

                  <div className="mt-6 rounded-md border border-white/10 bg-white/5 p-4 font-mono text-xs text-[#93A69B]">
                    <p className="font-sans font-semibold text-[#F2F0E6]">
                      Demo accounts
                    </p>
                    <p className="mt-1">
                      Customer: customer@example.com
                    </p>
                    <p>Staff: staff@example.com</p>
                    <p>Admin: admin@example.com</p>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-[#F2F0E6]">
                    Create an account
                  </h2>

                  <p className="mt-1 text-sm text-[#93A69B]">
                    Register to book appointments
                  </p>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-[#F2F0E6]">
                        Name
                      </label>

                      <input
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="John Doe"
                        className="mt-1 w-full rounded-md border border-white/10 bg-[#0E1712] px-4 py-3 text-[#F2F0E6] outline-none transition placeholder:text-white/30 focus:border-[#2B6E56]"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#F2F0E6]">
                        Email
                      </label>

                      <input
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="mt-1 w-full rounded-md border border-white/10 bg-[#0E1712] px-4 py-3 text-[#F2F0E6] outline-none transition placeholder:text-white/30 focus:border-[#2B6E56]"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#F2F0E6]">
                        Phone
                      </label>

                      <input
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        placeholder="9876543210"
                        className="mt-1 w-full rounded-md border border-white/10 bg-[#0E1712] px-4 py-3 text-[#F2F0E6] outline-none transition placeholder:text-white/30 focus:border-[#2B6E56]"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#F2F0E6]">
                        Account type
                      </label>

                      <select
                        value={registerRole}
                        onChange={(e) => {
                          setRegisterRole(
                            e.target.value as "CUSTOMER" | "STAFF" | "ADMIN"
                          );
                          setRegisterRoleKey("");
                        }}
                        className="mt-1 w-full rounded-md border border-white/10 bg-[#0E1712] px-4 py-3 text-[#F2F0E6] outline-none transition focus:border-[#2B6E56]"
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="STAFF">Staff</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>

                    {registerRole !== "CUSTOMER" && (
                      <div>
                        <label className="text-sm font-medium text-[#F2F0E6]">
                          {registerRole === "ADMIN"
                            ? "Admin signup key"
                            : "Staff signup key"}
                        </label>

                        <input
                          type="password"
                          value={registerRoleKey}
                          onChange={(e) => setRegisterRoleKey(e.target.value)}
                          placeholder="Enter signup key"
                          className="mt-1 w-full rounded-md border border-white/10 bg-[#0E1712] px-4 py-3 text-[#F2F0E6] outline-none transition placeholder:text-white/30 focus:border-[#2B6E56]"
                        />

                        <p className="mt-1 text-xs text-[#93A69B]">
                          Required to create a {registerRole.toLowerCase()}{" "}
                          account.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-[#F2F0E6]">
                        Password
                      </label>

                      <input
                        type="password"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="mt-1 w-full rounded-md border border-white/10 bg-[#0E1712] px-4 py-3 text-[#F2F0E6] outline-none transition focus:border-[#2B6E56]"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-[#F2F0E6]">
                        Confirm password
                      </label>

                      <input
                        type="password"
                        value={registerConfirmPassword}
                        onChange={(e) =>
                          setRegisterConfirmPassword(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") register();
                        }}
                        className="mt-1 w-full rounded-md border border-white/10 bg-[#0E1712] px-4 py-3 text-[#F2F0E6] outline-none transition focus:border-[#2B6E56]"
                      />
                    </div>

                    {registerError && (
                      <div className="rounded-md border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                        {registerError}
                      </div>
                    )}

                    {registerSuccess && (
                      <div className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
                        {registerSuccess}
                      </div>
                    )}

                    <button
                      onClick={register}
                      className="w-full rounded-md bg-[#2B6E56] py-3 font-semibold text-white transition hover:bg-[#35836A]"
                    >
                      Create account
                    </button>
                  </div>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-[#93A69B]">
                      Already have an account?
                    </p>

                    <button
                      onClick={() => {
                        setIsRegistering(false);
                        setRegisterError("");
                        setRegisterSuccess("");
                      }}
                      className="mt-1 text-sm font-semibold text-[#7FD9B6] hover:text-[#9CE6C7]"
                    >
                      Back to sign in
                    </button>
                  </div>
                </>
              )}
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

export default App;