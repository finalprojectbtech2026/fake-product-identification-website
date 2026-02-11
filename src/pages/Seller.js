import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import Navbar from "./Navbar";
import "./Seller.css";

const API_BASE = "https://fake-product-identification-backend.vercel.app";
const WEB_BASE = typeof window !== "undefined" ? window.location.origin : "";

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

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsErr, setProductsErr] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyErr, setHistoryErr] = useState("");
  const [history, setHistory] = useState([]);

  const [authToken, setAuthToken] = useState(() => localStorage.getItem("auth_token") || "");
  const [authUser, setAuthUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("auth_user") || "null");
    } catch {
      return null;
    }
  });

  const isAuthed = Boolean(authToken);
  const roleText = useMemo(() => normalize(me?.role || authUser?.role).toLowerCase(), [me, authUser]);
  const isSeller = roleText === "seller";

  const approvalRaw = useMemo(
    () => normalize(me?.approval_status || me?.status || me?.verification_status || authUser?.approval_status || authUser?.status).toLowerCase(),
    [me, authUser]
  );

  const approvalStatus = useMemo(() => {
    if (!approvalRaw) return "unknown";
    if (["approved", "active", "verified"].includes(approvalRaw)) return "approved";
    if (["rejected", "blocked", "disabled"].includes(approvalRaw)) return "rejected";
    if (["pending", "requested", "review"].includes(approvalRaw)) return "pending";
    return approvalRaw;
  }, [approvalRaw]);

  const canUsePortal = useMemo(() => {
    if (!isAuthed) return false;
    if (!isSeller) return false;
    if (approvalStatus === "rejected") return false;
    if (approvalStatus === "pending") return false;
    return true;
  }, [isAuthed, isSeller, approvalStatus]);

  const toastTimerRef = useRef(null);

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

  const safeJson = useCallback((v) => {
    try {
      return JSON.stringify(v);
    } catch {
      return "{}";
    }
  }, []);

  const goLogin = useCallback(() => {
    navigate("/auth");
  }, [navigate]);

  const apiFetch = useCallback(
    async (path, opts = {}) => {
      const headers = { ...(opts.headers || {}) };
      if (opts.auth !== false && authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch(`${API_BASE}${path}`, {
        ...opts,
        headers,
        cache: opts.noCache ? "no-store" : opts.cache
      });

      if (res.status === 401 && opts.auth !== false) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setAuthToken("");
        setAuthUser(null);
        setMe(null);
        navigate("/auth");
        throw new Error("Session expired. Please login again.");
      }

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const m = data?.message || `Request failed (${res.status})`;
        const e = data?.error ? `: ${data.error}` : "";
        throw new Error(m + e);
      }

      return data;
    },
    [authToken, navigate]
  );

  const refreshMe = useCallback(
    async (noCache = false) => {
      if (!isAuthed) {
        setMe(null);
        return null;
      }
      const data = await apiFetch("/api/auth/me", { method: "GET", noCache });
      const u = data?.user || null;
      setMe(u);
      if (u) {
        setAuthUser(u);
        localStorage.setItem("auth_user", safeJson(u));
      }
      return u;
    },
    [apiFetch, isAuthed, safeJson]
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
        await refreshMe(true);
      } catch {
        setMe(null);
      } finally {
        setMeLoading(false);
      }
    };
    run();
  }, [isAuthed, refreshMe]);

  const guardSeller = useCallback(() => {
    if (!isAuthed) {
      goLogin();
      return false;
    }
    if (!isSeller) {
      setError("Please login as Seller to use this portal.");
      return false;
    }
    if (!canUsePortal) {
      if (approvalStatus === "pending") setError("Your seller account is pending approval.");
      else if (approvalStatus === "rejected") setError("Your seller account is rejected or disabled.");
      else setError("You are not allowed to use this portal right now.");
      return false;
    }
    return true;
  }, [isAuthed, isSeller, canUsePortal, approvalStatus, goLogin]);

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

  const identity = useMemo(() => {
    const email = normalize(me?.email || authUser?.email) || "";
    const role = normalize(me?.role || authUser?.role) || "";
    const createdAt = normalize(me?.created_at || authUser?.created_at) || "";
    const name = normalize(me?.name || authUser?.name) || "";
    const companyName = normalize(me?.company_name || authUser?.company_name) || "";
    const licenseNumber = normalize(me?.license_number || authUser?.license_number) || "";
    return { email, role, createdAt, name, companyName, licenseNumber };
  }, [me, authUser]);

  const approvalBadge = useMemo(() => {
    const v = approvalStatus || "unknown";
    if (v === "approved") return { text: "Approved", cls: "sx-badge sx-badge-ok" };
    if (v === "pending") return { text: "Pending", cls: "sx-badge sx-badge-warn" };
    if (v === "rejected") return { text: "Rejected", cls: "sx-badge sx-badge-bad" };
    return { text: v, cls: "sx-badge" };
  }, [approvalStatus]);

  const sessionLine = useMemo(() => {
    if (meLoading) return "Loading session...";
    if (!isAuthed) return "Not logged in";
    if (identity.email) return identity.email;
    return "Session active";
  }, [meLoading, isAuthed, identity.email]);

  const copyText = useCallback(
    async (v) => {
      const s = normalize(v);
      if (!s) return;
      try {
        await navigator.clipboard.writeText(s);
        showToast("Copied");
      } catch {
        setError("Copy failed. Please copy manually.");
      }
    },
    [showToast]
  );

  const linkWallet = useCallback(async () => {
    if (!guardSeller()) return;
    const w = normalize(walletAddress);
    if (!w) {
      setError("Enter wallet address.");
      return;
    }
    setError("");
    setWalletLinking(true);
    setWalletLinked(null);
    try {
      const data = await apiFetch("/api/sellers/link-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: safeJson({ wallet_address: w })
      });
      setWalletLinked(data);
      showToast("Wallet linked");
      await refreshMe(true);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setWalletLinking(false);
    }
  }, [apiFetch, guardSeller, refreshMe, safeJson, showToast, walletAddress]);

  const buildScanLink = useCallback((pid, sh) => {
    const p = encodeURIComponent(normalize(pid));
    const s = encodeURIComponent(normalize(sh));
    return `${WEB_BASE}/scan?productId=${p}&stateHash=${s}`;
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
        const link = buildScanLink(pid, sh);
        setQrValue(link);
        const png = await QRCode.toDataURL(link, { errorCorrectionLevel: "M", margin: 2, scale: 8 });
        setQrPng(png);
      } catch {
        setQrPng("");
        setQrValue("");
      }
    };
    make();
  }, [transferRes, buildScanLink]);

  const loadProducts = useCallback(async () => {
    if (!isAuthed || !isSeller || !canUsePortal) return;
    setProductsLoading(true);
    setProductsErr("");
    try {
      let data = null;
      try {
        data = await apiFetch("/api/products/mine", { method: "GET", noCache: true });
      } catch {
        data = await apiFetch("/api/products", { method: "GET", noCache: true });
      }
      const list = data?.products || data?.items || data?.data || data || [];
      setProducts(Array.isArray(list) ? list : []);
    } catch (e) {
      setProductsErr(String(e?.message || e));
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [apiFetch, canUsePortal, isAuthed, isSeller]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const selectProductFromRow = useCallback(
    async (row) => {
      const code = normalize(row?.product_code || row?.productId || row?.product_id || row?.code || row?.id);
      if (!code) return;
      setSelectedProduct(row);
      setProductCode(code);
      setHistory([]);
      setHistoryErr("");
      setHistoryLoading(true);
      try {
        const h = await apiFetch(`/api/products/${encodeURIComponent(code)}/history`, { method: "GET", noCache: true });
        const events = h?.events || h?.history || h?.data || h || [];
        setHistory(Array.isArray(events) ? events : []);
      } catch (e) {
        setHistoryErr(String(e?.message || e));
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [apiFetch]
  );

  const transferProduct = useCallback(async () => {
    if (!guardSeller()) return;

    if (!normalize(walletStatus)) {
      setError("Link your wallet first.");
      return;
    }

    const pc = normalize(productCode);
    if (!pc) {
      setError("Enter product code.");
      return;
    }

    const to = normalize(toWallet);
    if (!to) {
      setError("Enter valid to_wallet address.");
      return;
    }

    const extraObj = parseExtra();
    if (extraObj === null) {
      setError("Extra JSON is invalid.");
      return;
    }

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
        body: safeJson(body)
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
      } catch {
        setScanProductId((x) => x);
        setScanStateHash((x) => x);
      }

      showToast("Transfer completed");
      loadProducts();
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setTransferring(false);
    }
  }, [apiFetch, guardSeller, loadProducts, notes, parseExtra, productCode, safeJson, showToast, toWallet, walletStatus]);

  const scanVerify = useCallback(async () => {
    const pid = normalize(scanProductId);
    const sh = normalize(scanStateHash);
    if (!pid || !sh) {
      setError("Enter productId and stateHash to scan.");
      return;
    }
    setError("");
    setScanning(true);
    setScanRes(null);
    try {
      const data = await apiFetch("/api/products/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        auth: false,
        body: safeJson({ productId: pid, stateHash: sh })
      });
      setScanRes(data);
      showToast("Verification completed");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setScanning(false);
    }
  }, [apiFetch, safeJson, scanProductId, scanStateHash, showToast]);

  const downloadQr = useCallback(() => {
    if (!qrPng) return;
    const a = document.createElement("a");
    a.href = qrPng;
    a.download = `${normalize(productCode) || "product"}-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [productCode, qrPng]);

  const clearTransfer = useCallback(() => {
    setTransferRes(null);
    setQrPng("");
    setQrValue("");
  }, []);

  const clearScan = useCallback(() => {
    setScanRes(null);
    setError("");
  }, []);

  const fillScanInputsFromPayload = useCallback(() => {
    try {
      const parsed = JSON.parse(transferRes?.qr_payload || "{}");
      setScanProductId(normalize(parsed?.productId));
      setScanStateHash(normalize(parsed?.stateHash));
      showToast("Scan inputs filled");
    } catch {
      setError("QR payload parse failed.");
    }
  }, [showToast, transferRes]);

  const verdict = scanRes?.verdict || null;

  const scanEvidence = useMemo(() => {
    const s = scanRes || {};
    const v = s?.verdict || {};
    return {
      contract_address: s?.contract_address || v?.contract_address || s?.contractAddress || v?.contractAddress || "",
      register_tx_hash: s?.register_tx_hash || v?.register_tx_hash || "",
      chain_transfer_tx_hash: s?.chain_transfer_tx_hash || v?.chain_transfer_tx_hash || "",
      chain_cloud_hash: s?.chain_cloud_hash || v?.chain_cloud_hash || "",
      chain_nfc_uid_hash: s?.chain_nfc_uid_hash || v?.chain_nfc_uid_hash || "",
      db_cloud_hash: s?.db_cloud_hash || v?.db_cloud_hash || "",
      db_nfc_uid_hash: s?.db_nfc_uid_hash || v?.db_nfc_uid_hash || "",
      latest_state_hash: s?.latest_state_hash || v?.latest_state_hash || ""
    };
  }, [scanRes]);

  const transferEvidence = useMemo(() => {
    const t = transferRes || {};
    return {
      prev_state_hash: t?.prev_state_hash || "",
      new_state_hash: t?.new_state_hash || "",
      chain_transfer_tx_hash: t?.chain_transfer_tx_hash || ""
    };
  }, [transferRes]);

  const portalGate = useMemo(() => {
    if (!isAuthed) return { ok: false, title: "Login required", msg: "Please login to use Seller portal.", action: "Go to Login" };
    if (!isSeller) return { ok: false, title: "Access restricted", msg: "Please login with a Seller account.", action: "Switch account" };
    if (approvalStatus === "pending") return { ok: false, title: "Approval pending", msg: "Your seller account is pending approval.", action: "Refresh session" };
    if (approvalStatus === "rejected") return { ok: false, title: "Account rejected", msg: "Your seller account is rejected or disabled.", action: "Contact support" };
    return { ok: true, title: "", msg: "", action: "" };
  }, [isAuthed, isSeller, approvalStatus]);

  const onGateAction = useCallback(() => {
    if (!isAuthed) return goLogin();
    if (!isSeller) return goLogin();
    if (approvalStatus === "pending") return refreshMe(true);
    return null;
  }, [approvalStatus, goLogin, isAuthed, isSeller, refreshMe]);

  const short = useCallback((v, n = 10) => {
    const s = normalize(v);
    if (!s) return "-";
    if (s.length <= n * 2 + 3) return s;
    return `${s.slice(0, n)}...${s.slice(-n)}`;
  }, []);

  const rowStatus = useCallback((p) => {
    const raw = normalize(p?.audit_status || p?.status || p?.stage || p?.state || "");
    const t = raw ? raw.toUpperCase() : "PENDING";
    if (["ACCEPT", "APPROVED", "ACTIVE", "VERIFIED"].includes(t)) return { text: "ACTIVE", cls: "sx-chip sx-chip-ok" };
    if (["REJECT", "REJECTED", "BLOCKED", "DISABLED"].includes(t)) return { text: "BLOCKED", cls: "sx-chip sx-chip-bad" };
    if (["PENDING", "REVIEW", "REQUESTED"].includes(t)) return { text: "PENDING", cls: "sx-chip sx-chip-warn" };
    return { text: t, cls: "sx-chip" };
  }, []);

  return (
    <div className="sx-shell">
      <Navbar />

      <header className="sx-topbar">
        <div className="sx-topbar-left">
          <div className="sx-brand">
            <div className="sx-brand-mark">S</div>
            <div className="sx-brand-text">
              <div className="sx-brand-title">Seller Portal</div>
              <div className="sx-brand-sub">Wallet, transfers, QR, verification</div>
            </div>
          </div>
        </div>

        <div className="sx-topbar-right">
          <div className="sx-sessionline">
            <span className="sx-sessionlabel">Session</span>
            <span className="sx-sessionvalue">{sessionLine}</span>
            {isAuthed ? <span className={approvalBadge.cls}>{approvalBadge.text}</span> : null}
          </div>

          {!isAuthed ? (
            <button className="sx-btn sx-btn-primary" type="button" onClick={goLogin}>
              Login
            </button>
          ) : null}
        </div>
      </header>

      <main className="sx-main">
        {error ? <div className="sx-banner sx-banner-bad">{error}</div> : null}

        {!portalGate.ok ? (
          <section className="sx-hero">
            <div className="sx-hero-card">
              <div className="sx-hero-title">{portalGate.title}</div>
              <div className="sx-hero-sub">{portalGate.msg}</div>
              <div className="sx-hero-actions">
                <button className="sx-btn sx-btn-primary" type="button" onClick={onGateAction}>
                  {portalGate.action}
                </button>
                <button className="sx-btn sx-btn-ghost" type="button" onClick={() => navigate("/")}>
                  Go Home
                </button>
              </div>
              <div className="sx-hero-meta">
                <div className="sx-meta-row">
                  <span className="sx-meta-k">Role</span>
                  <span className="sx-meta-v">{isAuthed ? (isSeller ? "seller" : normalize(me?.role || authUser?.role) || "-") : "-"}</span>
                </div>
                <div className="sx-meta-row">
                  <span className="sx-meta-k">Name</span>
                  <span className="sx-meta-v">{normalize(identity.name) || "-"}</span>
                </div>
                <div className="sx-meta-row">
                  <span className="sx-meta-k">Company</span>
                  <span className="sx-meta-v">{normalize(identity.companyName) || "-"}</span>
                </div>
                <div className="sx-meta-row">
                  <span className="sx-meta-k">License</span>
                  <span className="sx-meta-v sx-mono">{normalize(identity.licenseNumber) || "-"}</span>
                </div>
                <div className="sx-meta-row">
                  <span className="sx-meta-k">Wallet</span>
                  <span className="sx-meta-v sx-mono">{short(walletStatus, 12)}</span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="sx-layout">
            <aside className="sx-side">
              <div className="sx-card">
                <div className="sx-card-head">
                  <div>
                    <div className="sx-card-title">Account</div>
                    <div className="sx-card-sub">Your session and wallet details</div>
                  </div>
                  <span className={approvalBadge.cls}>{approvalBadge.text}</span>
                </div>

                <div className="sx-kv">
                  <div className="sx-kv-row">
                    <span className="sx-k">Name</span>
                    <span className="sx-v">{normalize(identity.name) || "-"}</span>
                  </div>

                  <div className="sx-kv-row">
                    <span className="sx-k">Company</span>
                    <span className="sx-v">{normalize(identity.companyName) || "-"}</span>
                  </div>

                  <div className="sx-kv-row">
                    <span className="sx-k">License</span>
                    <span className="sx-v sx-mono">
                      <span className="sx-inline">
                        <span>{normalize(identity.licenseNumber) || "-"}</span>
                       
                      </span>
                    </span>
                  </div>

                  <div className="sx-kv-row">
                    <span className="sx-k">Email</span>
                    <span className="sx-v">
                      <span className="sx-inline">
                        <span>{normalize(identity.email) || "-"}</span>
                        
                      </span>
                    </span>
                  </div>

                  <div className="sx-kv-row">
                    <span className="sx-k">Role</span>
                    <span className="sx-v">{normalize(identity.role) || "-"}</span>
                  </div>

                  <div className="sx-kv-row">
                    <span className="sx-k">Linked wallet</span>
                    <span className="sx-v sx-mono">
                      <span className="sx-inline">
                        <span>{short(walletStatus, 12)}</span>
                        <button className="sx-mini" type="button" onClick={() => copyText(walletStatus)} disabled={!normalize(walletStatus)}>
                          Copy
                        </button>
                      </span>
                    </span>
                  </div>

                  <div className="sx-kv-row">
                    <span className="sx-k">Created</span>
                    <span className="sx-v">{identity.createdAt ? new Date(identity.createdAt).toLocaleString() : "-"}</span>
                  </div>
                </div>

                <div className="sx-divider" />

                <div className="sx-card-head" style={{ paddingTop: 0 }}>
                  <div>
                    <div className="sx-card-title">Link wallet</div>
                    <div className="sx-card-sub">Required to transfer products</div>
                  </div>
                </div>

                <div className="sx-form">
                  <div className="sx-field">
                    <label className="sx-label">Wallet address</label>
                    <input className="sx-input sx-mono" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x..." disabled={walletLinking || transferring || !canUsePortal} />
                  </div>

                  <div className="sx-actions">
                    <button className="sx-btn sx-btn-primary" type="button" onClick={linkWallet} disabled={walletLinking || !canUsePortal}>
                      {walletLinking ? "Linking..." : "Link wallet"}
                    </button>
                    <button
                      className="sx-btn sx-btn-ghost"
                      type="button"
                      onClick={() => {
                        setWalletAddress("");
                        setWalletLinked(null);
                      }}
                      disabled={walletLinking}
                    >
                      Clear
                    </button>
                  </div>

                  {walletLinked?.wallet_address ? (
                    <div className="sx-callout sx-callout-ok">
                      <div className="sx-callout-title">Linked</div>
                      <div className="sx-callout-row sx-mono">
                        <span>{short(walletLinked.wallet_address, 14)}</span>
                        <button className="sx-mini" type="button" onClick={() => copyText(walletLinked.wallet_address)}>
                          Copy
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </aside>

            <div className="sx-content">
              <div className="sx-grid">
                <div className="sx-card">
                  <div className="sx-card-head">
                    <div>
                      <div className="sx-card-title">My products</div>
                      <div className="sx-card-sub">Select a product to auto-fill transfer and load history</div>
                    </div>
                    <button className="sx-btn sx-btn-ghost" type="button" onClick={loadProducts} disabled={!canUsePortal || productsLoading}>
                      {productsLoading ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>

                  {productsErr ? <div className="sx-banner sx-banner-bad">{productsErr}</div> : null}

                  <div className="sx-tablewrap">
                    <table className="sx-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Status</th>
                          <th>Owner wallet</th>
                          <th>State hash</th>
                          <th className="sx-ta-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!productsLoading && (!products || products.length === 0) ? (
                          <tr>
                            <td colSpan="5" className="sx-empty">
                              No products found
                            </td>
                          </tr>
                        ) : null}

                        {(products || []).map((p, idx) => {
                          const code = normalize(p?.product_code || p?.productId || p?.product_id || p?.code || p?.id) || `#${idx + 1}`;
                          const ow = normalize(p?.owner_wallet || p?.ownerWallet || p?.current_owner_wallet || p?.wallet_address || "-") || "-";
                          const hs = normalize(p?.latest_state_hash || p?.state_hash || p?.stateHash || "-") || "-";
                          const status = rowStatus(p);
                          const active = normalize(selectedProduct?.product_code || selectedProduct?.productId || selectedProduct?.product_id || selectedProduct?.code || selectedProduct?.id) === code;

                          return (
                            <tr key={`${code}-${idx}`} className={active ? "sx-row-active" : ""} onClick={() => selectProductFromRow(p)}>
                              <td className="sx-mono">{code}</td>
                              <td>
                                <span className={status.cls}>{status.text}</span>
                              </td>
                              <td className="sx-mono sx-ellipsis" title={ow}>
                                {ow}
                              </td>
                              <td className="sx-mono sx-ellipsis" title={hs}>
                                {hs}
                              </td>
                              <td className="sx-ta-right" onClick={(e) => e.stopPropagation()}>
                                <button className="sx-mini" type="button" onClick={() => selectProductFromRow(p)} disabled={!canUsePortal}>
                                  Select
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {selectedProduct ? (
                    <div className="sx-subcard">
                      <div className="sx-subhead">
                        <div>
                          <div className="sx-subtitle">Selected product</div>
                          <div className="sx-submeta">{normalize(productCode) || "-"}</div>
                        </div>
                        <button className="sx-mini" type="button" onClick={() => copyText(productCode)} disabled={!normalize(productCode)}>
                          Copy code
                        </button>
                      </div>

                      <div className="sx-kv sx-kv-tight">
                        <div className="sx-kv-row">
                          <span className="sx-k">Owner</span>
                          <span className="sx-v sx-mono">
                            {short(normalize(selectedProduct?.owner_wallet || selectedProduct?.ownerWallet || selectedProduct?.current_owner_wallet || selectedProduct?.wallet_address), 14)}
                          </span>
                        </div>
                        <div className="sx-kv-row">
                          <span className="sx-k">Latest state</span>
                          <span className="sx-v sx-mono">
                            {short(normalize(selectedProduct?.latest_state_hash || selectedProduct?.state_hash || selectedProduct?.stateHash), 14)}
                          </span>
                        </div>
                      </div>

                      <div className="sx-subcard" style={{ marginTop: 12 }}>
                        <div className="sx-subhead">
                          <div>
                            <div className="sx-subtitle">History</div>
                            <div className="sx-submeta">{historyLoading ? "Loading..." : historyErr ? "Error" : `${history.length} event(s)`}</div>
                          </div>
                        </div>

                        {historyErr ? <div className="sx-banner sx-banner-bad">{historyErr}</div> : null}

                        <div className="sx-tablewrap">
                          <table className="sx-table">
                            <thead>
                              <tr>
                                <th>Time</th>
                                <th>Action</th>
                                <th>From</th>
                                <th>To</th>
                                <th>State hash</th>
                              </tr>
                            </thead>
                            <tbody>
                              {!historyLoading && (!history || history.length === 0) ? (
                                <tr>
                                  <td colSpan="5" className="sx-empty">
                                    No history available
                                  </td>
                                </tr>
                              ) : null}

                              {(history || []).map((ev, i) => {
                                const t = normalize(ev?.timestamp || ev?.time || ev?.created_at || ev?.createdAt || "");
                                const a = normalize(ev?.action || ev?.event || ev?.type || "");
                                const f = normalize(ev?.from_wallet || ev?.from || ev?.fromWallet || "");
                                const to = normalize(ev?.to_wallet || ev?.to || ev?.toWallet || "");
                                const sh = normalize(ev?.state_hash || ev?.stateHash || ev?.new_state_hash || ev?.hash || "");
                                return (
                                  <tr key={`${i}-${t}-${a}`}>
                                    <td className="sx-ellipsis" title={t}>
                                      {t || "-"}
                                    </td>
                                    <td>{a || "-"}</td>
                                    <td className="sx-mono sx-ellipsis" title={f}>
                                      {f || "-"}
                                    </td>
                                    <td className="sx-mono sx-ellipsis" title={to}>
                                      {to || "-"}
                                    </td>
                                    <td className="sx-mono sx-ellipsis" title={sh}>
                                      {sh || "-"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="sx-emptybox">Select a product to see history and auto-fill the transfer form.</div>
                  )}
                </div>

                <div className="sx-card">
                  <div className="sx-card-head">
                    <div>
                      <div className="sx-card-title">Transfer / update</div>
                      <div className="sx-card-sub">Updates product state and generates a QR scan link</div>
                    </div>
                  </div>

                  <div className="sx-form sx-form-2">
                    <div className="sx-field">
                      <label className="sx-label">Product code</label>
                      <input className="sx-input sx-mono" value={productCode} onChange={(e) => setProductCode(e.target.value)} placeholder="P1001" disabled={transferring || !canUsePortal} />
                    </div>

                    <div className="sx-field">
                      <label className="sx-label">to_wallet</label>
                      <input className="sx-input sx-mono" value={toWallet} onChange={(e) => setToWallet(e.target.value)} placeholder="0x..." disabled={transferring || !canUsePortal} />
                    </div>

                    <div className="sx-field">
                      <label className="sx-label">Notes</label>
                      <input className="sx-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Transferred/Updated" disabled={transferring || !canUsePortal} />
                    </div>

                    <div className="sx-field">
                      <label className="sx-label">Extra JSON</label>
                      <input className="sx-input sx-mono" value={extraJson} onChange={(e) => setExtraJson(e.target.value)} placeholder='{"stage":"seller_update"}' disabled={transferring || !canUsePortal} />
                    </div>
                  </div>

                  <div className="sx-actions">
                    <button className="sx-btn sx-btn-primary" type="button" onClick={transferProduct} disabled={transferring || !canUsePortal || !normalize(walletStatus)}>
                      {transferring ? "Updating..." : "Transfer / Update"}
                    </button>
                    <button className="sx-btn sx-btn-ghost" type="button" onClick={clearTransfer} disabled={transferring}>
                      Clear
                    </button>
                  </div>

                  {transferRes ? (
                    <div className="sx-subcard">
                      <div className="sx-subhead">
                        <div>
                          <div className="sx-subtitle">Transfer result</div>
                          <div className="sx-submeta">Chain + state change evidence</div>
                        </div>
                      </div>

                      <div className="sx-kv sx-kv-tight">
                        <div className="sx-kv-row">
                          <span className="sx-k">prev_state_hash</span>
                          <span className="sx-v sx-mono">
                            <span className="sx-inline">
                              <span>{short(transferEvidence.prev_state_hash, 14)}</span>
                              <button className="sx-mini" type="button" onClick={() => copyText(transferEvidence.prev_state_hash)} disabled={!normalize(transferEvidence.prev_state_hash)}>
                                Copy
                              </button>
                            </span>
                          </span>
                        </div>
                        <div className="sx-kv-row">
                          <span className="sx-k">new_state_hash</span>
                          <span className="sx-v sx-mono">
                            <span className="sx-inline">
                              <span>{short(transferEvidence.new_state_hash, 14)}</span>
                              <button className="sx-mini" type="button" onClick={() => copyText(transferEvidence.new_state_hash)} disabled={!normalize(transferEvidence.new_state_hash)}>
                                Copy
                              </button>
                            </span>
                          </span>
                        </div>
                        <div className="sx-kv-row">
                          <span className="sx-k">chain_transfer_tx_hash</span>
                          <span className="sx-v sx-mono">
                            <span className="sx-inline">
                              <span>{short(transferEvidence.chain_transfer_tx_hash, 14)}</span>
                              <button className="sx-mini" type="button" onClick={() => copyText(transferEvidence.chain_transfer_tx_hash)} disabled={!normalize(transferEvidence.chain_transfer_tx_hash)}>
                                Copy
                              </button>
                            </span>
                          </span>
                        </div>
                      </div>

                      {qrValue ? (
                        <div className="sx-qrbox">
                          <div className="sx-qrhead">
                            <div>
                              <div className="sx-subtitle">QR scan link</div>
                              <div className="sx-submeta">Use Google Lens to open and verify</div>
                            </div>
                            <div className="sx-qractions">
                              <button className="sx-btn sx-btn-ghost" type="button" onClick={() => copyText(qrValue)}>
                                Copy link
                              </button>
                              <button className="sx-btn sx-btn-ghost" type="button" onClick={downloadQr} disabled={!qrPng}>
                                Download QR
                              </button>
                              <a className="sx-btn sx-btn-ghost sx-link" href={qrValue} target="_blank" rel="noreferrer">
                                Open
                              </a>
                            </div>
                          </div>

                          <div className="sx-qrgrid">
                            <div className="sx-qrpayload sx-mono">{qrValue}</div>
                            <div className="sx-qrimgwrap">{qrPng ? <img className="sx-qrimg" src={qrPng} alt="qr" /> : <div className="sx-placeholder">QR preview</div>}</div>
                          </div>

                          <button className="sx-btn sx-btn-ghost sx-full" type="button" onClick={fillScanInputsFromPayload}>
                            Fill verify fields
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="sx-card">
                  <div className="sx-card-head">
                    <div>
                      <div className="sx-card-title">Verify (public scan)</div>
                      <div className="sx-card-sub">Checks DB state and blockchain hash match</div>
                    </div>
                  </div>

                  <div className="sx-form sx-form-2">
                    <div className="sx-field">
                      <label className="sx-label">productId</label>
                      <input className="sx-input sx-mono" value={scanProductId} onChange={(e) => setScanProductId(e.target.value)} placeholder="P1001" disabled={scanning} />
                    </div>
                    <div className="sx-field">
                      <label className="sx-label">stateHash</label>
                      <input className="sx-input sx-mono" value={scanStateHash} onChange={(e) => setScanStateHash(e.target.value)} placeholder="(from QR payload)" disabled={scanning} />
                    </div>
                  </div>

                  <div className="sx-actions">
                    <button className="sx-btn sx-btn-primary" type="button" onClick={scanVerify} disabled={scanning}>
                      {scanning ? "Verifying..." : "Verify"}
                    </button>
                    <button className="sx-btn sx-btn-ghost" type="button" onClick={clearScan} disabled={scanning}>
                      Clear
                    </button>
                  </div>

                  {verdict ? (
                    <div className={`sx-verdict ${verdict.isAuthentic ? "sx-verdict-ok" : "sx-verdict-bad"}`}>
                      <div className="sx-verdict-top">
                        <div className={`sx-verdict-badge ${verdict.isAuthentic ? "sx-badge-ok" : "sx-badge-bad"}`}>{verdict.isAuthentic ? "AUTHENTIC" : "NOT AUTHENTIC"}</div>
                        <div className="sx-verdict-msg">{verdict.message || ""}</div>
                      </div>

                      <div className="sx-kv sx-kv-tight">
                        <div className="sx-kv-row">
                          <span className="sx-k">isLatestDbState</span>
                          <span className="sx-v">{String(verdict.isLatestDbState)}</span>
                        </div>
                        <div className="sx-kv-row">
                          <span className="sx-k">dbCloudHashMatches</span>
                          <span className="sx-v">{String(verdict.dbCloudHashMatches)}</span>
                        </div>
                        <div className="sx-kv-row">
                          <span className="sx-k">chainCloudHashMatches</span>
                          <span className="sx-v">{String(verdict.chainCloudHashMatches)}</span>
                        </div>
                      </div>

                      <div className="sx-subcard" style={{ marginTop: 12 }}>
                        <div className="sx-subhead">
                          <div>
                            <div className="sx-subtitle">Evidence</div>
                            <div className="sx-submeta">Blockchain + DB fields</div>
                          </div>
                        </div>

                        <div className="sx-kv sx-kv-tight">
                          {[
                            ["contract_address", scanEvidence.contract_address],
                            ["register_tx_hash", scanEvidence.register_tx_hash],
                            ["chain_transfer_tx_hash", scanEvidence.chain_transfer_tx_hash],
                            ["chain_cloud_hash", scanEvidence.chain_cloud_hash],
                            ["chain_nfc_uid_hash", scanEvidence.chain_nfc_uid_hash],
                            ["db_cloud_hash", scanEvidence.db_cloud_hash],
                            ["db_nfc_uid_hash", scanEvidence.db_nfc_uid_hash],
                            ["latest_state_hash", scanEvidence.latest_state_hash]
                          ].map(([k, v]) => (
                            <div className="sx-kv-row" key={k}>
                              <span className="sx-k">{k}</span>
                              <span className="sx-v sx-mono">
                                <span className="sx-inline">
                                  <span>{short(v, 14)}</span>
                                  <button className="sx-mini" type="button" onClick={() => copyText(v)} disabled={!normalize(v)}>
                                    Copy
                                  </button>
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="sx-emptybox">Run verification to view authenticity verdict and evidence.</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="sx-footer">
        <div>© {new Date().getFullYear()} Fake Product Identification</div>
        <div className="sx-footer-tag">Seller</div>
      </footer>

      {toast ? <div className="sx-toast">{toast}</div> : null}
    </div>
  );
}

export default Seller;
