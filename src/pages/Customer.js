import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "./Navbar";
import "./Customer.css";

const API_BASE = "https://fake-product-identification-backend.vercel.app";

const normalize = (v) => String(v || "").trim();

function Customer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [qrPayload, setQrPayload] = useState("");
  const [productId, setProductId] = useState("");
  const [stateHash, setStateHash] = useState("");

  const [loading, setLoading] = useState(false);
  const [resData, setResData] = useState(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const showToast = useCallback((msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 2200);
  }, []);

  const apiFetch = useCallback(async (path, opts = {}) => {
    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const m = data?.message || `Request failed (${res.status})`;
      const e = data?.error ? `: ${data.error}` : "";
      throw new Error(m + e);
    }
    return data;
  }, []);

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
    const pid = normalize(searchParams.get("productId"));
    const sh = normalize(searchParams.get("stateHash"));
    if (pid && sh) {
      setProductId(pid);
      setStateHash(sh);
      setQrPayload("");
    }
  }, [searchParams]);

  useEffect(() => {
    if (parsedFromQr) {
      setProductId(parsedFromQr.productId);
      setStateHash(parsedFromQr.stateHash);
    }
  }, [parsedFromQr]);

  const scanVerify = useCallback(
    async (overridePid, overrideSh) => {
      const pid = normalize(overridePid ?? productId);
      const sh = normalize(overrideSh ?? stateHash);
      if (!pid || !sh) {
        setError("Paste QR payload or enter productId and stateHash.");
        return;
      }
      setError("");
      setLoading(true);
      setResData(null);
      try {
        const data = await apiFetch("/api/products/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: pid, stateHash: sh })
        });
        setResData(data);
        showToast("Verification completed");
      } catch (e) {
        setError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    },
    [apiFetch, productId, stateHash, showToast]
  );

  useEffect(() => {
    const pid = normalize(searchParams.get("productId"));
    const sh = normalize(searchParams.get("stateHash"));
    if (pid && sh) scanVerify(pid, sh);
  }, [searchParams, scanVerify]);

  const clearAll = useCallback(() => {
    setQrPayload("");
    setProductId("");
    setStateHash("");
    setResData(null);
    setError("");
  }, []);

  const verdict = resData?.verdict || null;
  const product = resData?.product || null;
  const events = Array.isArray(resData?.events) ? resData.events : [];

  const brand = normalize(product?.meta_json?.brand) || "-";
  const nfcUid = normalize(product?.nfc_uid) || normalize(product?.meta_json?.nfc_uid) || "-";

  const ipfsCid = normalize(product?.ipfs_cid);
  const ipfsUrl = ipfsCid ? `https://gateway.pinata.cloud/ipfs/${ipfsCid}` : "";

  const [imgOk, setImgOk] = useState(false);
  useEffect(() => {
    setImgOk(false);
  }, [ipfsUrl]);

  const prettyDate = (d) => {
    try {
      return new Date(d).toLocaleString();
    } catch {
      return String(d || "");
    }
  };

  return (
    <div className="cv-shell">
      <Navbar />

      <div className="cv-bg" />
      <div className="cv-noise" />
      <div className="cv-orb cv-orb-1" />
      <div className="cv-orb cv-orb-2" />

      

      <main className="cv-main">
        <section className="cv-hero">
          <div className="cv-hero-top">
            <div className="cv-chip">
              <span className="cv-dot" />
              Authenticity check
            </div>
            <div className="cv-chip ghost">QR payload or link</div>
          </div>

          <h1 className="cv-hero-title">Verify your product in seconds</h1>
          <p className="cv-hero-desc">Paste the QR payload or open the scan link, we will show only the verified product details.</p>
        </section>

        <section className="cv-grid">
          <div className="cv-panel">
            <div className="cv-panel-title">Paste QR payload</div>
            <div className="cv-panel-sub">Format: {"{ productId, stateHash }"}</div>

            <textarea
              className="cv-textarea mono"
              value={qrPayload}
              onChange={(e) => setQrPayload(e.target.value)}
              placeholder='{"productId":"P2001","stateHash":"..."}'
              disabled={loading}
            />

            <div className="cv-row2">
              <div className="cv-field">
                <label className="cv-label">productId</label>
                <input className="cv-input mono" value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="P2001" disabled={loading} />
              </div>
              <div className="cv-field">
                <label className="cv-label">stateHash</label>
                <input className="cv-input mono" value={stateHash} onChange={(e) => setStateHash(e.target.value)} placeholder="(auto from QR)" disabled={loading} />
              </div>
            </div>

            <div className="cv-actions">
              <button className="cv-btn" type="button" onClick={() => scanVerify()} disabled={loading}>
                {loading ? "Verifying..." : "Verify Product"}
              </button>
              <button className="cv-btn ghost" type="button" onClick={clearAll} disabled={loading}>
                Clear
              </button>
            </div>

            {error ? <div className="cv-error">{error}</div> : null}

            {verdict ? (
              <div className="cv-verdict">
                <div className="cv-verdict-top">
                  <div className={`cv-badge2 ${verdict.isAuthentic ? "ok" : "bad"}`}>{verdict.isAuthentic ? "AUTHENTIC" : "NOT AUTHENTIC"}</div>
                  <div className="cv-verdict-msg">{verdict.message || ""}</div>
                </div>

                <div className="cv-mini-kv">
                  <div className="cv-mini">
                    <div className="cv-mini-title">Status</div>
                    <div className="cv-mini-sub">{verdict.isAuthentic ? "Verified genuine" : "Verification failed"}</div>
                  </div>
                  <div className="cv-mini">
                    <div className="cv-mini-title">Safety</div>
                    <div className="cv-mini-sub">{verdict.isLatestDbState ? "Latest state" : "Old QR detected"}</div>
                  </div>
                  <div className="cv-mini">
                    <div className="cv-mini-title">Confidence</div>
                    <div className="cv-mini-sub">{verdict.dbCloudHashMatches && verdict.chainCloudHashMatches ? "High" : "Low"}</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="cv-panel cv-side">
            <div className="cv-panel-title">Verified product view</div>
            <div className="cv-panel-sub">Only customer friendly details are shown here</div>

            <div className="cv-product-card">
              <div className="cv-product-media">
                {ipfsUrl ? (
                  <>
                    <img
                      className={`cv-product-img ${imgOk ? "show" : ""}`}
                      src={ipfsUrl}
                      alt="product"
                      onLoad={() => setImgOk(true)}
                      onError={() => setImgOk(false)}
                    />
                    {!imgOk ? <div className="cv-product-img-fallback">No image preview</div> : null}
                  </>
                ) : (
                  <div className="cv-product-img-fallback">No image</div>
                )}

                {ipfsUrl ? (
                  <a className="cv-btn small ghost" href={ipfsUrl} target="_blank" rel="noreferrer">
                    Open file
                  </a>
                ) : (
                  <button className="cv-btn small ghost" type="button" disabled>
                    Open file
                  </button>
                )}
              </div>

              <div className="cv-product-info">
                <div className="cv-step">Verified Product Details</div>

                <div className="cv-kvlist">
                  <div className="cv-kvrow">
                    <span>Product code</span>
                    <span className="mono">{product?.product_code || "-"}</span>
                  </div>
                  <div className="cv-kvrow">
                    <span>Batch</span>
                    <span>{product?.batch || "-"}</span>
                  </div>
                  <div className="cv-kvrow">
                    <span>Product name</span>
                    <span>{product?.name || "-"}</span>
                  </div>
                  <div className="cv-kvrow">
                    <span>Brand</span>
                    <span>{brand}</span>
                  </div>
                  <div className="cv-kvrow">
                    <span>NFC UID</span>
                    <span className="mono">{nfcUid}</span>
                  </div>
                </div>
              </div>
            </div>

            {product?.created_at ? (
              <div className="cv-note">
                Registered on <span className="mono">{prettyDate(product.created_at)}</span>
              </div>
            ) : null}
          </aside>
        </section>

        <section className="cv-panel">
          <div className="cv-panel-title">History timeline</div>
          <div className="cv-panel-sub">Shows only actions and timestamps (no technical hashes)</div>

          {events.length === 0 ? (
            <div className="cv-empty">No history found</div>
          ) : (
            <div className="cv-timeline">
              {events.map((e) => (
                <div key={e.id} className="cv-event">
                  <div className="cv-event-top">
                    <div className="cv-event-type">{e.event_type}</div>
                    <div className="cv-event-time mono">{prettyDate(e.created_at)}</div>
                  </div>

                  <div className="cv-event-body">
                    <div className="cv-event-row">
                      <span>Actor</span>
                      <span>{e.actor_email ? `${e.actor_email}${e.actor_role ? ` (${e.actor_role})` : ""}` : e.actor_id || "-"}</span>
                    </div>
                    <div className="cv-event-row">
                      <span>Notes</span>
                      <span>{e.notes || "-"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="cv-footer">
        <div>© {new Date().getFullYear()} Fake Product Identification</div>
        <div className="cv-footer-right">
          <span className="cv-footer-dot" />
          Customer view
        </div>
      </footer>

      {toast ? <div className="cv-toast">{toast}</div> : null}
    </div>
  );
}

export default Customer;
