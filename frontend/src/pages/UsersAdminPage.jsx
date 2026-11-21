import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./UsersAdminPage.css";

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000/api"
  : "https://ineveryunivers-books-api.onrender.com/api";

const STATUS_LABELS = { active: "Aktivní", pending: "Čeká na ověření", suspended: "Pozastavený", disabled: "Vypnutý" };
const ROLE_LABELS = { owner: "Vlastník", admin: "Administrátor", moderator: "Moderátor", member: "Člen", beta_tester: "Beta tester" };

// Uživatelsky srozumitelné skupiny. Klíče zůstávají interní a v rozhraní se nezobrazují.
const PERMISSION_GROUPS = [
  { title: "Administrace a nastavení", description: "Přístup do administračního prostředí a správa nastavení webu.", keys: ["admin.dashboard.view", "access.manage", "settings.manage"] },
  { title: "Správa obsahu", description: "Úpravy knih, kapitol a dalšího obsahu webu.", keys: ["content.manage"] },
  { title: "Uživatelé a role", description: "Prohlížení účtů, správa uživatelů a přidělování rolí.", keys: ["users.view", "users.manage", "roles.manage"] },
  { title: "Komunita a moderace", description: "Správa komunitního prostoru a moderátorské nástroje.", keys: ["community.manage", "moderation.access"] },
  { title: "Beta testování", description: "Přístup do Beta centra a k testovacím funkcím.", keys: ["beta.center.access", "beta.features.access"] },
];

export default function UsersAdminPage() {
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [roleDraft, setRoleDraft] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [badgeCatalog, setBadgeCatalog] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const [badgeDraft, setBadgeDraft] = useState("");
  const [permissionRows, setPermissionRows] = useState([]);
  const [permissionDraft, setPermissionDraft] = useState({});

  const request = useCallback(async (path, options = {}) => {
    const token = sessionStorage.getItem("userToken");
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), Authorization: `Bearer ${token}`, ...options.headers },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Požadavek se nezdařil.");
    return data;
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ q: query, status, role, page: String(page), per_page: "25" });
      const [list, stats, me] = await Promise.all([
        request(`/admin/users?${params}`), request("/admin/users/summary"), request("/auth/me"),
      ]);
      setUsers(list.users || []); setPages(list.pages || 1); setTotal(list.total || 0);
      setSummary(stats.summary); setCurrentUser(me.user);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [page, query, request, role, status]);

  useEffect(() => { load(); }, [load]);

  async function openDetail(user) {
    setSelected(user);
    setRoleDraft([...(user.roles || [])]);
    setAuditEvents([]);
    setPermissionRows([]);
    setPermissionDraft({});
    try {
      const [detail, audit, earned, catalog, permissions] = await Promise.all([
        request(`/admin/users/${user.id}`),
        request(`/admin/users/${user.id}/audit`),
        request(`/admin/users/${user.id}/badges`),
        request(`/admin/badges`),
        request(`/admin/users/${user.id}/permissions`),
      ]);
      setSelected(detail.user);
      setRoleDraft([...(detail.user.roles || [])]);
      setAuditEvents(audit.events || []);
      setUserBadges(earned.badges || []);
      setBadgeCatalog(catalog.badges || []);
      setBadgeDraft("");
      setPermissionRows(permissions.permissions || []);
      setPermissionDraft(Object.fromEntries((permissions.permissions || []).map((item) => [item.permission_key, item.user_override === null ? "inherit" : item.user_override ? "allow" : "deny"])));
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeStatus(user, nextStatus) {
    if (!window.confirm(`Opravdu změnit stav účtu ${user.username} na „${STATUS_LABELS[nextStatus]}“?`)) return;
    setBusy(true); setNotice(""); setError("");
    try {
      await request(`/admin/users/${user.id}/status`, { method: "PATCH", body: JSON.stringify({ account_status: nextStatus }) });
      setNotice("Stav účtu byl změněn a jeho aktivní přihlášení byla ukončena.");
      await load();
      if (selected?.id === user.id) setSelected(null);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function saveRoles() {
    if (!selected) return;
    if (!roleDraft.length) {
      setError("Uživatel musí mít alespoň jednu roli.");
      return;
    }
    setBusy(true); setError(""); setNotice("");
    try {
      const data = await request(`/admin/users/${selected.id}/roles`, {
        method: "PUT",
        body: JSON.stringify({ roles: roleDraft }),
      });
      setSelected(data.user);
      setRoleDraft([...(data.user.roles || [])]);
      setNotice(data.message);
      await load();
      const audit = await request(`/admin/users/${selected.id}/audit`);
      setAuditEvents(audit.events || []);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }


  async function savePermissions() {
    if (!selected) return;
    const overrides = Object.entries(permissionDraft)
      .filter(([, value]) => value !== "inherit")
      .map(([permission_key, value]) => ({ permission_key, granted: value === "allow" }));
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request(`/admin/users/${selected.id}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ overrides }),
      });
      setNotice(result.message);
      const permissions = await request(`/admin/users/${selected.id}/permissions`);
      setPermissionRows(permissions.permissions || []);
      setPermissionDraft(Object.fromEntries((permissions.permissions || []).map((item) => [item.permission_key, item.user_override === null ? "inherit" : item.user_override ? "allow" : "deny"])));
      const audit = await request(`/admin/users/${selected.id}/audit`);
      setAuditEvents(audit.events || []);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function awardBadge() {
    if (!selected || !badgeDraft) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request(`/admin/users/${selected.id}/badges`, { method: "POST", body: JSON.stringify({ badge_key: badgeDraft }) });
      setNotice(result.message);
      const earned = await request(`/admin/users/${selected.id}/badges`);
      setUserBadges(earned.badges || []);
      setBadgeDraft("");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function revokeBadge(badgeKey) {
    if (!selected) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request(`/admin/users/${selected.id}/badges/${encodeURIComponent(badgeKey)}`, { method: "DELETE" });
      setNotice(result.message);
      const earned = await request(`/admin/users/${selected.id}/badges`);
      setUserBadges(earned.badges || []);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const isOwner = currentUser?.roles?.includes("owner");
  const canManage = currentUser?.roles?.includes("owner") || currentUser?.roles?.includes("admin");

  return <main className="users-admin-page">
    <div className="users-admin-wrap">
      <Link to="/admin" className="users-admin-back">← Zpět do administrace</Link>
      <header className="users-admin-heading"><span>INEVERYUNIVERSE.BOOKS</span><h1>Správa uživatelů</h1><p>Uživatelské účty, role a stav přístupu</p></header>
      {error && <p className="users-admin-error" role="alert">{error}</p>}
      {notice && <p className="users-admin-notice" role="status">{notice}</p>}
      {summary && <section className="users-admin-stats">
        <article><strong>{summary.total}</strong><span>Uživatelé celkem</span></article>
        <article><strong>{summary.new_last_7_days}</strong><span>Noví za 7 dní</span></article>
        <article><strong>{summary.active}</strong><span>Aktivní účty</span></article>
        <article><strong>{summary.suspended + summary.disabled}</strong><span>Pozastavené / vypnuté</span></article>
      </section>}
      <section className="users-admin-panel">
        <div className="users-admin-toolbar">
          <input aria-label="Hledat uživatele" placeholder="Hledat podle jména nebo e-mailu…" value={query} onChange={(e) => { setPage(1); setQuery(e.target.value); }} />
          <select aria-label="Filtrovat podle stavu" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}><option value="">Všechny stavy</option>{Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          <select aria-label="Filtrovat podle role" value={role} onChange={(e) => { setPage(1); setRole(e.target.value); }}><option value="">Všechny role</option>{Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
        </div>
        <p className="users-admin-count">Nalezeno: {total}</p>
        {loading ? <p className="users-admin-empty">Načítám uživatele…</p> : users.length === 0 ? <p className="users-admin-empty">Žádní uživatelé neodpovídají filtru.</p> : <div className="users-admin-table-scroll"><table><thead><tr><th>Uživatel</th><th>E-mail</th><th>Role</th><th>Stav</th><th>Registrace</th><th>Akce</th></tr></thead><tbody>
          {users.map((user) => <tr key={user.id}>
            <td><button className="users-admin-user" onClick={() => openDetail(user)}><span className="users-admin-avatar">{user.avatar_url ? <img src={user.avatar_url} alt="" /> : (user.display_name || user.username).slice(0, 1).toUpperCase()}</span><span><b>{user.display_name || user.username}</b><small>@{user.username}</small></span></button></td>
            <td>{user.email}</td><td>{user.roles.map((item) => ROLE_LABELS[item] || item).join(", ")}</td>
            <td><span className={`users-admin-status status-${user.account_status}`}>{STATUS_LABELS[user.account_status]}</span></td>
            <td>{user.created_at ? new Date(user.created_at).toLocaleDateString("cs-CZ") : "—"}</td>
            <td><button className="users-admin-action" onClick={() => openDetail(user)}>Detail</button></td>
          </tr>)}
        </tbody></table></div>}
        <div className="users-admin-pagination"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Předchozí</button><span>Strana {page} z {pages}</span><button disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)}>Další</button></div>
      </section>
      {selected && <div className="users-admin-modal-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="users-admin-modal" role="dialog" aria-modal="true" aria-labelledby="users-admin-detail-title" onClick={(e) => e.stopPropagation()}>
        <button className="users-admin-close" onClick={() => setSelected(null)} aria-label="Zavřít">×</button>
        <h2 id="users-admin-detail-title">{selected.display_name || selected.username}</h2><p>@{selected.username} · {selected.email}</p>
        <dl><dt>Stav účtu</dt><dd>{STATUS_LABELS[selected.account_status]}</dd><dt>Role</dt><dd>{selected.roles.map((item) => ROLE_LABELS[item] || item).join(", ")}</dd><dt>Registrace</dt><dd>{selected.created_at ? new Date(selected.created_at).toLocaleString("cs-CZ") : "—"}</dd><dt>Poslední přihlášení</dt><dd>{selected.last_login_at ? new Date(selected.last_login_at).toLocaleString("cs-CZ") : "Zatím se nepřihlásil/a"}</dd></dl>
        {canManage && selected.id !== currentUser?.id && !selected.roles.includes("owner") && <div className="users-admin-actions">
          <h3>Stav účtu</h3>
          {selected.account_status !== "active" && <button disabled={busy} onClick={() => changeStatus(selected, "active")}>Aktivovat</button>}
          {selected.account_status !== "suspended" && <button disabled={busy} onClick={() => changeStatus(selected, "suspended")}>Pozastavit</button>}
          {selected.account_status !== "disabled" && <button disabled={busy} onClick={() => changeStatus(selected, "disabled")}>Vypnout účet</button>}
          {selected.account_status !== "pending" && <button disabled={busy} onClick={() => changeStatus(selected, "pending")}>Vrátit k ověření</button>}
        </div>}
        {canManage && selected.id !== currentUser?.id && !selected.roles.includes("owner") && <div className="users-admin-role-editor">
          <h3>Role uživatele</h3>
          {Object.entries(ROLE_LABELS).filter(([key]) => isOwner || !["owner", "admin"].includes(key)).map(([key, label]) => (
            <label key={key}><input type="checkbox" checked={roleDraft.includes(key)} onChange={(event) => setRoleDraft((old) => event.target.checked ? [...old, key] : old.filter((item) => item !== key))} /> {label}</label>
          ))}
          <button disabled={busy || roleDraft.length === 0} onClick={saveRoles}>Uložit role</button>
          <p className="users-admin-hint">Administrátor nemůže přidělovat ani měnit role administrátora a vlastníka.</p>
        </div>}
        {selected.roles.includes("owner") && <p className="users-admin-hint">Účet vlastníka je chráněný. Jeho stav nelze změnit běžnou správou uživatelů.</p>}
        {isOwner && <div className="users-admin-role-editor users-admin-permissions-editor">
          <h3>Individuální oprávnění</h3>
          <p className="users-admin-hint">Vlastní nastavení má přednost před oprávněním získaným z role. „Zdědit“ znamená použít pouze oprávnění z rolí.</p>
          <div className="users-admin-permission-list">
            {PERMISSION_GROUPS.map((group) => {
              const items = group.keys.map((key) => permissionRows.find((item) => item.permission_key === key)).filter(Boolean);
              if (!items.length) return null;
              return <section className="users-admin-permission-group" key={group.title}>
                <div className="users-admin-permission-group-heading">
                  <h4>{group.title}</h4>
                  <p>{group.description}</p>
                </div>
                {items.map((item) => (
                  <div className="users-admin-permission-row" key={item.permission_key}>
                    <div className="users-admin-permission-copy">
                      <strong>{item.label}</strong>
                      <small>{item.description || (item.role_granted ? "Toto oprávnění přiděluje některá z rolí uživatele." : "Žádná z rolí toto oprávnění nepřiděluje.")}</small>
                    </div>
                    <select
                      aria-label={`Individuální nastavení: ${item.label}`}
                      value={permissionDraft[item.permission_key] || "inherit"}
                      disabled={busy}
                      onChange={(event) => setPermissionDraft((old) => ({ ...old, [item.permission_key]: event.target.value }))}
                    >
                      <option value="inherit">Podle role</option>
                      <option value="allow">Vždy povolit</option>
                      <option value="deny">Vždy zakázat</option>
                    </select>
                    <span className={`users-admin-permission-effective ${item.effective ? "is-allowed" : "is-denied"}`}>
                      {item.effective ? "Aktivní" : "Neaktivní"}
                    </span>
                  </div>
                ))}
              </section>;
            })}
            {permissionRows.some((item) => !PERMISSION_GROUPS.some((group) => group.keys.includes(item.permission_key))) && <section className="users-admin-permission-group">
              <div className="users-admin-permission-group-heading"><h4>Další oprávnění</h4><p>Nová nebo dosud nezařazená oprávnění.</p></div>
              {permissionRows.filter((item) => !PERMISSION_GROUPS.some((group) => group.keys.includes(item.permission_key))).map((item) => (
                <div className="users-admin-permission-row" key={item.permission_key}>
                  <div className="users-admin-permission-copy"><strong>{item.label}</strong><small>{item.description || "Individuální oprávnění účtu."}</small></div>
                  <select aria-label={`Individuální nastavení: ${item.label}`} value={permissionDraft[item.permission_key] || "inherit"} disabled={busy} onChange={(event) => setPermissionDraft((old) => ({ ...old, [item.permission_key]: event.target.value }))}>
                    <option value="inherit">Podle role</option><option value="allow">Vždy povolit</option><option value="deny">Vždy zakázat</option>
                  </select>
                  <span className={`users-admin-permission-effective ${item.effective ? "is-allowed" : "is-denied"}`}>{item.effective ? "Aktivní" : "Neaktivní"}</span>
                </div>
              ))}
            </section>}
          </div>
          <button disabled={busy} onClick={savePermissions}>Uložit individuální oprávnění</button>
        </div>}
        {canManage && <div className="users-admin-role-editor users-admin-badges-editor">
          <h3>Odznaky uživatele</h3>
          <div className="users-admin-badge-award"><select value={badgeDraft} onChange={(e) => setBadgeDraft(e.target.value)}><option value="">Vyber odznak…</option>{badgeCatalog.filter((badge) => !userBadges.some((earned) => earned.badge_key === badge.badge_key) && badge.is_active).map((badge) => <option key={badge.badge_key} value={badge.badge_key}>{badge.icon} {badge.title}</option>)}</select><button disabled={busy || !badgeDraft} onClick={awardBadge}>Přidělit odznak</button></div>
          {userBadges.length ? <div className="users-admin-earned-badges">{userBadges.map((badge) => <span key={badge.badge_key}>{badge.icon} {badge.title} <button disabled={busy} onClick={() => revokeBadge(badge.badge_key)} aria-label={`Odebrat odznak ${badge.title}`}>×</button></span>)}</div> : <p className="users-admin-hint">Uživatel zatím nemá žádné odznaky.</p>}
        </div>}
        <div className="users-admin-audit">
          <h3>Historie změn</h3>
          {auditEvents.length ? auditEvents.map((event) => <p key={event.id}><b>{event.action === "status_changed" ? "Změna stavu" : event.action === "roles_changed" ? "Změna rolí" : event.action}</b> · {event.actor_username} · {event.created_at ? new Date(event.created_at).toLocaleString("cs-CZ") : ""}</p>) : <p>Zatím zde nejsou žádné zaznamenané změny.</p>}
        </div>
      </section></div>}
    </div>
  </main>;
}
