import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const [authToken, setAuthToken] = useState(() => localStorage.getItem("auth_token") || "");
  const [authUser, setAuthUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("auth_user") || "null");
    } catch {
      return null;
    }
  });

  const isAuthed = Boolean(authToken);
  const isManufacturer = (me?.role || authUser?.role || "").toLowerCase() === "manufacturer";

  const [activeTab, setActiveTab] = useState("ops");

  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [sellerWallet, setSellerWallet] = useState("");
  const [sellerVerifying, setSellerVerifying] = useState(false);
  const [sellerVerifyRes, setSellerVerifyRes] = useState(null);

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

  const [productsLoading, setProductsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");

  const toastTimerRef = useRef(null);
  const fileInputRef = useRef(null);

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
      return "";
    }
  }, []);

  const apiFetch = useCallback(
    async (path, opts = {}) => {
      const headers = { ...(opts.headers || {}) };
      if (opts.auth !== false && authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch(`${API_BASE}${path}`, {
        ...opts,
        headers,
        cache: opts.noCache ? "no-store" : opts.cache
      });

      if (res.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setAuthToken("");
        setAuthUser(null);
        setMe(null);
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
    [authToken]
  );

  const refreshMe = useCallback(async () => {
    if (!isAuthed) {
      setMe(null);
      return null;
    }
    try {
      const data = await apiFetch("/api/auth/me", { method: "GET", noCache: true });
      const u = data?.user || null;
      setMe(u);
      if (u) {
        setAuthUser(u);
        localStorage.setItem("auth_user", safeJson(u));
      }
      return u;
    } catch {
      setMe(null);
      return null;
    }
  }, [isAuthed, apiFetch, safeJson]);

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
        await refreshMe();
      } finally {
        setMeLoading(false);
      }
    };
    run();
  }, [isAuthed, refreshMe]);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setAuthToken("");
    setAuthUser(null);
    setMe(null);
    navigate("/");
  }, [navigate]);

  const approvalText = useMemo(() => {
    const raw =
      me?.approval_status ||
      me?.onboarding_status ||
      me?.registry_status ||
      me?.status ||
      me?.state ||
      authUser?.approval_status ||
      authUser?.onboarding_status ||
      authUser?.status ||
      "";
    const t = normalize(raw).toUpperCase();
    if (!t) return "APPROVED";
    return t;
  }, [me, authUser]);

  const isApproved = useMemo(() => {
    const t = approvalText;
    if (t === "APPROVED" || t === "ACTIVE" || t === "ACCEPT") return true;
    if (t === "PENDING" || t === "REJECTED" || t === "REJECT") return false;
    return true;
  }, [approvalText]);

  const isRejected = useMemo(() => {
    const t = approvalText;
    return t === "REJECTED" || t === "REJECT";
  }, [approvalText]);

  const canUsePortal = useMemo(() => {
    return isAuthed && isManufacturer && isApproved;
  }, [isAuthed, isManufacturer, isApproved]);

  const sessionText = useMemo(() => {
    if (meLoading) return "Loading...";
    if (!isAuthed) return "Not logged in";
    if (me?.email) return `${me.email} (${me.role || "user"})`;
    if (authUser?.email) return `${authUser.email} (${authUser.role || "user"})`;
    return "Session active";
  }, [meLoading, isAuthed, me, authUser]);

  const buildQrUrl = useCallback((productId, stateHash) => {
    const u = new URL(`${WEB_BASE}/scan`);
    u.searchParams.set("productId", String(productId || ""));
    u.searchParams.set("stateHash", String(stateHash || ""));
    return u.toString();
  }, []);

  const short = useCallback((v, n = 10) => {
    const s = normalize(v);
    if (!s) return "-";
    if (s.length <= n * 2 + 3) return s;
    return `${s.slice(0, n)}...${s.slice(-n)}`;
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

  const pillClass = useCallback((t) => {
    const v = normalize(t).toUpperCase();
    if (v === "APPROVED" || v === "ACTIVE" || v === "ACCEPT") return "ok";
    if (v === "REJECTED" || v === "REJECT") return "bad";
    return "neutral";
  }, []);

  const guardManufacturer = useCallback(() => {
    if (!isAuthed) {
      navigate("/auth");
      return false;
    }
    if (!isManufacturer) {
      setError("Please login as Manufacturer to use this portal.");
      return false;
    }
    return true;
  }, [isAuthed, isManufacturer, navigate]);

  const resetAll = useCallback(() => {
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
  }, []);

  const uploadCertificateToIpfs = useCallback(async () => {
    if (!guardManufacturer()) return;
    if (!canUsePortal) return setError(isRejected ? "Your registry request was rejected." : "Waiting for regulator approval.");
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

      if (res.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setAuthToken("");
        setAuthUser(null);
        setMe(null);
        throw new Error("Session expired. Please login again.");
      }

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
  }, [guardManufacturer, canUsePortal, isRejected, certFile, authToken, showToast]);

  const verifySellerWallet = useCallback(async () => {
    if (!guardManufacturer()) return;
    if (!canUsePortal) return setError(isRejected ? "Your registry request was rejected." : "Waiting for regulator approval.");
    const w = normalize(sellerWallet);
    if (!w) return setError("Enter seller wallet address to verify.");

    setError("");
    setSellerVerifying(true);
    setSellerVerifyRes(null);

    try {
      const data = await apiFetch("/api/sellers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: safeJson({ wallet_address: w }),
        noCache: true
      });
      setSellerVerifyRes(data);
      await refreshMe();
      showToast("Seller wallet verified");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setSellerVerifying(false);
    }
  }, [guardManufacturer, canUsePortal, isRejected, sellerWallet, apiFetch, safeJson, refreshMe, showToast]);

  const canUpload = useMemo(() => Boolean(certFile) && !certUploading, [certFile, certUploading]);

  const canRegister = useMemo(() => {
    return (
      canUsePortal &&
      !registering &&
      Boolean(normalize(productCode)) &&
      Boolean(normalize(name)) &&
      (!certFile || Boolean(certUploadRes?.ipfs_cid && certUploadRes?.file_sha256))
    );
  }, [canUsePortal, registering, productCode, name, certFile, certUploadRes]);

  const loadProducts = useCallback(async () => {
    if (!isAuthed || !isManufacturer) return;

    setProductsLoading(true);
    setError("");

    try {
      const data = await apiFetch("/api/products/mine", { method: "GET", noCache: true });
      const rows = Array.isArray(data?.products) ? data.products : [];
      setProducts(rows);

      const current = normalize(selectedCode);
      const found = current ? rows.find((r) => normalize(r?.product_code) === current) : null;
      const nextSel = found ? current : rows?.[0]?.product_code || "";
      setSelectedCode(nextSel);
    } catch (e) {
      setProducts([]);
      setError(String(e?.message || e));
    } finally {
      setProductsLoading(false);
    }
  }, [isAuthed, isManufacturer, apiFetch, selectedCode]);

  useEffect(() => {
    if (!isAuthed || !isManufacturer) return;
    loadProducts();
  }, [isAuthed, isManufacturer, loadProducts]);

  const registerProduct = useCallback(async () => {
    if (!guardManufacturer()) return;
    if (!canUsePortal) return setError(isRejected ? "Your registry request was rejected." : "Waiting for regulator approval.");

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
        body: safeJson(body),
        noCache: true
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
      setSelectedCode(pc);
      setActiveTab("products");
      await loadProducts();
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setRegistering(false);
    }
  }, [
    guardManufacturer,
    canUsePortal,
    isRejected,
    productCode,
    name,
    batch,
    brand,
    notes,
    certUploadRes,
    nfcUid,
    apiFetch,
    safeJson,
    buildQrUrl,
    showToast,
    loadProducts
  ]);

  const downloadQr = useCallback((png, code) => {
    if (!png) return;
    const a = document.createElement("a");
    a.href = png;
    a.download = `${normalize(code) || "product"}-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);

  const openLink = useCallback((url) => {
    const u = normalize(url);
    if (!u) return;
    window.open(u, "_blank", "noopener,noreferrer");
  }, []);

  const runScan = useCallback(
    async (productId, stateHash) => {
      const pid = normalize(productId);
      const sh = normalize(stateHash);
      if (!pid || !sh) {
        setError("Missing productId or stateHash for verification.");
        return;
      }
      setError("");
      setScanLoading(true);
      setScanRes(null);
      try {
        const data = await apiFetch("/api/products/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          auth: false,
          body: safeJson({ productId: pid, stateHash: sh }),
          noCache: true
        });
        setScanRes(data);
        showToast("Verification completed");
      } catch (e) {
        setError(String(e?.message || e));
      } finally {
        setScanLoading(false);
      }
    },
    [apiFetch, safeJson, showToast]
  );

  const loadHistoryByCode = useCallback(
    async (code) => {
      const pc = normalize(code);
      if (!pc) return;
      setHistoryLoading(true);
      setHistoryRes(null);
      setError("");
      try {
        const data = await apiFetch(`/api/products/${encodeURIComponent(pc)}/history`, { method: "GET", auth: false, noCache: true });
        setHistoryRes(data);
      } catch (e) {
        setError(String(e?.message || e));
      } finally {
        setHistoryLoading(false);
      }
    },
    [apiFetch]
  );

  const selected = useMemo(() => {
    const code = normalize(selectedCode);
    if (!code) return null;
    return products.find((p) => normalize(p?.product_code) === code) || null;
  }, [products, selectedCode]);

  const selectedIpfsUrl = useMemo(() => {
    const cid = normalize(selected?.ipfs_cid);
    return cid ? `https://gateway.pinata.cloud/ipfs/${cid}` : "";
  }, [selected]);

  const selectedCertSha = useMemo(() => {
    const v = selected?.meta_json?.certificate_sha256;
    return typeof v === "string" ? v : "";
  }, [selected]);

  const selectedBrand = useMemo(() => {
    const v = selected?.meta_json?.brand;
    return typeof v === "string" ? v : "";
  }, [selected]);

  const selectedNotes = useMemo(() => {
    const v = selected?.meta_json?.notes;
    return typeof v === "string" ? v : "";
  }, [selected]);

  const [selectedQrUrl, setSelectedQrUrl] = useState("");
  const [selectedQrPng, setSelectedQrPng] = useState("");

  useEffect(() => {
    const make = async () => {
      const pc = normalize(selected?.product_code);
      const sh = normalize(selected?.current_state_hash);
      if (!pc || !sh) {
        setSelectedQrUrl("");
        setSelectedQrPng("");
        return;
      }
      const url = buildQrUrl(pc, sh);
      setSelectedQrUrl(url);
      try {
        const png = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 2, scale: 7 });
        setSelectedQrPng(png);
      } catch {
        setSelectedQrPng("");
      }
    };
    make();
  }, [selected, buildQrUrl]);

  useEffect(() => {
    if (!selectedCode) return;
    loadHistoryByCode(selectedCode);
    setScanRes(null);
  }, [selectedCode, loadHistoryByCode]);

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
        const png = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 2, scale: 7 });
        setQrPng(png);
      } catch {
        setQrPng("");
      }
    };
    make();
  }, [registerRes, buildQrUrl]);

  const chainContractAddress = useMemo(() => {
    const v = scanRes?.chain?.contract_address || scanRes?.chain?.contractAddress || "";
    return normalize(v) || "-";
  }, [scanRes]);

  const chainRegisterTx = useMemo(() => {
    const v =
      selected?.chain_register_tx_hash ||
      selected?.chainRegisterTxHash ||
      scanRes?.chain?.register_tx_hash ||
      scanRes?.chain?.registerTxHash ||
      "";
    return normalize(v) || "-";
  }, [selected, scanRes]);

  const chainCloudHash = useMemo(() => {
    const v = scanRes?.chain?.cloud_hash || scanRes?.chain?.cloudHash || "";
    return normalize(v) || "-";
  }, [scanRes]);

  const chainNfcHash = useMemo(() => {
    const v = scanRes?.chain?.nfc_uid_hash || scanRes?.chain?.nfcUidHash || "";
    return normalize(v) || "-";
  }, [scanRes]);

  const verdict = scanRes?.verdict || null;

  const events = useMemo(() => {
    const arr = Array.isArray(historyRes?.events) ? historyRes.events : [];
    return arr;
  }, [historyRes]);

  const meDetails = useMemo(() => {
    const email = normalize(me?.email || authUser?.email) || "-";
    const role = normalize(me?.role || authUser?.role) || "-";
    const wallet = normalize(me?.wallet_address || authUser?.wallet_address) || "-";
    const createdAt = normalize(me?.created_at || authUser?.created_at) || "";
    const id = normalize(me?.id || authUser?.id) || "-";
    return [
      ["status", approvalText],
      ["email", email],
      ["role", role],
      ["user_id", id],
      ["wallet_address", wallet],
      ["created_at", createdAt ? new Date(createdAt).toLocaleString() : "-"]
    ];
  }, [me, authUser, approvalText]);

  const selectedStatus = useMemo(() => {
    const st = normalize(selected?.audit_status).toUpperCase();
    return st ? st : "PENDING";
  }, [selected]);

  const selectedStatusClass = useMemo(() => {
    const st = normalize(selected?.audit_status).toUpperCase();
    if (st === "ACCEPT") return "ok";
    if (st === "REJECT") return "bad";
    return "neutral";
  }, [selected]);

  const renderKV = useCallback((k, v, mono = false) => {
    return (
      <div className="mfg-kv-row" key={k}>
        <div className="mfg-k">{k}</div>
        <div className={`mfg-v ${mono ? "mono" : ""}`}>{String(v ?? "-")}</div>
      </div>
    );
  }, []);

  return (
    <div className="mfg-shell">
      <Navbar />

      <header className="mfg-header">
        <div className="mfg-hl">
          <div className="mfg-badge">Manufacturer</div>
          <div className="mfg-ht">
            <div className="mfg-title">Registry & Product Operations</div>
            <div className="mfg-subtitle">Register products, generate QR, and keep verification evidence ready</div>
          </div>
        </div>

        <div className="mfg-hr">
          {!isAuthed ? (
            <button className="mfg-btn ghost" type="button" onClick={() => navigate("/auth")}>
              Go to Login
            </button>
          ) : (
            <>
              <div className="mfg-session">{sessionText}</div>
              <button className="mfg-btn ghost" type="button" onClick={logout}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      <main className="mfg-main">
        {error ? <div className="mfg-alert">{error}</div> : null}

        {!isAuthed ? (
          <div className="mfg-center">
            <div className="mfg-card">
              <div className="mfg-card-head">
                <div>
                  <div className="mfg-card-title">Login required</div>
                  <div className="mfg-card-sub">Please login as a manufacturer to continue.</div>
                </div>
                <button className="mfg-btn" type="button" onClick={() => navigate("/auth")}>
                  Login
                </button>
              </div>
            </div>
          </div>
        ) : !isManufacturer ? (
          <div className="mfg-center">
            <div className="mfg-card">
              <div className="mfg-card-head">
                <div>
                  <div className="mfg-card-title">Access restricted</div>
                  <div className="mfg-card-sub">Please login with a Manufacturer account.</div>
                </div>
                <button className="mfg-btn" type="button" onClick={() => navigate("/auth")}>
                  Switch account
                </button>
              </div>
            </div>
          </div>
        ) : !isApproved ? (
          <div className="mfg-stack">
            <div className="mfg-card">
              <div className="mfg-card-head">
                <div>
                  <div className="mfg-card-title">Registry approval</div>
                  <div className="mfg-card-sub">
                    {isRejected
                      ? "Your registry request was rejected. Contact the regulator or re-register."
                      : "Your registry request is pending regulator approval. You can view your profile details below."}
                  </div>
                </div>
                <span className={`mfg-pill ${pillClass(approvalText)}`}>{approvalText}</span>
              </div>

              <div className="mfg-card-body">
                <div className="mfg-kv">{meDetails.map(([k, v]) => renderKV(k, v, k === "wallet_address" || k === "user_id"))}</div>

                <div className="mfg-actions">
                  <button
                    className="mfg-btn ghost"
                    type="button"
                    onClick={() => copyText(me?.wallet_address || authUser?.wallet_address || "")}
                    disabled={!normalize(me?.wallet_address || authUser?.wallet_address || "")}
                  >
                    Copy Wallet
                  </button>
                  <button
                    className="mfg-btn ghost"
                    type="button"
                    onClick={() => copyText(me?.email || authUser?.email || "")}
                    disabled={!normalize(me?.email || authUser?.email || "")}
                  >
                    Copy Email
                  </button>
                  <button className="mfg-btn ghost" type="button" onClick={loadProducts} disabled={productsLoading}>
                    {productsLoading ? "Refreshing..." : "Load products"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mfg-topbar">
              <div className="mfg-seg">
                <button className={`mfg-seg-btn ${activeTab === "ops" ? "active" : ""}`} type="button" onClick={() => setActiveTab("ops")}>
                  Operations
                </button>
                <button className={`mfg-seg-btn ${activeTab === "products" ? "active" : ""}`} type="button" onClick={() => setActiveTab("products")}>
                  My Products
                </button>
              </div>

              <div className="mfg-topbar-right">
                <span className={`mfg-pill ${pillClass(approvalText)}`}>{approvalText}</span>
                <button className="mfg-btn ghost" type="button" onClick={loadProducts} disabled={productsLoading}>
                  {productsLoading ? "Refreshing..." : "Refresh products"}
                </button>
              </div>
            </div>

            {activeTab === "ops" ? (
              <section className="mfg-ops">
                <div className="mfg-grid">
                  <div className="mfg-col">
                    <div className="mfg-card">
                      <div className="mfg-card-head">
                        <div>
                          <div className="mfg-card-title">Your profile</div>
                          <div className="mfg-card-sub">Account identity and registry status.</div>
                        </div>
                      </div>
                      <div className="mfg-card-body">
                        <div className="mfg-kv">{meDetails.map(([k, v]) => renderKV(k, v, k === "wallet_address" || k === "user_id"))}</div>
                        <div className="mfg-actions">
                          <button
                            className="mfg-btn ghost"
                            type="button"
                            onClick={() => copyText(me?.wallet_address || authUser?.wallet_address || "")}
                            disabled={!normalize(me?.wallet_address || authUser?.wallet_address || "")}
                          >
                            Copy Wallet
                          </button>
                          <button
                            className="mfg-btn ghost"
                            type="button"
                            onClick={() => copyText(me?.email || authUser?.email || "")}
                            disabled={!normalize(me?.email || authUser?.email || "")}
                          >
                            Copy Email
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mfg-card">
                      <div className="mfg-card-head">
                        <div>
                          <div className="mfg-card-title">Seller verification</div>
                          <div className="mfg-card-sub">Verify seller wallet before any transfer or sale is allowed.</div>
                        </div>
                      </div>

                      <div className="mfg-card-body">
                        <div className="mfg-field">
                          <div className="mfg-label">Seller wallet address</div>
                          <input
                            className="mfg-input mono"
                            value={sellerWallet}
                            onChange={(e) => setSellerWallet(e.target.value)}
                            placeholder="0x..."
                            disabled={sellerVerifying}
                          />
                          <div className="mfg-hint">This checks seller presence or eligibility based on backend rules.</div>
                        </div>

                        <div className="mfg-actions">
                          <button className="mfg-btn" type="button" onClick={verifySellerWallet} disabled={sellerVerifying}>
                            {sellerVerifying ? "Verifying..." : "Verify seller"}
                          </button>
                          <button
                            className="mfg-btn ghost"
                            type="button"
                            onClick={() => {
                              setSellerWallet("");
                              setSellerVerifyRes(null);
                            }}
                            disabled={sellerVerifying}
                          >
                            Clear
                          </button>
                        </div>

                        {sellerVerifyRes ? (
                          <div className="mfg-softbox">
                            <div className="mfg-softbox-title">Verification result</div>
                            <div className="mfg-kv compact">
                              {renderKV("wallet_address", sellerVerifyRes.wallet_address || "-", true)}
                              {renderKV("chain_tx_hash", sellerVerifyRes.chain_tx_hash || "null", true)}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mfg-col">
                    <div className="mfg-card">
                      <div className="mfg-card-head">
                        <div>
                          <div className="mfg-card-title">Register a product</div>
                          <div className="mfg-card-sub">Upload certificate (optional), bind NFC UID, then register.</div>
                        </div>
                      </div>

                      <div className="mfg-card-body">
                        <div className="mfg-formgrid">
                          <div className="mfg-field">
                            <div className="mfg-label">Product code</div>
                            <input className="mfg-input" value={productCode} onChange={(e) => setProductCode(e.target.value)} placeholder="P2001" disabled={registering} />
                          </div>
                          <div className="mfg-field">
                            <div className="mfg-label">Batch</div>
                            <input className="mfg-input" value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="B2" disabled={registering} />
                          </div>
                          <div className="mfg-field">
                            <div className="mfg-label">Product name</div>
                            <input className="mfg-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Demo Product" disabled={registering} />
                          </div>
                          <div className="mfg-field">
                            <div className="mfg-label">Brand</div>
                            <input className="mfg-input" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand" disabled={registering} />
                          </div>
                          <div className="mfg-field">
                            <div className="mfg-label">NFC UID</div>
                            <input className="mfg-input" value={nfcUid} onChange={(e) => setNfcUid(e.target.value)} placeholder="NFC999" disabled={registering} />
                            <div className="mfg-hint">Must match the physical tag UID.</div>
                          </div>
                          <div className="mfg-field">
                            <div className="mfg-label">Notes</div>
                            <input className="mfg-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" disabled={registering} />
                          </div>
                        </div>

                        <div className="mfg-softbox">
                          <div className="mfg-softbox-title">Certificate / warranty (optional)</div>
                          <div className="mfg-uploadrow">
                            <input
                              ref={fileInputRef}
                              className="mfg-file"
                              type="file"
                              onChange={(e) => {
                                const f = e.target.files?.[0] || null;
                                setCertFile(f);
                                setCertUploadRes(null);
                              }}
                              disabled={certUploading || registering}
                            />
                            <div className="mfg-uploadbtns">
                              <button className="mfg-btn ghost" type="button" onClick={uploadCertificateToIpfs} disabled={!canUpload}>
                                {certUploading ? "Uploading..." : "Upload"}
                              </button>
                              <button
                                className="mfg-btn ghost"
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
                              <button className="mfg-btn ghost" type="button" onClick={() => openLink(certUploadRes?.ipfs_url || "")} disabled={!normalize(certUploadRes?.ipfs_url)}>
                                Open IPFS
                              </button>
                            </div>
                          </div>

                          <div className="mfg-kv compact">
                            {renderKV("ipfs_cid", certUploadRes?.ipfs_cid || "null", true)}
                            {renderKV("file_sha256", certUploadRes?.file_sha256 || "null", true)}
                          </div>
                        </div>

                        <div className="mfg-actions">
                          <button className="mfg-btn" type="button" onClick={registerProduct} disabled={!canRegister}>
                            {registering ? "Registering..." : "Register product"}
                          </button>
                          <button className="mfg-btn ghost" type="button" onClick={resetAll} disabled={registering || certUploading}>
                            Reset
                          </button>
                        </div>

                        {registerRes ? (
                          <div className="mfg-result">
                            <div className="mfg-result-head">
                              <div>
                                <div className="mfg-result-title">Registration result</div>
                                <div className="mfg-result-sub">Database, blockchain evidence, and QR link.</div>
                              </div>
                              <span className="mfg-pill neutral">NEW</span>
                            </div>

                            <div className="mfg-result-grid">
                              <div className="mfg-result-card">
                                <div className="mfg-result-card-title">Database</div>
                                <div className="mfg-kv compact">
                                  {renderKV("product_code", registerRes.product?.product_code || "-", true)}
                                  {renderKV("current_state_hash", registerRes.product?.current_state_hash || "-", true)}
                                  {renderKV("ipfs_cid", registerRes.product?.ipfs_cid || "-", true)}
                                  {renderKV("cloud_hash", registerRes.product?.cloud_hash || "-", true)}
                                  {renderKV("nfc_uid_hash", registerRes.product?.nfc_uid_hash || "-", true)}
                                </div>
                              </div>

                              <div className="mfg-result-card">
                                <div className="mfg-result-card-title">Blockchain</div>
                                <div className="mfg-kv compact">
                                  {renderKV("register_tx_hash", registerRes.chain?.register_tx_hash || "-", true)}
                                  {renderKV("contract_address", registerRes.chain?.contract_address || "-", true)}
                                </div>
                              </div>
                            </div>

                            <div className="mfg-qrbox">
                              <div className="mfg-qrhead">
                                <div className="mfg-qrtitle">QR link</div>
                                <div className="mfg-qrbtns">
                                  <button
                                    className="mfg-btn small"
                                    type="button"
                                    onClick={() => copyText(registerRes.qr?.qr_url || registerRes.qr?.qr_payload || "")}
                                    disabled={!normalize(registerRes.qr?.qr_url || registerRes.qr?.qr_payload)}
                                  >
                                    Copy link
                                  </button>
                                  <button className="mfg-btn small ghost" type="button" onClick={() => downloadQr(qrPng, registerRes.product?.product_code)} disabled={!qrPng}>
                                    Download
                                  </button>
                                  <button className="mfg-btn small ghost" type="button" onClick={() => openLink(registerRes.qr?.qr_url || "")} disabled={!normalize(registerRes.qr?.qr_url)}>
                                    Open
                                  </button>
                                  <button
                                    className="mfg-btn small ghost"
                                    type="button"
                                    onClick={() => {
                                      const sh = registerRes?.product?.current_state_hash || "";
                                      const pc = registerRes?.product?.product_code || registerRes?.qr?.productId || "";
                                      runScan(pc, sh);
                                      setActiveTab("products");
                                    }}
                                    disabled={scanLoading || !normalize(registerRes?.product?.current_state_hash)}
                                  >
                                    {scanLoading ? "Verifying..." : "Verify"}
                                  </button>
                                </div>
                              </div>

                              <div className="mfg-qrgrid">
                                <div className="mfg-qrtext">
                                  <div className="mfg-payload">{registerRes.qr?.qr_url || ""}</div>
                                  <div className="mfg-payload muted">{registerRes.qr?.qr_payload || ""}</div>
                                </div>
                                <div className="mfg-qrimgwrap">{qrPng ? <img className="mfg-qrimg" src={qrPng} alt="qr" /> : <div className="mfg-qrph">QR preview</div>}</div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="mfg-products">
                <div className="mfg-split">
                  <div className="mfg-card">
                    <div className="mfg-card-head">
                      <div>
                        <div className="mfg-card-title">My products</div>
                        <div className="mfg-card-sub">Pick a product to view QR, IPFS, chain evidence, and history.</div>
                      </div>
                      <button className="mfg-btn ghost" type="button" onClick={loadProducts} disabled={productsLoading}>
                        {productsLoading ? "Refreshing..." : "Refresh"}
                      </button>
                    </div>

                    <div className="mfg-tablewrap">
                      <table className="mfg-table">
                        <thead>
                          <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Batch</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((p) => {
                            const active = normalize(p?.product_code) === normalize(selectedCode);
                            const st = normalize(p?.audit_status).toUpperCase();
                            const statusText = st ? st : "PENDING";
                            const statusClass = st === "ACCEPT" ? "ok" : st === "REJECT" ? "bad" : "neutral";
                            return (
                              <tr key={p.product_code} className={active ? "active" : ""} onClick={() => setSelectedCode(p.product_code)}>
                                <td className="mono">{p.product_code}</td>
                                <td>{p.name || "-"}</td>
                                <td>{p.batch || "-"}</td>
                                <td>
                                  <span className={`mfg-pill ${statusClass}`}>{statusText}</span>
                                </td>
                              </tr>
                            );
                          })}

                          {products.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="mfg-empty">
                                {productsLoading ? "Loading..." : "No products found"}
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mfg-card">
                    <div className="mfg-card-head">
                      <div>
                        <div className="mfg-card-title">Selected product</div>
                        <div className="mfg-card-sub">{selected ? `Code: ${selected.product_code}` : "Select a product from the table"}</div>
                      </div>
                      {selected ? <span className={`mfg-pill ${selectedStatusClass}`}>{selectedStatus}</span> : null}
                    </div>

                    <div className="mfg-card-body">
                      {selected ? (
                        <div className="mfg-detail">
                          <div className="mfg-detail-row">
                            <div className="mfg-softbox">
                              <div className="mfg-softbox-title">Quick info</div>
                              <div className="mfg-kv compact">
                                {renderKV("product_code", selected.product_code, true)}
                                {renderKV("name", selected.name || "-")}
                                {renderKV("brand", selectedBrand || "-")}
                                {renderKV("batch", selected.batch || "-")}
                                {renderKV("ipfs_cid", selected.ipfs_cid || "-", true)}
                                {renderKV("certificate_sha256", selectedCertSha || "-", true)}
                                {renderKV("cloud_hash (DB)", selected.cloud_hash || "-", true)}
                                {renderKV("current_state_hash", short(selected.current_state_hash, 12), true)}
                                {renderKV("nfc_uid_hash (DB)", short(selected.nfc_uid_hash, 12), true)}
                                {renderKV("notes", selectedNotes || "-")}
                              </div>

                              <div className="mfg-actions">
                                <button className="mfg-btn ghost" type="button" onClick={() => copyText(selected.ipfs_cid)} disabled={!normalize(selected.ipfs_cid)}>
                                  Copy CID
                                </button>
                                <button className="mfg-btn ghost" type="button" onClick={() => copyText(selectedCertSha)} disabled={!normalize(selectedCertSha)}>
                                  Copy Cert Hash
                                </button>
                                <a className={`mfg-btn ghost ${selectedIpfsUrl ? "" : "disabled"}`} href={selectedIpfsUrl || "#"} target="_blank" rel="noreferrer">
                                  Open IPFS File
                                </a>
                              </div>
                            </div>

                            <div className="mfg-softbox">
                              <div className="mfg-softbox-title">QR</div>
                              <div className="mfg-qrgrid compact">
                                <div className="mfg-qrtext">
                                  <div className="mfg-payload">{selectedQrUrl || ""}</div>
                                  <div className="mfg-actions">
                                    <button className="mfg-btn small" type="button" onClick={() => copyText(selectedQrUrl)} disabled={!normalize(selectedQrUrl)}>
                                      Copy link
                                    </button>
                                    <button className="mfg-btn small ghost" type="button" onClick={() => downloadQr(selectedQrPng, selected.product_code)} disabled={!selectedQrPng}>
                                      Download
                                    </button>
                                    <button className="mfg-btn small ghost" type="button" onClick={() => openLink(selectedQrUrl)} disabled={!normalize(selectedQrUrl)}>
                                      Open
                                    </button>
                                  </div>
                                </div>
                                <div className="mfg-qrimgwrap">
                                  {selectedQrPng ? <img className="mfg-qrimg" src={selectedQrPng} alt="qr" /> : <div className="mfg-qrph">QR preview</div>}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mfg-detail-row">
                            <div className="mfg-softbox">
                              <div className="mfg-softbox-title">Verification</div>
                              <div className="mfg-actions">
                                <button className="mfg-btn" type="button" onClick={() => runScan(selected.product_code, selected.current_state_hash)} disabled={scanLoading}>
                                  {scanLoading ? "Verifying..." : "Verify Authenticity"}
                                </button>
                                <button className="mfg-btn ghost" type="button" onClick={() => loadHistoryByCode(selected.product_code)} disabled={historyLoading}>
                                  {historyLoading ? "Loading..." : "Refresh History"}
                                </button>
                              </div>

                              {verdict ? (
                                <div className="mfg-verdict">
                                  <div className={`mfg-verdict-pill ${verdict.isAuthentic ? "ok" : "bad"}`}>
                                    {verdict.isAuthentic ? "AUTHENTIC (HASH MATCH)" : "NOT AUTHENTIC (MISMATCH)"}
                                  </div>
                                  <div className="mfg-kv compact" style={{ marginTop: 10 }}>
                                    {renderKV("isLatestDbState", String(verdict.isLatestDbState))}
                                    {renderKV("dbCloudHashMatches", String(verdict.dbCloudHashMatches))}
                                    {renderKV("chainCloudHashMatches", String(verdict.chainCloudHashMatches))}
                                    {renderKV("message", verdict.message || "-")}
                                  </div>
                                </div>
                              ) : (
                                <div className="mfg-emptyblock">Run verification to see chain and cloud hash comparisons.</div>
                              )}
                            </div>

                            <div className="mfg-softbox">
                              <div className="mfg-softbox-title">Chain evidence</div>
                              <div className="mfg-kv compact">
                                {renderKV("contract_address", chainContractAddress, true)}
                                {renderKV("register_tx_hash", chainRegisterTx, true)}
                                {renderKV("chain_cloud_hash", chainCloudHash, true)}
                                {renderKV("chain_nfc_uid_hash", chainNfcHash, true)}
                              </div>
                              <div className="mfg-actions">
                                <button className="mfg-btn ghost" type="button" onClick={() => copyText(chainRegisterTx)} disabled={chainRegisterTx === "-"}>
                                  Copy Tx
                                </button>
                                <button className="mfg-btn ghost" type="button" onClick={() => copyText(chainContractAddress)} disabled={chainContractAddress === "-"}>
                                  Copy Contract
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mfg-softbox">
                            <div className="mfg-softbox-title">Full history</div>
                            {historyRes ? (
                              <>
                                <div className="mfg-kv compact" style={{ marginBottom: 10 }}>
                                  {renderKV("product_code", historyRes.product?.product_code || selected.product_code, true)}
                                  {renderKV("current_state_hash", historyRes.product?.current_state_hash || selected.current_state_hash || "-", true)}
                                  {renderKV("ipfs_cid", historyRes.product?.ipfs_cid || selected.ipfs_cid || "-", true)}
                                </div>

                                <div className="mfg-events">
                                  {events.map((ev) => (
                                    <div className="mfg-ev" key={ev.id || `${ev.event_type}-${ev.created_at}`}>
                                      <div className="mfg-evtop">
                                        <div className="mfg-evtype">{ev.event_type}</div>
                                        <div className="mfg-evtime">{ev.created_at ? new Date(ev.created_at).toLocaleString() : "-"}</div>
                                      </div>
                                      <div className="mfg-evbody">
                                        <div className="mfg-evrow">
                                          <span>actor</span>
                                          <span>
                                            {ev.actor_email || "-"} ({ev.actor_role || "-"})
                                          </span>
                                        </div>
                                        <div className="mfg-evrow">
                                          <span>tx</span>
                                          <span className="mono">{ev.chain_tx_hash || "null"}</span>
                                        </div>
                                        <div className="mfg-evrow">
                                          <span>notes</span>
                                          <span>{ev.notes || ""}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {events.length === 0 ? <div className="mfg-emptyblock">No events found.</div> : null}
                                </div>
                              </>
                            ) : (
                              <div className="mfg-emptyblock">{historyLoading ? "Loading..." : "No history loaded."}</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mfg-emptyblock">Select a product from the table to view details.</div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <footer className="mfg-footer">
        <div>© {new Date().getFullYear()} Fake Product Identification</div>
        <div className="mfg-foot-note">Manufacturer View</div>
      </footer>

      {toast ? <div className="mfg-toast">{toast}</div> : null}
    </div>
  );
}

export default Manufacturer;
