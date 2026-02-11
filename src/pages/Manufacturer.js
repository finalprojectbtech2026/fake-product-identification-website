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

  const [walletAddress, setWalletAddress] = useState("");
  const [walletLinking, setWalletLinking] = useState(false);
  const [walletLinked, setWalletLinked] = useState(null);

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

  const [tProductCode, setTProductCode] = useState("");
  const [tToWallet, setTToWallet] = useState("");
  const [tNotes, setTNotes] = useState("Transferred/Updated");
  const [tExtraJson, setTExtraJson] = useState('{"stage":"manufacturer_update"}');
  const [transferring, setTransferring] = useState(false);
  const [transferRes, setTransferRes] = useState(null);
  const [transferQrUrl, setTransferQrUrl] = useState("");
  const [transferQrPng, setTransferQrPng] = useState("");

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

  const profileName = useMemo(() => {
    return (
      normalize(me?.name) ||
      normalize(me?.full_name) ||
      normalize(me?.fullname) ||
      normalize(authUser?.name) ||
      normalize(authUser?.full_name) ||
      normalize(authUser?.fullname) ||
      ""
    );
  }, [me, authUser]);

  const profileCompany = useMemo(() => {
    return (
      normalize(me?.company_name) ||
      normalize(me?.company) ||
      normalize(me?.companyName) ||
      normalize(authUser?.company_name) ||
      normalize(authUser?.company) ||
      normalize(authUser?.companyName) ||
      ""
    );
  }, [me, authUser]);

  const profileLicence = useMemo(() => {
    return (
      normalize(me?.licence_number) ||
      normalize(me?.license_number) ||
      normalize(me?.licenceNo) ||
      normalize(me?.licenseNo) ||
      normalize(authUser?.licence_number) ||
      normalize(authUser?.license_number) ||
      normalize(authUser?.licenceNo) ||
      normalize(authUser?.licenseNo) ||
      ""
    );
  }, [me, authUser]);

  const sessionText = useMemo(() => {
    if (meLoading) return "Loading...";
    if (!isAuthed) return "Not logged in";
    const email = normalize(me?.email || authUser?.email);
    const role = normalize(me?.role || authUser?.role) || "user";
    const parts = [];
    if (email) parts.push(`${email} (${role})`);
    if (profileName) parts.push(profileName);
    if (profileCompany) parts.push(profileCompany);
    return parts.length ? parts.join(" • ") : "Session active";
  }, [meLoading, isAuthed, me, authUser, profileName, profileCompany]);

  const buildQrUrl = useCallback((productId, stateHash) => {
    const u = new URL(`${WEB_BASE}/scan`);
    u.searchParams.set("productId", String(productId || ""));
    u.searchParams.set("stateHash", String(stateHash || ""));
    return u.toString();
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
    if (v === "PENDING") return "warn";
    return "neutral";
  }, []);

  const walletStatus = useMemo(() => {
    const w = normalize(me?.wallet_address) || normalize(walletLinked?.wallet_address);
    return w ? w : "";
  }, [me, walletLinked]);

  const guardManufacturer = useCallback(() => {
    if (!isAuthed) {
      navigate("/auth");
      return false;
    }
    if (!isManufacturer) {
      setError("Please login as Manufacturer to use this portal.");
      return false;
    }
    if (!canUsePortal) {
      if (isRejected) setError("Your registry request was rejected.");
      else setError("Waiting for regulator approval.");
      return false;
    }
    return true;
  }, [isAuthed, isManufacturer, canUsePortal, isRejected, navigate]);

  const parseExtra = useCallback(() => {
    const raw = normalize(tExtraJson);
    if (!raw) return {};
    try {
      const obj = JSON.parse(raw);
      return obj && typeof obj === "object" ? obj : {};
    } catch {
      return null;
    }
  }, [tExtraJson]);

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
    setTransferRes(null);
    setTransferQrUrl("");
    setTransferQrPng("");
    setTToWallet("");
    setTNotes("Transferred/Updated");
    setTExtraJson('{"stage":"manufacturer_update"}');
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const uploadCertificateToIpfs = useCallback(async () => {
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

      if (res.status === 401) {
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
  }, [guardManufacturer, certFile, authToken, showToast, navigate]);

  const verifySellerWallet = useCallback(async () => {
    if (!guardManufacturer()) return;
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
  }, [guardManufacturer, sellerWallet, apiFetch, safeJson, refreshMe, showToast]);

  const linkWallet = useCallback(async () => {
    if (!guardManufacturer()) return;
    const w = normalize(walletAddress);
    if (!w) {
      setError("Enter wallet address.");
      return;
    }

    setError("");
    setWalletLinking(true);
    setWalletLinked(null);

    try {
      const data = await apiFetch("/api/sellers/manufacturer/link-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: safeJson({ wallet_address: w }),
        noCache: true
      });
      setWalletLinked(data);
      showToast("Wallet linked");
      await refreshMe();
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setWalletLinking(false);
    }
  }, [guardManufacturer, walletAddress, apiFetch, safeJson, showToast, refreshMe]);

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

  useEffect(() => {
    const c = normalize(selectedCode);
    if (!c) return;
    setTProductCode(c);
  }, [selectedCode]);

  const registerProduct = useCallback(async () => {
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
      setTProductCode(pc);
      setActiveTab("products");
      await loadProducts();
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setRegistering(false);
    }
  }, [guardManufacturer, productCode, name, batch, brand, notes, certUploadRes, nfcUid, apiFetch, safeJson, buildQrUrl, showToast, loadProducts]);

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

  useEffect(() => {
    const make = async () => {
      const payload = transferRes?.qr_payload || "";
      if (!payload) {
        setTransferQrUrl("");
        setTransferQrPng("");
        return;
      }
      try {
        const parsed = JSON.parse(payload);
        const pid = normalize(parsed?.productId);
        const sh = normalize(parsed?.stateHash);
        if (!pid || !sh) {
          setTransferQrUrl("");
          setTransferQrPng("");
          return;
        }
        const url = buildQrUrl(pid, sh);
        setTransferQrUrl(url);
        const png = await QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 2, scale: 7 });
        setTransferQrPng(png);
      } catch {
        setTransferQrUrl("");
        setTransferQrPng("");
      }
    };
    make();
  }, [transferRes, buildQrUrl]);

  const transferProduct = useCallback(async () => {
    if (!guardManufacturer()) return;

    const pc = normalize(tProductCode);
    if (!pc) {
      setError("Enter product code.");
      return;
    }

    const to = normalize(tToWallet);
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

    try {
      const body = {
        to_wallet: to,
        notes: normalize(tNotes) || "Transferred/Updated",
        extra: extraObj
      };

      const data = await apiFetch(`/api/products/${encodeURIComponent(pc)}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: safeJson(body),
        noCache: true
      });

      setTransferRes(data);
      showToast("Transfer completed");
      await loadProducts();
      setActiveTab("products");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setTransferring(false);
    }
  }, [guardManufacturer, tProductCode, tToWallet, tNotes, parseExtra, apiFetch, safeJson, showToast, loadProducts]);

  const clearTransfer = useCallback(() => {
    setTransferRes(null);
    setTransferQrUrl("");
    setTransferQrPng("");
    setTToWallet("");
    setTNotes("Transferred/Updated");
    setTExtraJson('{"stage":"manufacturer_update"}');
  }, []);

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
    const nm = profileName || "-";
    const co = profileCompany || "-";
    const lic = profileLicence || "-";
    return [
      ["status", approvalText],
      ["name", nm],
      ["company_name", co],
      ["licence_number", lic],
      ["email", email],
      ["role", role],
      ["user_id", id],
      ["wallet_address", wallet],
      ["created_at", createdAt ? new Date(createdAt).toLocaleString() : "-"]
    ];
  }, [me, authUser, approvalText, profileName, profileCompany, profileLicence]);

  const selectedStatus = useMemo(() => {
    const st = normalize(selected?.audit_status).toUpperCase();
    return st ? st : "PENDING";
  }, [selected]);

  const selectedStatusClass = useMemo(() => {
    const st = normalize(selected?.audit_status).toUpperCase();
    if (st === "ACCEPT") return "ok";
    if (st === "REJECT") return "bad";
    if (st === "PENDING") return "warn";
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

  const TopIcon = useMemo(() => {
    return (
      <svg className="mfg-mark" width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2.4c5.3 0 9.6 4.3 9.6 9.6S17.3 21.6 12 21.6 2.4 17.3 2.4 12 6.7 2.4 12 2.4Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7.6 12.2l2.6 2.6L16.6 8.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }, []);

  return (
    <div className="mfg-shell">
      <Navbar />

      <header className="mfg-header">
        <div className="mfg-hl">
          <div className="mfg-badge">
            {TopIcon}
            <span>Manufacturer</span>
          </div>
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
            </>
          )}
        </div>
      </header>

      <main className="mfg-main">
        {error ? (
          <div className="mfg-alert">
            <div className="mfg-alert-ic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 17.6h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                <path
                  d="M10.2 4.7h3.6c.8 0 1.6.4 2.1 1.1l6 9.1c.9 1.4-.1 3.1-1.8 3.1H3.9c-1.7 0-2.7-1.7-1.8-3.1l6-9.1c.5-.7 1.3-1.1 2.1-1.1Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="mfg-alert-txt">{error}</div>
          </div>
        ) : null}

        {!isAuthed ? (
          <div className="mfg-center">
            <div className="mfg-card mfg-card-lg">
              <div className="mfg-card-head">
                <div>
                  <div className="mfg-card-title">Login required</div>
                  <div className="mfg-card-sub">Please login as a manufacturer to continue.</div>
                </div>
                <button className="mfg-btn" type="button" onClick={() => navigate("/auth")}>
                  Login
                </button>
              </div>
              <div className="mfg-card-body">
                <div className="mfg-emptyblock">You are currently not authenticated. Login to access product registration, QR generation, and verification history.</div>
              </div>
            </div>
          </div>
        ) : !isManufacturer ? (
          <div className="mfg-center">
            <div className="mfg-card mfg-card-lg">
              <div className="mfg-card-head">
                <div>
                  <div className="mfg-card-title">Access restricted</div>
                  <div className="mfg-card-sub">Please login with a Manufacturer account.</div>
                </div>
                <button className="mfg-btn" type="button" onClick={() => navigate("/auth")}>
                  Switch account
                </button>
              </div>
              <div className="mfg-card-body">
                <div className="mfg-emptyblock">Your current session is not a Manufacturer role. Use a Manufacturer account to access this portal.</div>
              </div>
            </div>
          </div>
        ) : !isApproved ? (
          <div className="mfg-stack">
            <div className="mfg-card">
              <div className="mfg-card-head">
                <div>
                  <div className="mfg-card-title">Registry approval</div>
                  <div className="mfg-card-sub">{isRejected ? "Your registry request was rejected. Contact the regulator or re-register." : "Your registry request is pending regulator approval. You can view your profile details below."}</div>
                </div>
                <span className={`mfg-pill ${pillClass(approvalText)}`}>
                  <span className="mfg-dot" />
                  {approvalText}
                </span>
              </div>

              <div className="mfg-card-body">
                <div className="mfg-kv">{meDetails.map(([k, v]) => renderKV(k, v, k === "wallet_address" || k === "user_id" || k === "licence_number"))}</div>

                <div className="mfg-actions">
                  <button className="mfg-btn ghost" type="button" onClick={() => copyText(me?.wallet_address || authUser?.wallet_address || "")} disabled={!normalize(me?.wallet_address || authUser?.wallet_address || "")}>
                    Copy Wallet
                  </button>
                  <button className="mfg-btn ghost" type="button" onClick={() => copyText(me?.email || authUser?.email || "")} disabled={!normalize(me?.email || authUser?.email || "")}>
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
                <span className={`mfg-pill ${pillClass(approvalText)}`}>
                  <span className="mfg-dot" />
                  {approvalText}
                </span>
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
                        <div className="mfg-head-meta">
                          <span className="mfg-chip">{(me?.role || authUser?.role || "user").toString()}</span>
                        </div>
                      </div>
                      <div className="mfg-card-body">
                        <div className="mfg-kv">{meDetails.map(([k, v]) => renderKV(k, v, k === "wallet_address" || k === "user_id" || k === "licence_number"))}</div>
                        <div className="mfg-actions">
                          <button className="mfg-btn ghost" type="button" onClick={() => copyText(me?.wallet_address || authUser?.wallet_address || "")} disabled={!normalize(me?.wallet_address || authUser?.wallet_address || "")}>
                            Copy Wallet
                          </button>
                          <button className="mfg-btn ghost" type="button" onClick={() => copyText(me?.email || authUser?.email || "")} disabled={!normalize(me?.email || authUser?.email || "")}>
                            Copy Email
                          </button>
                          <button className="mfg-btn ghost" type="button" onClick={() => copyText(profileLicence)} disabled={!normalize(profileLicence)}>
                            Copy Licence
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mfg-card">
                      <div className="mfg-card-head">
                        <div>
                          <div className="mfg-card-title">Link wallet</div>
                          
                        </div>
                      </div>

                      <div className="mfg-card-body">
                        <div className="mfg-field">
                          <div className="mfg-label">Wallet address</div>
                          <div className="mfg-input-wrap">
                            <input className="mfg-input mono" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="0x..." disabled={walletLinking || transferring} />
                          </div>
                        </div>

                        <div className="mfg-actions">
                          <button className="mfg-btn" type="button" onClick={linkWallet} disabled={walletLinking}>
                            {walletLinking ? "Linking..." : "Link wallet"}
                          </button>
                          <button
                            className="mfg-btn ghost"
                            type="button"
                            onClick={() => {
                              setWalletAddress("");
                              setWalletLinked(null);
                            }}
                            disabled={walletLinking}
                          >
                            Clear
                          </button>
                          <button className="mfg-btn ghost" type="button" onClick={() => copyText(walletStatus)} disabled={!normalize(walletStatus)}>
                            Copy linked wallet
                          </button>
                        </div>

                        <div className="mfg-softbox" style={{ marginTop: 12 }}>
                          <div className="mfg-softbox-title">Current linked wallet</div>
                          <div className="mfg-kv compact">{renderKV("wallet_address", walletStatus || "null", true)}</div>
                        </div>

                        {walletLinked?.wallet_address ? (
                          <div className="mfg-softbox" style={{ marginTop: 12 }}>
                            <div className="mfg-softbox-title">Link result</div>
                            <div className="mfg-kv compact">{renderKV("wallet_address", walletLinked.wallet_address || "null", true)}</div>
                          </div>
                        ) : null}
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
                          <div className="mfg-input-wrap">
                            <span className="mfg-input-ic">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M4.5 7.4c0-1 .8-1.8 1.8-1.8h11.4c1 0 1.8.8 1.8 1.8v9.2c0 1-.8 1.8-1.8 1.8H6.3c-1 0-1.8-.8-1.8-1.8V7.4Z" stroke="currentColor" strokeWidth="1.6" />
                                <path d="M14.2 12h5.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                <path d="M6.8 12h4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                              </svg>
                            </span>
                            <input className="mfg-input mono" value={sellerWallet} onChange={(e) => setSellerWallet(e.target.value)} placeholder="0x..." disabled={sellerVerifying} />
                          </div>
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

                    <div className="mfg-card">
                      <div className="mfg-card-head">
                        <div>
                          <div className="mfg-card-title">Transfer / update</div>
                          <div className="mfg-card-sub">Updates product state and generates a QR scan link.</div>
                        </div>
                      </div>

                      <div className="mfg-card-body">
                        <div className="mfg-formgrid">
                          <div className="mfg-field">
                            <div className="mfg-label">Product code</div>
                            <input className="mfg-input" value={tProductCode} onChange={(e) => setTProductCode(e.target.value)} placeholder="P2001" disabled={transferring} />
                          </div>

                          <div className="mfg-field">
                            <div className="mfg-label">to_wallet</div>
                            <input className="mfg-input mono" value={tToWallet} onChange={(e) => setTToWallet(e.target.value)} placeholder="0x..." disabled={transferring} />
                          </div>

                          <div className="mfg-field">
                            <div className="mfg-label">Notes</div>
                            <input className="mfg-input" value={tNotes} onChange={(e) => setTNotes(e.target.value)} placeholder="Transferred/Updated" disabled={transferring} />
                          </div>

                          <div className="mfg-field">
                            <div className="mfg-label">Extra JSON</div>
                            <input className="mfg-input mono" value={tExtraJson} onChange={(e) => setTExtraJson(e.target.value)} placeholder='{"stage":"manufacturer_update"}' disabled={transferring} />
                          </div>
                        </div>

                        <div className="mfg-actions">
                          <button className="mfg-btn" type="button" onClick={transferProduct} disabled={transferring}>
                            {transferring ? "Updating..." : "Transfer / Update"}
                          </button>
                          <button className="mfg-btn ghost" type="button" onClick={clearTransfer} disabled={transferring}>
                            Clear
                          </button>
                          <button className="mfg-btn ghost" type="button" onClick={() => copyText(walletStatus)} disabled={!normalize(walletStatus)}>
                            Copy my wallet
                          </button>
                        </div>

                        {transferRes ? (
                          <div className="mfg-result" style={{ marginTop: 14 }}>
                            <div className="mfg-result-head">
                              <div>
                                <div className="mfg-result-title">Transfer result</div>
                                <div className="mfg-result-sub">State change evidence and QR link.</div>
                              </div>
                              <span className="mfg-pill neutral">
                                <span className="mfg-dot" />
                                UPDATED
                              </span>
                            </div>

                            <div className="mfg-softbox" style={{ marginTop: 10 }}>
                              <div className="mfg-softbox-title">Evidence</div>
                              <div className="mfg-kv compact">
                                {renderKV("prev_state_hash", transferRes?.prev_state_hash || "null", true)}
                                {renderKV("new_state_hash", transferRes?.new_state_hash || "null", true)}
                                {renderKV("chain_transfer_tx_hash", transferRes?.chain_transfer_tx_hash || "null", true)}
                              </div>
                              <div className="mfg-actions" style={{ marginTop: 10 }}>
                                <button className="mfg-btn ghost" type="button" onClick={() => copyText(transferRes?.new_state_hash || "")} disabled={!normalize(transferRes?.new_state_hash || "")}>
                                  Copy new hash
                                </button>
                                <button className="mfg-btn ghost" type="button" onClick={() => copyText(transferRes?.chain_transfer_tx_hash || "")} disabled={!normalize(transferRes?.chain_transfer_tx_hash || "")}>
                                  Copy tx
                                </button>
                              </div>
                            </div>

                            {transferQrUrl ? (
                              <div className="mfg-qrbox" style={{ marginTop: 12 }}>
                                <div className="mfg-qrhead">
                                  <div className="mfg-qrtitle">QR link</div>
                                  <div className="mfg-qrbtns">
                                    <button className="mfg-btn small" type="button" onClick={() => copyText(transferQrUrl)} disabled={!normalize(transferQrUrl)}>
                                      Copy link
                                    </button>
                                    <button className="mfg-btn small ghost" type="button" onClick={() => downloadQr(transferQrPng, tProductCode)} disabled={!transferQrPng}>
                                      Download
                                    </button>
                                    <button className="mfg-btn small ghost" type="button" onClick={() => openLink(transferQrUrl)} disabled={!normalize(transferQrUrl)}>
                                      Open
                                    </button>
                                    <button
                                      className="mfg-btn small ghost"
                                      type="button"
                                      onClick={() => {
                                        try {
                                          const parsed = JSON.parse(transferRes?.qr_payload || "{}");
                                          const pid = parsed?.productId || "";
                                          const sh = parsed?.stateHash || "";
                                          runScan(pid, sh);
                                          setActiveTab("products");
                                        } catch {
                                          setError("QR payload parse failed.");
                                        }
                                      }}
                                      disabled={scanLoading || !normalize(transferRes?.qr_payload || "")}
                                    >
                                      {scanLoading ? "Verifying..." : "Verify"}
                                    </button>
                                  </div>
                                </div>

                                <div className="mfg-qrgrid">
                                  <div className="mfg-qrtext">
                                    <div className="mfg-payload">{transferQrUrl}</div>
                                    <div className="mfg-payload muted">{transferRes?.qr_payload || ""}</div>
                                  </div>
                                  <div className="mfg-qrimgwrap">{transferQrPng ? <img className="mfg-qrimg" src={transferQrPng} alt="qr" /> : <div className="mfg-qrph">QR preview</div>}</div>
                                </div>
                              </div>
                            ) : null}
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
                        <span className="mfg-chip soft">Step by step</span>
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
                              <span className="mfg-pill neutral">
                                <span className="mfg-dot" />
                                NEW
                              </span>
                            </div>

                            <div className="mfg-qrbox">
                              <div className="mfg-qrhead">
                                <div className="mfg-qrtitle">QR link</div>
                                <div className="mfg-qrbtns">
                                  <button className="mfg-btn small" type="button" onClick={() => copyText(registerRes.qr?.qr_url || registerRes.qr?.qr_payload || "")} disabled={!normalize(registerRes.qr?.qr_url || registerRes.qr?.qr_payload)}>
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
                            const statusClass = st === "ACCEPT" ? "ok" : st === "REJECT" ? "bad" : "warn";
                            return (
                              <tr
                                key={p.product_code}
                                className={active ? "active" : ""}
                                onClick={() => {
                                  setSelectedCode(p.product_code);
                                  setTProductCode(p.product_code);
                                }}
                              >
                                <td className="mono">{p.product_code}</td>
                                <td>{p.name || "-"}</td>
                                <td>{p.batch || "-"}</td>
                                <td>
                                  <span className={`mfg-pill ${statusClass}`}>
                                    <span className="mfg-dot" />
                                    {statusText}
                                  </span>
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
                      {selected ? (
                        <span className={`mfg-pill ${selectedStatusClass}`}>
                          <span className="mfg-dot" />
                          {selectedStatus}
                        </span>
                      ) : null}
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
                                <div className="mfg-qrimgwrap">{selectedQrPng ? <img className="mfg-qrimg" src={selectedQrPng} alt="qr" /> : <div className="mfg-qrph">QR preview</div>}</div>
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
                                    <span className="mfg-dot" />
                                    {verdict.isAuthentic ? "AUTHENTIC (HASH MATCH)" : "NOT AUTHENTIC (MISMATCH)"}
                                  </div>
                                  <div className="mfg-kv compact" style={{ marginTop: 10 }}>
                                    {renderKV("isLatestDbState", String(verdict.isLatestDbState))}
                                    {renderKV("dbCloudHashMatches", String(verdict.dbCloudHashMatches))}
                                    {renderKV("chainCloudHashMatches", String(verdict.chainCloudHashMatches))}
                                    {renderKV("message", verdict.message || "-")}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="mfg-softbox">
                            <div className="mfg-softbox-title">Full history</div>
                            {historyRes ? (
                              <>
                                <div className="mfg-kv compact" style={{ marginBottom: 10 }}>
                                  {renderKV("product_code", historyRes.product?.product_code || selected.product_code, true)}
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
        <div className="mfg-foot-note">
          <span className="mfg-chip soft">Manufacturer View</span>
        </div>
      </footer>

      {toast ? <div className="mfg-toast">{toast}</div> : null}
    </div>
  );
}

export default Manufacturer;
