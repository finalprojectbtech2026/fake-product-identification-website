import React from "react";
import { Link } from "react-router-dom";
import "./Customer.css";

function Customer() {
  return (
    <div className="role-shell">
      <div className="role-header">
        <div className="role-left">
          <div className="role-badge">C</div>
          <div>
            <div className="role-title">Customer Portal</div>
            <div className="role-subtitle">Scan QR to verify originality and view transactions</div>
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
          <div className="card-title">Scan Product QR</div>
          <div className="card-desc">Scan dynamic QR, fetch history, confirm original or duplicate.</div>
          <button className="card-btn">Scan Now</button>
        </div>

        <div className="role-card">
          <div className="card-title">Transaction History</div>
          <div className="card-desc">Shows manufacturer to seller to customer chain updates clearly.</div>
          <button className="card-btn">View History</button>
        </div>

        <div className="role-card">
          <div className="card-title">Verify Certificate</div>
          <div className="card-desc">Later: IPFS certificates and images with hash verification.</div>
          <button className="card-btn">Verify</button>
        </div>
      </div>
    </div>
  );
}

export default Customer;
