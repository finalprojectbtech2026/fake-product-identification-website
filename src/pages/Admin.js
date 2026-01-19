import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";
import "./Admin.css";

const roles = [
  {
    key: "manufacturer",
    title: "Manufacturer",
    subtitle: "Register products and generate dynamic QR codes",
    route: "/manufacturer",
  },
  {
    key: "seller",
    title: "Seller",
    subtitle: "Verify history, accept updates, and manage inventory",
    route: "/seller",
  },
  {
    key: "customer",
    title: "Customer",
    subtitle: "Scan QR codes and verify authenticity instantly",
    route: "/customer",
  },
];

function Admin() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState("login");
  const [activeRole, setActiveRole] = useState(null);

  const activeRoleObj = useMemo(
    () => roles.find((r) => r.key === activeRole),
    [activeRole]
  );

  const openAuth = (roleKey, authMode) => {
    setActiveRole(roleKey);
    setMode(authMode);
    setModalOpen(true);
  };

  const closeAuth = () => {
    setModalOpen(false);
    setActiveRole(null);
  };

  const onAuthed = (roleKey) => {
    const roleObj = roles.find((r) => r.key === roleKey);
    if (roleObj) navigate(roleObj.route);
  };

  return (
    <div className="admin-shell">
      <div className="admin-bg" />
      <div className="admin-noise" />

      <div className="admin-container">
        <header className="brand">
          <div className="brand-badge" aria-hidden="true">
            <span className="brand-badge-inner">QR</span>
          </div>

          <div className="brand-text">
            <div className="brand-title">Product Authenticity System</div>
            <div className="brand-subtitle">
              Dynamic QR codes with traceable verification
            </div>
          </div>

          <div className="brand-chip">
            <span className="chip-dot" />
            Secure Mode
          </div>
        </header>

        <section className="cards">
          {roles.map((role) => (
            <article className="role-card" key={role.key}>
              <div className="role-accent" aria-hidden="true" />

              <div className="role-top">
                <div className="role-kicker">Access</div>
                <div className="role-title">{role.title}</div>
                <div className="role-subtitle">{role.subtitle}</div>
              </div>

              <div className="role-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => openAuth(role.key, "login")}
                >
                  Login
                </button>

                <button
                  className="btn btn-ghost"
                  onClick={() => openAuth(role.key, "signup")}
                >
                  Signup
                </button>
              </div>
            </article>
          ))}
        </section>

        <footer className="admin-footer">
          <div className="footer-left">Local auth demo, ready for Web3 routing</div>
          <div className="footer-right">
            <span className="dot" />
            <span>Ganache / Sepolia</span>
          </div>
        </footer>
      </div>

      <AuthModal
        open={modalOpen}
        mode={mode}
        roleKey={activeRole}
        roleTitle={activeRoleObj?.title || ""}
        onClose={closeAuth}
        onAuthed={onAuthed}
      />
    </div>
  );
}

export default Admin;
