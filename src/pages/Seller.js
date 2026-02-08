import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  const [qrValue, setQrValue] = useState("");
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

  const showToast = useCallback((msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 2000);
  }, []);

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

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setAuthToken("");
    setAuthUser(null);
    navigate("/");
  };

  const goLogin = () => navigate("/auth");

  const guardSeller = useCallback(() => {
    if (!isAuthed) {
      goLogin();
      return false;
    }
    if (!isSeller) {
      setError("Please login as Seller to use this portal.");
      return false;
    }
    return true;
  }, [isAuthed, isSeller, navigate]);

  const parseExtra = useCallback(() => {
    const raw = normalize(extraJson);
    if (!raw) return {};
    try {
      const obj = JSON.parse(raw);
      return obj && typeof obj === "object" ? obj : {};
    } catch {
      return null;
    }
  }, [extraJson]);

  const walletStatus = useMemo(() => {
    const w = normalize(me?.wallet_address) || normalize(walletLinked?.wallet_address);
    return w ? w : "";
  }, [me, walletLinked]);

  const sessionText = useMemo(() => {
    if (meLoading) return "Loading...";
    if (!isAuthed) return "Not logged in";
    if (me?.email) return `${me.email} (${me.role || "user"})`;
    return "Token present, unable to fetch /me";
  }, [meLoading, isAuthed, me]);

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
      try {
        const meData = await apiFetch("/api/auth/me", { method: "GET" });
        setMe(meData?.user || null);
      } catch {}
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setWalletLinking(false);
    }
  };

  const buildCustomerLink = useCallback((pid, sh) => {
    const origin = window.location.origin;
    const p = encodeURIComponent(normalize(pid));
    const s = encodeURIComponent(normalize(sh));
    return `${origin}/customer?productId=${p}&stateHash=${s}`;
  }, []);

  useEffect(() => {
    const make = async () => {
      if (!transferRes?.qr_payload) {
        setQrPng("");
        setQrValue("");
        return;
      }
      try {
        const parsed = JSON.parse(transferRes.qr_payload);
        const pid = normalize(parsed?.productId);
        const sh = normalize(parsed?.stateHash);
        if (!pid || !sh) {
          setQrPng("");
          setQrValue("");
          return;
        }
        const link = buildCustomerLink(pid, sh);
        setQrValue(link);
        const png = await QRCode.toDataURL(link, { errorCorrectionLevel: "H", margin: 2, scale: 10 });
        setQrPng(png);
      } catch {
        setQrPng("");
        setQrValue("");
      }
    };
    make();
  }, [transferRes, buildCustomerLink]);

  const transferProduct = async () => {
    if (!guardSeller()) return;

    if (!normalize(walletStatus)) {
      return setError("Link your wallet first. Manufacturer/Admin will verify it.");
    }

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

      showToast("Transfer completed");
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

  const copyQrValue = async () => {
    const v = normalize(qrValue);
    if (!v) return;
    try {
      await navigator.clipboard.writeText(v);
      showToast("Copied");
    } catch {
      setError("Copy failed. Please copy manually.");
    }
  };

  const downloadQr = () => {
    if (!qrPng) return;
    const a = document.createElement("a");
    a.href = qrPng;
    a.download = `${normalize(productCode) || "product"}-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const clearTransfer = () => {
    setTransferRes(null);
    setQrPng("");
    setQrValue("");
  };

  const clearScan = () => {
    setScanRes(null);
    setError("");
  };

  const verdict = scanRes?.verdict || null;

  return (
    <div className="sp-shell">
      <Navbar />

      <header className="sp-header">
        <div className="sp-header-left">
          <div className="sp-title">Seller Portal</div>
          <div className="sp-subtitle">Link wallet, transfer ownership, generate QR link, verify authenticity</div>
        </div>
        <div className="sp-header-right">
          {!isAuthed ? (
            <button className="sp-btn sp-btn-secondary" type="button" onClick={goLogin}>
              Login
            </button>
          ) : (
            <button className="sp-btn sp-btn-secondary" type="button" onClick={logout}>
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="sp-main">
        <section className="sp-card">
          <div className="sp-card-head">
            <div className="sp-card-title">Session</div>
          </div>
          <div className="sp-kv">
            <div className="sp-kv-row">
              <div className="sp-k">User</div>
              <div className="sp-v">{sessionText}</div>
            </div>
            <div className="sp-kv-row">
              <div className="sp-k">Role</div>
              <div className="sp-v">{isAuthed ? (isSeller ? "seller" : normalize(me?.role || authUser?.role) || "-") : "-"}</div>
            </div>
            <div className="sp-kv-row">
              <div className="sp-k">Linked wallet</div>
              <div className="sp-v sp-mono">{normalize(walletStatus) || "-"}</div>
            </div>
          </div>
          {!isAuthed ? <div className="sp-note">Login is required to link wallet and transfer ownership.</div> : null}
          {isAuthed && !isSeller ? <div className="sp-alert">Please login with a seller account.</div> : null}
          {isAuthed && isSeller ? <div className="sp-note">Wallet verification is done by Manufacturer/Admin.</div> : null}
        </section>

        <section className="sp-card">
          <div className="sp-card-head">
            <div className="sp-card-title">1) Link wallet</div>
            <div className="sp-card-sub">Link the seller wallet address to your account</div>
          </div>

          <div className="sp-form">
            <div className="sp-field">
              <label className="sp-label">Wallet address</label>
              <input className="sp-input sp-mono" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x..." disabled={walletLinking || transferring} />
            </div>
            <div className="sp-actions">
              <button className="sp-btn" type="button" onClick={linkWallet} disabled={walletLinking || !isSeller}>
                {walletLinking ? "Linking..." : "Link wallet"}
              </button>
            </div>
          </div>

          {walletLinked?.wallet_address ? (
            <div className="sp-result">
              <div className="sp-result-title">Linked</div>
              <div className="sp-result-value sp-mono">{walletLinked.wallet_address}</div>
            </div>
          ) : null}
        </section>

        <section className="sp-card">
          <div className="sp-card-head">
            <div className="sp-card-title">2) Transfer / update product</div>
            <div className="sp-card-sub">Updates state and returns a QR link that Google Lens can open</div>
          </div>

          <div className="sp-form sp-form-2col">
            <div className="sp-field">
              <label className="sp-label">Product code</label>
              <input className="sp-input sp-mono" value={productCode} onChange={(e) => setProductCode(e.target.value)} placeholder="P1001" disabled={transferring} />
            </div>

            <div className="sp-field">
              <label className="sp-label">to_wallet</label>
              <input className="sp-input sp-mono" value={toWallet} onChange={(e) => setToWallet(e.target.value)} placeholder="0x..." disabled={transferring} />
            </div>

            <div className="sp-field">
              <label className="sp-label">Notes</label>
              <input className="sp-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Transferred/Updated" disabled={transferring} />
            </div>

            <div className="sp-field">
              <label className="sp-label">Extra JSON</label>
              <input className="sp-input sp-mono" value={extraJson} onChange={(e) => setExtraJson(e.target.value)} placeholder='{"stage":"seller_update"}' disabled={transferring} />
            </div>
          </div>

          <div className="sp-actions">
            <button className="sp-btn" type="button" onClick={transferProduct} disabled={transferring || !isSeller || !normalize(walletStatus)}>
              {transferring ? "Updating..." : "Transfer / Update"}
            </button>
            <button className="sp-btn sp-btn-secondary" type="button" onClick={clearTransfer} disabled={transferring}>
              Clear
            </button>
          </div>

          {transferRes ? (
            <div className="sp-result">
              <div className="sp-result-title">Transfer result</div>

              <div className="sp-kv sp-kv-tight">
                <div className="sp-kv-row">
                  <div className="sp-k">prev_state_hash</div>
                  <div className="sp-v sp-mono">{transferRes.prev_state_hash || "-"}</div>
                </div>
                <div className="sp-kv-row">
                  <div className="sp-k">new_state_hash</div>
                  <div className="sp-v sp-mono">{transferRes.new_state_hash || "-"}</div>
                </div>
                <div className="sp-kv-row">
                  <div className="sp-k">chain_transfer_tx_hash</div>
                  <div className="sp-v sp-mono">{transferRes.chain_transfer_tx_hash || "-"}</div>
                </div>
              </div>

              {qrValue ? (
                <div className="sp-qr">
                  <div className="sp-qr-head">
                    <div>
                      <div className="sp-qr-title">QR scan link</div>
                      <div className="sp-qr-sub">Google Lens will open this URL and verify</div>
                    </div>
                    <div className="sp-qr-actions">
                      <button className="sp-btn sp-btn-secondary" type="button" onClick={copyQrValue}>
                        Copy link
                      </button>
                      <button className="sp-btn sp-btn-secondary" type="button" onClick={downloadQr} disabled={!qrPng}>
                        Download QR
                      </button>
                      <a className="sp-btn sp-btn-secondary" href={qrValue} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </div>
                  </div>

                  <div className="sp-qr-grid">
                    <div className="sp-qr-payload sp-mono">{qrValue}</div>
                    <div className="sp-qr-imgwrap">{qrPng ? <img className="sp-qr-img" src={qrPng} alt="qr" /> : <div className="sp-placeholder">QR preview</div>}</div>
                  </div>

                  <button
                    className="sp-btn sp-btn-secondary sp-full"
                    type="button"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(transferRes.qr_payload);
                        setScanProductId(normalize(parsed?.productId));
                        setScanStateHash(normalize(parsed?.stateHash));
                        showToast("Scan inputs filled");
                      } catch {
                        setError("QR payload parse failed.");
                      }
                    }}
                  >
                    Fill scan inputs (internal test)
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="sp-card">
          <div className="sp-card-head">
            <div className="sp-card-title">3) Verify (public scan)</div>
            <div className="sp-card-sub">Checks DB state and blockchain hash match</div>
          </div>

          <div className="sp-form sp-form-2col">
            <div className="sp-field">
              <label className="sp-label">productId</label>
              <input className="sp-input sp-mono" value={scanProductId} onChange={(e) => setScanProductId(e.target.value)} placeholder="P1001" disabled={scanning} />
            </div>
            <div className="sp-field">
              <label className="sp-label">stateHash</label>
              <input className="sp-input sp-mono" value={scanStateHash} onChange={(e) => setScanStateHash(e.target.value)} placeholder="(from QR payload)" disabled={scanning} />
            </div>
          </div>

          <div className="sp-actions">
            <button className="sp-btn sp-btn-secondary" type="button" onClick={scanVerify} disabled={scanning}>
              {scanning ? "Verifying..." : "Verify scan"}
            </button>
            <button className="sp-btn sp-btn-secondary" type="button" onClick={clearScan} disabled={scanning}>
              Clear
            </button>
          </div>

          {verdict ? (
            <div className={`sp-verdict ${verdict.isAuthentic ? "ok" : "bad"}`}>
              <div className="sp-verdict-top">
                <div className="sp-verdict-badge">{verdict.isAuthentic ? "AUTHENTIC" : "NOT AUTHENTIC"}</div>
                <div className="sp-verdict-msg">{verdict.message || ""}</div>
              </div>

              <div className="sp-kv sp-kv-tight">
                <div className="sp-kv-row">
                  <div className="sp-k">isLatestDbState</div>
                  <div className="sp-v">{String(verdict.isLatestDbState)}</div>
                </div>
                <div className="sp-kv-row">
                  <div className="sp-k">dbCloudHashMatches</div>
                  <div className="sp-v">{String(verdict.dbCloudHashMatches)}</div>
                </div>
                <div className="sp-kv-row">
                  <div className="sp-k">chainCloudHashMatches</div>
                  <div className="sp-v">{String(verdict.chainCloudHashMatches)}</div>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {error ? <div className="sp-alert sp-alert-danger">{error}</div> : null}
      </main>

      <footer className="sp-footer">
        <div>© {new Date().getFullYear()} Fake Product Identification</div>
        <div>Seller</div>
      </footer>

      {toast ? <div className="sp-toast">{toast}</div> : null}
    </div>
  );
}

export default Seller;
