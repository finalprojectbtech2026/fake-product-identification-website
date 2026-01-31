import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Regulator.css";

const API_BASE = "https://fake-product-identification-backend.vercel.app";

const normalize = (v) => String(v || "").trim();

function Regulator() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);

  const [qrPayload, setQrPayload] = useState("");
  const [productId, setProductId] = useState("");
  const [stateHash, setStateHash] = useState("");

  const [loading, setLoading] = useState(false);
  const [resData, setResData] = useState(null);
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
  const isRegulator = (me?.role || authUser?.role || "").toLowerCase() === "regulator";

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

  const parsedFromQr = useMemo(() => {
    const raw = normalize(qrPayload);
    if (!raw) return null;
    try {
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return null;
      const pid = normalize(obj.productId);
      const sh = normalize(obj.stateHash);
      if (!pid || !sh) return null;
      return { productId: pid, stateHash: sh };
    } catch {
      return null;
    }
  }, [qrPayload]);

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
    if (parsedFromQr) {
      setProductId(parsedFromQr.productId);
      setStateHash(parsedFromQr.stateHash);
    }
  }, [parsedFromQr]);

  useEffect(() => {
    if (!isAuthed) return;
    if (!meLoading && (me || authUser) && !isRegulator) {
      setError("Please login as Regulator to use this portal.");
    }
  }, [isAuthed, meLoading, me, authUser, isRegulator]);

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setAuthToken("");
    setAuthUser(null);
    navigate("/");
  };

  const scanVerify = async () => {
    const pid = normalize(productId);
    const sh = normalize(stateHash);

    if (!pid || !sh) {
      setError("Enter productId and stateHash (or paste QR payload).");
      return;
    }

    setError("");
    setLoading(true);
    setResData(null);

    try {
      const data = await apiFetch("/api/products/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        auth: false,
        body: JSON.stringify({ productId: pid, stateHash: sh })
      });
      setResData(data);
      showToast("Audit scan completed");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setQrPayload("");
    setProductId("");
    setStateHash("");
    setResData(null);
    setError("");
  };

  const copyText = async (text) => {
    const t = normalize(text);
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      showToast("Copied");
    } catch {
      setError("Copy failed. Please copy manually.");
    }
  };

  const verdict = resData?.verdict || null;
  const product = resData?.product || null;
  const chain = resData?.chain || null;
  const events = Array.isArray(resData?.events) ? resData.events : [];

  const ipfsCid = product?.ipfs_cid || "";
  const ipfsUrl = ipfsCid ? `https://gateway.pinata.cloud/ipfs/${ipfsCid}` : "";

  const certificateSha = useMemo(() => {
    const v = product?.meta_json?.certificate_sha256;
    return typeof v === "string" ? v : "";
  }, [product]);

  return (
    <div className="r-shell">
      <Navbar />

      <header className="r-header">
        <div className="r-left">
          <div className="r-badge">R</div>
          <div>
            <div className="r-title">Regulator Audit Portal</div>
            <div className="r-subtitle">Independent verification using blockchain record + cloud hash integrity</div>
          </div>
        </div>

        <div className="r-nav">
          <button className="r-logout" type="button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="r-main">
        <section className="r-topgrid">
          <div className="r-panel">
            <div className="r-panel-head">Session</div>
            <div className="r-panel-sub">
              {meLoading ? "Loading..." : isAuthed ? (me ? `${me.email} (${me.role})` : "Token present, unable to fetch /me") : "Not logged in"}
            </div>

            {!isAuthed ? (
              <button className="r-btn ghost" type="button" onClick={() => navigate("/auth")}>
                Go to Login
              </button>
            ) : null}

            {isAuthed && !isRegulator ? <div className="r-error">Please login with a regulator account.</div> : null}
          </div>

          <div className="r-panel">
            <div className="r-panel-head">Audit Input</div>
            <div className="r-panel-sub">Paste QR payload or enter productId + stateHash</div>

            <textarea
              className="r-textarea mono"
              value={qrPayload}
              onChange={(e) => setQrPayload(e.target.value)}
              placeholder='{"productId":"P2001","stateHash":"..."}'
              disabled={loading}
            />

            <div className="r-split">
              <div className="r-field">
                <div className="r-label">productId</div>
                <input className="r-input mono" value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="P2001" disabled={loading} />
              </div>
              <div className="r-field">
                <div className="r-label">stateHash</div>
                <input className="r-input mono" value={stateHash} onChange={(e) => setStateHash(e.target.value)} placeholder="a46a..." disabled={loading} />
              </div>
            </div>

            <div className="r-actions">
              <button className="r-btn" type="button" onClick={scanVerify} disabled={loading || !isRegulator}>
                {loading ? "Auditing..." : "Run Audit Scan"}
              </button>
              <button className="r-btn ghost" type="button" onClick={clearAll} disabled={loading}>
                Clear
              </button>
            </div>

            {error ? <div className="r-error">{error}</div> : null}

            {verdict ? (
              <div className="r-verdict">
                <div className={`r-pill ${verdict.isAuthentic ? "ok" : "bad"}`}>{verdict.isAuthentic ? "AUTHENTIC" : "NOT AUTHENTIC"}</div>

                <div className="r-kv">
                  <div className="r-kv-row">
                    <span>isLatestDbState</span>
                    <span>{String(verdict.isLatestDbState)}</span>
                  </div>
                  <div className="r-kv-row">
                    <span>dbCloudHashMatches</span>
                    <span>{String(verdict.dbCloudHashMatches)}</span>
                  </div>
                  <div className="r-kv-row">
                    <span>chainCloudHashMatches</span>
                    <span>{String(verdict.chainCloudHashMatches)}</span>
                  </div>
                  <div className="r-kv-row">
                    <span>message</span>
                    <span>{verdict.message}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="r-panel">
            <div className="r-panel-head">Cloud Proof (IPFS)</div>
            <div className="r-panel-sub">Regulator can verify attached certificate/image is unchanged</div>

            <div className="r-kv">
              <div className="r-kv-row">
                <span>ipfs_cid</span>
                <span className="mono">{ipfsCid || "-"}</span>
              </div>
              <div className="r-kv-row">
                <span>cloud_hash (DB)</span>
                <span className="mono">{product?.cloud_hash || "-"}</span>
              </div>
              <div className="r-kv-row">
                <span>certificate_sha256</span>
                <span className="mono">{certificateSha || "-"}</span>
              </div>
            </div>

            <div className="r-actions">
              <button className="r-btn ghost" type="button" onClick={() => copyText(ipfsCid)} disabled={!ipfsCid}>
                Copy CID
              </button>
              <button className="r-btn ghost" type="button" onClick={() => copyText(product?.cloud_hash)} disabled={!product?.cloud_hash}>
                Copy Cloud Hash
              </button>
              <a className={`r-btn link ${ipfsUrl ? "" : "disabled"}`} href={ipfsUrl || "#"} target="_blank" rel="noreferrer">
                Open IPFS File
              </a>
            </div>
          </div>
        </section>

        <section className="r-panel">
          <div className="r-panel-head">On-chain Record</div>
          <div className="r-panel-sub">Contract view for the product</div>

          <div className="r-kv">
            <div className="r-kv-row">
              <span>exists</span>
              <span>{chain ? String(chain.exists) : "-"}</span>
            </div>
            <div className="r-kv-row">
              <span>manufacturer</span>
              <span className="mono">{chain?.manufacturer || "-"}</span>
            </div>
            <div className="r-kv-row">
              <span>currentOwner</span>
              <span className="mono">{chain?.currentOwner || "-"}</span>
            </div>
            <div className="r-kv-row">
              <span>cloudHash (chain)</span>
              <span className="mono">{chain?.cloudHash || "-"}</span>
            </div>
            <div className="r-kv-row">
              <span>nfcUidHash (chain)</span>
              <span className="mono">{chain?.nfcUidHash || "-"}</span>
            </div>
          </div>
        </section>

        <section className="r-panel">
          <div className="r-panel-head">History Timeline</div>
          <div className="r-panel-sub">Every state change with actor + chain tx</div>

          {events.length === 0 ? (
            <div className="r-empty">No events</div>
          ) : (
            <div className="r-timeline">
              {events.map((e) => (
                <div key={e.id} className="r-event">
                  <div className="r-event-top">
                    <div className="r-event-type">{e.event_type}</div>
                    <div className="r-event-time mono">{e.created_at}</div>
                  </div>
                  <div className="r-event-kv">
                    <div className="r-kv-row">
                      <span>actor</span>
                      <span>{e.actor_email ? `${e.actor_email} (${e.actor_role || "-"})` : e.actor_id}</span>
                    </div>
                    <div className="r-kv-row">
                      <span>prev_state_hash</span>
                      <span className="mono">{e.prev_state_hash || "-"}</span>
                    </div>
                    <div className="r-kv-row">
                      <span>new_state_hash</span>
                      <span className="mono">{e.new_state_hash || "-"}</span>
                    </div>
                    <div className="r-kv-row">
                      <span>chain_tx_hash</span>
                      <span className="mono">{e.chain_tx_hash || "-"}</span>
                    </div>
                    <div className="r-kv-row">
                      <span>notes</span>
                      <span>{e.notes || "-"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="r-footer">
        <div>© {new Date().getFullYear()} Fake Product Identification</div>
        <div className="r-footer-right">
          <span className="r-footer-dot" />
          Regulator View
        </div>
      </footer>

      {toast ? <div className="r-toast">{toast}</div> : null}
    </div>
  );
}

export default Regulator;