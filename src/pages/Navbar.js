import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import "./Navbar.css";

function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [sessionRole, setSessionRole] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const readSession = () => {
    let token = "";
    let user = null;

    try {
      token = localStorage.getItem("auth_token") || "";
    } catch {}

    try {
      user = JSON.parse(localStorage.getItem("auth_user") || "null");
    } catch {
      user = null;
    }

    const role = String(user?.role || "").toLowerCase().trim();
    return { token, user, role };
  };

  const getRoleRoute = (role) => {
    if (role === "manufacturer") return "/manufacturer";
    if (role === "seller") return "/seller";
    if (role === "customer") return "/customer";
    return "";
  };

  useEffect(() => {
    const apply = () => {
      const { token, role } = readSession();
      setSessionRole(token ? role : "");
    };

    apply();

    const onStorage = (e) => {
      if (!e || !e.key) return;
      if (e.key === "auth_token" || e.key === "auth_user") apply();
    };

    window.addEventListener("storage", onStorage);

    const interval = window.setInterval(() => {
      apply();
    }, 700);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(interval);
    };
  }, []);

  const navLinks = useMemo(
    () => [
      { name: "Home", path: "/" },
      { name: "How it Works", path: "/about" },
    ],
    []
  );

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsMobileOpen(false);
  };

  const goLogin = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsMobileOpen(false);

    const { token, role } = readSession();
    if (token && role) {
      const r = getRoleRoute(role);
      if (r) return navigate(r);
    }
    navigate("/auth");
  };

  const goPortal = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsMobileOpen(false);

    const { token, role } = readSession();
    if (!token) return navigate("/auth");

    const r = getRoleRoute(role);
    if (r) return navigate(r);

    navigate("/auth");
  };

  const logout = () => {
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    } catch {}
    setSessionRole("");
    setIsMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate("/");
  };

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY;

      if (y < 10) {
        setHidden(false);
      } else if (delta > 8) {
        setHidden(true);
        setIsMobileOpen(false);
      } else if (delta < -8) {
        setHidden(false);
      }
      lastY = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const authed = Boolean(sessionRole);
  const portalLabel =
    sessionRole === "manufacturer"
      ? "Manufacturer Portal"
      : sessionRole === "seller"
      ? "Seller Portal"
      : sessionRole === "customer"
      ? "Customer Portal"
      : "Portal";

  const portalActive =
    location.pathname.startsWith("/manufacturer") ||
    location.pathname.startsWith("/seller") ||
    location.pathname.startsWith("/customer");

  return (
    <nav className={`navbar ${hidden ? "navbar-hidden" : ""}`}>
      <div className="nav-inner">
        <button
          type="button"
          className="nav-burger mobile-only"
          aria-label={isMobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMobileOpen((s) => !s)}
        >
          {isMobileOpen ? <FaTimes /> : <FaBars />}
        </button>

        <Link to="/" className="logo" onClick={handleLinkClick} aria-label="Home">
          <img src="/Images/qr.jpg" alt="logo" />
        </Link>

        <div className="nav-links desktop-only">
          {navLinks.map(({ name, path }) => (
            <Link
              key={name}
              to={path}
              onClick={handleLinkClick}
              className={`nav-link ${isActive(path) ? "active" : ""}`}
            >
              {name}
            </Link>
          ))}

          {authed ? (
            <>
              <button
                type="button"
                className={`nav-link nav-login ${portalActive ? "active" : ""}`}
                onClick={goPortal}
              >
                {portalLabel}
              </button>
              <button type="button" className="nav-link nav-login" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              className={`nav-link nav-login ${location.pathname.startsWith("/auth") ? "active" : ""}`}
              onClick={goLogin}
            >
              Login
            </button>
          )}
        </div>

        <div className="nav-spacer mobile-only" />
      </div>

      <div className={`mobile-sheet ${isMobileOpen ? "open" : ""}`}>
        <div className="mobile-sheet-head">
          <button
            type="button"
            className="mobile-close"
            aria-label="Close menu"
            onClick={() => setIsMobileOpen(false)}
          >
            <FaTimes />
          </button>
        </div>

        <div className="mobile-links">
          {navLinks.map(({ name, path }) => (
            <Link
              key={name}
              to={path}
              onClick={handleLinkClick}
              className={`mobile-link ${isActive(path) ? "active" : ""}`}
            >
              {name}
            </Link>
          ))}

          {authed ? (
            <>
              <button
                type="button"
                className={`mobile-link mobile-login ${portalActive ? "active" : ""}`}
                onClick={goPortal}
              >
                {portalLabel}
              </button>
              <button type="button" className="mobile-link mobile-login" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              className={`mobile-link mobile-login ${location.pathname.startsWith("/auth") ? "active" : ""}`}
              onClick={goLogin}
            >
              Login
            </button>
          )}
        </div>
      </div>

      <div
        className={`mobile-backdrop ${isMobileOpen ? "open" : ""}`}
        onClick={() => setIsMobileOpen(false)}
        role="button"
        tabIndex={-1}
        aria-label="Close menu backdrop"
      />
    </nav>
  );
}

export default Navbar;