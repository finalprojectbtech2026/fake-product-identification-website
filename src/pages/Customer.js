import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import Navbar from "./Navbar";
import Orders from "./Orders";
import "./Customer.css";

const API_BASE = "https://fake-product-identification-backend.vercel.app";

const normalize = (v) => String(v ?? "").trim();
const hasValue = (v) => {
  const s = normalize(v);
  return !!s && s !== "-" && s.toLowerCase() !== "null" && s.toLowerCase() !== "undefined";
};

function Customer() {
  const [searchParams] = useSearchParams();

  const [qrPayload, setQrPayload] = useState("");
  const [productId, setProductId] = useState("");
  const [stateHash, setStateHash] = useState("");

  const [loading, setLoading] = useState(false);
  const [resData, setResData] = useState(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [scannerOn, setScannerOn] = useState(false);
  const scannerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const scannerId = "cv-qr-reader";

  const clearNonceRef = useRef(0);

  const [imgOk, setImgOk] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);

  const [ordersOpen, setOrdersOpen] = useState(false);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2200);
  }, []);

  const apiFetch = useCallback(async (path, opts = {}) => {
    const res = await fetch(`${API_BASE}${path}`, opts);
    const text = await res.text().catch(() => "");
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!res.ok) {
      const m = data?.message || `Request failed (${res.status})`;
      const e = data?.error ? `: ${data.error}` : "";
      throw new Error(m + e);
    }
    return data;
  }, []);

  const extractFromText = useCallback((rawText) => {
    const raw = normalize(rawText);
    if (!raw) return null;

    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      try {
        const u = new URL(raw);
        const pid = normalize(u.searchParams.get("productId")) || normalize(u.searchParams.get("product_code"));
        const sh = normalize(u.searchParams.get("stateHash")) || normalize(u.searchParams.get("state_hash"));
        if (pid && sh) return { productId: pid, stateHash: sh };
      } catch {}
    }

    try {
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object") return null;
      const pid = normalize(obj.productId) || normalize(obj.product_code);
      const sh = normalize(obj.stateHash) || normalize(obj.state_hash);
      if (!pid || !sh) return null;
      return { productId: pid, stateHash: sh };
    } catch {}

    return null;
  }, []);

  const parsedFromQr = useMemo(() => extractFromText(qrPayload), [qrPayload, extractFromText]);

  const stopScanner = useCallback(async () => {
    try {
      const inst = scannerRef.current;
      if (inst) {
        await inst.stop().catch(() => {});
        await inst.clear().catch(() => {});
      }
    } finally {
      scannerRef.current = null;
      setScannerOn(false);
    }
  }, []);

  const clearAll = useCallback(async () => {
    clearNonceRef.current += 1;
    setQrPayload("");
    setProductId("");
    setStateHash("");
    setResData(null);
    setError("");
    setLoading(false);
    setImgOk(false);
    setImgLoading(false);
    setOrdersOpen(false);
    await stopScanner();
  }, [stopScanner]);

  useEffect(() => {
    const pid = normalize(searchParams.get("productId")) || normalize(searchParams.get("product_code"));
    const sh = normalize(searchParams.get("stateHash")) || normalize(searchParams.get("state_hash"));
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
        setResData(null);
        setError("Paste QR link or payload, or enter productId and stateHash.");
        return;
      }

      setError("");
      setLoading(true);
      setResData(null);
      setOrdersOpen(false);

      try {
        const data = await apiFetch("/api/products/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: pid, stateHash: sh })
        });
        if (!mountedRef.current) return;

        clearNonceRef.current += 1;
        setResData({ ...(data || {}), __img_nonce: clearNonceRef.current });
        showToast("Verification completed");
      } catch (e) {
        if (!mountedRef.current) return;
        setError(String(e?.message || e));
      } finally {
        if (!mountedRef.current) return;
        setLoading(false);
      }
    },
    [apiFetch, productId, stateHash, showToast]
  );

  useEffect(() => {
    const pid = normalize(searchParams.get("productId")) || normalize(searchParams.get("product_code"));
    const sh = normalize(searchParams.get("stateHash")) || normalize(searchParams.get("state_hash"));
    if (pid && sh) scanVerify(pid, sh);
  }, [searchParams, scanVerify]);

  const verdict = resData?.verdict || null;
  const product = resData?.product || null;

  const imgNonce = resData?.__img_nonce || 0;
  const meta = product?.meta_json && typeof product.meta_json === "object" ? product.meta_json : {};

  const productName = normalize(product?.name) || normalize(meta?.name) || "";
  const productCode = normalize(product?.product_code) || normalize(meta?.product_code) || normalize(productId) || "";
  const batch = normalize(product?.batch) || normalize(meta?.batch) || "";
  const brand = normalize(meta?.brand) || "";
  const statusFromScan = normalize(product?.sale_status) || normalize(product?.status) || normalize(meta?.sale_status) || normalize(meta?.status) || "";

  const manufacturer = normalize(meta?.manufacturer) || normalize(meta?.mfg) || normalize(meta?.manufacturer_name) || "";
  const serialNo = normalize(meta?.serial_no) || normalize(meta?.serialNumber) || normalize(meta?.serial) || "";
  const mfgDate = normalize(meta?.manufacture_date) || normalize(meta?.mfg_date) || normalize(meta?.mfgDate) || "";
  const expDate = normalize(meta?.expiry_date) || normalize(meta?.exp_date) || normalize(meta?.expDate) || "";
  const warranty = normalize(meta?.warranty) || normalize(meta?.warranty_period) || "";
  const seller = normalize(meta?.seller) || normalize(meta?.seller_name) || normalize(meta?.sellerName) || "";
  const sellerVerified = meta?.seller_verified ?? meta?.isSellerVerified ?? null;

  const nfcUid =
    normalize(meta?.nfc_uid) ||
    normalize(meta?.nfcUid) ||
    normalize(meta?.nfc_uid_hash) ||
    normalize(meta?.nfcUidHash) ||
    normalize(product?.nfc_uid_hash) ||
    normalize(product?.nfcUidHash) ||
    "";

  const ipfsCid = normalize(product?.ipfs_cid) || normalize(meta?.ipfs_cid) || normalize(meta?.ipfsCid) || "";
  const ipfsUrlBase = ipfsCid ? `https://gateway.pinata.cloud/ipfs/${ipfsCid}` : "";
  const ipfsUrl = ipfsUrlBase ? `${ipfsUrlBase}${ipfsUrlBase.includes("?") ? "&" : "?"}v=${encodeURIComponent(String(imgNonce))}` : "";

  useEffect(() => {
    if (ipfsUrl) {
      setImgOk(false);
      setImgLoading(true);
    } else {
      setImgOk(false);
      setImgLoading(false);
    }
  }, [ipfsUrl]);

  const isSoldFromScan = useMemo(() => {
    const v = normalize(verdict?.isSold);
    if (v) return String(verdict?.isSold) === "true";
    return normalize(statusFromScan).toUpperCase() === "SOLD";
  }, [verdict, statusFromScan]);

  const prettyDate = (d) => {
    const v = normalize(d);
    if (!v) return "";
    try {
      const dt = new Date(v);
      if (Number.isNaN(dt.getTime())) return v;
      return dt.toLocaleDateString();
    } catch {
      return v;
    }
  };

  const copyText = useCallback(
    async (v, okMsg = "Copied") => {
      const text = normalize(v);
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showToast(okMsg);
      } catch {
        showToast("Copy failed");
      }
    },
    [showToast]
  );

  const startScanner = useCallback(async () => {
    setError("");
    setResData(null);
    setOrdersOpen(false);

    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setError("Camera scanning needs HTTPS (or run on localhost). Paste the QR link/payload instead.");
      return;
    }

    if (scannerOn) return;

    const inst = new Html5Qrcode(scannerId);
    scannerRef.current = inst;

    try {
      setScannerOn(true);
      await inst.start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 270, height: 270 } },
        async (decodedText) => {
          const extracted = extractFromText(decodedText);
          if (!extracted) {
            setError("QR scanned, but it did not contain a valid link or payload.");
            return;
          }
          setProductId(extracted.productId);
          setStateHash(extracted.stateHash);
          setQrPayload("");
          showToast("QR scanned");
          await stopScanner();
          scanVerify(extracted.productId, extracted.stateHash);
        },
        () => {}
      );
    } catch (e) {
      scannerRef.current = null;
      setScannerOn(false);
      setError(String(e?.message || e));
    }
  }, [scannerOn, extractFromText, stopScanner, scanVerify, showToast]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      stopScanner();
    };
  }, [stopScanner]);

  const formatActor = (e) => {
    const email = normalize(e?.actor_email);
    const role = normalize(e?.actor_role);
    if (email) return role ? `${email} (${role})` : email;
    return normalize(e?.actor_id) || "-";
  };

  const rawEventsMemo = useMemo(() => (Array.isArray(resData?.events) ? resData.events : []), [resData?.events]);

  const events = useMemo(() => {
    const mapped = rawEventsMemo.map((e) => ({
      ...e,
      __type: normalize(e?.event_type) || "EVENT"
    }));

    const hasSoldAlready = mapped.some((e) => {
      const t = normalize(e.__type).toUpperCase();
      return t === "SOLD" || t === "PURCHASE";
    });

    if (!hasSoldAlready && isSoldFromScan) {
      const lastTs =
        mapped.length && mapped[mapped.length - 1]?.created_at ? new Date(mapped[mapped.length - 1].created_at).getTime() : Date.now();

      const synthetic = {
        id: `sold-${normalize(productCode) || normalize(productId) || "x"}-${String(lastTs)}`,
        event_type: "SOLD",
        actor_id: "",
        prev_state_hash: "",
        new_state_hash: normalize(product?.current_state_hash) || normalize(stateHash) || "",
        chain_tx_hash: "",
        notes: "Marked as sold",
        created_at: new Date(lastTs + 1000).toISOString(),
        actor_role: "system",
        actor_email: ""
      };

      return [...mapped, synthetic];
    }

    return mapped;
  }, [rawEventsMemo, isSoldFromScan, productCode, productId, product?.current_state_hash, stateHash]);

  const availableDetails = useMemo(() => {
    const list = [];

    const add = (label, value, mono = false) => {
      if (!hasValue(value)) return;
      list.push({ label, value: normalize(value), mono });
    };

    add("Product name", productName);
    add("Product code", productCode, true);
    add("Status", isSoldFromScan ? "SOLD" : hasValue(statusFromScan) ? statusFromScan : "");
    add("Batch", batch);
    add("Brand", brand);
    add("Manufacturer", manufacturer);
    add("Serial no", serialNo, true);
    add("Manufactured", mfgDate ? prettyDate(mfgDate) : "");
    add("Expiry", expDate ? prettyDate(expDate) : "");
    add("Warranty", warranty);
    add("Seller", seller);
    add("NFC UID", nfcUid, true);

    return list;
  }, [productName, productCode, isSoldFromScan, statusFromScan, batch, brand, manufacturer, serialNo, mfgDate, expDate, warranty, seller, nfcUid]);

  const exampleUrl = useMemo(() => {
    const pid = normalize(productId) || "P2001";
    const sh = normalize(stateHash) || "STATE_HASH";
    return `${window.location.origin}/customer?productId=${encodeURIComponent(pid)}&stateHash=${encodeURIComponent(sh)}`;
  }, [productId, stateHash]);

  const canPurchase = useMemo(() => {
    if (!verdict) return false;
    const vCan = verdict?.canPurchase;
    if (vCan === true) return true;
    if (vCan === false) return false;
    if (!verdict.isAuthentic) return false;
    if (!hasValue(productCode) || !hasValue(stateHash)) return false;
    if (verdict.isLatestDbState === false) return false;
    if (isSoldFromScan) return false;
    return true;
  }, [verdict, productCode, stateHash, isSoldFromScan]);

  const openOrders = useCallback(() => {
    if (!canPurchase) return;
    setOrdersOpen(true);
  }, [canPurchase]);

  const closeOrders = useCallback(() => {
    setOrdersOpen(false);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOrdersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const ordersPayload = useMemo(() => {
    const pid = normalize(productId);
    const sh = normalize(stateHash);
    const pc = normalize(productCode) || pid;
    return {
      productId: pid,
      stateHash: sh,
      product_code: pc,
      state_hash: sh,
      product: product || null,
      verdict: verdict || null
    };
  }, [productId, stateHash, productCode, product, verdict]);

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
              Customer verification
            </div>
          </div>

          <div className="cv-hero-row">
            <div>
              <h1 className="cv-hero-title">Verify your product in seconds</h1>

              <div className="cv-hero-cta">
                <button className="cv-btn" type="button" onClick={() => scanVerify()} disabled={loading}>
                  {loading ? "Verifying..." : "Verify Product"}
                </button>
                <button className="cv-btn ghost" type="button" onClick={() => copyText(exampleUrl, "Link copied")} disabled={!exampleUrl}>
                  Copy customer link
                </button>
                <button className="cv-btn ghost" type="button" onClick={clearAll} disabled={loading}>
                  Clear
                </button>
                {canPurchase ? (
                  <button className="cv-btn" type="button" onClick={openOrders} disabled={loading}>
                    Purchase
                  </button>
                ) : null}
              </div>

              {isSoldFromScan ? <div className="cv-error">This product is already SOLD.</div> : null}
            </div>
          </div>
        </section>

        <section className="cv-grid">
          <div className="cv-panel">
            <div className="cv-panel-title">Scan or paste</div>
            <div className="cv-panel-sub">Supported: URL with productId/stateHash, or JSON payload</div>

            <div className="cv-actions">
              {!scannerOn ? (
                <button className="cv-btn" type="button" onClick={startScanner} disabled={loading}>
                  Scan with camera
                </button>
              ) : (
                <button className="cv-btn ghost" type="button" onClick={stopScanner} disabled={loading}>
                  Stop camera
                </button>
              )}

              <button
                className="cv-btn ghost"
                type="button"
                onClick={() => {
                  const sample = JSON.stringify({ productId: "P2001", stateHash: "STATE_HASH" });
                  setQrPayload(sample);
                  showToast("Example payload inserted");
                }}
                disabled={loading}
              >
                Insert example payload
              </button>
            </div>

            <div className={`cv-scanner ${scannerOn ? "show" : ""}`}>
              <div className="cv-scanner-head">
                <div className="cv-scanner-title">Camera scanner</div>
                <div className="cv-scanner-sub">Point at the QR code</div>
              </div>
              <div id={scannerId} className="cv-scanner-box" />
            </div>

            <div className="cv-inputblock">
              <div className="cv-inputhead">
                <div className="cv-inputtitle">QR link or JSON payload</div>
                <button className="cv-mini-btn" type="button" onClick={() => copyText(qrPayload, "Payload copied")} disabled={!normalize(qrPayload)}>
                  Copy
                </button>
              </div>

              <textarea
                className="cv-textarea mono"
                value={qrPayload}
                onChange={(e) => setQrPayload(e.target.value)}
                placeholder='Paste QR link like https://your-site/customer?productId=P2001&stateHash=... or JSON {"productId":"P2001","stateHash":"..."}'
                disabled={loading}
              />
            </div>

            <div className="cv-row2">
              <div className="cv-field">
                <div className="cv-labelrow">
                  <label className="cv-label">productId</label>
                  <button className="cv-mini-btn" type="button" onClick={() => copyText(productId, "productId copied")} disabled={!normalize(productId)}>
                    Copy
                  </button>
                </div>
                <input className="cv-input mono" value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="P2001" disabled={loading} />
              </div>

              <div className="cv-field">
                <div className="cv-labelrow">
                  <label className="cv-label">stateHash</label>
                  <button className="cv-mini-btn" type="button" onClick={() => copyText(stateHash, "stateHash copied")} disabled={!normalize(stateHash)}>
                    Copy
                  </button>
                </div>
                <input className="cv-input mono" value={stateHash} onChange={(e) => setStateHash(e.target.value)} placeholder="(auto from QR)" disabled={loading} />
              </div>
            </div>

            <div className="cv-actions">
              <button className="cv-btn" type="button" onClick={() => scanVerify()} disabled={loading}>
                {loading ? "Verifying..." : "Verify Product"}
              </button>
              <button className="cv-btn ghost" type="button" onClick={clearAll} disabled={loading}>
                Clear data
              </button>
              {canPurchase ? (
                <button className="cv-btn" type="button" onClick={openOrders} disabled={loading}>
                  Purchase
                </button>
              ) : null}
            </div>

            {error ? <div className="cv-error">{error}</div> : null}
          </div>

          <aside className="cv-panel cv-side">
            <div className="cv-panel-title">Verified product view</div>
            <div className="cv-panel-sub">Only available details are shown</div>

            <div className="cv-product-card">
              <div className="cv-product-media">
                {ipfsUrl ? (
                  <>
                    {imgLoading ? (
                      <div className="cv-product-img-fallback">
                        <span className="cv-loader" />
                      </div>
                    ) : null}

                    <img
                      className={`cv-product-img ${imgOk ? "show" : ""}`}
                      src={ipfsUrl}
                      alt="product"
                      onLoad={() => {
                        setImgOk(true);
                        setImgLoading(false);
                      }}
                      onError={() => {
                        setImgOk(false);
                        setImgLoading(false);
                      }}
                      style={{ display: imgOk ? "block" : "none" }}
                    />

                    {!imgLoading && !imgOk ? <div className="cv-product-img-fallback">File is not an image preview</div> : null}
                  </>
                ) : (
                  <div className="cv-product-img-fallback">No file</div>
                )}

                <div className="cv-media-actions">
                  <button className="cv-btn small ghost" type="button" onClick={() => copyText(ipfsUrlBase, "IPFS link copied")} disabled={!ipfsUrlBase}>
                    Copy file link
                  </button>
                  {ipfsUrlBase ? (
                    <a className="cv-btn small" href={ipfsUrlBase} target="_blank" rel="noreferrer">
                      Open file
                    </a>
                  ) : (
                    <button className="cv-btn small" type="button" disabled>
                      Open file
                    </button>
                  )}
                </div>
              </div>

              <div className="cv-product-info">
                <div className="cv-step">Product details</div>

                {availableDetails.length ? (
                  <div className="cv-kvlist">
                    {availableDetails.map((row) => (
                      <div key={row.label} className="cv-kvrow">
                        <span>{row.label}</span>
                        <span className={row.mono ? "mono" : ""}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="cv-empty">No product details available</div>
                )}

                {sellerVerified !== null ? (
                  <div className={`cv-flag ${sellerVerified ? "ok" : "bad"}`}>
                    <div className="cv-flag-dot" />
                    <div className="cv-flag-text">{sellerVerified ? "Seller verified" : "Seller not verified"}</div>
                  </div>
                ) : null}

                {canPurchase ? (
                  <div style={{ marginTop: 12 }}>
                    <button className="cv-btn" type="button" onClick={openOrders} disabled={loading}>
                      Purchase
                    </button>
                  </div>
                ) : null}

                {!canPurchase && isSoldFromScan ? (
                  <div style={{ marginTop: 10 }}>
                    <div className="cv-error">The Product you are looking is SOLD.</div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="cv-notegrid">
              {product?.created_at ? (
                <div className="cv-note">
                  Registered on <span className="mono">{new Date(product.created_at).toLocaleString()}</span>
                </div>
              ) : (
                <div className="cv-note">Run verification to load registration info</div>
              )}

              {hasValue(nfcUid) ? (
                <div className="cv-note">
                  NFC UID detected <span className="mono">{nfcUid}</span>
                </div>
              ) : (
                <div className="cv-note">No NFC UID found for this product</div>
              )}
            </div>
          </aside>
        </section>

        <section className="cv-panel">
          <div className="cv-panel-title">History timeline</div>
          <div className="cv-panel-sub">Supply chain actions and timestamps</div>

          {events.length === 0 ? (
            <div className="cv-empty">No history found</div>
          ) : (
            <div className="cv-timeline">
              {events.map((e) => (
                <div key={e.id} className="cv-event">
                  <div className="cv-event-top">
                    <div className="cv-event-type">{normalize(e.event_type) || "EVENT"}</div>
                    <div className="cv-event-time mono">{new Date(e.created_at).toLocaleString()}</div>
                  </div>

                  <div className="cv-event-body">
                    <div className="cv-event-row">
                      <span>Actor</span>
                      <span>{formatActor(e)}</span>
                    </div>
                    <div className="cv-event-row">
                      <span>Notes</span>
                      <span>{normalize(e.notes) || "-"}</span>
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

      {ordersOpen ? (
        <div
          className="cv-modal"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeOrders();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999
          }}
        >
          <div
            className="cv-modal-card"
            style={{
              width: "min(980px, 100%)",
              maxHeight: "min(86vh, 900px)",
              overflow: "auto",
              borderRadius: 16,
              background: "#0c0f16",
              boxShadow: "0 20px 80px rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.08)"
            }}
          >
            <div
              className="cv-modal-head"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "14px 14px",
                borderBottom: "1px solid rgba(255,255,255,0.08)"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontWeight: 700, color: "#fff" }}>Orders</div>
                <div style={{ opacity: 0.75, fontSize: 12 }}>
                  {normalize(productCode) ? `Product: ${normalize(productCode)}` : normalize(productId) ? `Product: ${normalize(productId)}` : "Create a new order"}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button className="cv-btn ghost small" type="button" onClick={closeOrders}>
                  Close
                </button>
              </div>
            </div>

            <div style={{ padding: 14 }}>
              <Orders openFromCustomer={true} payload={ordersPayload} onClose={closeOrders} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default Customer;
