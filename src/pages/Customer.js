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

  const copyText = useCallback(
    async (text) => {
      const t = normalize(text);
      if (!t) return;
      try {
        await navigator.clipboard.writeText(t);
        showToast("Copied");
      } catch {
        setError("Copy failed. Please copy manually.");
      }
    },
    [showToast]
  );

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
    <div className="c-shell">
      <Navbar />

      <header className="c-header">
        <div className="c-left">
          <div className="c-badge">C</div>
          <div>
            <div className="c-title">Customer Verification</div>
            <div className="c-subtitle">Scan QR or paste payload to verify authenticity with blockchain + IPFS hash</div>
          </div>
        </div>

        <div className="c-nav">
          <button className="c-logout" type="button" onClick={() => navigate("/")}>
            Back
          </button>
        </div>
      </header>

      <main className="c-main">
        <section className="c-grid">
          <div className="c-panel">
            <div className="c-panel-head">Paste QR Payload</div>
            <div className="c-panel-sub">QR payload format: {"{ productId, stateHash }"}</div>

            <textarea
              className="c-textarea mono"
              value={qrPayload}
              onChange={(e) => setQrPayload(e.target.value)}
              placeholder='{"productId":"P2001","stateHash":"..."}'
              disabled={loading}
            />

            <div className="c-split">
              <div className="c-field">
                <div className="c-label">productId</div>
                <input
                  className="c-input mono"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="P2001"
                  disabled={loading}
                />
              </div>
              <div className="c-field">
                <div className="c-label">stateHash</div>
                <input
                  className="c-input mono"
                  value={stateHash}
                  onChange={(e) => setStateHash(e.target.value)}
                  placeholder="a46a..."
                  disabled={loading}
                />
              </div>
            </div>

            <div className="c-actions">
              <button className="c-btn" type="button" onClick={() => scanVerify()} disabled={loading}>
                {loading ? "Verifying..." : "Verify Product"}
              </button>
              <button className="c-btn ghost" type="button" onClick={clearAll} disabled={loading}>
                Clear
              </button>
            </div>

            {error ? <div className="c-error">{error}</div> : null}

            {verdict ? (
              <div className="c-verdict">
                <div className={`c-pill ${verdict.isAuthentic ? "ok" : "bad"}`}>{verdict.isAuthentic ? "AUTHENTIC" : "NOT AUTHENTIC"}</div>

                <div className="c-kv">
                  <div className="c-kv-row">
                    <span>isLatestDbState</span>
                    <span>{String(verdict.isLatestDbState)}</span>
                  </div>
                  <div className="c-kv-row">
                    <span>dbCloudHashMatches</span>
                    <span>{String(verdict.dbCloudHashMatches)}</span>
                  </div>
                  <div className="c-kv-row">
                    <span>chainCloudHashMatches</span>
                    <span>{String(verdict.chainCloudHashMatches)}</span>
                  </div>
                  <div className="c-kv-row">
                    <span>message</span>
                    <span>{verdict.message}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="c-side">
            <div className="c-panel">
              <div className="c-panel-head">Cloud (IPFS) Proof</div>
              <div className="c-panel-sub">Large files stored on IPFS. Blockchain stores hash for integrity.</div>

              <div className="c-kv">
                <div className="c-kv-row">
                  <span>ipfs_cid</span>
                  <span className="mono">{ipfsCid || "-"}</span>
                </div>
                <div className="c-kv-row">
                  <span>cloud_hash (DB)</span>
                  <span className="mono">{product?.cloud_hash || "-"}</span>
                </div>
                <div className="c-kv-row">
                  <span>certificate_sha256</span>
                  <span className="mono">{certificateSha || "-"}</span>
                </div>
              </div>

              <div className="c-actions">
                <button className="c-btn ghost" type="button" onClick={() => copyText(ipfsCid)} disabled={!ipfsCid}>
                  Copy CID
                </button>
                <button className="c-btn ghost" type="button" onClick={() => copyText(product?.cloud_hash)} disabled={!product?.cloud_hash}>
                  Copy Cloud Hash
                </button>
                <a className={`c-btn link ${ipfsUrl ? "" : "disabled"}`} href={ipfsUrl || "#"} target="_blank" rel="noreferrer">
                  Open IPFS File
                </a>
              </div>
            </div>

            <div className="c-panel">
              <div className="c-panel-head">On-chain Record</div>
              <div className="c-panel-sub">What the contract reports for this productId</div>

              <div className="c-kv">
                <div className="c-kv-row">
                  <span>exists</span>
                  <span>{chain ? String(chain.exists) : "-"}</span>
                </div>
                <div className="c-kv-row">
                  <span>manufacturer</span>
                  <span className="mono">{chain?.manufacturer || "-"}</span>
                </div>
                <div className="c-kv-row">
                  <span>currentOwner</span>
                  <span className="mono">{chain?.currentOwner || "-"}</span>
                </div>
                <div className="c-kv-row">
                  <span>cloudHash (chain)</span>
                  <span className="mono">{chain?.cloudHash || "-"}</span>
                </div>
                <div className="c-kv-row">
                  <span>nfcUidHash (chain)</span>
                  <span className="mono">{chain?.nfcUidHash || "-"}</span>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="c-panel">
          <div className="c-panel-head">Product Details</div>
          <div className="c-panel-sub">These values are verified against chain hash + recomputed cloud hash</div>

          <div className="c-kv">
            <div className="c-kv-row">
              <span>product_code</span>
              <span className="mono">{product?.product_code || "-"}</span>
            </div>
            <div className="c-kv-row">
              <span>name</span>
              <span>{product?.name || "-"}</span>
            </div>
            <div className="c-kv-row">
              <span>batch</span>
              <span>{product?.batch || "-"}</span>
            </div>
            <div className="c-kv-row">
              <span>current_state_hash (DB)</span>
              <span className="mono">{product?.current_state_hash || "-"}</span>
            </div>
            <div className="c-kv-row">
              <span>nfc_uid_hash (DB)</span>
              <span className="mono">{product?.nfc_uid_hash || "-"}</span>
            </div>
            <div className="c-kv-row">
              <span>created_at</span>
              <span className="mono">{product?.created_at || "-"}</span>
            </div>
          </div>

          {product?.meta_json ? (
            <div className="c-meta">
              <div className="c-meta-head">meta_json</div>
              <pre className="c-pre mono">{JSON.stringify(product.meta_json, null, 2)}</pre>
            </div>
          ) : null}
        </section>

        <section className="c-panel">
          <div className="c-panel-head">History Timeline</div>
          <div className="c-panel-sub">Every state change (REGISTER, TRANSFER) with chain tx hash</div>

          {events.length === 0 ? (
            <div className="c-empty">No events</div>
          ) : (
            <div className="c-timeline">
              {events.map((e) => (
                <div key={e.id} className="c-event">
                  <div className="c-event-top">
                    <div className="c-event-type">{e.event_type}</div>
                    <div className="c-event-time mono">{e.created_at}</div>
                  </div>
                  <div className="c-event-kv">
                    <div className="c-kv-row">
                      <span>actor</span>
                      <span>{e.actor_email ? `${e.actor_email} (${e.actor_role || "-"})` : e.actor_id}</span>
                    </div>
                    <div className="c-kv-row">
                      <span>prev_state_hash</span>
                      <span className="mono">{e.prev_state_hash || "-"}</span>
                    </div>
                    <div className="c-kv-row">
                      <span>new_state_hash</span>
                      <span className="mono">{e.new_state_hash || "-"}</span>
                    </div>
                    <div className="c-kv-row">
                      <span>chain_tx_hash</span>
                      <span className="mono">{e.chain_tx_hash || "-"}</span>
                    </div>
                    <div className="c-kv-row">
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

      <footer className="c-footer">
        <div>© {new Date().getFullYear()} Fake Product Identification</div>
        <div className="c-footer-right">
          <span className="c-footer-dot" />
          Customer View
        </div>
      </footer>

      {toast ? <div className="c-toast">{toast}</div> : null}
    </div>
  );
}

export default Customer;