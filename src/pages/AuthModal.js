import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaIndustry, FaGavel, FaStore, FaUserCheck, FaArrowRight, FaCheckCircle, FaLock, FaUserPlus } from "react-icons/fa";
import Navbar from "./Navbar";
import "./AuthModal.css";

const API_BASE = "https://fake-product-identification-backend.vercel.app";

const roles = [
  { key: "manufacturer", title: "Manufacturer", icon: FaIndustry, desc: "Register products and publish authenticity proofs." },
  { key: "seller", title: "Seller", icon: FaStore, desc: "Verify inventory and record supply chain actions." },
  { key: "regulator", title: "Regulator", icon: FaGavel, desc: "Audit history and compliance signals quickly." },
  { key: "customer", title: "Consumer", icon: FaUserCheck, desc: "Scan and verify a product before purchase." }
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

  const activeRole = useMemo(() => roles.find((r) => r.key === roleKey) || roles[0], [roleKey]);
  const roleTitle = useMemo(() => activeRole?.title || "User", [activeRole]);

  const onRoleSelect = (key) => {
    if (loading) return;
    if (key === "customer") {
      navigate("/customer");
      return;
    }
    setError("");
    setRoleKey(key);
  };

  const approvalGateError = (serverRole, approvalStatus) => {
    const r = String(serverRole || "").toLowerCase().trim();
    const st = String(approvalStatus || "").toUpperCase().trim();
    if ((r === "manufacturer" || r === "seller") && st !== "APPROVED") {
      return `${roleTitle} account is not approved yet. Current status: ${st || "PENDING"}. Please wait for Regulator approval.`;
    }
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
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

        const serverRole = String(data?.user?.role || "").toLowerCase().trim();
        const st = String(data?.user?.approval_status || "").toUpperCase().trim();

        const gateMsg = approvalGateError(serverRole, st);
        if (gateMsg) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("auth_user");
          setLoading(false);
          return setError(gateMsg);
        }

        if (!persistSession(data)) {
          setLoading(false);
          return setError("Signup succeeded but session data is missing");
        }

        setLoading(false);
        navigate(roleRoute(data.user.role));
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
      const st = String(data?.user?.approval_status || "").toUpperCase().trim();

      if (!serverRole) {
        setLoading(false);
        return setError("Login succeeded but role is missing");
      }

      if (serverRole !== selectedRole) {
        setLoading(false);
        return setError(`This account is registered as ${serverRole}, not ${roleTitle}`);
      }

      const gateMsg = approvalGateError(serverRole, st);
      if (gateMsg) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setLoading(false);
        return setError(gateMsg);
      }

      if (!persistSession(data)) {
        setLoading(false);
        return setError("Login succeeded but session data is missing");
      }

      setLoading(false);
      navigate(roleRoute(serverRole));
    } catch {
      setLoading(false);
      setError("Network error, please try again");
    }
  };

  return (
    <div className="authp-page">
      <Navbar />

      <div className="authx-shell">
        <div className="authx-wrap">
          <div className="authx-grid">
            <div className="authx-left">
              <div className="authx-leftHead">
                <div className="authx-mark">
                  <FaCheckCircle />
                </div>
                <div className="authx-leftTxt">
                  <div className="authx-leftTitle">Choose your role</div>
                  <div className="authx-leftSub">Then login or create an account. Consumer access is instant.</div>
                </div>
              </div>

              <div className="authx-roles2x2" aria-label="roles">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const active = r.key === roleKey;
                  const isConsumer = r.key === "customer";
                  return (
                    <button
                      key={r.key}
                      type="button"
                      className={`authx-roleCard ${active ? "active" : ""} ${isConsumer ? "consumer" : ""}`}
                      onClick={() => onRoleSelect(r.key)}
                      disabled={loading}
                    >
                      <div className="authx-roleTop">
                        <div className="authx-roleIcon">
                          <Icon />
                        </div>
                        {isConsumer ? <div className="authx-pill">No login</div> : null}
                      </div>
                      <div className="authx-roleName">{r.title}</div>
                      <div className="authx-roleDesc">{r.desc}</div>
                      <div className="authx-roleCta">
                        <span>{isConsumer ? "Open" : "Select"}</span>
                        <FaArrowRight />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="authx-right">
              <div className="authx-card">
                <div className="authx-head">
                  <div className="authx-headLeft">
                    <div className="authx-headTitle">{tab === "login" ? "Welcome back" : "Create your account"}</div>
                    <div className="authx-headSub">
                      Role: <span className="authx-headRole">{activeRole.title}</span>
                    </div>
                  </div>

                  <div className="authx-tabs" role="tablist" aria-label="auth tabs">
                    <button
                      type="button"
                      className={`authx-tab ${tab === "login" ? "active" : ""}`}
                      onClick={() => setTab("login")}
                      disabled={loading}
                    >
                      <FaLock />
                      <span>Login</span>
                    </button>
                    <button
                      type="button"
                      className={`authx-tab ${tab === "signup" ? "active" : ""}`}
                      onClick={() => setTab("signup")}
                      disabled={loading}
                    >
                      <FaUserPlus />
                      <span>Signup</span>
                    </button>
                  </div>
                </div>

                <form className="authx-form" onSubmit={onSubmit}>
                  <div className="authx-field">
                    <label className="authx-label">Email</label>
                    <input
                      className="authx-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      type="email"
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>

                  <div className="authx-field">
                    <label className="authx-label">Password</label>
                    <input
                      className="authx-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      type="password"
                      autoComplete={tab === "login" ? "current-password" : "new-password"}
                      disabled={loading}
                    />
                  </div>

                  {tab === "signup" ? (
                    <div className="authx-field">
                      <label className="authx-label">Confirm Password</label>
                      <input
                        className="authx-input"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="Confirm password"
                        type="password"
                        autoComplete="new-password"
                        disabled={loading}
                      />
                    </div>
                  ) : null}

                  {error ? <div className="authx-error">{error}</div> : null}

                  <button className="authx-submit" type="submit" disabled={loading}>
                    <span>{loading ? "Please wait..." : tab === "login" ? "Continue" : "Create Account"}</span>
                    <FaArrowRight />
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="authx-foot" />
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
