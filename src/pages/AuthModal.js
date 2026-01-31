import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaIndustry, FaGavel, FaStore, FaUserCheck, FaArrowRight, FaQrcode, FaShieldAlt, FaBolt } from "react-icons/fa";
import Navbar from "./Navbar";
import "./AuthModal.css";

const API_BASE = "https://fake-product-identification-backend.vercel.app";

const roles = [
  { key: "manufacturer", title: "Manufacturer", icon: FaIndustry },
  { key: "regulator", title: "Regulator", icon: FaGavel },
  { key: "seller", title: "Seller", icon: FaStore },
  { key: "customer", title: "Customer", icon: FaUserCheck }
];

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  const [roleKey, setRoleKey] = useState("manufacturer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const roleTitle = useMemo(() => roles.find((r) => r.key === roleKey)?.title || "User", [roleKey]);

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const roleRoute = (role) => {
    const r = String(role || "").toLowerCase().trim();
    if (r === "manufacturer") return "/manufacturer";
    if (r === "seller") return "/seller";
    if (r === "customer" || r === "consumer") return "/customer";
    if (r === "regulator") return "/regulator";
    return "/";
  };

  const safeJson = async (resp) => {
    try {
      return await resp.json();
    } catch {
      return null;
    }
  };

  const persistSession = (data) => {
    if (!data?.token || !data?.user) return false;
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    window.dispatchEvent(new Event("storage"));
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const e1 = email.trim().toLowerCase();
    const p1 = password;

    if (!validateEmail(e1)) return setError("Enter a valid email");
    if (!p1 || p1.length < 4) return setError("Password must be at least 4 characters");
    if (tab === "signup" && confirm !== password) return setError("Passwords do not match");

    setLoading(true);

    try {
      if (tab === "signup") {
        const resp = await fetch(`${API_BASE}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: roleKey, email: e1, password: p1 })
        });

        const data = await safeJson(resp);

        if (!resp.ok) {
          setLoading(false);
          return setError(data?.message || "Signup failed");
        }

        if (!persistSession(data)) {
          setLoading(false);
          return setError("Signup succeeded but session data is missing");
        }

        const next = roleRoute(data.user.role);
        setLoading(false);
        navigate(next);
        return;
      }

      const resp = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e1, password: p1 })
      });

      const data = await safeJson(resp);

      if (!resp.ok) {
        setLoading(false);
        return setError(data?.message || "Login failed");
      }

      const serverRole = String(data?.user?.role || "").toLowerCase().trim();
      const selectedRole = String(roleKey || "").toLowerCase().trim();

      if (!serverRole) {
        setLoading(false);
        return setError("Login succeeded but role is missing");
      }

      if (serverRole !== selectedRole) {
        setLoading(false);
        return setError(`This account is registered as ${serverRole}, not ${roleTitle}`);
      }

      if (!persistSession(data)) {
        setLoading(false);
        return setError("Login succeeded but session data is missing");
      }

      const next = roleRoute(serverRole);
      setLoading(false);
      navigate(next);
    } catch {
      setLoading(false);
      setError("Network error, please try again");
    }
  };

  return (
    <div className="authp-page">
      <Navbar />

      <div className="authp-shell authp-shell-page">
        <div className="authp-bg" />
        <div className="authp-grid" />
        <div className="authp-glow authp-glow-1" />
        <div className="authp-glow authp-glow-2" />

        <div className="authp-wrap authp-wrap-page">
          <div className="authp-split">
            <div className="authp-left">
              <div className="authp-left-card">
                <div className="authp-left-kicker">
                  <FaQrcode />
                  Secure QR Verification
                </div>
                <div className="authp-left-title">Login to manage roles and verify products on blockchain.</div>
                <div className="authp-left-desc">
                  Select your role, then login or signup. Every product scan can show the full history and authenticity status.
                </div>

                <div className="authp-left-points">
                  <div className="authp-point">
                    <span className="authp-point-ico">
                      <FaShieldAlt />
                    </span>
                    <span className="authp-point-text">Tamper-proof verification flow</span>
                  </div>
                  <div className="authp-point">
                    <span className="authp-point-ico">
                      <FaBolt />
                    </span>
                    <span className="authp-point-text">Instant scan result for customers</span>
                  </div>
                </div>

                <button className="authp-left-back" type="button" onClick={() => navigate("/")}>
                  Back to Home
                </button>
              </div>
            </div>

            <div className="authp-right">
              <div className="authp-top">
                <div className="authp-title">{tab === "login" ? "Login" : "Create Account"}</div>
                <div className="authp-sub">Select your role and continue securely.</div>

                <div className="authp-tabs">
                  <button
                    type="button"
                    className={`authp-tab ${tab === "login" ? "active" : ""}`}
                    onClick={() => setTab("login")}
                    disabled={loading}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className={`authp-tab ${tab === "signup" ? "active" : ""}`}
                    onClick={() => setTab("signup")}
                    disabled={loading}
                  >
                    Signup
                  </button>
                </div>
              </div>

              <div className="authp-card">
                <div className="authp-section-head">
                  <div className="authp-section-title">Select Role</div>
                </div>

                <div className="authp-roles">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const active = r.key === roleKey;
                    return (
                      <button
                        key={r.key}
                        type="button"
                        className={`authp-role ${active ? "active" : ""}`}
                        onClick={() => setRoleKey(r.key)}
                        disabled={loading}
                      >
                        <div className="authp-role-ico">
                          <Icon />
                        </div>
                        <div className="authp-role-name">{r.title}</div>
                      </button>
                    );
                  })}
                </div>

                <form className="authp-form" onSubmit={onSubmit}>
                  <div className="authp-field">
                    <label className="authp-label">Email</label>
                    <input
                      className="authp-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      type="email"
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>

                  <div className="authp-field">
                    <label className="authp-label">Password</label>
                    <input
                      className="authp-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      type="password"
                      autoComplete={tab === "login" ? "current-password" : "new-password"}
                      disabled={loading}
                    />
                  </div>

                  {tab === "signup" ? (
                    <div className="authp-field">
                      <label className="authp-label">Confirm Password</label>
                      <input
                        className="authp-input"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Confirm password"
                        type="password"
                        autoComplete="new-password"
                        disabled={loading}
                      />
                    </div>
                  ) : null}

                  {error ? <div className="authp-error">{error}</div> : null}

                  <button className="authp-submit" type="submit" disabled={loading}>
                    <span>{loading ? "Please wait..." : tab === "login" ? "Continue" : "Create Account"}</span>
                    <FaArrowRight />
                  </button>

                  <div className="authp-note">Your login is stored in Neon DB and authenticated using JWT.</div>
                </form>
              </div>
            </div>
          </div>

          <div className="authp-foot-space" />
        </div>
      </div>
    </div>
  );
}

export default AuthPage;