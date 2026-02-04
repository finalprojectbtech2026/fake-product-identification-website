import React from "react";
import { useNavigate } from "react-router-dom";
import { FaLock, FaShieldAlt, FaBolt } from "react-icons/fa";
import Navbar from "./Navbar";
import "./Admin.css";

function QRScanSvg() {
  return (
    <div className="qr-wrap" aria-hidden="true">
      <div className="qr-card">
        <div className="qr-card-inner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 640"
            focusable="false"
            className="qr-svg"
          >
            <path d="M160 224L224 224L224 160L160 160L160 224zM96 144C96 117.5 117.5 96 144 96L240 96C266.5 96 288 117.5 288 144L288 240C288 266.5 266.5 288 240 288L144 288C117.5 288 96 266.5 96 240L96 144zM160 480L224 480L224 416L160 416L160 480zM96 400C96 373.5 117.5 352 144 352L240 352C266.5 352 288 373.5 288 400L288 496C288 522.5 266.5 544 240 544L144 544C117.5 544 96 522.5 96 496L96 400zM416 160L416 224L480 224L480 160L416 160zM400 96L496 96C522.5 96 544 117.5 544 144L544 240C544 266.5 522.5 288 496 288L400 288C373.5 288 352 266.5 352 240L352 144C352 117.5 373.5 96 400 96zM384 416C366.3 416 352 401.7 352 384C352 366.3 366.3 352 384 352C401.7 352 416 366.3 416 384C416 401.7 401.7 416 384 416zM384 480C401.7 480 416 494.3 416 512C416 529.7 401.7 544 384 544C366.3 544 352 529.7 352 512C352 494.3 366.3 480 384 480zM480 512C480 494.3 494.3 480 512 480C529.7 480 544 494.3 544 512C544 529.7 529.7 544 512 544C494.3 544 480 529.7 480 512zM512 416C494.3 416 480 401.7 480 384C480 366.3 494.3 352 512 352C529.7 352 544 366.3 544 384C544 401.7 529.7 416 512 416zM480 448C480 465.7 465.7 480 448 480C430.3 480 416 465.7 416 448C416 430.3 430.3 416 448 416C465.7 416 480 430.3 480 448z" />
          </svg>
          <div className="qr-scanline" />
          <div className="qr-glow" />
        </div>
      </div>
    </div>
  );
}

function Admin() {
  const navigate = useNavigate();

  return (
    <div className="admin-page">
      <Navbar />

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <h1 className="hero-title">
              verify product <span className="hero-title-dark">Authenticity</span>{" "}
              <span className="hero-title-rest">using Blockchain</span>
            </h1>

            <p className="hero-desc">
              Scan QR codes to instantly confirm genuine products through a secure and tamper-proof blockchain network.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="hero-btn secondary"
                onClick={() => navigate("/manufacturer")}
              >
                <FaLock />
                Login as Manufacturer
              </button>
            </div>
          </div>

          <div className="hero-right">
            <QRScanSvg />
          </div>
        </div>
      </section>

      <section className="sec2">
        <div className="sec2-inner">
          <div className="sec2-grid">
            <div className="sec2-card">
              <div className="sec2-ico green">
                <FaLock />
              </div>
              <div className="sec2-text">
                <div className="sec2-title">Blockchain Secured</div>
                <div className="sec2-sub">Immutable ledger data</div>
              </div>
            </div>
            <div className="sec2-card">
              <div className="sec2-ico blueLite">
                <FaShieldAlt />
              </div>
              <div className="sec2-text">
                <div className="sec2-title">Tamper-proof Records</div>
                <div className="sec2-sub">Cannot be altered</div>
              </div>
            </div>
            <div className="sec2-card">
              <div className="sec2-ico blue">
                <FaBolt />
              </div>
              <div className="sec2-text">
                <div className="sec2-title">Real-Time Verification</div>
                <div className="sec2-sub">Instant status check</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec3">
        <div className="sec3-inner">
          <h2 className="sec3-title">How it Works</h2>
          <p className="sec3-sub">
            Secure tracking from factory to consumer in three simple steps.
          </p>

          <div className="sec3-steps">
            <div className="sec3-step">
              <div className="sec3-num">1</div>
              <div className="sec3-head">Register Product</div>
              <div className="sec3-desc">
                Manufacturer registers authentic product details on the blockchain.
              </div>
            </div>

            <div className="sec3-step">
              <div className="sec3-num">2</div>
              <div className="sec3-head">Generate QR</div>
              <div className="sec3-desc">
                Smart contract generates a unique, secure QR code for packaging.
              </div>
            </div>

            <div className="sec3-step">
              <div className="sec3-num">3</div>
              <div className="sec3-head">Scan & Verify</div>
              <div className="sec3-desc">
                Consumer scans the QR code to instantly verify authenticity.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Admin;