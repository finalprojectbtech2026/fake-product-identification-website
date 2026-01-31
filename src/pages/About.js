import React from "react";
import Navbar from "./Navbar";
import "./About.css";

function About() {
  return (
    <div className="how-shell">
      <Navbar />

      <section className="how-hero">
        <div className="how-wrap how-hero-grid">
          <div className="how-hero-left">
            <div className="how-badge">How it Works</div>

            <h1 className="how-title">
              Verify Product{" "}
              <span className="how-title-accent">Authenticity</span> using Blockchain
            </h1>

            <p className="how-desc">
              Our system uses SHA-256 hashing and blockchain records to keep every product event permanent,
              from manufacturing to final customer scan.
            </p>

            <div className="how-hero-actions">
              <div className="how-pill">Manufacturer → QR</div>
              <div className="how-pill how-pill-alt">Seller → Updates</div>
              <div className="how-pill">Consumer → Scan</div>
            </div>

            <div className="how-mini-stats">
              <div className="how-stat">
                <div className="how-stat-k">Immutable Logs</div>
                <div className="how-stat-v">Blockchain Records</div>
              </div>
              <div className="how-stat">
                <div className="how-stat-k">Secure Hashing</div>
                <div className="how-stat-v">SHA-256 Chain</div>
              </div>
              <div className="how-stat">
                <div className="how-stat-k">Fast Verify</div>
                <div className="how-stat-v">QR Scan Result</div>
              </div>
            </div>
          </div>

          <div className="how-hero-right">
            <div className="how-qr-card">
              <div className="how-qr-top">
                <div className="how-qr-tag">Dynamic QR</div>
                <div className="how-qr-tag how-qr-tag-outline">SHA-256</div>
              </div>

              <div className="how-qr-box" aria-hidden="true">
                <div className="how-qr-glow" />
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="how-qr-svg">
                  <path d="M160 224L224 224L224 160L160 160L160 224zM96 144C96 117.5 117.5 96 144 96L240 96C266.5 96 288 117.5 288 144L288 240C288 266.5 266.5 288 240 288L144 288C117.5 288 96 266.5 96 240L96 144zM160 480L224 480L224 416L160 416L160 480zM96 400C96 373.5 117.5 352 144 352L240 352C266.5 352 288 373.5 288 400L288 496C288 522.5 266.5 544 240 544L144 544C117.5 544 96 522.5 96 496L96 400zM416 160L416 224L480 224L480 160L416 160zM400 96L496 96C522.5 96 544 117.5 544 144L544 240C544 266.5 522.5 288 496 288L400 288C373.5 288 352 266.5 352 240L352 144C352 117.5 373.5 96 400 96zM384 416C366.3 416 352 401.7 352 384C352 366.3 366.3 352 384 352C401.7 352 416 366.3 416 384C416 401.7 401.7 416 384 416zM384 480C401.7 480 416 494.3 416 512C416 529.7 401.7 544 384 544C366.3 544 352 529.7 352 512C352 494.3 366.3 480 384 480zM480 512C480 494.3 494.3 480 512 480C529.7 480 544 494.3 544 512C544 529.7 529.7 544 512 544C494.3 544 480 529.7 480 512zM512 416C494.3 416 480 401.7 480 384C480 366.3 494.3 352 512 352C529.7 352 544 366.3 544 384C544 401.7 529.7 416 512 416zM480 448C480 465.7 465.7 480 448 480C430.3 480 416 465.7 416 448C416 430.3 430.3 416 448 416C465.7 416 480 430.3 480 448z" />
                </svg>
                <div className="how-scanline" />
              </div>

              <div className="how-qr-meta">
                <div className="how-meta-row">
                  <span className="how-meta-k">QR Data</span>
                  <span className="how-meta-v">Product ID + State Hash</span>
                </div>
                <div className="how-meta-row">
                  <span className="how-meta-k">Result</span>
                  <span className="how-meta-v how-meta-ok">Original or Duplicate</span>
                </div>
              </div>
            </div>

            <div className="how-note">
              <div className="how-note-dot" />
              <div className="how-note-text">
                Every scan validates the latest blockchain state and shows the full event history instantly.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="how-section how-alt">
        <div className="how-wrap">
          <div className="how-section-head">
            <h2 className="how-h2">Project Hosting</h2>
            <p className="how-sub">
              Fast delivery, strong security, and scalable infrastructure for all three layers.
            </p>
          </div>

          <div className="how-cards-3">
            <div className="how-card">
              <div className="how-card-top">
                <div className="how-icon how-icon-blue" />
                <div className="how-card-title">Frontend</div>
              </div>
              <div className="how-card-desc">Hosted on Vercel with fast global delivery.</div>
              <div className="how-card-pill">React</div>
            </div>

            <div className="how-card">
              <div className="how-card-top">
                <div className="how-icon how-icon-purple" />
                <div className="how-card-title">Backend</div>
              </div>
              <div className="how-card-desc">Optional Node.js + Express API for data and access control.</div>
              <div className="how-card-pill how-pill-purple">JWT</div>
            </div>

            <div className="how-card">
              <div className="how-card-top">
                <div className="how-icon how-icon-mix" />
                <div className="how-card-title">Blockchain</div>
              </div>
              <div className="how-card-desc">Ethereum network, smart contracts in Solidity.</div>
              <div className="how-card-pill how-pill-blue">Solidity</div>
            </div>
          </div>
        </div>
      </section>

      <section className="how-section how-gradient">
        <div className="how-wrap">
          <div className="how-section-head invert">
            <h2 className="how-h2 how-h2-invert">Hashing Algorithm</h2>
            <p className="how-sub how-sub-invert">
              Each state becomes a secure fingerprint for the next step in the product journey.
            </p>
          </div>

          <div className="how-grid-2">
            <div className="how-panel how-panel-glass">
              <div className="how-panel-title how-panel-title-invert">SHA-256 (Used)</div>
              <div className="how-panel-desc how-panel-desc-invert">
                Every product update generates a new hash. That hash becomes the next blockchain state.
              </div>
            </div>

            <div className="how-panel how-panel-glass">
              <div className="how-panel-title how-panel-title-invert">Advanced Option</div>
              <div className="how-panel-desc how-panel-desc-invert">
                If needed, you can move to SHA-3 (Keccak) to match Ethereum style hashing for some flows.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="how-section how-white">
        <div className="how-wrap">
          <div className="how-section-head">
            <h2 className="how-h2">System Flow</h2>
            <p className="how-sub">
              Clear roles, clear events, and every change is recorded permanently.
            </p>
          </div>

          <div className="how-steps">
            <div className="how-step">
              <div className="how-step-num">1</div>
              <div className="how-step-body">
                <div className="how-step-title">Manufacturer</div>
                <div className="how-step-desc">
                  Registers the product, stores details, and generates a dynamic QR linked to blockchain state.
                </div>
              </div>
            </div>

            <div className="how-step">
              <div className="how-step-num how-step-num-purple">2</div>
              <div className="how-step-body">
                <div className="how-step-title">Seller</div>
                <div className="how-step-desc">
                  Accepts updates, handles transfer, and refreshes the QR state as ownership changes.
                </div>
              </div>
            </div>

            <div className="how-step">
              <div className="how-step-num how-step-num-blue">3</div>
              <div className="how-step-body">
                <div className="how-step-title">Consumer</div>
                <div className="how-step-desc">
                  Scans QR during purchase. The system shows full history and confirms original or duplicate.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="how-section how-soft-purple">
        <div className="how-wrap">
          <div className="how-section-head invert">
            <h2 className="how-h2 how-h2-invert">Consumer (Home Page)</h2>
            <p className="how-sub how-sub-invert">Simple actions designed for real users at purchase time.</p>
          </div>

          <div className="how-list">
            <div className="how-list-item">Login leads to login page</div>
            <div className="how-list-item">Register leads to register page</div>
            <div className="how-list-item">Verify Product opens QR code scanner</div>
          </div>
        </div>
      </section>

      <section className="how-section how-alt">
        <div className="how-wrap">
          <div className="how-section-head">
            <h2 className="how-h2">Login Page</h2>
            <p className="how-sub">Role-based access for controlled product updates and approvals.</p>
          </div>

          <div className="how-cards-2">
            <div className="how-card">
              <div className="how-card-top">
                <div className="how-icon how-icon-blue" />
                <div className="how-card-title">Manufacturer or Seller</div>
              </div>
              <div className="how-card-desc">Login leads to their respective dashboards and actions.</div>
              <div className="how-card-pill">Role Based</div>
            </div>

            <div className="how-card">
              <div className="how-card-top">
                <div className="how-icon how-icon-purple" />
                <div className="how-card-title">Regulator (Admin)</div>
              </div>
              <div className="how-card-desc">Use default username and password set by admin.</div>
              <div className="how-card-pill how-pill-purple">Admin</div>
            </div>
          </div>
        </div>
      </section>

      <section className="how-section how-gradient-2">
        <div className="how-wrap">
          <div className="how-section-head invert">
            <h2 className="how-h2 how-h2-invert">Register Page</h2>
            <p className="how-sub how-sub-invert">
              Trusted onboarding, regulator approval, and a clean verification pipeline.
            </p>
          </div>

          <div className="how-grid-2">
            <div className="how-panel how-panel-glass">
              <div className="how-panel-title how-panel-title-invert">Submit Request</div>
              <div className="how-panel-desc how-panel-desc-invert">
                Registration details from manufacturer and seller go to the regulator for approval.
              </div>
            </div>

            <div className="how-panel how-panel-glass">
              <div className="how-panel-title how-panel-title-invert">Verification</div>
              <div className="how-panel-desc how-panel-desc-invert">
                Regulator validates documents and enables trusted participation in the network.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="how-section how-white">
        <div className="how-wrap">
          <div className="how-section-head">
            <h2 className="how-h2">Pages Overview</h2>
            <p className="how-sub">Everything you need, neatly separated by role and responsibility.</p>
          </div>

          <div className="how-cards-3">
            <div className="how-card">
              <div className="how-card-top">
                <div className="how-icon how-icon-blue" />
                <div className="how-card-title">Seller</div>
              </div>
              <div className="how-card-desc">
                Dashboard shows overview. Products lists manufacturer goods. Transfer updates ownership to consumer.
              </div>
              <div className="how-card-pill">Transfer</div>
            </div>

            <div className="how-card">
              <div className="how-card-top">
                <div className="how-icon how-icon-mix" />
                <div className="how-card-title">Manufacturer</div>
              </div>
              <div className="how-card-desc">
                Dashboard shows stats. Add Product generates QR for download. Transfer ownership to verified seller.
              </div>
              <div className="how-card-pill how-pill-blue">QR</div>
            </div>

            <div className="how-card">
              <div className="how-card-top">
                <div className="how-icon how-icon-purple" />
                <div className="how-card-title">Regulator</div>
              </div>
              <div className="how-card-desc">Dashboard shows stats. Requests allow accept or reject after verification.</div>
              <div className="how-card-pill how-pill-purple">Approve</div>
            </div>
          </div>
        </div>
      </section>

      <section className="how-footer">
        <div className="how-wrap how-foot-inner">
          <div className="how-foot-left">Fake Product Identification</div>
          <div className="how-foot-right">White • Blue • Purple</div>
        </div>
      </section>
    </div>
  );
}

export default About;
