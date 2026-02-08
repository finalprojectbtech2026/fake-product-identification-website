import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Regulator.css";

const API_BASE = "https://fake-product-identification-backend.vercel.app";
const normalize = (v) => String(v || "").trim();

function Regulator() {
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
  const isRegulator = (me?.role || authUser?.role || "").toLowerCase() === "regulator";

  const [activeTab, setActiveTab] = useState("manufacturers");

  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [manufacturersLoading, setManufacturersLoading] = useState(false);
  const [manufacturers, setManufacturers] = useState([]);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState("");
  const [mActionLoading, setMActionLoading] = useState(false);
  const [mDecisionReason, setMDecisionReason] = useState("");

  const [productsLoading, setProductsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [scanLoading, setScanLoading] = useState(false);
  const [scanRes, setScanRes] = useState(null);

  const [auditReason, setAuditReason] = useState("");

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRes, setHistoryRes] = useState(null);

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

  useEffect(() => {
    if (!isAuthed) return;
    if (!meLoading && (me || authUser) && !isRegulator) setError("Please login as Regulator to use this portal.");
  }, [isAuthed, meLoading, me, authUser, isRegulator]);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setAuthToken("");
    setAuthUser(null);
    navigate("/");
  }, [navigate]);

  const renderKeyValue = useCallback(
    (k, v) => (
      <div className="r-kv-row" key={k}>
        <span>{k}</span>
        <span className={String(v ?? "").startsWith("0x") ? "mono" : ""}>{String(v ?? "-")}</span>
      </div>
    ),
    []
  );

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

  const short = useCallback((v, n = 10) => {
    const s = normalize(v);
    if (!s) return "-";
    if (s.length <= n * 2 + 3) return s;
    return `${s.slice(0, n)}...${s.slice(-n)}`;
  }, []);

  const loadManufacturers = useCallback(async () => {
    if (!isAuthed || !isRegulator) return;
    setManufacturersLoading(true);
    setError("");
    try {
      let data = null;
      try {
        data = await apiFetch("/api/manufacturers?status=pending", { method: "GET" });
      } catch {
        data = await apiFetch("/api/manufacturers/pending", { method: "GET" });
      }

      const rows =
        (Array.isArray(data?.manufacturers) && data.manufacturers) ||
        (Array.isArray(data?.pending) && data.pending) ||
        (Array.isArray(data) && data) ||
        [];

      setManufacturers(rows);

      const firstId =
        rows?.[0]?.id ||
        rows?.[0]?._id ||
        rows?.[0]?.manufacturer_id ||
        rows?.[0]?.manufacturerId ||
        rows?.[0]?.email ||
        "";

      if (!selectedManufacturerId && firstId) setSelectedManufacturerId(String(firstId));
    } catch (e) {
      setManufacturers([]);
      setError(String(e?.message || e));
    } finally {
      setManufacturersLoading(false);
    }
  }, [apiFetch, isAuthed, isRegulator, selectedManufacturerId]);

  const manufacturerIdOf = useCallback((m) => {
    return (
      String(m?.id ?? "") ||
      String(m?._id ?? "") ||
      String(m?.manufacturer_id ?? "") ||
      String(m?.manufacturerId ?? "") ||
      String(m?.email ?? "") ||
      ""
    );
  }, []);

  const selectedManufacturer = useMemo(() => {
    const sid = normalize(selectedManufacturerId);
    if (!sid) return null;
    return (
      manufacturers.find((m) => normalize(manufacturerIdOf(m)) === sid) ||
      manufacturers.find((m) => normalize(m?.email) === sid) ||
      null
    );
  }, [manufacturers, manufacturerIdOf, selectedManufacturerId]);

  const manufacturerStatusText = useCallback((m) => {
    const raw = normalize(m?.status || m?.approval_status || m?.onboarding_status || m?.state);
    const t = raw.toUpperCase();
    if (t) return t;
    return "PENDING";
  }, []);

  const manufacturerPillClass = useCallback(
    (m) => {
      const t = manufacturerStatusText(m);
      if (t === "APPROVED" || t === "ACCEPT" || t === "ACTIVE") return "ok";
      if (t === "REJECTED" || t === "REJECT") return "bad";
      return "neutral";
    },
    [manufacturerStatusText]
  );

  const postManufacturerDecision = useCallback(
    async (id, decision, reason) => {
      const rid = normalize(id);
      if (!rid) throw new Error("Missing manufacturer id");
      const payload = { decision, reason: normalize(reason) || undefined };

      try {
        await apiFetch(`/api/manufacturers/${encodeURIComponent(rid)}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: normalize(reason) || undefined })
        });
        return;
      } catch {}

      try {
        await apiFetch(`/api/manufacturers/${encodeURIComponent(rid)}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: normalize(reason) || undefined })
        });
        return;
      } catch {}

      await apiFetch(`/api/manufacturers/${encodeURIComponent(rid)}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    },
    [apiFetch]
  );

  const approveManufacturer = useCallback(async () => {
    if (!isRegulator) {
      setError("Please login as Regulator to use this portal.");
      return;
    }
    if (!selectedManufacturer) {
      setError("Select a manufacturer to approve.");
      return;
    }
    const id = manufacturerIdOf(selectedManufacturer);
    if (!normalize(id)) {
      setError("Manufacturer id is missing.");
      return;
    }
    setError("");
    setMActionLoading(true);
    try {
      await postManufacturerDecision(id, "APPROVE", mDecisionReason);
      showToast("Manufacturer approved");
      setMDecisionReason("");
      await loadManufacturers();
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setMActionLoading(false);
    }
  }, [isRegulator, loadManufacturers, mDecisionReason, manufacturerIdOf, postManufacturerDecision, selectedManufacturer, showToast]);

  const rejectManufacturer = useCallback(async () => {
    if (!isRegulator) {
      setError("Please login as Regulator to use this portal.");
      return;
    }
    if (!selectedManufacturer) {
      setError("Select a manufacturer to reject.");
      return;
    }
    const id = manufacturerIdOf(selectedManufacturer);
    if (!normalize(id)) {
      setError("Manufacturer id is missing.");
      return;
    }
    setError("");
    setMActionLoading(true);
    try {
      await postManufacturerDecision(id, "REJECT", mDecisionReason);
      showToast("Manufacturer rejected");
      setMDecisionReason("");
      await loadManufacturers();
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setMActionLoading(false);
    }
  }, [isRegulator, loadManufacturers, mDecisionReason, manufacturerIdOf, postManufacturerDecision, selectedManufacturer, showToast]);

  useEffect(() => {
    if (!isAuthed || !isRegulator) return;
    loadManufacturers();
  }, [isAuthed, isRegulator, loadManufacturers]);

  const loadProducts = useCallback(async () => {
    if (!isAuthed) return;
    setProductsLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/products", { method: "GET" });
      const rows = Array.isArray(data?.products) ? data.products : [];
      setProducts(rows);
      if (!selectedCode && rows.length) setSelectedCode(rows[0].product_code);
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setProductsLoading(false);
    }
  }, [apiFetch, isAuthed, selectedCode]);

  useEffect(() => {
    if (!isAuthed || !isRegulator) return;
    loadProducts();
  }, [isAuthed, isRegulator, loadProducts]);

  const selected = useMemo(() => {
    const code = normalize(selectedCode);
    return products.find((p) => normalize(p.product_code) === code) || null;
  }, [products, selectedCode]);

  const ipfsUrl = useMemo(() => {
    const cid = normalize(selected?.ipfs_cid);
    return cid ? `https://gateway.pinata.cloud/ipfs/${cid}` : "";
  }, [selected]);

  const certificateSha = useMemo(() => {
    const v = selected?.meta_json?.certificate_sha256;
    return typeof v === "string" ? v : "";
  }, [selected]);

  const brand = useMemo(() => {
    const v = selected?.meta_json?.brand;
    return typeof v === "string" ? v : "";
  }, [selected]);

  const events = useMemo(() => {
    const arr = Array.isArray(historyRes?.events) ? historyRes.events : [];
    return arr;
  }, [historyRes]);

  const runScanForSelected = useCallback(async () => {
    if (!selected) return;
    const pid = normalize(selected.product_code);
    const sh = normalize(selected.current_state_hash);
    if (!pid || !sh) {
      setError("Missing productId or stateHash for this product.");
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
        body: JSON.stringify({ productId: pid, stateHash: sh })
      });
      setScanRes(data);
      showToast("Verification completed");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setScanLoading(false);
    }
  }, [apiFetch, selected, showToast]);

  const loadHistory = useCallback(
    async (code) => {
      const pc = normalize(code || selectedCode);
      if (!pc) return;
      setHistoryLoading(true);
      setError("");
      try {
        const data = await apiFetch(`/api/products/${encodeURIComponent(pc)}/history`, { method: "GET", auth: false });
        setHistoryRes(data);
        showToast("History loaded");
      } catch (e) {
        setHistoryRes(null);
        setError(String(e?.message || e));
      } finally {
        setHistoryLoading(false);
      }
    },
    [apiFetch, selectedCode, showToast]
  );

  useEffect(() => {
    setScanRes(null);
    setHistoryRes(null);
    setAuditReason("");
    if (!isAuthed || !isRegulator) return;
    if (!selectedCode) return;
    loadHistory(selectedCode);
  }, [selectedCode, isAuthed, isRegulator, loadHistory]);

  const postAudit = useCallback(
    async (pc, decision, reason) => {
      await apiFetch(`/api/products/${encodeURIComponent(pc)}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason: normalize(reason) || undefined })
      });
    },
    [apiFetch]
  );

  const auditDecision = useCallback(
    async (productCode, decision) => {
      const pc = normalize(productCode);
      if (!pc) return;
      if (!isRegulator) {
        setError("Please login as Regulator to use this portal.");
        return;
      }
      setError("");
      setActionLoading(true);
      try {
        try {
          await postAudit(pc, decision, auditReason);
        } catch {
          await apiFetch(`/api/products/${encodeURIComponent(pc)}/audit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ decision })
          });
        }

        showToast(decision === "ACCEPT" ? "Accepted as original" : "Marked as duplicate");
        await loadProducts();
        if (normalize(selectedCode) === pc) {
          setScanRes(null);
          await loadHistory(pc);
        }
      } catch (e) {
        setError(String(e?.message || e));
      } finally {
        setActionLoading(false);
      }
    },
    [apiFetch, auditReason, isRegulator, loadHistory, loadProducts, postAudit, selectedCode, showToast]
  );

  const pillClass = useCallback((p) => {
    const t = normalize(p?.audit_status).toUpperCase();
    if (t === "ACCEPT") return "ok";
    if (t === "REJECT") return "bad";
    return "neutral";
  }, []);

  const pillText = useCallback((p) => {
    const t = normalize(p?.audit_status).toUpperCase();
    if (t === "ACCEPT") return "ACCEPTED";
    if (t === "REJECT") return "REJECTED";
    return "PENDING";
  }, []);

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

  const manufacturerDetails = useMemo(() => {
    if (!selectedManufacturer) return [];
    const m = selectedManufacturer;

    const docsCid =
      normalize(m?.ipfs_cid) ||
      normalize(m?.docs_ipfs_cid) ||
      normalize(m?.documents_ipfs_cid) ||
      normalize(m?.document_cid) ||
      normalize(m?.kyc_ipfs_cid) ||
      "";

    const name = normalize(m?.company_name) || normalize(m?.company) || normalize(m?.name) || normalize(m?.manufacturer_name) || "";
    const email = normalize(m?.email) || normalize(m?.manufacturer_email) || "";
    const phone = normalize(m?.phone) || normalize(m?.mobile) || "";
    const wallet = normalize(m?.wallet_address) || normalize(m?.wallet) || "";
    const regNo = normalize(m?.registration_no) || normalize(m?.registration_number) || normalize(m?.reg_no) || "";
    const country = normalize(m?.country) || normalize(m?.location) || "";
    const createdAt = normalize(m?.created_at) || normalize(m?.createdAt) || "";
    const status = manufacturerStatusText(m);

    const rows = [
      ["status", status],
      ["company", name || "-"],
      ["email", email || "-"],
      ["phone", phone || "-"],
      ["wallet_address", wallet || "-"],
      ["registration_no", regNo || "-"],
      ["country", country || "-"],
      ["created_at", createdAt ? new Date(createdAt).toLocaleString() : "-"]
    ];

    if (docsCid) rows.push(["documents_ipfs_cid", docsCid]);

    return rows;
  }, [manufacturerStatusText, selectedManufacturer]);

  const manufacturerDocsUrl = useMemo(() => {
    const cid =
      normalize(selectedManufacturer?.ipfs_cid) ||
      normalize(selectedManufacturer?.docs_ipfs_cid) ||
      normalize(selectedManufacturer?.documents_ipfs_cid) ||
      normalize(selectedManufacturer?.document_cid) ||
      normalize(selectedManufacturer?.kyc_ipfs_cid) ||
      "";
    return cid ? `https://gateway.pinata.cloud/ipfs/${cid}` : "";
  }, [selectedManufacturer]);

  useEffect(() => {
    if (!isAuthed) return;
    if (!isRegulator) return;
    if (activeTab === "manufacturers") loadManufacturers();
    if (activeTab === "products") loadProducts();
  }, [activeTab, isAuthed, isRegulator, loadManufacturers, loadProducts]);

  return (
    <div className="r-shell">
      <Navbar />

      <header className="r-header">
        <div className="r-head-left">
          <div className="r-mark">Regulator</div>
          <div className="r-head-text">
            <div className="r-title">Audit & Verification</div>
            <div className="r-subtitle">Approve manufacturers, then verify products and accept or reject</div>
          </div>
        </div>

        <div className="r-head-right">
          {!isAuthed ? (
            <button className="r-btn ghost" type="button" onClick={() => navigate("/auth")}>
              Go to Login
            </button>
          ) : (
            <>
              <div className="r-session">{meLoading ? "Loading..." : me ? `${me.email} (${me.role})` : "Session active"}</div>
              <button className="r-btn ghost" type="button" onClick={logout}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      <main className="r-main">
        {error ? <div className="r-alert">{error}</div> : null}

        <div className="r-tabs">
          <button
            className={`r-tab-btn ${activeTab === "manufacturers" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab("manufacturers")}
            disabled={!isRegulator}
          >
            Manufacturer details
          </button>
          <button
            className={`r-tab-btn ${activeTab === "products" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab("products")}
            disabled={!isRegulator}
          >
            Products approval
          </button>
        </div>

        {activeTab === "manufacturers" ? (
          <section className="r-split">
            <div className="r-card">
              <div className="r-card-head">
                <div>
                  <div className="r-card-title">Manufacturer onboarding</div>
                  <div className="r-card-sub">Approve or reject manufacturer registry requests</div>
                </div>
                <button className="r-btn ghost" type="button" onClick={loadManufacturers} disabled={manufacturersLoading || !isRegulator}>
                  {manufacturersLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div className="r-table-wrap">
                <table className="r-table r-table-compact">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Email</th>
                      <th>Wallet</th>
                      <th>Status</th>
                      <th className="ta-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manufacturers.map((m) => {
                      const id = manufacturerIdOf(m);
                      const active = normalize(id) === normalize(selectedManufacturerId);
                      const company = normalize(m?.company_name) || normalize(m?.company) || normalize(m?.name) || normalize(m?.manufacturer_name) || "-";
                      const email = normalize(m?.email) || normalize(m?.manufacturer_email) || "-";
                      const wallet = normalize(m?.wallet_address) || normalize(m?.wallet) || "-";
                      return (
                        <tr key={id || email} className={active ? "active" : ""} onClick={() => setSelectedManufacturerId(id || email)}>
                          <td>{company}</td>
                          <td>{email}</td>
                          <td className="mono">{wallet === "-" ? "-" : short(wallet, 10)}</td>
                          <td>
                            <span className={`r-pill ${manufacturerPillClass(m)}`}>{manufacturerStatusText(m)}</span>
                          </td>
                          <td className="ta-right">
                            <div className="r-row-actions" onClick={(e) => e.stopPropagation()}>
                              <button className="r-btn small" type="button" onClick={() => setSelectedManufacturerId(id || email)}>
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {manufacturers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="r-empty">
                          {manufacturersLoading ? "Loading..." : "No pending manufacturers"}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="r-card">
              <div className="r-card-head">
                <div>
                  <div className="r-card-title">Review & decision</div>
                  <div className="r-card-sub">Selected manufacturer details and approval actions</div>
                </div>
              </div>

              <div className="r-section">
                {selectedManufacturer ? (
                  <>
                    <div className="r-kv">{manufacturerDetails.map(([k, v]) => renderKeyValue(k, v))}</div>

                    <div className="r-actions">
                      <button
                        className="r-btn ghost"
                        type="button"
                        onClick={() => copyText(normalize(selectedManufacturer?.wallet_address || selectedManufacturer?.wallet || ""))}
                        disabled={!normalize(selectedManufacturer?.wallet_address || selectedManufacturer?.wallet || "")}
                      >
                        Copy Wallet
                      </button>
                      <button
                        className="r-btn ghost"
                        type="button"
                        onClick={() => copyText(normalize(selectedManufacturer?.email || selectedManufacturer?.manufacturer_email || ""))}
                        disabled={!normalize(selectedManufacturer?.email || selectedManufacturer?.manufacturer_email || "")}
                      >
                        Copy Email
                      </button>
                      <a className={`r-btn link ${manufacturerDocsUrl ? "" : "disabled"}`} href={manufacturerDocsUrl || "#"} target="_blank" rel="noreferrer">
                        Open Documents (IPFS)
                      </a>
                    </div>

                    <div className="r-field" style={{ marginTop: 12 }}>
                      <div className="r-field-label">Reason / Notes</div>
                      <textarea
                        className="r-textarea"
                        value={mDecisionReason}
                        onChange={(e) => setMDecisionReason(e.target.value)}
                        placeholder="Write reason for approve/reject (optional)"
                        disabled={mActionLoading || !isRegulator}
                        rows={4}
                      />
                      <div className="r-hint">This will be sent if backend supports it.</div>
                    </div>

                    <div className="r-actions">
                      <button className="r-btn ghost" type="button" onClick={approveManufacturer} disabled={mActionLoading || !isRegulator}>
                        {mActionLoading ? "Saving..." : "Approve manufacturer"}
                      </button>
                      <button className="r-btn danger" type="button" onClick={rejectManufacturer} disabled={mActionLoading || !isRegulator}>
                        {mActionLoading ? "Saving..." : "Reject manufacturer"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="r-empty-block">Select a manufacturer from the table to review and approve/reject.</div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="r-split">
            <div className="r-card">
              <div className="r-card-head">
                <div>
                  <div className="r-card-title">Products</div>
                  <div className="r-card-sub">Select a product, then approve or reject</div>
                </div>
                <button className="r-btn ghost" type="button" onClick={loadProducts} disabled={productsLoading || !isRegulator}>
                  {productsLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div className="r-table-wrap">
                <table className="r-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Batch</th>
                      <th>Status</th>
                      <th className="ta-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const active = normalize(p.product_code) === normalize(selectedCode);
                      return (
                        <tr key={p.product_code} className={active ? "active" : ""} onClick={() => setSelectedCode(p.product_code)}>
                          <td className="mono">{p.product_code}</td>
                          <td>{p.name || "-"}</td>
                          <td>{p.batch || "-"}</td>
                          <td>
                            <span className={`r-pill ${pillClass(p)}`}>{pillText(p)}</span>
                          </td>
                          <td className="ta-right">
                            <div className="r-row-actions" onClick={(e) => e.stopPropagation()}>
                              <button className="r-btn small" type="button" onClick={() => setSelectedCode(p.product_code)}>
                                View
                              </button>
                              <button className="r-btn small ghost" type="button" onClick={() => auditDecision(p.product_code, "ACCEPT")} disabled={actionLoading || !isRegulator}>
                                Accept
                              </button>
                              <button className="r-btn small danger" type="button" onClick={() => auditDecision(p.product_code, "REJECT")} disabled={actionLoading || !isRegulator}>
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="r-empty">
                          {productsLoading ? "Loading..." : "No products found"}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="r-card">
              <div className="r-card-head">
                <div>
                  <div className="r-card-title">Selected product</div>
                  <div className="r-card-sub">{selected ? `Code: ${selected.product_code}` : "Pick a product from the table"}</div>
                </div>
              </div>

              <div className="r-section">
                {selected ? (
                  <>
                    <div className="r-section-title">Document check (IPFS)</div>
                    <div className="r-kv">
                      {renderKeyValue("ipfs_cid", selected.ipfs_cid || "-")}
                      {renderKeyValue("certificate_sha256", certificateSha || "-")}
                      {renderKeyValue("cloud_hash (DB)", selected.cloud_hash || "-")}
                    </div>

                    <div className="r-actions">
                      <button className="r-btn ghost" type="button" onClick={() => copyText(selected.ipfs_cid)} disabled={!selected.ipfs_cid}>
                        Copy CID
                      </button>
                      <button className="r-btn ghost" type="button" onClick={() => copyText(certificateSha)} disabled={!certificateSha}>
                        Copy Cert Hash
                      </button>
                      <a className={`r-btn link ${ipfsUrl ? "" : "disabled"}`} href={ipfsUrl || "#"} target="_blank" rel="noreferrer">
                        Open IPFS File
                      </a>
                    </div>

                    <div className="r-section-title" style={{ marginTop: 18 }}>
                      Product check (Blockchain + DB)
                    </div>
                    <div className="r-kv">
                      {renderKeyValue("product_code", selected.product_code)}
                      {renderKeyValue("name", selected.name || "-")}
                      {renderKeyValue("brand", brand || "-")}
                      {renderKeyValue("current_state_hash", short(selected.current_state_hash, 12))}
                      {renderKeyValue("nfc_uid_hash", short(selected.nfc_uid_hash, 12))}
                    </div>

                    <div className="r-actions">
                      <button className="r-btn" type="button" onClick={runScanForSelected} disabled={scanLoading}>
                        {scanLoading ? "Verifying..." : "Verify Authenticity"}
                      </button>
                      <button className="r-btn ghost" type="button" onClick={() => loadHistory(selected.product_code)} disabled={historyLoading}>
                        {historyLoading ? "Loading..." : "Refresh History"}
                      </button>
                    </div>

                    {scanRes?.verdict ? (
                      <div className="r-verdict">
                        <div className={`r-verdict-pill ${scanRes.verdict.isAuthentic ? "ok" : "bad"}`}>
                          {scanRes.verdict.isAuthentic ? "AUTHENTIC (HASH MATCH)" : "NOT AUTHENTIC (MISMATCH)"}
                        </div>
                        <div className="r-kv tight">
                          {renderKeyValue("isLatestDbState", String(scanRes.verdict.isLatestDbState))}
                          {renderKeyValue("dbCloudHashMatches", String(scanRes.verdict.dbCloudHashMatches))}
                          {renderKeyValue("chainCloudHashMatches", String(scanRes.verdict.chainCloudHashMatches))}
                          {renderKeyValue("message", scanRes.verdict.message || "-")}
                        </div>
                      </div>
                    ) : null}

                    <div className="r-section-title" style={{ marginTop: 18 }}>
                      Chain evidence
                    </div>
                    <div className="r-kv">
                      {renderKeyValue("contract_address", chainContractAddress)}
                      {renderKeyValue("register_tx_hash", chainRegisterTx)}
                      {renderKeyValue("chain_cloud_hash", chainCloudHash)}
                      {renderKeyValue("chain_nfc_uid_hash", chainNfcHash)}
                    </div>

                    <div className="r-actions">
                      <button className="r-btn ghost" type="button" onClick={() => copyText(chainRegisterTx)} disabled={chainRegisterTx === "-"}>
                        Copy Tx
                      </button>
                      <button className="r-btn ghost" type="button" onClick={() => copyText(chainContractAddress)} disabled={chainContractAddress === "-"}>
                        Copy Contract
                      </button>
                    </div>

                    <div className="r-section-title" style={{ marginTop: 18 }}>
                      Audit decision
                    </div>

                    <div className="r-field">
                      <div className="r-field-label">Reason / Evidence</div>
                      <textarea
                        className="r-textarea"
                        value={auditReason}
                        onChange={(e) => setAuditReason(e.target.value)}
                        placeholder="Write why you accept or reject"
                        disabled={actionLoading || !isRegulator}
                        rows={4}
                      />
                      <div className="r-hint">If backend supports it, the reason will be saved. If not, decision will still work.</div>
                    </div>

                    <div className="r-actions">
                      <button className="r-btn ghost" type="button" onClick={() => auditDecision(selected.product_code, "ACCEPT")} disabled={actionLoading || !isRegulator}>
                        Accept as Original
                      </button>
                      <button className="r-btn danger" type="button" onClick={() => auditDecision(selected.product_code, "REJECT")} disabled={actionLoading || !isRegulator}>
                        Mark as Duplicate
                      </button>
                    </div>

                    <div className="r-section-title" style={{ marginTop: 18 }}>
                      Full history
                    </div>

                    {historyRes ? (
                      <>
                        <div className="r-kv">
                          {renderKeyValue("product_code", historyRes.product?.product_code || selected.product_code)}
                          {renderKeyValue("current_state_hash", historyRes.product?.current_state_hash || selected.current_state_hash || "-")}
                          {renderKeyValue("ipfs_cid", historyRes.product?.ipfs_cid || selected.ipfs_cid || "-")}
                        </div>

                        <div className="r-events">
                          {events.map((ev) => (
                            <div className="r-ev" key={ev.id || `${ev.event_type}-${ev.created_at}`}>
                              <div className="r-ev-top">
                                <div className="r-ev-type">{ev.event_type}</div>
                                <div className="r-ev-time">{ev.created_at ? new Date(ev.created_at).toLocaleString() : "-"}</div>
                              </div>
                              <div className="r-ev-body">
                                <div className="r-ev-row">
                                  <span>actor</span>
                                  <span>
                                    {ev.actor_email || "-"} ({ev.actor_role || "-"})
                                  </span>
                                </div>
                                <div className="r-ev-row">
                                  <span>tx</span>
                                  <span className="mono">{ev.chain_tx_hash || "null"}</span>
                                </div>
                                <div className="r-ev-row">
                                  <span>notes</span>
                                  <span>{ev.notes || ""}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {events.length === 0 ? <div className="r-empty-block">No events found.</div> : null}
                        </div>
                      </>
                    ) : (
                      <div className="r-empty-block">{historyLoading ? "Loading..." : "No history loaded."}</div>
                    )}
                  </>
                ) : (
                  <div className="r-placeholder">Pick a product from the table to verify documents, authenticity, and history.</div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="r-footer">
        <div>© {new Date().getFullYear()} Fake Product Identification</div>
        <div className="r-foot-note">Regulator View</div>
      </footer>

      {toast ? <div className="r-toast">{toast}</div> : null}
    </div>
  );
}

export default Regulator;
