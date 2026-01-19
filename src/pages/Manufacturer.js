import React from "react";
import { Link } from "react-router-dom";
import "./Manufacturer.css";

function Manufacturer() {
  return (
    <div className="role-shell">
      <div className="role-header">
        <div className="role-left">
          <div className="role-badge">M</div>
          <div>
            <div className="role-title">Manufacturer Portal</div>
            <div className="role-subtitle">Register product, generate Dynamic QR</div>
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
          <div className="card-title">Register Product</div>
          <div className="card-desc">Create Product ID, store metadata (IPFS later), and initialize blockchain state.</div>
          <button className="card-btn">Start Registration</button>
        </div>

        <div className="role-card">
          <div className="card-title">Generate Dynamic QR</div>
          <div className="card-desc">QR data: Product ID + Blockchain State Hash. QR updates as chain updates.</div>
          <button className="card-btn">Generate QR</button>
        </div>

        <div className="role-card">
          <div className="card-title">View Transactions</div>
          <div className="card-desc">Track all updates after registration, seller accepts, customer scans.</div>
          <button className="card-btn">Open History</button>
        </div>
      </div>
    </div>
  );
}

export default Manufacturer;
