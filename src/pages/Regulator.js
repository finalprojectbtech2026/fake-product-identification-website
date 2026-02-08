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

  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [productsLoading, setProductsLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [scanLoading, setScanLoading] = useState(false);
  const [scanRes, setScanRes] = useState(null);

  const [auditReason, setAuditReason] = useState("");

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRes, setHistoryRes] = useState(null);

  const [sellerWallet, setSellerWallet] = useState("");
  const [sellerVerifying, setSellerVerifying] = useState(false);
  const [sellerVerifyRes, setSellerVerifyRes] = useState(null);

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

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setAuthToken("");
    setAuthUser(null);
    navigate("/");
  };

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

  const short = (v, n = 10) => {
    const s = normalize(v);
    if (!s) return "-";
    if (s.length <= n * 2 + 3) return s;
    return `${s.slice(0, n)}...${s.slice(-n)}`;
  };

  const renderKeyValue = (k, v) => (
    <div className="r-kv-row" key={k}>
      <span>{k}</span>
      <span className={String(v ?? "").startsWith("0x") ? "mono" : ""}>{String(v ?? "-")}</span>
    </div>
  );

  const runScanForSelected = async () => {
    if (!selected) return;
    const pid = normalize(selected.product_code);
    const sh = normalize(selected.current_state_hash);
    if (!pid || !sh) return setError("Missing productId or stateHash for this product.");
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
  };

  const loadHistory = async (code) => {
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
  };

  useEffect(() => {
    setScanRes(null);
    setHistoryRes(null);
    setAuditReason("");
    if (!isAuthed || !isRegulator) return;
    if (!selectedCode) return;
    loadHistory(selectedCode);
  }, [selectedCode, isAuthed, isRegulator]);

  const postAudit = async (pc, decision, reason) => {
    await apiFetch(`/api/products/${encodeURIComponent(pc)}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason: normalize(reason) || undefined })
    });
  };

  const auditDecision = async (productCode, decision) => {
    const pc = normalize(productCode);
    if (!pc) return;
    if (!isRegulator) return setError("Please login as Regulator to use this portal.");
    setError("");
    setActionLoading(true);
    try {
      try {
        await postAudit(pc, decision, auditReason);
      } catch (e) {
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
  };

  const pillClass = (p) => {
    const t = normalize(p?.audit_status).toUpperCase();
    if (t === "ACCEPT") return "ok";
    if (t === "REJECT") return "bad";
    return "neutral";
  };

  const pillText = (p) => {
    const t = normalize(p?.audit_status).toUpperCase();
    if (t === "ACCEPT") return "ACCEPTED";
    if (t === "REJECT") return "REJECTED";
    return "PENDING";
  };

  const verifySellerWallet = async () => {
    const wa = normalize(sellerWallet);
    if (!wa) return setError("Enter seller wallet address to verify.");
    if (!isRegulator) return setError("Please login as Regulator to use this portal.");
    setError("");
    setSellerVerifying(true);
    setSellerVerifyRes(null);
    try {
      const data = await apiFetch("/api/sellers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_address: wa })
      });
      setSellerVerifyRes(data);
      showToast("Seller wallet verified");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setSellerVerifying(false);
    }
  };

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

  return (
    <div className="r-shell">
      <Navbar />

      <header className="r-header">
        <div className="r-head-left">
          <div className="r-mark">Regulator</div>
          <div className="r-head-text">
            <div className="r-title">Audit & Verification</div>
            <div className="r-subtitle">Verify documents, verify authenticity, approve identities, then accept or reject</div>
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

        <section className="r-grid">
          <div className="r-card">
            <div className="r-card-head">
              <div className="r-card-title">Products</div>
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

          <div className="r-rightcol">
            

            <div className="r-card">
              <div className="r-card-head">
                <div className="r-card-title">Verification</div>
                <div className="r-card-sub">{selected ? `Selected: ${selected.product_code}` : "Select a product from the table"}</div>
              </div>

              {selected ? (
                <>
                  <div className="r-section">
                    <div className="r-section-title">Document check (IPFS)</div>
                    <div className="r-kv">
                      <div className="r-kv-row">
                        <span>ipfs_cid</span>
                        <span className="mono">{selected.ipfs_cid || "-"}</span>
                      </div>
                      <div className="r-kv-row">
                        <span>certificate_sha256</span>
                        <span className="mono">{certificateSha || "-"}</span>
                      </div>
                      <div className="r-kv-row">
                        <span>cloud_hash (DB)</span>
                        <span className="mono">{selected.cloud_hash || "-"}</span>
                      </div>
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
                  </div>

                  <div className="r-section">
                    <div className="r-section-title">Product check (Blockchain + DB)</div>
                    <div className="r-kv">
                      <div className="r-kv-row">
                        <span>product_code</span>
                        <span className="mono">{selected.product_code}</span>
                      </div>
                      <div className="r-kv-row">
                        <span>name</span>
                        <span>{selected.name || "-"}</span>
                      </div>
                      <div className="r-kv-row">
                        <span>brand</span>
                        <span>{brand || "-"}</span>
                      </div>
                      <div className="r-kv-row">
                        <span>current_state_hash</span>
                        <span className="mono">{short(selected.current_state_hash, 12)}</span>
                      </div>
                      <div className="r-kv-row">
                        <span>nfc_uid_hash</span>
                        <span className="mono">{short(selected.nfc_uid_hash, 12)}</span>
                      </div>
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
                          <div className="r-kv-row">
                            <span>isLatestDbState</span>
                            <span>{String(scanRes.verdict.isLatestDbState)}</span>
                          </div>
                          <div className="r-kv-row">
                            <span>dbCloudHashMatches</span>
                            <span>{String(scanRes.verdict.dbCloudHashMatches)}</span>
                          </div>
                          <div className="r-kv-row">
                            <span>chainCloudHashMatches</span>
                            <span>{String(scanRes.verdict.chainCloudHashMatches)}</span>
                          </div>
                          <div className="r-kv-row">
                            <span>message</span>
                            <span>{scanRes.verdict.message}</span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="r-section">
                    <div className="r-section-title">Chain evidence</div>
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
                  </div>

                  <div className="r-section">
                    <div className="r-section-title">Audit decision</div>

                    <div className="r-field">
                      <div className="r-field-label">Reason / Evidence</div>
                      <textarea
                        className="r-textarea"
                        value={auditReason}
                        onChange={(e) => setAuditReason(e.target.value)}
                        placeholder="Write why you accept or reject (e.g., hash mismatch, missing document, duplicate code)"
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
                  </div>

                  <div className="r-section">
                    <div className="r-section-title">Full history</div>

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
                  </div>
                </>
              ) : (
                <div className="r-placeholder">Pick a product from the left table to verify documents, authenticity, and history.</div>
              )}
            </div>
          </div>
        </section>
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
