import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "./AuthModal.css";

const storageKey = (roleKey) => `auth_users_${roleKey}`;
const sessionKey = (roleKey) => `auth_session_${roleKey}`;

function AuthModal({ open, mode, roleKey, roleTitle, onClose, onAuthed }) {
  const [tab, setTab] = useState(mode || "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setTab(mode || "login");
  }, [mode]);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setPassword("");
      setConfirm("");
      setError("");
    }
  }, [open]);

  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  const title = useMemo(() => {
    if (!roleTitle) return "Authentication";
    return `${roleTitle} ${tab === "login" ? "Login" : "Signup"}`;
  }, [roleTitle, tab]);

  if (!open || !roleKey) return null;

  const readUsers = () => {
    try {
      const raw = localStorage.getItem(storageKey(roleKey));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const writeUsers = (users) => {
    localStorage.setItem(storageKey(roleKey), JSON.stringify(users));
  };

  const setSession = (userEmail) => {
    localStorage.setItem(
      sessionKey(roleKey),
      JSON.stringify({ email: userEmail, role: roleKey, at: Date.now() })
    );
  };

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const submit = (e) => {
    e.preventDefault();
    setError("");

    const e1 = email.trim().toLowerCase();
    const p1 = password;

    if (!validateEmail(e1)) return setError("Enter a valid email");
    if (p1.length < 4) return setError("Password must be at least 4 characters");

    const users = readUsers();

    if (tab === "signup") {
      if (confirm !== password) return setError("Passwords do not match");
      const exists = users.some((u) => u.email === e1);
      if (exists) return setError("User already exists, please login");
      const updated = [...users, { email: e1, password: p1 }];
      writeUsers(updated);
      setSession(e1);
      onClose();
      onAuthed(roleKey);
      return;
    }

    const found = users.find((u) => u.email === e1 && u.password === p1);
    if (!found) return setError("Invalid credentials");
    setSession(e1);
    onClose();
    onAuthed(roleKey);
  };

  return createPortal(
    <div className="auth-overlay" onMouseDown={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="auth-glow" aria-hidden="true" />

        <div className="auth-head">
          <div className="auth-brand">
            <div className="auth-mark" aria-hidden="true" />
            <div className="auth-titles">
              <div className="auth-title">{title}</div>
              <div className="auth-subtitle">
                {tab === "login" ? "Welcome back, continue securely" : "Create an account in seconds"}
              </div>
            </div>
          </div>

          <button className="auth-close" onClick={onClose} type="button" aria-label="Close">
            ×
          </button>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            type="button"
            onClick={() => setTab("login")}
          >
            Login
          </button>
          <button
            className={`auth-tab ${tab === "signup" ? "active" : ""}`}
            type="button"
            onClick={() => setTab("signup")}
          >
            Signup
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <div className="auth-control">
              <span className="auth-icon" aria-hidden="true">
                @
              </span>
              <input
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                type="email"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-control">
              <span className="auth-icon" aria-hidden="true">
                ••
              </span>
              <input
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                type="password"
                autoComplete={tab === "login" ? "current-password" : "new-password"}
              />
            </div>
          </div>

          {tab === "signup" ? (
            <div className="auth-field">
              <label className="auth-label">Confirm Password</label>
              <div className="auth-control">
                <span className="auth-icon" aria-hidden="true">
                  ✓
                </span>
                <input
                  className="auth-input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                  type="password"
                  autoComplete="new-password"
                />
              </div>
            </div>
          ) : null}

          {error ? <div className="auth-error">{error}</div> : null}

          <button className="auth-submit" type="submit">
            {tab === "login" ? "Continue" : "Create Account"}
          </button>

          <div className="auth-footnote">
            By continuing, you agree to the basic demo terms and local storage usage.
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default AuthModal;
