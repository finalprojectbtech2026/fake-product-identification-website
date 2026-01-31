import React, { useCallback, useEffect,  useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import Navbar from "./Navbar";
import "./Seller.css";

const API_BASE = "https://fake-product-identification-backend.vercel.app";

const normalize = (v) => String(v || "").trim();

function Seller() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);

  const [walletAddress, setWalletAddress] = useState("");
  const [walletLinking, setWalletLinking] = useState(false);
  const [walletLinked, setWalletLinked] = useState(null);

  const [verifyWallet, setVerifyWallet] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyRes, setVerifyRes] = useState(null);

  const [productCode, setProductCode] = useState("");
  const [toWallet, setToWallet] = useState("");
  const [notes, setNotes] = useState("Transferred/Updated");
  const [extraJson, setExtraJson] = useState('{"stage":"seller_update"}');

  const [transferring, setTransferring] = useState(false);
  const [transferRes, setTransferRes] = useState(null);

  const [scanProductId, setScanProductId] = useState("");
  const [scanStateHash, setScanStateHash] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanRes, setScanRes] = useState(null);

  const [qrPng, setQrPng] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [authToken, setAuthToken] = useState(() => localStorage.getItem("auth_token") || "");
  const [authUser, setAuthUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("auth_user") || "null");
    } catch {
      return null;
    }
  });

  const isAuthed = Boolean(authToken);
  const isSeller = (me?.role || authUser?.role || "").toLowerCase() === "seller";

  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 2200);
  };

  const apiFetch = useCallback(
    async (path, opts = {}) => {
      const headers = { ...(opts.headers || {}) };
      if (opts.auth !== false && authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const m = data?.message || `Request failed (${res.status})`;
        const e = data?.error ? `: ${data.error}` : "";
        throw new Error(m + e);
      }
      return data;
    },
    [authToken]
  );

  useEffect(() => {
    const run = async () => {
      setMeLoading(true);
      setError("");
      if (!isAuthed) {
        setMeLoading(false);
        setMe(null);
        return;
      }
      try {
        const data = await apiFetch("/api/auth/me", { method: "GET" });
        setMe(data?.user || null);
      } catch {
        setMe(null);
      } finally {
        setMeLoading(false);
      }
    };
    run();
  }, [isAuthed, apiFetch]);

  useEffect(() => {
    const make = async () => {
      const payload = transferRes?.qr_payload || "";
      if (!payload) {
        setQrPng("");
        return;
      }
      try {
        const png = await QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 2, scale: 8 });
        setQrPng(png);
      } catch {
        setQrPng("");
      }
    };
    make();
  }, [transferRes]);

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setAuthToken("");
    setAuthUser(null);
    navigate("/");
  };

  const guardSeller = () => {
    if (!isAuthed) {
      navigate("/auth");
      return false;
    }
    if (!isSeller) {
      setError("Please login as Seller to use this portal.");
      return false;
    }
    return true;
  };

  const linkWallet = async () => {
    if (!guardSeller()) return;
    const w = normalize(walletAddress);
    if (!w) return setError("Enter wallet address.");
    setError("");
    setWalletLinking(true);
    setWalletLinked(null);
    try {
      const data = await apiFetch("/api/sellers/link-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: w })
      });
      setWalletLinked(data);
      showToast("Wallet linked");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setWalletLinking(false);
    }
  };

  const adminVerifySellerWallet = async () => {
    if (!guardSeller()) return;
    const w = normalize(verifyWallet);
    if (!w) return setError("Enter wallet address to verify.");
    setError("");
    setVerifying(true);
    setVerifyRes(null);
    try {
      const data = await apiFetch("/api/sellers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: w })
      });
      setVerifyRes(data);
      showToast("Seller verified on-chain");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setVerifying(false);
    }
  };

  const parseExtra = () => {
    const raw = normalize(extraJson);
    if (!raw) return {};
    try {
      const obj = JSON.parse(raw);
      return obj && typeof obj === "object" ? obj : {};
    } catch {
      return null;
    }
  };

  const transferProduct = async () => {
    if (!guardSeller()) return;

    const pc = normalize(productCode);
    if (!pc) return setError("Enter product code.");
    const to = normalize(toWallet);
    if (!to) return setError("Enter valid to_wallet address.");

    const extraObj = parseExtra();
    if (extraObj === null) return setError("Extra JSON is invalid.");

    setError("");
    setTransferring(true);
    setTransferRes(null);
    setScanRes(null);

    try {
      const body = {
        to_wallet: to,
        notes: normalize(notes) || "Transferred/Updated",
        extra: extraObj
      };

      const data = await apiFetch(`/api/products/${encodeURIComponent(pc)}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      setTransferRes(data);

      try {
        const parsed = JSON.parse(data?.qr_payload || "{}");
        const pid = normalize(parsed?.productId);
        const sh = normalize(parsed?.stateHash);
        if (pid && sh) {
          setScanProductId(pid);
          setScanStateHash(sh);
        }
      } catch {}

      showToast("Transfer completed and QR updated");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setTransferring(false);
    }
  };

  const scanVerify = async () => {
    const pid = normalize(scanProductId);
    const sh = normalize(scanStateHash);
    if (!pid || !sh) return setError("Enter productId and stateHash to scan.");
    setError("");
    setScanning(true);
    setScanRes(null);
    try {
      const data = await apiFetch("/api/products/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        auth: false,
        body: JSON.stringify({ productId: pid, stateHash: sh })
      });
      setScanRes(data);
      showToast("Scan verified");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setScanning(false);
    }
  };

  const copyUpdatedQrPayload = async () => {
    const payload = transferRes?.qr_payload || "";
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
      showToast("Updated QR payload copied");
    } catch {
      setError("Copy failed. Please copy manually.");
    }
  };

  const downloadQr = () => {
    if (!qrPng) return;
    const a = document.createElement("a");
    a.href = qrPng;
    a.download = `${normalize(productCode) || "product"}-updated-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="s-shell">
      <Navbar />

      <div className="s-bg" />
      <div className="s-noise" />
      <div className="s-orb s-orb-1" />
      <div className="s-orb s-orb-2" />

      <header className="s-header">
        <div className="s-left">
          <div className="s-badge">S</div>
          <div className="s-headtext">
            <div className="s-title">Seller Portal</div>
            <div className="s-subtitle">Verify seller wallet, transfer ownership, regenerate dynamic QR</div>
          </div>
        </div>

        <div className="s-right">
          <button className="s-logout" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="s-main">
        <section className="s-hero">
          <div className="s-hero-top">
            <div className="s-chip">
              <span className="s-dot" />
              Ownership Transfer + QR Refresh
            </div>
            <div className="s-chip ghost">Scan verification (public)</div>
          </div>

          <h1 className="s-hero-title">Link wallet, verify, transfer, refresh QR</h1>
          <p className="s-hero-desc">Seller actions update product state and regenerate the QR payload. Anyone can verify the latest state using Scan API.</p>

          <div className="s-hero-cards">
            <div className="s-mini">
              <div className="s-mini-title">Wallet</div>
              <div className="s-mini-sub">Link and verify wallet</div>
            </div>
            <div className="s-mini">
              <div className="s-mini-title">Transfer</div>
              <div className="s-mini-sub">State changes on update</div>
            </div>
            <div className="s-mini">
              <div className="s-mini-title">Scan</div>
              <div className="s-mini-sub">Check DB + chain hashes</div>
            </div>
          </div>

          <div className="s-session">
            <div className="s-session-left">
              <div className="s-session-title">Session</div>
              <div className="s-session-sub">
                {meLoading ? "Loading..." : isAuthed ? (me ? `${me.email} (${me.role})` : "Token present, unable to fetch /me") : "Not logged in"}
              </div>
            </div>
            <div className="s-session-right">
              {!isAuthed ? (
                <button className="s-btn ghost" type="button" onClick={() => navigate("/auth")}>
                  Go to Login
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="s-body">
          <div className="s-leftcol">
            <div className="s-panel">
              <div className="s-panel-title">Step 1: Link wallet</div>
              <div className="s-panel-sub">Seller must link wallet before transfer</div>

              <input className="s-input" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x..." disabled={walletLinking || transferring} />

              <div className="s-actions">
                <button className="s-btn" type="button" onClick={linkWallet} disabled={walletLinking}>
                  {walletLinking ? "Linking..." : "Link wallet"}
                </button>
              </div>

              {walletLinked ? (
                <div className="s-result">
                  <div className="s-result-title">Linked wallet</div>
                  <div className="s-kvgrid">
                    <div className="s-kv">
                      <div className="s-k">wallet_address</div>
                      <div className="s-v mono">{walletLinked.wallet_address}</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="s-panel">
              <div className="s-panel-title">Step 2: Verify seller wallet</div>
              <div className="s-panel-sub">On-chain authorization (admin/manufacturer flow)</div>

              <input className="s-input" value={verifyWallet} onChange={(e) => setVerifyWallet(e.target.value)} placeholder="0x..." disabled={verifying || transferring} />

              <div className="s-actions">
                <button className="s-btn ghost" type="button" onClick={adminVerifySellerWallet} disabled={verifying}>
                  {verifying ? "Verifying..." : "Verify wallet"}
                </button>
              </div>

              {verifyRes ? (
                <div className="s-result">
                  <div className="s-result-title">Verification result</div>
                  <div className="s-kvgrid">
                    <div className="s-kv">
                      <div className="s-k">wallet_address</div>
                      <div className="s-v mono">{verifyRes.wallet_address}</div>
                    </div>
                    <div className="s-kv">
                      <div className="s-k">chain_tx_hash</div>
                      <div className="s-v mono">{verifyRes.chain_tx_hash}</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="s-panel">
              <div className="s-panel-title">Step 3: Transfer / update product</div>
              <div className="s-panel-sub">Calls /api/products/:productCode/transfer and regenerates QR payload</div>

              <div className="s-form">
                <div className="s-row2">
                  <div className="s-field">
                    <label className="s-label">Product code</label>
                    <input className="s-input" value={productCode} onChange={(e) => setProductCode(e.target.value)} placeholder="P1001" disabled={transferring} />
                  </div>
                  <div className="s-field">
                    <label className="s-label">to_wallet</label>
                    <input className="s-input" value={toWallet} onChange={(e) => setToWallet(e.target.value)} placeholder="0x..." disabled={transferring} />
                  </div>
                </div>

                <div className="s-row2">
                  <div className="s-field">
                    <label className="s-label">Notes</label>
                    <input className="s-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Transferred/Updated" disabled={transferring} />
                  </div>
                  <div className="s-field">
                    <label className="s-label">Extra JSON</label>
                    <input className="s-input" value={extraJson} onChange={(e) => setExtraJson(e.target.value)} placeholder='{"stage":"seller_update"}' disabled={transferring} />
                  </div>
                </div>

                <div className="s-actions">
                  <button className="s-btn" type="button" onClick={transferProduct} disabled={transferring || !isSeller}>
                    {transferring ? "Updating..." : "Accept and update (transfer)"}
                  </button>
                  <button
                    className="s-btn ghost"
                    type="button"
                    onClick={() => {
                      setTransferRes(null);
                      setQrPng("");
                    }}
                    disabled={transferring}
                  >
                    Clear result
                  </button>
                </div>
              </div>

              {transferRes ? (
                <div className="s-result">
                  <div className="s-result-title">Transfer result</div>
                  <div className="s-kvgrid">
                    <div className="s-kv">
                      <div className="s-k">prev_state_hash</div>
                      <div className="s-v mono">{transferRes.prev_state_hash}</div>
                    </div>
                    <div className="s-kv">
                      <div className="s-k">new_state_hash</div>
                      <div className="s-v mono">{transferRes.new_state_hash}</div>
                    </div>
                    <div className="s-kv">
                      <div className="s-k">to_wallet</div>
                      <div className="s-v mono">{transferRes.to_wallet}</div>
                    </div>
                    <div className="s-kv">
                      <div className="s-k">chain_transfer_tx_hash</div>
                      <div className="s-v mono">{transferRes.chain_transfer_tx_hash}</div>
                    </div>
                  </div>

                  {transferRes?.qr_payload ? (
                    <div className="s-qrbox">
                      <div className="s-qrhead">
                        <div className="s-subhead">Updated QR payload</div>
                        <div className="s-qrbtns">
                          <button className="s-btn small" type="button" onClick={copyUpdatedQrPayload}>
                            Copy
                          </button>
                          <button className="s-btn small ghost" type="button" onClick={downloadQr} disabled={!qrPng}>
                            Download
                          </button>
                        </div>
                      </div>

                      <div className="s-qrgrid">
                        <div className="s-qrl">
                          <div className="s-payload mono">{transferRes.qr_payload}</div>
                          <div className="s-hint">Use Quick Fill on the right, or scan and verify below.</div>
                        </div>
                        <div className="s-qrr">{qrPng ? <img className="s-qrimg" src={qrPng} alt="updated qr" /> : <div className="s-qrplaceholder">QR preview</div>}</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="s-panel">
              <div className="s-panel-title">Step 4: Scan verify</div>
              <div className="s-panel-sub">Public verification using /api/products/scan</div>

              <div className="s-form">
                <div className="s-row2">
                  <div className="s-field">
                    <label className="s-label">productId</label>
                    <input className="s-input" value={scanProductId} onChange={(e) => setScanProductId(e.target.value)} placeholder="productId" disabled={scanning} />
                  </div>
                  <div className="s-field">
                    <label className="s-label">stateHash</label>
                    <input className="s-input" value={scanStateHash} onChange={(e) => setScanStateHash(e.target.value)} placeholder="stateHash" disabled={scanning} />
                  </div>
                </div>

                <div className="s-actions">
                  <button className="s-btn ghost" type="button" onClick={scanVerify} disabled={scanning}>
                    {scanning ? "Scanning..." : "Verify scan"}
                  </button>
                  <button
                    className="s-btn ghost"
                    type="button"
                    onClick={() => {
                      setScanRes(null);
                      setError("");
                    }}
                    disabled={scanning}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {scanRes ? (
                <div className="s-verify">
                  <div className="s-verify-head">
                    <div className="s-subhead">Verification result</div>
                    <div className={`s-badge2 ${scanRes?.verdict?.isAuthentic ? "ok" : "bad"}`}>{scanRes?.verdict?.isAuthentic ? "AUTHENTIC" : "NOT AUTHENTIC"}</div>
                  </div>

                  <div className="s-kvgrid">
                    <div className="s-kv">
                      <div className="s-k">isLatestDbState</div>
                      <div className="s-v">{String(scanRes?.verdict?.isLatestDbState)}</div>
                    </div>
                    <div className="s-kv">
                      <div className="s-k">dbCloudHashMatches</div>
                      <div className="s-v">{String(scanRes?.verdict?.dbCloudHashMatches)}</div>
                    </div>
                    <div className="s-kv">
                      <div className="s-k">chainCloudHashMatches</div>
                      <div className="s-v">{String(scanRes?.verdict?.chainCloudHashMatches)}</div>
                    </div>
                    <div className="s-kv">
                      <div className="s-k">message</div>
                      <div className="s-v">{scanRes?.verdict?.message}</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {error ? <div className="s-error">{error}</div> : null}
          </div>

          <aside className="s-rightcol">
            <div className="s-spec">
              <div className="s-spec-title">Seller flow accuracy</div>

              <div className="s-spec-block">
                <div className="s-spec-head">Checklist</div>
                <div className="s-spec-row">Seller links wallet (DB)</div>
                <div className="s-spec-row">Wallet gets verified on-chain</div>
                <div className="s-spec-row">Only seller can transfer ownership</div>
                <div className="s-spec-row">QR updates with new state hash</div>
                <div className="s-spec-row">Scan checks latest DB state + chain hashes</div>
              </div>

              <div className="s-spec-block">
                <div className="s-spec-head">Quick fill</div>
                <div className="s-spec-row">Use updated QR payload to fill scan inputs</div>
                <button
                  className="s-btn full ghost"
                  type="button"
                  onClick={() => {
                    if (!transferRes?.qr_payload) return;
                    try {
                      const parsed = JSON.parse(transferRes.qr_payload);
                      setScanProductId(normalize(parsed?.productId));
                      setScanStateHash(normalize(parsed?.stateHash));
                      showToast("Filled scan inputs");
                    } catch {
                      setError("QR payload parse failed.");
                    }
                  }}
                  disabled={!transferRes?.qr_payload}
                >
                  Fill scan inputs from updated QR
                </button>
              </div>
            </div>

            <div className="s-proof">
              <div className="s-proof-title">Tip</div>
              <div className="s-proof-sub">After transfer, download the new QR and attach it to the product packaging.</div>

              <button className="s-btn full ghost" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                Scroll to top
              </button>
            </div>
          </aside>
        </section>
      </main>

      <footer className="s-footer">
        <div>© {new Date().getFullYear()} Fake Product Identification</div>
        <div className="s-footer-right">
          <span className="s-footer-dot" />
          Seller view
        </div>
      </footer>

      {toast ? <div className="s-toast">{toast}</div> : null}
    </div>
  );
}

export default Seller;