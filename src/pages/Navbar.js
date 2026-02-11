import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import "./Navbar.css";

function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [sessionRole, setSessionRole] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const readSession = useCallback(() => {
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
  }, []);

  const getRolePortalRoute = useCallback((role) => {
    if (role === "manufacturer") return "/manufacturer";
    if (role === "seller") return "/seller";
    if (role === "regulator") return "/regulator";
    if (role === "customer" || role === "consumer") return "/customer";
    return "/auth";
  }, []);

  const getRoleDescRoute = useCallback((role) => {
    if (role === "manufacturer") return "/role/manufacturer";
    if (role === "seller") return "/role/seller";
    if (role === "regulator") return "/role/regulator";
    return "/auth";
  }, []);

  const roleLabel = useCallback((role) => {
    if (role === "manufacturer") return "Manufacturer";
    if (role === "seller") return "Seller";
    if (role === "regulator") return "Regulator";
    if (role === "customer" || role === "consumer") return "Consumer";
    return "Role";
  }, []);

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
  }, [readSession]);

  const isActive = useCallback(
    (path) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)),
    [location.pathname]
  );

  const handleLinkClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsMobileOpen(false);
  }, []);

  const goHome = useCallback(() => {
    handleLinkClick();
    navigate("/");
  }, [handleLinkClick, navigate]);

  const goLogin = useCallback(() => {
    handleLinkClick();
    navigate("/auth");
  }, [handleLinkClick, navigate]);

  const goRole = useCallback(() => {
    handleLinkClick();
    if (!sessionRole) {
      navigate("/auth");
      return;
    }
    navigate(getRoleDescRoute(sessionRole));
  }, [getRoleDescRoute, handleLinkClick, navigate, sessionRole]);

  const goPortal = useCallback(() => {
    handleLinkClick();
    if (!sessionRole) {
      navigate("/auth");
      return;
    }
    navigate(getRolePortalRoute(sessionRole));
  }, [getRolePortalRoute, handleLinkClick, navigate, sessionRole]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    } catch {}
    setSessionRole("");
    setIsMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate("/");
  }, [navigate]);

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

  const desktopLinks = useMemo(() => {
    if (!authed) {
      return [
        { type: "link", name: "Home", path: "/" },
        { type: "btn", name: "Login", onClick: goLogin, active: location.pathname.startsWith("/auth") }
      ];
    }

    const role = sessionRole;
    return [
      { type: "link", name: "Home", path: "/" },
      { type: "btn", name: "Role", onClick: goRole, active: location.pathname.startsWith("/role/") },
      { type: "btn", name: roleLabel(role), onClick: goPortal, active: isActive(getRolePortalRoute(role)) },
      { type: "btn", name: "Logout", onClick: logout, active: false }
    ];
  }, [authed, getRolePortalRoute, goLogin, goPortal, goRole, isActive, location.pathname, logout, roleLabel, sessionRole]);

  const mobileLinks = desktopLinks;

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

        <button type="button" className="logo" onClick={goHome} aria-label="Home">
          <img src="/Images/qr.jpg" alt="logo" />
        </button>

        <div className="nav-links desktop-only">
          {desktopLinks.map((it) => {
            if (it.type === "link") {
              return (
                <Link
                  key={it.name}
                  to={it.path}
                  onClick={handleLinkClick}
                  className={`nav-link ${isActive(it.path) ? "active" : ""}`}
                >
                  {it.name}
                </Link>
              );
            }

            return (
              <button
                key={it.name}
                type="button"
                className={`nav-link nav-login ${it.active ? "active" : ""}`}
                onClick={it.onClick}
              >
                {it.name}
              </button>
            );
          })}
        </div>

        <div className="nav-spacer mobile-only" />
      </div>

      <div className={`mobile-sheet ${isMobileOpen ? "open" : ""}`}>
        <div className="mobile-sheet-head">
          <button type="button" className="mobile-close" aria-label="Close menu" onClick={() => setIsMobileOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <div className="mobile-links">
          {mobileLinks.map((it) => {
            if (it.type === "link") {
              return (
                <Link
                  key={it.name}
                  to={it.path}
                  onClick={handleLinkClick}
                  className={`mobile-link ${isActive(it.path) ? "active" : ""}`}
                >
                  {it.name}
                </Link>
              );
            }

            return (
              <button
                key={it.name}
                type="button"
                className={`mobile-link mobile-login ${it.active ? "active" : ""}`}
                onClick={() => {
                  it.onClick();
                  setIsMobileOpen(false);
                }}
              >
                {it.name}
              </button>
            );
          })}
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
