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

  const [activeTab, setActiveTab] = useState("users");
  const [userRoleTab, setUserRoleTab] = useState("manufacturer");

  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [uActionLoading, setUActionLoading] = useState(false);
  const [uDecisionNotes, setUDecisionNotes] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("PENDING");
  const [userSearch, setUserSearch] = useState("");

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

  const fmtDate = useCallback((v) => {
    const s = normalize(v);
    if (!s) return "-";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleString();
  }, []);

  const shortWallet = useCallback((v) => {
    const s = normalize(v);
    if (!s) return "-";
    if (!s.startsWith("0x")) return s;
    if (s.length <= 16) return s;
    return `${s.slice(0, 8)}...${s.slice(-6)}`;
  }, []);

  const userStatusText = useCallback((u) => {
    const raw = normalize(u?.approval_status);
    const t = raw.toUpperCase();
    return t || "PENDING";
  }, []);

  const pillClassByStatus = useCallback((statusText) => {
    const t = normalize(statusText).toUpperCase();
    if (t === "APPROVED") return "ok";
    if (t === "REJECTED") return "bad";
    return "neutral";
  }, []);

  const userPillClass = useCallback(
    (u) => {
      const t = userStatusText(u);
      return pillClassByStatus(t);
    },
    [pillClassByStatus, userStatusText]
  );

  const loadUsers = useCallback(async () => {
    if (!isAuthed || !isRegulator) return;
    setUsersLoading(true);
    setError("");
    try {
      const role = normalize(userRoleTab).toLowerCase() === "seller" ? "seller" : "manufacturer";
      const st = normalize(userStatusFilter).toUpperCase();
      const qs = new URLSearchParams();
      qs.set("role", role);
      if (st && st !== "ALL") qs.set("status", st);

      const data = await apiFetch(`/api/manufacturers?${qs.toString()}`, { method: "GET" });

      const rows =
        (role === "seller" && Array.isArray(data?.sellers) && data.sellers) ||
        (role === "manufacturer" && Array.isArray(data?.manufacturers) && data.manufacturers) ||
        (Array.isArray(data?.users) && data.users) ||
        [];

      setUsers(rows);

      const firstId = rows?.[0]?.id || "";
      if (!selectedUserId && firstId) setSelectedUserId(String(firstId));
    } catch (e) {
      setUsers([]);
      setError(String(e?.message || e));
    } finally {
      setUsersLoading(false);
    }
  }, [apiFetch, isAuthed, isRegulator, selectedUserId, userRoleTab, userStatusFilter]);

  useEffect(() => {
    if (!isAuthed || !isRegulator) return;
    loadUsers();
  }, [isAuthed, isRegulator, loadUsers]);

  const filteredUsers = useMemo(() => {
    const q = normalize(userSearch).toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const email = normalize(u?.email).toLowerCase();
      const wallet = normalize(u?.wallet_address).toLowerCase();
      const id = normalize(u?.id).toLowerCase();
      return email.includes(q) || wallet.includes(q) || id.includes(q);
    });
  }, [users, userSearch]);

  const selectedUser = useMemo(() => {
    const sid = normalize(selectedUserId);
    if (!sid) return null;
    return filteredUsers.find((u) => normalize(u?.id) === sid) || users.find((u) => normalize(u?.id) === sid) || null;
  }, [filteredUsers, selectedUserId, users]);

  const selectedUserDetails = useMemo(() => {
    if (!selectedUser) return [];
    return [
      ["id", selectedUser.id || "-"],
      ["role", selectedUser.role || "-"],
      ["email", selectedUser.email || "-"],
      ["wallet_address", selectedUser.wallet_address || "-"],
      ["approval_status", userStatusText(selectedUser)],
      ["approval_notes", selectedUser.approval_notes || "-"],
      ["approved_by", selectedUser.approved_by || "-"],
      ["approved_at", fmtDate(selectedUser.approved_at)],
      ["rejected_by", selectedUser.rejected_by || "-"],
      ["rejected_at", fmtDate(selectedUser.rejected_at)],
      ["created_at", fmtDate(selectedUser.created_at)]
    ];
  }, [fmtDate, selectedUser, userStatusText]);

  const postUserDecision = useCallback(
    async (id, decision, notes) => {
      const rid = normalize(id);
      if (!rid) throw new Error("Missing user id");
      const role = normalize(userRoleTab).toLowerCase() === "seller" ? "seller" : "manufacturer";
      const body = JSON.stringify({ notes: normalize(notes) || null });

      if (decision === "APPROVE") {
        await apiFetch(`/api/manufacturers/${encodeURIComponent(rid)}/approve?role=${encodeURIComponent(role)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body
        });
        return;
      }

      await apiFetch(`/api/manufacturers/${encodeURIComponent(rid)}/reject?role=${encodeURIComponent(role)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
    },
    [apiFetch, userRoleTab]
  );

  const approveUser = useCallback(async () => {
    if (!isRegulator) {
      setError("Please login as Regulator to use this portal.");
      return;
    }
    if (!selectedUser) {
      setError("Select a user to approve.");
      return;
    }
    if (!normalize(selectedUser.id)) {
      setError("User id is missing.");
      return;
    }
    setError("");
    setUActionLoading(true);
    try {
      await postUserDecision(selectedUser.id, "APPROVE", uDecisionNotes);
      showToast(`${normalize(userRoleTab) === "seller" ? "Seller" : "Manufacturer"} approved`);
      setUDecisionNotes("");
      await loadUsers();
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setUActionLoading(false);
    }
  }, [isRegulator, loadUsers, postUserDecision, selectedUser, showToast, uDecisionNotes, userRoleTab]);

  const rejectUser = useCallback(async () => {
    if (!isRegulator) {
      setError("Please login as Regulator to use this portal.");
      return;
    }
    if (!selectedUser) {
      setError("Select a user to reject.");
      return;
    }
    if (!normalize(selectedUser.id)) {
      setError("User id is missing.");
      return;
    }
    setError("");
    setUActionLoading(true);
    try {
      await postUserDecision(selectedUser.id, "REJECT", uDecisionNotes);
      showToast(`${normalize(userRoleTab) === "seller" ? "Seller" : "Manufacturer"} rejected`);
      setUDecisionNotes("");
      await loadUsers();
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setUActionLoading(false);
    }
  }, [isRegulator, loadUsers, postUserDecision, selectedUser, showToast, uDecisionNotes, userRoleTab]);

  const loadProducts = useCallback(async () => {
    if (!isAuthed || !isRegulator) return;
    setProductsLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/products", { method: "GET" });
      const rows = Array.isArray(data?.products) ? data.products : Array.isArray(data) ? data : [];
      setProducts(rows);
      if (!selectedCode && rows.length) setSelectedCode(rows[0].product_code);
    } catch (e) {
      setProducts([]);
      setError(String(e?.message || e));
    } finally {
      setProductsLoading(false);
    }
  }, [apiFetch, isAuthed, isRegulator, selectedCode]);

  useEffect(() => {
    if (!isAuthed || !isRegulator) return;
    loadProducts();
  }, [isAuthed, isRegulator, loadProducts]);

  const selectedProduct = useMemo(() => {
    const code = normalize(selectedCode);
    return products.find((p) => normalize(p.product_code) === code) || null;
  }, [products, selectedCode]);

  const ipfsUrl = useMemo(() => {
    const cid = normalize(selectedProduct?.ipfs_cid);
    return cid ? `https://gateway.pinata.cloud/ipfs/${cid}` : "";
  }, [selectedProduct]);

  const runScanForSelected = useCallback(async () => {
    if (!selectedProduct) return;
    const pid = normalize(selectedProduct.product_code);
    const sh = normalize(selectedProduct.current_state_hash);
    if (!pid || !sh) {
      setError("Missing required data for verification.");
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
  }, [apiFetch, selectedProduct, showToast]);

  const loadHistory = useCallback(
    async (code) => {
      const pc = normalize(code || selectedCode);
      if (!pc) return;
      setHistoryLoading(true);
      setError("");
      try {
        const data = await apiFetch(`/api/products/${encodeURIComponent(pc)}/history`, { method: "GET", auth: false });
        setHistoryRes(data);
      } catch (e) {
        setHistoryRes(null);
        setError(String(e?.message || e));
      } finally {
        setHistoryLoading(false);
      }
    },
    [apiFetch, selectedCode]
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
        await postAudit(pc, decision, auditReason);
        showToast(decision === "ACCEPT" ? "Accepted" : "Rejected");
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
    [auditReason, isRegulator, loadHistory, loadProducts, postAudit, selectedCode, showToast]
  );

  const productPillText = useCallback((p) => {
    const t = normalize(p?.audit_status).toUpperCase();
    if (t === "ACCEPT") return "ACCEPTED";
    if (t === "REJECT") return "REJECTED";
    return "PENDING";
  }, []);

  const productPillClass = useCallback(
    (p) => {
      const t = productPillText(p);
      return pillClassByStatus(t === "ACCEPTED" ? "APPROVED" : t === "REJECTED" ? "REJECTED" : "PENDING");
    },
    [pillClassByStatus, productPillText]
  );

  const events = useMemo(() => {
    const arr = Array.isArray(historyRes?.events) ? historyRes.events : [];
    return arr;
  }, [historyRes]);

  useEffect(() => {
    if (!isAuthed) return;
    if (!isRegulator) return;
    if (activeTab === "users") loadUsers();
    if (activeTab === "products") loadProducts();
  }, [activeTab, isAuthed, isRegulator, loadUsers, loadProducts]);

  const renderKeyValue = useCallback((k, v, opts = {}) => {
    const value = String(v ?? "-");
    const mono = opts.mono ? "mono" : "";
    const clickable = Boolean(opts.copyValue);
    return (
      <div className={`r-kv-row ${clickable ? "clickable" : ""}`} key={k} onClick={clickable ? () => copyText(opts.copyValue) : undefined}>
        <span className="r-k">{k}</span>
        <span className={`r-v ${mono}`}>{value}</span>
      </div>
    );
  }, [copyText]);

  return (
    <div className="r-shell">
      <Navbar />

      <header className="r-header">
        <div className="r-head-left">
          <div className="r-mark">Regulator</div>
          <div className="r-head-text">
            <div className="r-title">Audit & Approvals</div>
            <div className="r-subtitle">Approve manufacturers and sellers, then review product history</div>
          </div>
        </div>

        <div className="r-head-right">
          {!isAuthed ? (
            <button className="r-btn ghost" type="button" onClick={() => navigate("/auth")}>
              Go to Login
            </button>
          ) : (
            <>
              <div className="r-session">
                {meLoading ? "Loading..." : me ? `${me.email} (${me.role})` : "Session active"}
              </div>
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
            className={`r-tab-btn ${activeTab === "users" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab("users")}
            disabled={!isRegulator}
          >
            Users approval
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

        {activeTab === "users" ? (
          <section className="r-split">
            <div className="r-card">
              <div className="r-card-head">
                <div>
                  <div className="r-card-title">Approvals</div>
                  <div className="r-card-sub">Choose role and status, then approve or reject</div>
                </div>
                <button className="r-btn ghost" type="button" onClick={loadUsers} disabled={usersLoading || !isRegulator}>
                  {usersLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div className="r-toolbar">
                <div className="r-seg">
                  <button
                    type="button"
                    className={`r-seg-btn ${userRoleTab === "manufacturer" ? "active" : ""}`}
                    onClick={() => {
                      setSelectedUserId("");
                      setUserRoleTab("manufacturer");
                    }}
                    disabled={!isRegulator}
                  >
                    Manufacturers
                  </button>
                  <button
                    type="button"
                    className={`r-seg-btn ${userRoleTab === "seller" ? "active" : ""}`}
                    onClick={() => {
                      setSelectedUserId("");
                      setUserRoleTab("seller");
                    }}
                    disabled={!isRegulator}
                  >
                    Sellers
                  </button>
                </div>

                <div className="r-filters">
                  <select
                    className="r-select"
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    disabled={!isRegulator || usersLoading}
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="ALL">ALL</option>
                  </select>

                  <input
                    className="r-input"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by email, wallet, or id"
                    disabled={!isRegulator}
                  />
                </div>
              </div>

              <div className="r-table-wrap">
                <table className="r-table r-table-compact">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Wallet</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th className="ta-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const id = normalize(u?.id);
                      const active = id && id === normalize(selectedUserId);
                      const email = normalize(u?.email) || "-";
                      const wallet = normalize(u?.wallet_address) || "-";
                      const st = userStatusText(u);
                      const createdAt = fmtDate(u?.created_at);

                      return (
                        <tr key={id || email} className={active ? "active" : ""} onClick={() => setSelectedUserId(id)}>
                          <td data-label="Email">{email}</td>
                          <td data-label="Wallet" className="mono">
                            {wallet === "-" ? "-" : shortWallet(wallet)}
                          </td>
                          <td data-label="Status">
                            <span className={`r-pill ${userPillClass(u)}`}>{st}</span>
                          </td>
                          <td data-label="Created">{createdAt}</td>
                          <td data-label="Actions" className="ta-right" onClick={(e) => e.stopPropagation()}>
                            <div className="r-row-actions">
                              <button className="r-btn small" type="button" onClick={() => setSelectedUserId(id)}>
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="r-empty">
                          {usersLoading ? "Loading..." : "No users found"}
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
                  <div className="r-card-sub">Only user table fields are shown</div>
                </div>
              </div>

              <div className="r-section">
                {selectedUser ? (
                  <>
                    <div className="r-kv">
                      {selectedUserDetails.map(([k, v]) =>
                        k === "wallet_address"
                          ? renderKeyValue(k, v, { mono: true, copyValue: normalize(v) !== "-" ? v : "" })
                          : renderKeyValue(k, v)
                      )}
                    </div>

                    <div className="r-actions">
                      <button className="r-btn ghost" type="button" onClick={() => copyText(selectedUser.email)} disabled={!normalize(selectedUser.email)}>
                        Copy Email
                      </button>
                      <button
                        className="r-btn ghost"
                        type="button"
                        onClick={() => copyText(selectedUser.wallet_address)}
                        disabled={!normalize(selectedUser.wallet_address)}
                      >
                        Copy Wallet
                      </button>
                    </div>

                    <div className="r-field" style={{ marginTop: 12 }}>
                      <div className="r-field-label">Notes</div>
                      <textarea
                        className="r-textarea"
                        value={uDecisionNotes}
                        onChange={(e) => setUDecisionNotes(e.target.value)}
                        placeholder="Approval notes (optional)"
                        disabled={uActionLoading || !isRegulator}
                        rows={4}
                      />
                      <div className="r-hint">Saved to approval_notes</div>
                    </div>

                    <div className="r-actions">
                      <button className="r-btn" type="button" onClick={approveUser} disabled={uActionLoading || !isRegulator}>
                        {uActionLoading ? "Saving..." : "Approve"}
                      </button>
                      <button className="r-btn danger" type="button" onClick={rejectUser} disabled={uActionLoading || !isRegulator}>
                        {uActionLoading ? "Saving..." : "Reject"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="r-empty-block">Select a user from the table to review and approve or reject.</div>
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
                  <div className="r-card-sub">Audit products and view history</div>
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
                          <td data-label="Code" className="mono">
                            {p.product_code}
                          </td>
                          <td data-label="Name">{p.name || "-"}</td>
                          <td data-label="Batch">{p.batch || "-"}</td>
                          <td data-label="Status">
                            <span className={`r-pill ${productPillClass(p)}`}>{productPillText(p)}</span>
                          </td>
                          <td data-label="Actions" className="ta-right" onClick={(e) => e.stopPropagation()}>
                            <div className="r-row-actions">
                              <button className="r-btn small" type="button" onClick={() => setSelectedCode(p.product_code)}>
                                View
                              </button>
                              <button
                                className="r-btn small ghost"
                                type="button"
                                onClick={() => auditDecision(p.product_code, "ACCEPT")}
                                disabled={actionLoading || !isRegulator}
                              >
                                Accept
                              </button>
                              <button
                                className="r-btn small danger"
                                type="button"
                                onClick={() => auditDecision(p.product_code, "REJECT")}
                                disabled={actionLoading || !isRegulator}
                              >
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
                  <div className="r-card-sub">{selectedProduct ? `Code: ${selectedProduct.product_code}` : "Pick a product"}</div>
                </div>
              </div>

              <div className="r-section">
                {selectedProduct ? (
                  <>
                    <div className="r-section-title">Product details</div>
                    <div className="r-kv">
                      {renderKeyValue("product_code", selectedProduct.product_code, { mono: true, copyValue: selectedProduct.product_code })}
                      {renderKeyValue("name", selectedProduct.name || "-")}
                      {renderKeyValue("batch", selectedProduct.batch || "-")}
                      {renderKeyValue("ipfs_cid", selectedProduct.ipfs_cid || "-", { mono: true, copyValue: selectedProduct.ipfs_cid || "" })}
                      {renderKeyValue("created_at", fmtDate(selectedProduct.created_at))}
                    </div>

                    <div className="r-actions">
                      <a className={`r-btn link ${ipfsUrl ? "" : "disabled"}`} href={ipfsUrl || "#"} target="_blank" rel="noreferrer">
                        Open IPFS
                      </a>
                      <button className="r-btn ghost" type="button" onClick={() => copyText(selectedProduct.ipfs_cid)} disabled={!normalize(selectedProduct.ipfs_cid)}>
                        Copy CID
                      </button>
                      <button className="r-btn" type="button" onClick={runScanForSelected} disabled={scanLoading}>
                        {scanLoading ? "Verifying..." : "Verify Authenticity"}
                      </button>
                      <button className="r-btn ghost" type="button" onClick={() => loadHistory(selectedProduct.product_code)} disabled={historyLoading}>
                        {historyLoading ? "Loading..." : "Refresh History"}
                      </button>
                    </div>

                    {scanRes?.verdict ? (
                      <div className="r-verdict">
                        <div className={`r-verdict-pill ${scanRes.verdict.isAuthentic ? "ok" : "bad"}`}>
                          {scanRes.verdict.isAuthentic ? "AUTHENTIC" : "NOT AUTHENTIC"}
                        </div>
                        <div className="r-verdict-msg">{normalize(scanRes.verdict.message) || "-"}</div>
                        <div className="r-kv tight">
                          {renderKeyValue("isLatestDbState", String(Boolean(scanRes.verdict.isLatestDbState)))}
                          {renderKeyValue("dbCloudHashMatches", String(Boolean(scanRes.verdict.dbCloudHashMatches)))}
                          {renderKeyValue("chainCloudHashMatches", String(Boolean(scanRes.verdict.chainCloudHashMatches)))}
                        </div>
                      </div>
                    ) : null}

                    <div className="r-section-title" style={{ marginTop: 18 }}>
                      Audit decision
                    </div>

                    <div className="r-field">
                      <div className="r-field-label">Reason</div>
                      <textarea
                        className="r-textarea"
                        value={auditReason}
                        onChange={(e) => setAuditReason(e.target.value)}
                        placeholder="Write why you accept or reject (optional)"
                        disabled={actionLoading || !isRegulator}
                        rows={4}
                      />
                    </div>

                    <div className="r-actions">
                      <button className="r-btn ghost" type="button" onClick={() => auditDecision(selectedProduct.product_code, "ACCEPT")} disabled={actionLoading || !isRegulator}>
                        Accept
                      </button>
                      <button className="r-btn danger" type="button" onClick={() => auditDecision(selectedProduct.product_code, "REJECT")} disabled={actionLoading || !isRegulator}>
                        Reject
                      </button>
                    </div>

                    <div className="r-section-title" style={{ marginTop: 18 }}>
                      History
                    </div>

                    {historyRes ? (
                      <>
                        <div className="r-history-summary">
                          <div className="r-sum">
                            <div className="r-sum-k">Events</div>
                            <div className="r-sum-v">{events.length}</div>
                          </div>
                          <div className="r-sum">
                            <div className="r-sum-k">Last update</div>
                            <div className="r-sum-v">{events[0]?.created_at ? fmtDate(events[0].created_at) : "-"}</div>
                          </div>
                        </div>

                        <div className="r-events">
                          {events.map((ev) => (
                            <div className="r-ev" key={ev.id || `${ev.event_type}-${ev.created_at}`}>
                              <div className="r-ev-top">
                                <div className="r-ev-type">{ev.event_type || "EVENT"}</div>
                                <div className="r-ev-time">{ev.created_at ? fmtDate(ev.created_at) : "-"}</div>
                              </div>
                              <div className="r-ev-body">
                                <div className="r-ev-row">
                                  <span>actor</span>
                                  <span>
                                    {ev.actor_email || "-"} {ev.actor_role ? `(${ev.actor_role})` : ""}
                                  </span>
                                </div>
                                <div className="r-ev-row">
                                  <span>notes</span>
                                  <span>{ev.notes || "-"}</span>
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
                  <div className="r-placeholder">Pick a product from the table to review and see history.</div>
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
