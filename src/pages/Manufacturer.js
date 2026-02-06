import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import Navbar from "./Navbar";
import "./Manufacturer.css";

const API_BASE = "https://fake-product-identification-backend.vercel.app";
const WEB_BASE = "https://fake-product-identification-website.vercel.app";

const normalize = (v) => String(v || "").trim();

function Manufacturer() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);

  const [productCode, setProductCode] = useState("");
  const [name, setName] = useState("");
  const [batch, setBatch] = useState("");
  const [brand, setBrand] = useState("");
  const [nfcUid, setNfcUid] = useState("");
  const [notes, setNotes] = useState("");

  const [certFile, setCertFile] = useState(null);
  const [certUploading, setCertUploading] = useState(false);
  const [certUploadRes, setCertUploadRes] = useState(null);

  const [registering, setRegistering] = useState(false);
  const [registerRes, setRegisterRes] = useState(null);

  const [qrPng, setQrPng] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanRes, setScanRes] = useState(null);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRes, setHistoryRes] = useState(null);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [authToken, setAuthToken] = useState(() => localStorage.getItem("auth_token") || "");
  const [authUser, setAuthUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("auth_user") || "null");
    } catch {
      return null;
    }
  });

  const fileInputRef = useRef(null);

  const isAuthed = Boolean(authToken);
  const isManufacturer = (me?.role || authUser?.role || "").toLowerCase() === "manufacturer";

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

  const buildQrUrl = (productId, stateHash) => {
    const u = new URL(`${WEB_BASE}/scan`);
    u.searchParams.set("productId", String(productId || ""));
    u.searchParams.set("stateHash", String(stateHash || ""));
    return u.toString();
  };

  useEffect(() => {
    const make = async () => {
      const payload = registerRes?.qr?.qr_payload || "";
      if (!payload) {
        setQrPng("");
        return;
      }
      try {
        const parsed = JSON.parse(payload);
        const url = buildQrUrl(parsed?.productId, parsed?.stateHash);
        const png = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 2, scale: 8 });
        setQrPng(png);
      } catch {
        setQrPng("");
      }
    };
    make();
  }, [registerRes]);

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setAuthToken("");
    setAuthUser(null);
    navigate("/");
  };

  const guardManufacturer = () => {
    if (!isAuthed) {
      navigate("/auth");
      return false;
    }
    if (!isManufacturer) {
      setError("Please login as Manufacturer to use this portal.");
      return false;
    }
    return true;
  };

  const safeJson = (v) => {
    try {
      return JSON.stringify(v);
    } catch {
      return "";
    }
  };

  const canUpload = Boolean(certFile) && !certUploading;

  const canRegister =
    !registering &&
    Boolean(normalize(productCode)) &&
    Boolean(normalize(name)) &&
    (!certFile || Boolean(certUploadRes?.ipfs_cid && certUploadRes?.file_sha256));

  const resetAll = () => {
    setProductCode("");
    setName("");
    setBatch("");
    setBrand("");
    setNfcUid("");
    setNotes("");
    setCertFile(null);
    setCertUploadRes(null);
    setRegisterRes(null);
    setQrPng("");
    setScanRes(null);
    setHistoryRes(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadCertificateToIpfs = async () => {
    if (!guardManufacturer()) return;
    if (!certFile) return setError("Choose a file first.");
    setError("");
    setCertUploading(true);
    setCertUploadRes(null);

    try {
      const form = new FormData();
      form.append("file", certFile);

      const res = await fetch(`${API_BASE}/api/storage/ipfs/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: form
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const m = data?.message || `Upload failed (${res.status})`;
        const e = data?.error ? `: ${data.error}` : "";
        throw new Error(m + e);
      }

      setCertUploadRes(data);
      showToast("Certificate uploaded");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setCertUploading(false);
    }
  };

  const registerProduct = async () => {
    if (!guardManufacturer()) return;
    setError("");
    setRegistering(true);
    setRegisterRes(null);
    setScanRes(null);
    setHistoryRes(null);

    try {
      const pc = normalize(productCode);
      const nm = normalize(name);
      const bt = normalize(batch) || null;

      const meta = {};
      const b = normalize(brand);
      const n = normalize(notes);

      if (b) meta.brand = b;
      if (certUploadRes?.file_sha256) meta.certificate_sha256 = certUploadRes.file_sha256;
      if (n) meta.notes = n;

      const body = {
        product_code: pc,
        name: nm,
        batch: bt,
        ipfs_cid: certUploadRes?.ipfs_cid || null,
        meta_json: meta,
        nfc_uid: normalize(nfcUid) || ""
      };

      const data = await apiFetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: safeJson(body)
      });

      const pid = data?.qr?.productId || pc;
      const sh = data?.product?.current_state_hash || "";
      const qrPayload = safeJson({ productId: pid, stateHash: sh });

      const next = {
        ...data,
        qr: {
          ...(data.qr || {}),
          qr_payload: qrPayload,
          qr_url: buildQrUrl(pid, sh)
        }
      };

      setRegisterRes(next);
      showToast("Product registered");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setRegistering(false);
    }
  };

  const copyQrPayload = async () => {
    const payload = registerRes?.qr?.qr_url || registerRes?.qr?.qr_payload || "";
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(payload);
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

  const verifyByScan = async () => {
    const payload = registerRes?.qr?.qr_payload || "";
    if (!payload) return;
    setScanLoading(true);
    setScanRes(null);
    setError("");

    try {
      const parsed = JSON.parse(payload);
      const data = await apiFetch("/api/products/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        auth: false,
        body: safeJson({ productId: parsed.productId, stateHash: parsed.stateHash })
      });
      setScanRes(data);
      showToast("Verified");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setScanLoading(false);
    }
  };

  const openQrLink = () => {
    const url = registerRes?.qr?.qr_url || "";
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const loadHistory = async () => {
    const pc = normalize(productCode);
    if (!pc) return setError("Enter product code to load history.");
    setHistoryLoading(true);
    setHistoryRes(null);
    setError("");

    try {
      const data = await apiFetch(`/api/products/${encodeURIComponent(pc)}/history`, { method: "GET", auth: false });
      setHistoryRes(data);
      showToast("History loaded");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setHistoryLoading(false);
    }
  };

  const renderKeyValue = (k, v) => (
    <div className="m-kv" key={k}>
      <div className="m-k">{k}</div>
      <div className="m-v">{String(v ?? "")}</div>
    </div>
  );

  const events = Array.isArray(historyRes?.events) ? historyRes.events : [];

  return (
    <div className="m-shell">
      <Navbar />

      <div className="m-bg" />
      <div className="m-orb m-orb-1" />
      <div className="m-orb m-orb-2" />

      <header className="m-header">
        <div className="m-left">
          <div className="m-badge">M</div>
          <div className="m-headtext">
            <div className="m-title">Manufacturer</div>
            <div className="m-subtitle">
              {meLoading ? "Loading..." : isAuthed ? (me ? `${me.email} (${me.role})` : "Logged in") : "Not logged in"}
            </div>
          </div>
        </div>

        <div className="m-right">
          {!isAuthed ? (
            <button className="m-btn ghost" type="button" onClick={() => navigate("/auth")}>
              Login
            </button>
          ) : (
            <button className="m-logout" type="button" onClick={logout}>
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="m-main">
        <section className="m-topcard">
          <div className="m-topcard-left">
            <div className="m-top-title">Register products and generate QR</div>
            <div className="m-top-sub">Upload certificate to IPFS, then register. Use QR link to verify.</div>
          </div>
          <div className="m-topcard-right">
            <div className="m-pill">White UI</div>
            <div className="m-pill ghost">Simple view</div>
          </div>
        </section>

        <section className="m-body single">
          <div className="m-leftcol">
            <div className="m-panel">
              <div className="m-panel-title">Upload certificate</div>

              <div className="m-form">
                <div className="m-field">
                  <label className="m-label">Certificate / Warranty file</label>
                  <input
                    ref={fileInputRef}
                    className="m-input"
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setCertFile(f);
                      setCertUploadRes(null);
                    }}
                    disabled={certUploading || registering}
                  />
                  <div className="m-hint">We store CID + SHA-256 and link it during registration.</div>
                </div>

                <div className="m-actions">
                  <button className="m-btn" type="button" onClick={uploadCertificateToIpfs} disabled={!canUpload}>
                    {certUploading ? "Uploading..." : "Upload"}
                  </button>
                  <button
                    className="m-btn ghost"
                    type="button"
                    onClick={() => {
                      setCertFile(null);
                      setCertUploadRes(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={certUploading || registering}
                  >
                    Clear
                  </button>
                </div>

                {certUploadRes ? (
                  <div className="m-result">
                    <div className="m-result-title">Upload result</div>
                    <div className="m-kvgrid">
                      {renderKeyValue("ipfs_cid", certUploadRes.ipfs_cid)}
                      {renderKeyValue("ipfs_url", certUploadRes.ipfs_url)}
                      {renderKeyValue("file_sha256", certUploadRes.file_sha256)}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="m-panel">
              <div className="m-panel-title">Register product</div>

              <div className="m-form">
                <div className="m-row2">
                  <div className="m-field">
                    <label className="m-label">Product code</label>
                    <input className="m-input" value={productCode} onChange={(e) => setProductCode(e.target.value)} placeholder="P2001" disabled={registering} />
                  </div>
                  <div className="m-field">
                    <label className="m-label">Batch</label>
                    <input className="m-input" value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="B2" disabled={registering} />
                  </div>
                </div>

                <div className="m-row2">
                  <div className="m-field">
                    <label className="m-label">Product name</label>
                    <input className="m-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Demo With Certificate" disabled={registering} />
                  </div>
                  <div className="m-field">
                    <label className="m-label">Brand</label>
                    <input className="m-input" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Demo" disabled={registering} />
                  </div>
                </div>

                <div className="m-row2">
                  <div className="m-field">
                    <label className="m-label">NFC UID</label>
                    <input className="m-input" value={nfcUid} onChange={(e) => setNfcUid(e.target.value)} placeholder="NFC999" disabled={registering} />
                    <div className="m-hint">UID must match the hardware tag.</div>
                  </div>
                  <div className="m-field">
                    <label className="m-label">Notes</label>
                    <input className="m-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional note" disabled={registering} />
                  </div>
                </div>

                <div className="m-meta">
                  <div className="m-meta-title">Linked certificate</div>
                  <div className="m-kvgrid">
                    {renderKeyValue("ipfs_cid", certUploadRes?.ipfs_cid || "null")}
                    {renderKeyValue("certificate_sha256", certUploadRes?.file_sha256 || "null")}
                  </div>
                </div>

                <div className="m-actions">
                  <button className="m-btn" type="button" onClick={registerProduct} disabled={!canRegister || !isManufacturer}>
                    {registering ? "Registering..." : "Register"}
                  </button>
                  <button className="m-btn ghost" type="button" onClick={loadHistory} disabled={historyLoading}>
                    {historyLoading ? "Loading..." : "History"}
                  </button>
                  <button className="m-btn ghost" type="button" onClick={resetAll} disabled={registering || certUploading}>
                    Reset
                  </button>
                </div>

                {registerRes ? (
                  <div className="m-result">
                    <div className="m-result-title">Result</div>

                    <div className="m-result-split">
                      <div className="m-result-col">
                        <div className="m-subhead">Database</div>
                        <div className="m-kvgrid">
                          {renderKeyValue("product_code", registerRes.product?.product_code)}
                          {renderKeyValue("current_state_hash", registerRes.product?.current_state_hash)}
                          {renderKeyValue("ipfs_cid", registerRes.product?.ipfs_cid)}
                          {renderKeyValue("created_at", registerRes.product?.created_at)}
                        </div>
                      </div>

                      <div className="m-result-col">
                        <div className="m-subhead">Blockchain</div>
                        <div className="m-kvgrid">
                          {renderKeyValue("register_tx_hash", registerRes.chain?.register_tx_hash)}
                          {renderKeyValue("contract_address", registerRes.chain?.contract_address)}
                        </div>
                      </div>
                    </div>

                    <div className="m-qrbox">
                      <div className="m-qrhead">
                        <div className="m-subhead">QR</div>
                        <div className="m-qrbtns">
                          <button className="m-btn small" type="button" onClick={copyQrPayload}>
                            Copy link
                          </button>
                          <button className="m-btn small ghost" type="button" onClick={downloadQr} disabled={!qrPng}>
                            Download
                          </button>
                          <button className="m-btn small ghost" type="button" onClick={openQrLink} disabled={!registerRes?.qr?.qr_url}>
                            Open
                          </button>
                          <button className="m-btn small ghost" type="button" onClick={verifyByScan} disabled={scanLoading}>
                            {scanLoading ? "Verifying..." : "Verify"}
                          </button>
                        </div>
                      </div>

                      <div className="m-qrgrid">
                        <div className="m-qrl">
                          <div className="m-payload">{registerRes.qr?.qr_url || ""}</div>
                          <div className="m-hint">Scan opens the link. Scan page calls /api/products/scan.</div>
                          <div className="m-payload">{registerRes.qr?.qr_payload || ""}</div>
                        </div>
                        <div className="m-qrr">{qrPng ? <img className="m-qrimg" src={qrPng} alt="qr" /> : <div className="m-qrplaceholder">QR preview</div>}</div>
                      </div>
                    </div>

                    {scanRes ? (
                      <div className="m-verify">
                        <div className="m-verify-head">
                          <div className="m-subhead">Verification</div>
                          <div className={`m-badge2 ${scanRes?.verdict?.isAuthentic ? "ok" : "bad"}`}>
                            {scanRes?.verdict?.isAuthentic ? "AUTHENTIC" : "NOT AUTHENTIC"}
                          </div>
                        </div>
                        <div className="m-kvgrid">
                          {renderKeyValue("isAuthentic", scanRes?.verdict?.isAuthentic)}
                          {renderKeyValue("message", scanRes?.verdict?.message)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {historyRes ? (
              <div className="m-panel">
                <div className="m-panel-title">Product history</div>

                <div className="m-history">
                  <div className="m-history-top">
                    <div className="m-subhead">Summary</div>
                    <div className="m-kvgrid">
                      {renderKeyValue("product_code", historyRes.product?.product_code)}
                      {renderKeyValue("current_state_hash", historyRes.product?.current_state_hash)}
                      {renderKeyValue("ipfs_cid", historyRes.product?.ipfs_cid)}
                    </div>
                  </div>

                  <div className="m-events">
                    <div className="m-subhead">Events</div>
                    <div className="m-events-list">
                      {events.map((ev) => (
                        <div className="m-ev" key={ev.id}>
                          <div className="m-ev-top">
                            <div className="m-ev-type">{ev.event_type}</div>
                            <div className="m-ev-time">{new Date(ev.created_at).toLocaleString()}</div>
                          </div>
                          <div className="m-ev-body">
                            <div className="m-ev-row">
                              <span>actor</span>
                              <span>
                                {ev.actor_email} ({ev.actor_role})
                              </span>
                            </div>
                            <div className="m-ev-row">
                              <span>tx</span>
                              <span className="mono">{ev.chain_tx_hash || "null"}</span>
                            </div>
                            <div className="m-ev-row">
                              <span>notes</span>
                              <span>{ev.notes || ""}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {events.length === 0 ? <div className="m-empty">No events found.</div> : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {error ? <div className="m-error">{error}</div> : null}
          </div>
        </section>
      </main>

      <footer className="m-footer">
        <div>© {new Date().getFullYear()} Fake Product Identification</div>
        <div className="m-footer-right">
          <span className="m-footer-dot" />
          Manufacturer
        </div>
      </footer>

      {toast ? <div className="m-toast">{toast}</div> : null}
    </div>
  );
}

export default Manufacturer;
