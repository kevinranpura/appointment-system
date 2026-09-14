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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          <div className="mb-8 text-center text-white">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 text-2xl font-bold">
              S
            </div>

            <h1 className="text-3xl font-bold">
              Smart Appointment System
            </h1>

            <p className="mt-2 text-slate-400">
              Smart Appointment & Queue Management
            </p>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-2xl">

            {!isRegistering ? (
              <>
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

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-500">
                    Don't have an account?
                  </p>

                  <button
                    onClick={() => {
                      setIsRegistering(true);
                      setLoginError("");
                    }}
                    className="mt-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Create an account
                  </button>
                </div>

                <div className="mt-6 rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">
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
                <h2 className="text-xl font-semibold text-slate-900">
                  Create an account
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Register to book appointments
                </p>

                <div className="mt-6 space-y-4">

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Name
                    </label>

                    <input
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="John Doe"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Email
                    </label>

                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Phone
                    </label>

                    <input
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="9876543210"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
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
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                    >
                      <option value="CUSTOMER">Customer</option>
                      <option value="STAFF">Staff</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  {registerRole !== "CUSTOMER" && (
                    <div>
                      <label className="text-sm font-medium text-slate-700">
                        {registerRole === "ADMIN"
                          ? "Admin signup key"
                          : "Staff signup key"}
                      </label>

                      <input
                        type="password"
                        value={registerRoleKey}
                        onChange={(e) => setRegisterRoleKey(e.target.value)}
                        placeholder="Enter signup key"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                      />

                      <p className="mt-1 text-xs text-slate-500">
                        Required to create a {registerRole.toLowerCase()} account.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-slate-700">
                      Password
                    </label>

                    <input
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700">
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
                      className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                    />
                  </div>

                  {registerError && (
                    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                      {registerError}
                    </div>
                  )}

                  {registerSuccess && (
                    <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                      {registerSuccess}
                    </div>
                  )}

                  <button
                    onClick={register}
                    className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Create account
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-500">
                    Already have an account?
                  </p>

                  <button
                    onClick={() => {
                      setIsRegistering(false);
                      setRegisterError("");
                      setRegisterSuccess("");
                    }}
                    className="mt-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Back to sign in
                  </button>
                </div>
              </>
            )}
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