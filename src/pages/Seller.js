import React from "react";
import { Link } from "react-router-dom";
import "./Seller.css";

function Seller() {
  return (
    <div className="role-shell">
      <div className="role-header">
        <div className="role-left">
          <div className="role-badge">S</div>
          <div>
            <div className="role-title">Seller Portal</div>
            <div className="role-subtitle">Accept product updates and update QR state</div>
          </div>
        </div>
        <div className="role-nav">
          <Link className="role-link" to="/">Home</Link>
          <Link className="role-link" to="/about">About</Link>
          <Link className="role-link" to="/services">Services</Link>
          <Link className="role-link" to="/contact">Contact</Link>
        </div>
      </div>

      <div className="role-cardgrid">
        <div className="role-card">
          <div className="card-title">Scan Manufacturer QR</div>
          <div className="card-desc">Fetch chain state, validate product, and pull previous transactions.</div>
          <button className="card-btn">Scan QR</button>
        </div>

        <div className="role-card">
          <div className="card-title">Accept Updates</div>
          <div className="card-desc">Accept received shipment updates and push a new transaction to blockchain.</div>
          <button className="card-btn">Accept & Update</button>
        </div>

        <div className="role-card">
          <div className="card-title">Generate Updated QR</div>
          <div className="card-desc">Dynamic QR regenerates with latest Blockchain State Hash.</div>
          <button className="card-btn">Update QR</button>
        </div>
      </div>
    </div>
  );
}

export default Seller;
