import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./RegulatorDescription.css";

function RegulatorDescription() {
  const navigate = useNavigate();

  const steps = useMemo(
    () => [
      {
        title: "Login as regulator",
        text:
          "Login with a Regulator account. If your role is not regulator, the portal blocks actions like approving users or auditing products.",
        meta: ["Role check", "Session based access", "Secure actions"]
      },
      {
        title: "User approvals (manufacturers and sellers)",
        text:
          "Go to Users approval. Switch between Manufacturers and Sellers, filter by status, search by email or wallet, then review a user and approve or reject.",
        meta: ["Approve or reject", "Notes stored", "Status filters"]
      },
      {
        title: "Review user details before decision",
        text:
          "Select a user to view all key table fields like approval status, wallet address, and timestamps. Add notes to support your decision for audits.",
        meta: ["Audit ready", "Approval notes", "Traceability"]
      },
      {
        title: "Products approval and audit",
        text:
          "Go to Products approval to review registered products. For each product you can accept or reject based on state and supporting evidence.",
        meta: ["Product audit", "Accept or reject", "Regulatory review"]
      },
      {
        title: "Verify authenticity for a product",
        text:
          "Use Verify Authenticity to check that the current state hash matches database and blockchain evidence. This helps detect tampering or mismatched records.",
        meta: ["DB vs chain check", "Verdict output", "Fraud detection"]
      },
      {
        title: "Inspect product history timeline",
        text:
          "Open History to see a full sequence of events like register, transfer, and audit actions. Use it to understand who acted and what changed.",
        meta: ["Event timeline", "Actor tracking", "Investigation support"]
      },
      {
        title: "Document decisions with reasons",
        text:
          "When accepting or rejecting products, add an optional reason. This keeps your audit trail clear and improves accountability.",
        meta: ["Reason field", "Governance", "Compliance"]
      }
    ],
    []
  );

  const highlights = useMemo(
    () => [
      {
        title: "What you control",
        items: [
          "Approve or reject manufacturers",
          "Approve or reject sellers",
          "Audit products (accept or reject)",
          "Run authenticity verification on products",
          "Review full history and event trail",
          "Record notes and reasons for decisions"
        ]
      },
      {
        title: "What you can prove",
        items: [
          "Who was approved or rejected and when",
          "Product audit outcomes and reasons",
          "Verification verdict based on hash consistency",
          "Evidence fields from DB and blockchain",
          "Event trail for investigations and disputes"
        ]
      }
    ],
    []
  );

  return (
    <div className="rdd-shell">
      <Navbar />

      <div className="rdd-bg">
        <div className="rdd-glow g1" />
        <div className="rdd-glow g2" />
        <div className="rdd-noise" />
      </div>

      <header className="rdd-hero">
        <div className="rdd-hero-inner">
          <div className="rdd-badge">
            <span className="rdd-badge-ic" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2.7c5.1 0 9.3 4.2 9.3 9.3S17.1 21.3 12 21.3 2.7 17.1 2.7 12 6.9 2.7 12 2.7Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M9.1 12.3l2.1 2.1 4.8-4.8"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Regulator Flow
          </div>

          <h1 className="rdd-title">How the Regulator Portal Works</h1>
          <p className="rdd-subtitle">
            This is where you approve users (manufacturers and sellers), audit products (accept or reject), verify authenticity using hashes, and review full product history for investigations.
          </p>

          <div className="rdd-cta">
            <button className="rdd-btn" type="button" onClick={() => navigate("/regulator")}>
              Go to Regulator Portal
            </button>
            <button className="rdd-btn ghost" type="button" onClick={() => navigate("/auth")}>
              Login
            </button>
          </div>

          <div className="rdd-strip">
            <div className="rdd-strip-card">
              <div className="rdd-strip-k">Primary goal</div>
              <div className="rdd-strip-v">Govern access and keep the product chain trustworthy</div>
            </div>
            <div className="rdd-strip-card">
              <div className="rdd-strip-k">Your inputs</div>
              <div className="rdd-strip-v">Approval notes, audit reason, selected user or product</div>
            </div>
            <div className="rdd-strip-card">
              <div className="rdd-strip-k">Your outputs</div>
              <div className="rdd-strip-v">Approvals, audit status, verification verdict, history view</div>
            </div>
          </div>
        </div>
      </header>

      <main className="rdd-main">
        <section className="rdd-grid">
          <div className="rdd-col">
            <div className="rdd-card">
              <div className="rdd-card-head">
                <div>
                  <div className="rdd-card-title">End to end flow</div>
                  <div className="rdd-card-sub">Use this to approve users and audit products with evidence.</div>
                </div>
                <span className="rdd-chip">Step by step</span>
              </div>

              <div className="rdd-card-body">
                <div className="rdd-timeline">
                  {steps.map((s, i) => (
                    <div className="rdd-step" key={s.title}>
                      <div className="rdd-step-left" aria-hidden="true">
                        <div className="rdd-step-dot">{i + 1}</div>
                        {i !== steps.length - 1 ? <div className="rdd-step-line" /> : null}
                      </div>

                      <div className="rdd-step-right">
                        <div className="rdd-step-title">{s.title}</div>
                        <div className="rdd-step-text">{s.text}</div>

                        <div className="rdd-meta">
                          {s.meta.map((m) => (
                            <span className="rdd-pill" key={m}>
                              <span className="rdd-pill-dot" />
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rdd-note">
                  <div className="rdd-note-ic" aria-hidden="true">
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
                  <div className="rdd-note-t">
                    Strong approvals and clear audit reasons make the entire system safer. When in doubt, verify authenticity and review history before deciding.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rdd-col">
            <div className="rdd-card">
              <div className="rdd-card-head">
                <div>
                  <div className="rdd-card-title">Responsibilities</div>
                  <div className="rdd-card-sub">Your powers and the evidence you can rely on.</div>
                </div>
                <span className="rdd-chip soft">Overview</span>
              </div>

              <div className="rdd-card-body">
                <div className="rdd-two">
                  {highlights.map((h) => (
                    <div className="rdd-mini" key={h.title}>
                      <div className="rdd-mini-title">{h.title}</div>
                      <ul className="rdd-list">
                        {h.items.map((it) => (
                          <li key={it}>
                            <span className="rdd-check" aria-hidden="true">
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

                <div className="rdd-card-split">
                  <div className="rdd-evidence">
                    <div className="rdd-evidence-title">Evidence you can use</div>
                    <div className="rdd-evidence-grid">
                      <div className="rdd-evi">
                        <div className="rdd-evi-k">Approval trail</div>
                        <div className="rdd-evi-v">Status, notes, and timestamps for each user</div>
                      </div>
                      <div className="rdd-evi">
                        <div className="rdd-evi-k">Audit status</div>
                        <div className="rdd-evi-v">Accepted, rejected, or pending product reviews</div>
                      </div>
                      <div className="rdd-evi">
                        <div className="rdd-evi-k">Verification verdict</div>
                        <div className="rdd-evi-v">Hash match result between DB and blockchain</div>
                      </div>
                      <div className="rdd-evi">
                        <div className="rdd-evi-k">History events</div>
                        <div className="rdd-evi-v">Full event timeline with actor and notes</div>
                      </div>
                    </div>
                  </div>

                  <div className="rdd-quick">
                    <div className="rdd-quick-title">Quick navigation</div>
                    <div className="rdd-quick-actions">
                      <button className="rdd-btn ghost" type="button" onClick={() => navigate("/regulator")}>
                        Open portal
                      </button>
                      <button className="rdd-btn ghost" type="button" onClick={() => navigate("/scan")}>
                        Open scan page
                      </button>
                      <button className="rdd-btn ghost" type="button" onClick={() => navigate("/")}>
                        Home
                      </button>
                    </div>
                    <div className="rdd-quick-hint">
                      Use the portal for approvals and audits. Use the scan page or built in verify action to validate authenticity with hashes.
                    </div>
                  </div>
                </div>

                <div className="rdd-footerline">
                  <div className="rdd-footerline-left">
                    <div className="rdd-footerline-title">Tip</div>
                    <div className="rdd-footerline-sub">
                      Approve users carefully, audit products based on evidence, and verify authenticity before final decisions.
                    </div>
                  </div>
                  <div className="rdd-footerline-right" aria-hidden="true">
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

            <div className="rdd-mini-banner">
              <div className="rdd-mini-banner-title">Regulator view only</div>
              <div className="rdd-mini-banner-sub">
                This page explains regulator responsibilities for approvals and audits. Other roles have separate flows.
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="rdd-footer">
        <div>© {new Date().getFullYear()} Fake Product Identification</div>
        <div className="rdd-footer-chip">Regulator Flow</div>
      </footer>
    </div>
  );
}

export default RegulatorDescription;
