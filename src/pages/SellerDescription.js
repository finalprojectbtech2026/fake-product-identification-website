import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./SellerDescription.css";

function SellerDescription() {
  const navigate = useNavigate();

  const steps = useMemo(
    () => [
      {
        title: "Login and approval gate",
        text:
          "Login with your Seller account. Your portal access depends on your approval status. If your account is pending or rejected, you cannot perform transfers or updates.",
        meta: ["Seller role required", "Approval required", "Access control"]
      },
      {
        title: "Link your wallet (required)",
        text:
          "Link your wallet address first. Transfers and updates are blocked until the wallet is connected to your seller account.",
        meta: ["Wallet linking", "Identity binding", "Required for transfers"]
      },
      {
        title: "View your products and pick one",
        text:
          "Your product list helps you choose a product code quickly. Selecting a product auto-fills the product code and loads its history so you understand its current state before acting.",
        meta: ["Product list", "Quick selection", "History loaded"]
      },
      {
        title: "Transfer or update product state",
        text:
          "Use product code and a destination wallet to perform a transfer or state update. Add notes and optional extra JSON to record the stage or context of your action.",
        meta: ["to_wallet destination", "Notes for traceability", "Extra JSON stage data"]
      },
      {
        title: "Generate a fresh QR scan link",
        text:
          "After a successful transfer or update, the system returns a QR payload that maps to a scan link. You can copy, open, or download the QR to share verification access.",
        meta: ["QR scan link", "Downloadable QR", "Shareable verification"]
      },
      {
        title: "Verify authenticity (public scan)",
        text:
          "Run verification using productId and stateHash. The verdict confirms whether the latest state matches the database and blockchain evidence.",
        meta: ["Hash match verdict", "DB vs chain validation", "Authenticity check"]
      },
      {
        title: "Maintain audit-ready history",
        text:
          "Every action creates history events. Use history to track who acted, what changed, and which hashes were produced for proof and audits.",
        meta: ["Event timeline", "Traceability", "Audit readiness"]
      }
    ],
    []
  );

  const highlights = useMemo(
    () => [
      {
        title: "What you do as a seller",
        items: [
          "Link your wallet to your seller identity",
          "Transfer products to the next wallet in the chain",
          "Record context using notes and extra JSON stage data",
          "Generate and share QR scan links after each update",
          "Verify authenticity when receiving or handing over products",
          "Review product history before and after transfers"
        ]
      },
      {
        title: "What the system proves",
        items: [
          "Transfers produce a new state hash tied to your action",
          "Verification checks hash consistency across records",
          "Evidence shows chain transaction hash when available",
          "History keeps an ordered trail of changes for audits"
        ]
      }
    ],
    []
  );

  return (
    <div className="sdd-shell">
      <Navbar />

      <div className="sdd-bg">
        <div className="sdd-glow g1" />
        <div className="sdd-glow g2" />
        <div className="sdd-noise" />
      </div>

      <header className="sdd-hero">
        <div className="sdd-hero-inner">
          <div className="sdd-badge">
            <span className="sdd-badge-ic" aria-hidden="true">
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
            Seller Flow
          </div>

          <h1 className="sdd-title">How the Seller Portal Works</h1>
          <p className="sdd-subtitle">
            This is where you link your wallet, transfer products to the next party, generate new QR scan links, and verify authenticity using hash matching and history evidence.
          </p>

          <div className="sdd-cta">
            <button className="sdd-btn" type="button" onClick={() => navigate("/seller")}>
              Go to Seller Portal
            </button>
            <button className="sdd-btn ghost" type="button" onClick={() => navigate("/auth")}>
              Login
            </button>
          </div>

          <div className="sdd-strip">
            <div className="sdd-strip-card">
              <div className="sdd-strip-k">Primary goal</div>
              <div className="sdd-strip-v">Move products securely while keeping authenticity checks easy</div>
            </div>
            <div className="sdd-strip-card">
              <div className="sdd-strip-k">Your inputs</div>
              <div className="sdd-strip-v">Wallet, product code, destination wallet, notes, stage JSON</div>
            </div>
            <div className="sdd-strip-card">
              <div className="sdd-strip-k">Your outputs</div>
              <div className="sdd-strip-v">New state hash, QR scan link, verification verdict, history trail</div>
            </div>
          </div>
        </div>
      </header>

      <main className="sdd-main">
        <section className="sdd-grid">
          <div className="sdd-col">
            <div className="sdd-card">
              <div className="sdd-card-head">
                <div>
                  <div className="sdd-card-title">End to end flow</div>
                  <div className="sdd-card-sub">Use this flow for every transfer, handover, or seller stage update.</div>
                </div>
                <span className="sdd-chip">Step by step</span>
              </div>

              <div className="sdd-card-body">
                <div className="sdd-timeline">
                  {steps.map((s, i) => (
                    <div className="sdd-step" key={s.title}>
                      <div className="sdd-step-left" aria-hidden="true">
                        <div className="sdd-step-dot">{i + 1}</div>
                        {i !== steps.length - 1 ? <div className="sdd-step-line" /> : null}
                      </div>

                      <div className="sdd-step-right">
                        <div className="sdd-step-title">{s.title}</div>
                        <div className="sdd-step-text">{s.text}</div>

                        <div className="sdd-meta">
                          {s.meta.map((m) => (
                            <span className="sdd-pill" key={m}>
                              <span className="sdd-pill-dot" />
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sdd-note">
                  <div className="sdd-note-ic" aria-hidden="true">
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
                  <div className="sdd-note-t">
                    Always verify after receiving and after handing over. A quick scan confirms the state hash still matches and helps catch tampering early.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sdd-col">
            <div className="sdd-card">
              <div className="sdd-card-head">
                <div>
                  <div className="sdd-card-title">Responsibilities</div>
                  <div className="sdd-card-sub">Your actions and the proof you can show at any time.</div>
                </div>
                <span className="sdd-chip soft">Overview</span>
              </div>

              <div className="sdd-card-body">
                <div className="sdd-two">
                  {highlights.map((h) => (
                    <div className="sdd-mini" key={h.title}>
                      <div className="sdd-mini-title">{h.title}</div>
                      <ul className="sdd-list">
                        {h.items.map((it) => (
                          <li key={it}>
                            <span className="sdd-check" aria-hidden="true">
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

                <div className="sdd-card-split">
                  <div className="sdd-evidence">
                    <div className="sdd-evidence-title">Evidence you can present anytime</div>
                    <div className="sdd-evidence-grid">
                      <div className="sdd-evi">
                        <div className="sdd-evi-k">QR scan link</div>
                        <div className="sdd-evi-v">Opens scan page for productId and state hash verification</div>
                      </div>
                      <div className="sdd-evi">
                        <div className="sdd-evi-k">State hashes</div>
                        <div className="sdd-evi-v">Previous and new state hashes generated during transfer</div>
                      </div>
                      <div className="sdd-evi">
                        <div className="sdd-evi-k">Transfer tx hash</div>
                        <div className="sdd-evi-v">Blockchain transaction reference when available</div>
                      </div>
                      <div className="sdd-evi">
                        <div className="sdd-evi-k">History events</div>
                        <div className="sdd-evi-v">Ordered timeline of actions for audits and disputes</div>
                      </div>
                    </div>
                  </div>

                  <div className="sdd-quick">
                    <div className="sdd-quick-title">Quick navigation</div>
                    <div className="sdd-quick-actions">
                      <button className="sdd-btn ghost" type="button" onClick={() => navigate("/seller")}>
                        Open portal
                      </button>
                      <button className="sdd-btn ghost" type="button" onClick={() => navigate("/scan")}>
                        Open scan page
                      </button>
                      <button className="sdd-btn ghost" type="button" onClick={() => navigate("/")}>
                        Home
                      </button>
                    </div>
                    <div className="sdd-quick-hint">
                      Your portal creates QR scan links after transfers. The scan page is used to verify authenticity using hash matching.
                    </div>
                  </div>
                </div>

                <div className="sdd-footerline">
                  <div className="sdd-footerline-left">
                    <div className="sdd-footerline-title">Tip</div>
                    <div className="sdd-footerline-sub">
                      Select the product first to load history, then transfer to the next wallet, then share the new QR link for verification.
                    </div>
                  </div>
                  <div className="sdd-footerline-right" aria-hidden="true">
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

            <div className="sdd-mini-banner">
              <div className="sdd-mini-banner-title">Seller view only</div>
              <div className="sdd-mini-banner-sub">
                This page describes only seller responsibilities and steps. Other roles have their own pages.
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="sdd-footer">
        <div>© {new Date().getFullYear()} Fake Product Identification</div>
        <div className="sdd-footer-chip">Seller Flow</div>
      </footer>
    </div>
  );
}

export default SellerDescription;
