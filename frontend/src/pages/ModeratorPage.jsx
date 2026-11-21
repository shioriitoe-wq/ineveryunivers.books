import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./RolePages.css";

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000/api"
  : "https://ineveryunivers-books-api.onrender.com/api";

const REASON_LABELS = {
  harassment: "Obtěžování",
  spam: "Spam",
  threat: "Výhrůžky",
  inappropriate: "Nevhodný obsah",
  other: "Jiný důvod",
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("cs-CZ", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function ModeratorPage({ embedded = false }) {
  const [state, setState] = useState("loading");
  const [reports, setReports] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeSection, setActiveSection] = useState("messages");
  const [reportFilter, setReportFilter] = useState("open");

  const loadReports = useCallback(async () => {
    const token = sessionStorage.getItem("userToken");
    if (!token) {
      setState("denied");
      return;
    }
    setLoadingReports(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/moderation/private-message-reports?status=${reportFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        setState("denied");
        throw new Error(data.message || "K hlášením nemáš oprávnění.");
      }
      if (!response.ok) throw new Error(data.message || "Hlášení se nepodařilo načíst.");
      const items = Array.isArray(data.reports) ? data.reports : [];
      setReports(items);
      setSelectedId(current => items.some(item => item.id === current) ? current : (items[0]?.id ?? null));
      setState("allowed");
    } catch (err) {
      setError(err.message || "Nastala chyba při načítání hlášení.");
    } finally {
      setLoadingReports(false);
    }
  }, [reportFilter]);

  useEffect(() => {
    let live = true;
    const token = sessionStorage.getItem("userToken");
    if (!token) {
      setState("denied");
      return () => { live = false; };
    }
    fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : Promise.reject(new Error("Přihlášení vypršelo.")))
      .then(data => {
        if (!live) return;
        const roles = data.user?.roles || [];
        if (roles.some(role => ["owner", "admin", "moderator"].includes(role))) {
          setState("allowed");
          loadReports();
        } else {
          setState("denied");
        }
      })
      .catch(err => { if (live) { setState("denied"); setError(err.message); } });
    return () => { live = false; };
  }, [loadReports]);

  const selected = reports.find(report => report.id === selectedId) || null;

  async function updateReport(status) {
    if (!selected) return;
    const token = sessionStorage.getItem("userToken");
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${API_BASE}/moderation/private-message-reports/${selected.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Stav hlášení se nepodařilo uložit.");
      setNotice(status === "reviewing" ? "Hlášení bylo převzato k řešení." : status === "resolved" ? "Hlášení bylo označeno jako vyřešené." : "Hlášení bylo zamítnuto.");
      await loadReports();
    } catch (err) {
      setError(err.message || "Nastala chyba při ukládání.");
    } finally {
      setSaving(false);
    }
  }

  if (state === "loading") return <section className={`iu-moderation ${embedded ? "is-embedded" : ""}`}><p>Ověřuji přístup…</p></section>;
  if (state === "denied") return <section className={`iu-moderation ${embedded ? "is-embedded" : ""}`}><h2>Moderace komunity</h2><p>{error || "Tato část je dostupná pouze moderátorům, administrátorům a vlastníkovi webu."}</p>{!embedded && <Link to="/account">Přejít k účtu</Link>}</section>;

  return (
    <section className={`iu-moderation ${embedded ? "is-embedded" : ""}`}>
      {!embedded && <div className="iu-moderation-top"><Link to="/">← Zpět na web</Link><p className="iu-moderation-kicker">CENTRUM SPRÁVY · KOMUNITA</p><h1>Komunita a moderace</h1><p>Správa nahlášeného obsahu a bezpečí komunity.</p></div>}
      <div className="iu-moderation-tabs" role="tablist" aria-label="Oblasti moderace">
        <button type="button" role="tab" aria-selected={activeSection === "messages"} className={activeSection === "messages" ? "active" : ""} onClick={() => setActiveSection("messages")}>Nahlášené soukromé zprávy <span>{reports.length}</span></button>
        <button type="button" role="tab" aria-selected={activeSection === "other"} className={activeSection === "other" ? "active" : ""} onClick={() => setActiveSection("other")}>Ostatní obsah</button>
      </div>

      {notice && <div className="iu-moderation-notice" role="status">{notice}</div>}
      {error && <div className="iu-moderation-error" role="alert">{error}</div>}

      {activeSection === "messages" ? (
        <>
          <div className="iu-moderation-section-head">
            <div><p className="iu-moderation-kicker">SOUKROMÁ KOMUNIKACE</p><h2>Nahlášené zprávy</h2><p>Zobrazuje se pouze konkrétní zpráva, kterou člen nahlásil, nikoliv celá soukromá konverzace.</p></div>
            <button type="button" className="iu-moderation-refresh" onClick={loadReports} disabled={loadingReports}>{loadingReports ? "Načítám…" : "↻ Obnovit"}</button>
          </div>
          <div className="iu-report-filter-tabs" role="tablist" aria-label="Stav hlášení">
            <button type="button" role="tab" aria-selected={reportFilter === "open"} className={reportFilter === "open" ? "active" : ""} onClick={() => { setReportFilter("open"); setSelectedId(null); }}>Čekající hlášení</button>
            <button type="button" role="tab" aria-selected={reportFilter === "closed"} className={reportFilter === "closed" ? "active" : ""} onClick={() => { setReportFilter("closed"); setSelectedId(null); }}>Vyřešená hlášení</button>
          </div>
          <div className="iu-report-workspace">
            <aside className="iu-report-list">
              <div className="iu-report-list-head">{reportFilter === "closed" ? "Uzavřená hlášení" : "Čekající hlášení"} <span>{reports.length}</span></div>
              {loadingReports && reports.length === 0 ? <p className="iu-report-empty">Načítám hlášení…</p> : reports.length === 0 ? <div className="iu-report-empty"><span>✧</span><strong>{reportFilter === "closed" ? "Žádná vyřešená hlášení" : "Žádná otevřená hlášení"}</strong><small>{reportFilter === "closed" ? "Uzavřená hlášení se budou ukládat zde." : "Nová hlášení soukromých zpráv se objeví zde."}</small></div> : reports.map(report => (
                <button type="button" key={report.id} className={`iu-report-list-item ${selectedId === report.id ? "selected" : ""}`} onClick={() => setSelectedId(report.id)}>
                  <span className="iu-report-item-title">{report.sender_username || "Neznámý uživatel"}</span>
                  <span className="iu-report-item-reason">{REASON_LABELS[report.reason] || report.reason}</span>
                  <span className="iu-report-item-preview">{report.message?.body || "Zpráva není dostupná."}</span>
                  <span className="iu-report-item-date">{formatDate(report.created_at)}</span>
                </button>
              ))}
            </aside>
            <div className="iu-report-detail">
              {selected ? (
                <>
                  <div className="iu-report-detail-head"><div><p className="iu-moderation-kicker">HLÁŠENÍ #{selected.id}</p><h3>Nahlášená zpráva</h3></div><span className={`iu-report-status status-${selected.status}`}>{selected.status === "reviewing" ? "Řeší se" : selected.status === "resolved" ? "Vyřešeno" : selected.status === "rejected" ? "Zamítnuto" : "Nové"}</span></div>
                  <div className="iu-report-meta"><div><small>Odesílatel</small><strong>{selected.sender_username}</strong></div><div><small>Nahlásil/a</small><strong>{selected.reporter_username}</strong></div><div><small>Nahlášeno</small><strong>{formatDate(selected.created_at)}</strong></div><div><small>Důvod</small><strong>{REASON_LABELS[selected.reason] || selected.reason}</strong></div></div>
                  <div className="iu-reported-message"><small>OBSAH NAHLÁŠENÉ ZPRÁVY · {formatDate(selected.message?.created_at)}</small><p>{selected.message?.body || "Obsah zprávy již není dostupný."}</p></div>
                  {selected.details && <div className="iu-report-details"><small>VYSVĚTLENÍ NAHLAŠOVATELE</small><p>{selected.details}</p></div>}
                  {reportFilter === "closed" ? (
                    <div className="iu-report-closed-meta"><span>{selected.status === "resolved" ? "Hlášení bylo vyřešeno" : "Hlášení bylo zamítnuto"}</span>{selected.reviewer_username && <span>Vyřídil/a: <strong>{selected.reviewer_username}</strong></span>}{selected.reviewed_at && <span>Datum vyřízení: <strong>{formatDate(selected.reviewed_at)}</strong></span>}</div>
                  ) : (
                    <div className="iu-report-actions">
                      {selected.status === "open" && <button type="button" className="iu-report-secondary" disabled={saving} onClick={() => updateReport("reviewing")}>Převzít k řešení</button>}
                      <button type="button" className="iu-report-secondary" disabled={saving} onClick={() => updateReport("rejected")}>Zamítnout</button>
                      <button type="button" className="iu-report-primary" disabled={saving} onClick={() => updateReport("resolved")}>{saving ? "Ukládám…" : "Označit jako vyřešené"}</button>
                    </div>
                  )}
                </>
              ) : <div className="iu-report-empty iu-report-detail-empty"><span>✧</span><strong>{reportFilter === "closed" ? "Vyber uzavřené hlášení" : "Vyber hlášení"}</strong><small>Po výběru se zde zobrazí jeho podrobnosti.</small></div>}
            </div>
          </div>
        </>
      ) : (
        <div className="iu-moderation-placeholder"><span>✧</span><h2>Ostatní nahlášený obsah</h2><p>Správu příspěvků a komentářů doplníme v návaznosti na komunitní funkce. Hlášení soukromých zpráv už můžeš řešit v první záložce.</p></div>
      )}
    </section>
  );
}
