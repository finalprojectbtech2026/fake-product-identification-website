import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./ManufacturerDescription.css";

function ManufacturerDescription() {
  const navigate = useNavigate();

  const steps = useMemo(
    () => [
      {
        title: "Login and registry approval",
        text:
          "Login with your Manufacturer account. Your profile shows your registry status. If it is pending, you wait for regulator approval before using product operations.",
        meta: ["Session identity", "Registry status", "Approval gate"]
      },
      {
        title: "Verify seller wallet (access control)",
        text:
          "Before any sale or transfer, verify the seller wallet address. This keeps only approved sellers inside your supply chain flow.",
        meta: ["Seller wallet verification", "Restricts unauthorized sellers", "Supply chain trust"]
      },
      {
        title: "Upload certificate or warranty (optional)",
        text:
          "Upload large evidence files like certificates or warranty documents to storage. The system stores a reference (CID) and a SHA-256 hash for integrity checks later.",
        meta: ["Storage reference (CID)", "SHA-256 integrity", "Evidence ready for audits"]
      },
      {
        title: "Register product and bind NFC UID",
        text:
          "Create a product record using product code and name (plus batch, brand, notes). Bind the physical item using NFC UID so the physical tag maps to its digital identity.",
        meta: ["Product record", "NFC UID binding", "Stronger physical to digital link"]
      },
      {
        title: "Generate QR linked to product state",
        text:
          "After registration, you get a QR link that contains productId and the current state hash. This QR is used throughout the lifecycle for verification.",
        meta: ["QR for lifecycle checks", "State hash included", "Fast scanning"]
      },
      {
        title: "Verify authenticity and keep history",
        text:
          "Run verification to confirm the state hash matches across records. The product history timeline preserves events with actor, role, and chain transaction hash.",
        meta: ["Hash match verdict", "Chain transaction evidence", "Full lifecycle history"]
      }
    ],
    []
  );

  const highlights = useMemo(
    () => [
      {
        title: "What you control",
        items: [
          "Register products and generate QR for each item",
          "Bind NFC UID to make cloning harder",
          "Approve seller participation through wallet verification",
          "Attach certificates and warranty evidence via storage reference",
          "Monitor authenticity checks and lifecycle history"
        ]
      },
      {
        title: "What the system guarantees",
        items: [
          "Product identity stays consistent across the lifecycle",
          "Large files stay off chain, only hashes or references matter",
          "Verification uses hash matching to detect tampering",
          "History stays available for audit and investigations"
        ]
      }
    ],
    []
  );

  return (
    <div className="mfd-shell">
      <Navbar />

      <div className="mfd-bg">
        <div className="mfd-glow g1" />
        <div className="mfd-glow g2" />
        <div className="mfd-noise" />
      </div>

      <header className="mfd-hero">
        <div className="mfd-hero-inner">
          <div className="mfd-badge">
            <span className="mfd-badge-ic" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2.7c5.1 0 9.3 4.2 9.3 9.3S17.1 21.3 12 21.3 2.7 17.1 2.7 12 6.9 2.7 12 2.7Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M7.8 12.2l2.5 2.5 6-6.1"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Manufacturer Flow
          </div>

          <h1 className="mfd-title">How the Manufacturer Portal Works</h1>
          <p className="mfd-subtitle">
            This is your operational space to register products, attach evidence, verify seller wallets, generate QR,
            and keep a clean authenticity trail from creation to verification.
          </p>

          <div className="mfd-cta">
            <button className="mfd-btn" type="button" onClick={() => navigate("/manufacturer")}>
              Go to Manufacturer Portal
            </button>
            <button className="mfd-btn ghost" type="button" onClick={() => navigate("/auth")}>
              Login
            </button>
          </div>

          <div className="mfd-strip">
            <div className="mfd-strip-card">
              <div className="mfd-strip-k">Primary goal</div>
              <div className="mfd-strip-v">Prevent counterfeit by binding each product to a verifiable identity</div>
            </div>
            <div className="mfd-strip-card">
              <div className="mfd-strip-k">Your inputs</div>
              <div className="mfd-strip-v">Product code, NFC UID, certificate hash, QR link</div>
            </div>
            <div className="mfd-strip-card">
              <div className="mfd-strip-k">Your outputs</div>
              <div className="mfd-strip-v">QR image, authenticity verdict, full history events</div>
            </div>
          </div>
        </div>
      </header>

      <main className="mfd-main">
        <section className="mfd-grid">
          <div className="mfd-col">
            <div className="mfd-card">
              <div className="mfd-card-head">
                <div>
                  <div className="mfd-card-title">End to end flow</div>
                  <div className="mfd-card-sub">Follow these steps for every new product and seller in your network.</div>
                </div>
                <span className="mfd-chip">Step by step</span>
              </div>

              <div className="mfd-card-body">
                <div className="mfd-timeline">
                  {steps.map((s, i) => (
                    <div className="mfd-step" key={s.title}>
                      <div className="mfd-step-left" aria-hidden="true">
                        <div className="mfd-step-dot">{i + 1}</div>
                        {i !== steps.length - 1 ? <div className="mfd-step-line" /> : null}
                      </div>

                      <div className="mfd-step-right">
                        <div className="mfd-step-title">{s.title}</div>
                        <div className="mfd-step-text">{s.text}</div>

                        <div className="mfd-meta">
                          {s.meta.map((m) => (
                            <span className="mfd-pill" key={m}>
                              <span className="mfd-pill-dot" />
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mfd-note">
                  <div className="mfd-note-ic" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 3.2c4.9 0 8.8 4 8.8 8.8S16.9 20.8 12 20.8 3.2 16.9 3.2 12 7.1 3.2 12 3.2Z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                      <path d="M12 11v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      <path d="M12 8.4h.01" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="mfd-note-t">
                    Keep the NFC UID accurate. The portal expects the UID to match the physical tag, so the product stays
                    tightly linked to its real world identity.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mfd-col">
            <div className="mfd-card">
              <div className="mfd-card-head">
                <div>
                  <div className="mfd-card-title">Responsibilities</div>
                  <div className="mfd-card-sub">What you do inside the portal, and what to expect from the system.</div>
                </div>
                <span className="mfd-chip soft">Overview</span>
              </div>

              <div className="mfd-card-body">
                <div className="mfd-two">
                  {highlights.map((h) => (
                    <div className="mfd-mini" key={h.title}>
                      <div className="mfd-mini-title">{h.title}</div>
                      <ul className="mfd-list">
                        {h.items.map((it) => (
                          <li key={it}>
                            <span className="mfd-check" aria-hidden="true">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M20 6.8l-9.2 9.2L4 9.2"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mfd-card-split">
                  <div className="mfd-evidence">
                    <div className="mfd-evidence-title">Evidence you can present anytime</div>
                    <div className="mfd-evidence-grid">
                      <div className="mfd-evi">
                        <div className="mfd-evi-k">QR link</div>
                        <div className="mfd-evi-v">Points to scan page with productId and state hash</div>
                      </div>
                      <div className="mfd-evi">
                        <div className="mfd-evi-k">Certificate hash</div>
                        <div className="mfd-evi-v">SHA-256 of the uploaded file for integrity checks</div>
                      </div>
                      <div className="mfd-evi">
                        <div className="mfd-evi-k">Storage reference</div>
                        <div className="mfd-evi-v">CID or link to retrieve certificate or warranty</div>
                      </div>
                      <div className="mfd-evi">
                        <div className="mfd-evi-k">History events</div>
                        <div className="mfd-evi-v">Actor, role, timestamp, and chain tx hash for audits</div>
                      </div>
                    </div>
                  </div>

                  <div className="mfd-quick">
                    <div className="mfd-quick-title">Quick navigation</div>
                    <div className="mfd-quick-actions">
                      <button className="mfd-btn ghost" type="button" onClick={() => navigate("/manufacturer")}>
                        Open portal
                      </button>
                      <button className="mfd-btn ghost" type="button" onClick={() => navigate("/scan")}>
                        Open scan page
                      </button>
                      <button className="mfd-btn ghost" type="button" onClick={() => navigate("/")}>
                        Home
                      </button>
                    </div>
                    <div className="mfd-quick-hint">
                      Scan page is used for QR verification. Your portal creates the QR link and keeps the product history.
                    </div>
                  </div>
                </div>

                <div className="mfd-footerline">
                  <div className="mfd-footerline-left">
                    <div className="mfd-footerline-title">Tip</div>
                    <div className="mfd-footerline-sub">
                      Use seller wallet verification first, then register products, then distribute using verified parties only.
                    </div>
                  </div>
                  <div className="mfd-footerline-right" aria-hidden="true">
                    <svg width="54" height="54" viewBox="0 0 64 64" fill="none">
                      <path
                        d="M32 7c13.8 0 25 11.2 25 25S45.8 57 32 57 7 45.8 7 32 18.2 7 32 7Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        opacity="0.6"
                      />
                      <path
                        d="M22 32.5l6 6L42 24.5"
                        stroke="currentColor"
                        strokeWidth="2.1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="mfd-mini-banner">
              <div className="mfd-mini-banner-title">Manufacturer view only</div>
              <div className="mfd-mini-banner-sub">
                This page describes only manufacturer responsibilities and steps. Other roles have their own pages.
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mfd-footer">
        <div>© {new Date().getFullYear()} Fake Product Identification</div>
        <div className="mfd-footer-chip">Manufacturer Flow</div>
      </footer>
    </div>
  );
}

export default ManufacturerDescription;
