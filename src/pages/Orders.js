import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "./Navbar";
import "./Orders.css";

const API_BASE = "https://fake-product-identification-backend.vercel.app";

const normalize = (v) => String(v ?? "").trim();
const hasValue = (v) => {
  const s = normalize(v);
  return !!s && s !== "-" && s.toLowerCase() !== "null" && s.toLowerCase() !== "undefined";
};

function Orders({ openFromCustomer = false, payload = null, onClose = null }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [toast, setToast] = useState("");
  const toastTimerRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [err, setErr] = useState("");
  const [orderRes, setOrderRes] = useState(null);

  const basePid = useMemo(() => normalize(payload?.productId) || normalize(searchParams.get("productId")), [payload, searchParams]);
  const baseSh = useMemo(() => normalize(payload?.stateHash) || normalize(searchParams.get("stateHash")), [payload, searchParams]);
  const verdict = useMemo(() => payload?.verdict || null, [payload]);
  const product = useMemo(() => payload?.product || null, [payload]);
  const meta = useMemo(() => (product?.meta_json && typeof product.meta_json === "object" ? product.meta_json : {}), [product]);

  const productName = useMemo(() => normalize(product?.name) || normalize(meta?.name) || "Product", [product, meta]);
  const productCode = useMemo(() => normalize(product?.product_code) || normalize(meta?.product_code) || basePid, [product, meta, basePid]);
  const brand = useMemo(() => normalize(meta?.brand) || "", [meta]);
  const seller = useMemo(() => normalize(meta?.seller) || normalize(meta?.seller_name) || "", [meta]);

  const isAuthentic = useMemo(() => {
    if (!verdict) return null;
    return Boolean(verdict.isAuthentic);
  }, [verdict]);

  const canPlace = useMemo(() => {
    if (!hasValue(basePid) || !hasValue(baseSh)) return false;
    if (isAuthentic === false) return false;
    return true;
  }, [basePid, baseSh, isAuthentic]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
    payment: "COD",
    qty: 1
  });

  useEffect(() => {
    setPlaced(false);
    setErr("");
    setOrderRes(null);
  }, [basePid, baseSh]);

  const qty = useMemo(() => {
    const n = Number(form.qty);
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(10, Math.floor(n)));
  }, [form.qty]);

  const short = useCallback((v, n = 10) => {
    const s = normalize(v);
    if (!s) return "-";
    if (s.length <= n * 2 + 3) return s;
    return `${s.slice(0, n)}...${s.slice(-n)}`;
  }, []);

  const setField = useCallback((k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
  }, []);

  const mapPayment = useCallback((v) => {
    const p = normalize(v).toUpperCase();
    if (p === "COD") return "COD";
    if (p === "UPI") return "MOCK_UPI";
    if (p === "CARD") return "MOCK_CARD";
    return "COD";
  }, []);

  const buildAddress = useCallback(() => {
    const a1 = normalize(form.address1);
    const a2 = normalize(form.address2);
    const city = normalize(form.city);
    const st = normalize(form.state);
    const pin = normalize(form.pincode);

    const parts = [];
    if (a1) parts.push(a1);
    if (a2) parts.push(a2);
    const line3 = [city, st, pin].filter(Boolean).join(", ");
    if (line3) parts.push(line3);
    return parts.join("\n");
  }, [form.address1, form.address2, form.city, form.state, form.pincode]);

  const validate = useCallback(() => {
    const fullName = normalize(form.fullName);
    const phone = normalize(form.phone);
    const email = normalize(form.email);
    const address1 = normalize(form.address1);
    const city = normalize(form.city);
    const state = normalize(form.state);
    const pincode = normalize(form.pincode);

    if (!canPlace) return "Verify product first before purchase.";
    if (fullName.length < 2) return "Enter your full name.";
    if (!/^[6-9]\d{9}$/.test(phone)) return "Enter a valid 10-digit mobile number.";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email (or keep it empty).";
    if (address1.length < 5) return "Enter your address.";
    if (city.length < 2) return "Enter your city.";
    if (state.length < 2) return "Enter your state.";
    if (!/^\d{6}$/.test(pincode)) return "Enter a valid 6-digit pincode.";
    return "";
  }, [form, canPlace]);

  const apiPostOrder = useCallback(async (body) => {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

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

  const placeOrder = useCallback(async () => {
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }

    setErr("");
    setSubmitting(true);
    setPlaced(false);
    setOrderRes(null);

    try {
      const body = {
        product_code: productCode || basePid,
        state_hash: baseSh,
        customer_name: normalize(form.fullName),
        customer_phone: normalize(form.phone),
        customer_email: normalize(form.email) || null,
        customer_address: buildAddress(),
        payment_method: mapPayment(form.payment),
        qty
      };

      const data = await apiPostOrder(body);

      setOrderRes(data || null);
      setPlaced(true);
      showToast("Order placed");
    } catch (e) {
      setPlaced(false);
      setOrderRes(null);
      setErr(String(e?.message || e));
    } finally {
      setSubmitting(false);
    }
  }, [apiPostOrder, basePid, baseSh, buildAddress, form.email, form.fullName, form.payment, form.phone, mapPayment, productCode, showToast, validate, qty]);

  const close = useCallback(() => {
    if (typeof onClose === "function") return onClose();
    navigate("/customer");
  }, [navigate, onClose]);

  const goBack = useCallback(() => {
    if (openFromCustomer) return close();
    navigate(-1);
  }, [close, navigate, openFromCustomer]);

  const badge = useMemo(() => {
    if (isAuthentic === null) return { text: "Not verified", cls: "od-pill neutral" };
    if (isAuthentic) return { text: "Authentic", cls: "od-pill ok" };
    return { text: "Not authentic", cls: "od-pill bad" };
  }, [isAuthentic]);

  const headerTitle = useMemo(() => (openFromCustomer ? "Purchase" : "Orders"), [openFromCustomer]);

  const [imgOk, setImgOk] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const imgNonceRef = useRef(0);

  const ipfsCid = useMemo(() => normalize(product?.ipfs_cid) || normalize(meta?.ipfs_cid) || normalize(meta?.ipfsCid) || "", [product, meta]);
  const ipfsUrlBase = useMemo(() => (ipfsCid ? `https://gateway.pinata.cloud/ipfs/${ipfsCid}` : ""), [ipfsCid]);
  const ipfsUrl = useMemo(() => {
    if (!ipfsUrlBase) return "";
    return `${ipfsUrlBase}${ipfsUrlBase.includes("?") ? "&" : "?"}v=${encodeURIComponent(String(imgNonceRef.current))}`;
  }, [ipfsUrlBase]);

  useEffect(() => {
    imgNonceRef.current += 1;
    if (ipfsCid) {
      setImgOk(false);
      setImgLoading(true);
    } else {
      setImgOk(false);
      setImgLoading(false);
    }
  }, [ipfsCid, basePid, baseSh]);

  const mobileOnChange = useCallback(
    (e) => {
      const digits = String(e.target.value || "").replace(/\D/g, "").slice(0, 10);
      setField("phone", digits);
    },
    [setField]
  );

  const pinOnChange = useCallback(
    (e) => {
      const digits = String(e.target.value || "").replace(/\D/g, "").slice(0, 6);
      setField("pincode", digits);
    },
    [setField]
  );

  return (
    
    <div className="od-shell">
     

      <main className="od-main">
        <header className="od-top">
          <div className="od-top-left">
            <div className="od-title">{headerTitle}</div>
            <div className="od-sub">Verified checkout</div>
          </div>

          <div className="od-top-right">
            <span className={badge.cls}>{badge.text}</span>
            <button className="od-btn ghost" type="button" onClick={goBack}>
              Back
            </button>
            <button className="od-btn" type="button" onClick={close}>
              Close
            </button>
          </div>
        </header>

        {err ? <div className="od-alert bad">{err}</div> : null}

        {!canPlace ? (
          <section className="od-gate">
            <div className="od-gate-card">
              <div className="od-gate-title">Verification needed</div>
              <div className="od-gate-sub">Open this page after successful verification so productId and stateHash are available.</div>

              <div className="od-gate-kv">
                <div className="od-kv">
                  <span>productId</span>
                  <span className="mono">{hasValue(basePid) ? basePid : "-"}</span>
                </div>
                <div className="od-kv">
                  <span>stateHash</span>
                  <span className="mono">{hasValue(baseSh) ? short(baseSh, 12) : "-"}</span>
                </div>
              </div>

              <div className="od-gate-actions">
                <button className="od-btn" type="button" onClick={() => navigate("/customer")}>
                  Go to verification
                </button>
                <button className="od-btn ghost" type="button" onClick={goBack}>
                  Back
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="od-popup">
            <div className="od-popup-card">
              <div className="od-popup-body">
                <div className="od-col od-left">
                  <div className="od-block">
                    <div className="od-block-title">Product details</div>

                    <div className="od-pairs">
                      <div className="od-pair">
                        <div className="od-k">Name</div>
                        <div className="od-v">{productName}</div>
                      </div>

                      <div className="od-pair">
                        <div className="od-k">Code</div>
                        <div className="od-v mono">{productCode || basePid}</div>
                      </div>

                      <div className="od-pair">
                        <div className="od-k">Brand</div>
                        <div className="od-v">{brand || "-"}</div>
                      </div>

                      <div className="od-pair">
                        <div className="od-k">Seller</div>
                        <div className="od-v">{seller || "-"}</div>
                      </div>

                      <div className="od-pair">
                        <div className="od-k">productId</div>
                        <div className="od-v mono">{basePid}</div>
                      </div>

                      <div className="od-pair">
                        <div className="od-k">stateHash</div>
                        <div className="od-v mono">{short(baseSh, 16)}</div>
                      </div>

                      <div className="od-pair">
                        <div className="od-k">Quantity</div>
                        <div className="od-v">
                          <div className="od-qty-inline">
                            <button className="od-qty-btn" type="button" onClick={() => setField("qty", Math.max(1, qty - 1))} disabled={submitting || placed}>
                              -
                            </button>
                            <input className="od-input mono od-qty-input" value={String(qty)} onChange={(e) => setField("qty", e.target.value)} inputMode="numeric" disabled={submitting || placed} />
                            <button className="od-qty-btn" type="button" onClick={() => setField("qty", Math.min(10, qty + 1))} disabled={submitting || placed}>
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="od-total">
                        <div className="od-total-row">
                          <span>Total</span>
                          <span className="mono">₹{(() => {
                            const base = 999;
                            const subtotal = base * qty;
                            const shipping = subtotal >= 1500 ? 0 : 49;
                            const tax = Math.round(subtotal * 0.05);
                            const total = subtotal + shipping + tax;
                            return total;
                          })()}</span>
                        </div>
                        <div className="od-total-sub">Includes shipping and tax</div>
                      </div>
                    </div>
                  </div>

                  <div className="od-image-block">
                    <div className="od-image-title">Product image</div>
                    <div className="od-media-frame">
                      {ipfsUrlBase ? (
                        <>
                          {imgLoading ? (
                            <div className="od-media-skeleton">
                              <span className="od-spinner" />
                            </div>
                          ) : null}

                          <img
                            className={`od-media-img ${imgOk ? "show" : ""}`}
                            src={ipfsUrl.replace(/v=\d+$/, `v=${encodeURIComponent(String(imgNonceRef.current))}`)}
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

                          {!imgLoading && !imgOk ? <div className="od-media-fallback">No preview available</div> : null}
                        </>
                      ) : (
                        <div className="od-media-fallback">No image</div>
                      )}
                    </div>

                    <div className="od-media-actions">
                      <button className="od-btn small ghost" type="button" onClick={() => (ipfsUrlBase ? navigator.clipboard.writeText(ipfsUrlBase).then(() => showToast("Image link copied")).catch(() => showToast("Copy failed")) : null)} disabled={!ipfsUrlBase}>
                        Copy link
                      </button>
                      {ipfsUrlBase ? (
                        <a className="od-btn small" href={ipfsUrlBase} target="_blank" rel="noreferrer">
                          Open
                        </a>
                      ) : (
                        <button className="od-btn small" type="button" disabled>
                          Open
                        </button>
                      )}
                    </div>
                  </div>

                  {placed ? (
                    <div className="od-alert ok">
                      <div className="od-alert-title">Order placed</div>
                      <div className="od-alert-sub">
                        {orderRes?.order?.id ? (
                          <>
                            Order ID <span className="mono">{orderRes.order.id}</span>
                          </>
                        ) : (
                          "Your order is confirmed."
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="od-col od-right">
                  <div className="od-block">
                    <div className="od-block-title">Delivery address</div>

                    <div className="od-form-grid">
                      <div className="od-field">
                        <label className="od-label">Full name</label>
                        <input className="od-input" value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} placeholder="Your name" disabled={submitting || placed} />
                      </div>

                      <div className="od-field">
                        <label className="od-label">Mobile</label>
                        <input className="od-input mono" value={form.phone} onChange={mobileOnChange} placeholder="10-digit number" inputMode="numeric" maxLength={10} disabled={submitting || placed} />
                      </div>

                      <div className="od-field od-span-2">
                        <label className="od-label">Email (optional)</label>
                        <input className="od-input" value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="name@email.com" disabled={submitting || placed} />
                      </div>

                      <div className="od-field od-span-2">
                        <label className="od-label">Address line 1</label>
                        <input className="od-input" value={form.address1} onChange={(e) => setField("address1", e.target.value)} placeholder="House no, street, area" disabled={submitting || placed} />
                      </div>

                      <div className="od-field od-span-2">
                        <label className="od-label">Address line 2 (optional)</label>
                        <input className="od-input" value={form.address2} onChange={(e) => setField("address2", e.target.value)} placeholder="Landmark, apartment, etc." disabled={submitting || placed} />
                      </div>

                      <div className="od-field">
                        <label className="od-label">City</label>
                        <input className="od-input" value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="City" disabled={submitting || placed} />
                      </div>

                      <div className="od-field">
                        <label className="od-label">State</label>
                        <input className="od-input" value={form.state} onChange={(e) => setField("state", e.target.value)} placeholder="State" disabled={submitting || placed} />
                      </div>

                      <div className="od-field">
                        <label className="od-label">Pincode</label>
                        <input className="od-input mono" value={form.pincode} onChange={pinOnChange} placeholder="6-digit" inputMode="numeric" maxLength={6} disabled={submitting || placed} />
                      </div>

                      <div className="od-field">
                        <label className="od-label">Payment</label>
                        <select className="od-input" value={form.payment} onChange={(e) => setField("payment", e.target.value)} disabled={submitting || placed}>
                          <option value="COD">Cash on Delivery</option>
                          <option value="UPI">UPI (demo)</option>
                          <option value="CARD">Card (demo)</option>
                        </select>
                      </div>
                    </div>

                    <div className="od-actions">
                      <button className="od-btn ghost" type="button" onClick={() => setErr("")} disabled={submitting}>
                        Clear error
                      </button>

                      <button className="od-btn" type="button" onClick={placeOrder} disabled={submitting || placed}>
                        {placed ? "Placed" : submitting ? "Placing..." : "Place order"}
                      </button>
                    </div>

                    <div className="od-footnote">Your verification proof stays attached to this order.</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {toast ? <div className="od-toast">{toast}</div> : null}
    </div>
  );
}

export default Orders;
