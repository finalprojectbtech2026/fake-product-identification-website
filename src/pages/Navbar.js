import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import "./Navbar.css";

function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Contact Us", path: "/contact" }
  ];

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsMobileOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="logo" onClick={handleLinkClick}>
          <img src="/Images/logo3.jpeg" alt="logo" />
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
        </div>

        <div className="nav-toggle mobile-only" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          {isMobileOpen ? <FaTimes /> : <FaBars />}
        </div>
      </div>

      {isMobileOpen && (
        <div className="mobile-drawer">
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
        </div>
      )}
    </nav>
  );
}

export default Navbar;
