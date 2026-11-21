import { useCallback, useEffect, useMemo, useState } from "react";
import "./SiteSettingsAdminPage.css";

const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://ineveryunivers-books-api.onrender.com/api";

const ROLE_OPTIONS = [
  { value: "owner", label: "Vlastník" },
  { value: "admin", label: "Administrátor" },
  { value: "moderator", label: "Moderátor" },
  { value: "beta_tester", label: "Beta tester" },
  { value: "member", label: "Člen" },
];

const SITE_STATUSES = [
  { value: "active", label: "Web je aktivní" },
  { value: "maintenance", label: "Údržba" },
  { value: "locked", label: "Web uzamčen" },
  { value: "inactive", label: "Web nedostupný" },
];

const SECTION_STATUSES = [
  { value: "active", label: "Aktivní" },
  { value: "inactive", label: "Vypnutá" },
  { value: "locked", label: "Uzamčená" },
  { value: "authenticated", label: "Jen přihlášení" },
  { value: "roles", label: "Vybrané role" },
];

function authHeaders(json = false) {
  const token = sessionStorage.getItem("userToken");
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(Boolean(options.body)), ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Požadavek se nezdařil (${response.status}).`);
  }
  return data;
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function StatusPill({ status }) {
  const labels = {
    active: "Aktivní",
    maintenance: "Údržba",
    locked: "Uzamčený",
    inactive: "Nedostupný",
    ready: "Připraveno",
    preparing: "Připravuje se",
  };
  return <span className={`site-settings-pill is-${status}`}>{labels[status] || status}</span>;
}


const CATALOG_GROUPS = {
  volume: "Svazky",
  part: "Části",
  chapter: "Kapitoly",
  character: "Postavy",
  track: "Skladby",
  video: "Videa",
};

function groupCatalogChildren(children = [], parentNode = {}) {
  const groups = new Map();
  children.forEach((child) => {
    let key = child.type;
    if (parentNode.key === "section:community") {
      key = ["community:fans", "community:member_directory", "community:profiles"].includes(child.key)
        ? "community_members"
        : "community_communication";
    }
    // Keep each book's structural content visibly separated, rather than mixing
    // chapters, characters, volumes and parts in one flat-looking list.
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(child);
  });
  const preferredOrder = ["volume", "part", "chapter", "character", "track", "video", "community_members", "community_communication"];
  return [...groups.entries()].sort((a, b) => {
    const ai = preferredOrder.indexOf(a[0]);
    const bi = preferredOrder.indexOf(b[0]);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi) || a[0].localeCompare(b[0]);
  });
}

function CatalogNode({ node, depth = 0, onSave, roles = [], profiles = [], savingKey = "", activeKey, setActiveKey }) {
  const children = Array.isArray(node.children) ? node.children : [];
  const groups = groupCatalogChildren(children, node);
  const hasChildren = children.length > 0;
  const [mode, setMode] = useState(node.access_mode || "inherit");
  const [allowedRoles, setAllowedRoles] = useState(node.allowed_roles || []);
  const [profileKey, setProfileKey] = useState(node.access_profile_key || "");
  const [message, setMessage] = useState(node.locked_message || "Tento obsah je momentálně uzamčen.");
  useEffect(() => {
    setMode(node.access_mode || "inherit");
    setAllowedRoles(node.allowed_roles || []);
    setProfileKey(node.access_profile_key || "");
    setMessage(node.locked_message || "Tento obsah je momentálně uzamčen.");
  }, [node.access_mode, node.allowed_roles, node.access_profile_key, node.locked_message]);
  const toggleRole = (role) => setAllowedRoles((current) =>
    current.includes(role) ? current.filter((item) => item !== role) : [...current, role]
  );
  const statusLabel = {
    inherit: "Dědí nastavení",
    public: "Veřejné",
    authenticated: "Registrovaní",
    roles: "Vybrané role",
    users: "Vybraní uživatelé",
    profile: "Přístupový profil",
    locked: "Zamčené",
    hidden: "Skryté",
  }[node.access_mode || "inherit"];
  const isOpen = activeKey === node.key;
  return (
    <details
      className={`access-catalog-node depth-${Math.min(depth, 4)}`}
      open={isOpen}
      onToggle={(event) => {
        if (event.currentTarget.open) setActiveKey(node.key);
      }}
    >
      <summary>
        <span className="access-catalog-label">{node.label}</span>
        <span className={`access-catalog-status mode-${node.access_mode || "inherit"}`}>{statusLabel}</span>
        <span className="access-catalog-meta">{node.type}{node.source_id ? ` · #${node.source_id}` : ""}</span>
      </summary>
      <div className="access-catalog-rule-editor">
        <label>Režim přístupu
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
            <option value="inherit">Dědit od nadřazené položky</option>
            <option value="public">Aktivní – veřejný přístup</option>
            <option value="authenticated">Aktivní – registrovaní členové</option>
            <option value="profile">Aktivní – podle profilu</option>
            <option value="roles">Aktivní – vybrané role</option>
            <option value="locked">Zamčené</option>
            <option value="hidden">Skryté</option>
          </select>
        </label>
        {(mode === "roles" || mode === "hidden") && (
          <div className="access-catalog-role-picker">
            <strong>{mode === "hidden" ? "Výjimky – kdo smí skrytý obsah vidět (nepovinné)" : "Kdo smí obsah otevřít"}</strong>
            {mode === "hidden" && <p className="access-catalog-help">Bez vybraných výjimek zůstane obsah skrytý všem kromě vlastníka webu.</p>}
            <div>{roles.map((role) => (
              <label key={role.value}>
                <input type="checkbox" checked={allowedRoles.includes(role.value)} onChange={() => toggleRole(role.value)} />
                {role.label}
              </label>
            ))}</div>
          </div>
        )}
        {mode === "profile" && (
          <label>Přístupový profil
            <select value={profileKey} onChange={(event) => setProfileKey(event.target.value)}>
              <option value="">Vyber profil…</option>
              {profiles.map((profile) => <option key={profile.value} value={profile.value}>{profile.label}</option>)}
            </select>
          </label>
        )}
        {(mode === "locked" || mode === "hidden") && (
          <label>Zpráva při omezení
            <input value={message} maxLength={1000} onChange={(event) => setMessage(event.target.value)} />
          </label>
        )}
        <div className="access-catalog-rule-actions">
          <button type="button" className="site-settings-button is-primary" disabled={savingKey === node.key} onClick={() => onSave(node, { mode, allowedRoles, profileKey, message })}>
            {savingKey === node.key ? "Ukládám…" : "Uložit pravidlo"}
          </button>
        </div>
      </div>
      {hasChildren ? (
        <div className="access-catalog-children">
          {groups.map(([type, items]) => (
            <section className="access-catalog-group" key={`${node.id}-${type}`}>
              <div className="access-catalog-group-heading">
                <span>{CATALOG_GROUPS[type] || type}</span>
                <span>{items.length}</span>
              </div>
              <div className="access-catalog-group-items">
                {items.map((child) => <CatalogNode key={child.id} node={child} depth={depth + 1} onSave={onSave} roles={roles} profiles={profiles} savingKey={savingKey} activeKey={activeKey} setActiveKey={setActiveKey} />)}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </details>
  );
}

function getRootCountLabel(root) {
  const count = root.children?.length || 0;
  const labels = {
    "section:books": count === 1 ? "kniha" : count >= 2 && count <= 4 ? "knihy" : "knih",
    "section:soundtrack": count === 1 ? "skladba" : count >= 2 && count <= 4 ? "skladby" : "skladeb",
    "section:filmoteka": count === 1 ? "video" : count >= 2 && count <= 4 ? "videa" : "videí",
    "section:community": "funkcí",
  };
  return `${count} ${labels[root.key] || "položek"}`;
}

export default function SiteSettingsAdminPage() {
  const [settings, setSettings] = useState(null);
  const [sections, setSections] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSite, setSavingSite] = useState(false);
  const [savingSections, setSavingSections] = useState(false);
  const [savingFeature, setSavingFeature] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState("site");
  const [accessCatalog, setAccessCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [accessRoles, setAccessRoles] = useState([]);
  const [accessProfiles, setAccessProfiles] = useState([]);
  const [savingAccessKey, setSavingAccessKey] = useState("");
  const [activeAccessKey, setActiveAccessKey] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/admin/site-settings");
      setSettings({
        ...data.site,
        expected_restore_at: formatDateTime(data.site?.expected_restore_at),
      });
      setSections(data.sections || []);
      setFeatures(data.features || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const loadAccessCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError("");
    try {
      const [data, adminData] = await Promise.all([
        apiRequest("/admin/access-control/catalog"),
        apiRequest("/admin/access-control"),
      ]);
      setAccessCatalog(data.roots || []);
      setAccessRoles(adminData.roles || []);
      setAccessProfiles(adminData.profiles || []);
    } catch (err) {
      setCatalogError(err.message || "Katalog obsahu se nepodařilo načíst.");
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const saveAccessRule = useCallback(async (node, values) => {
    setSavingAccessKey(node.key);
    setCatalogError("");
    try {
      await apiRequest("/admin/access-control/resources", {
        method: "POST",
        body: JSON.stringify({
          resource_key: node.key,
          label: node.label,
          resource_type: node.type,
          parent_resource_key: node.parent_key || null,
          access_mode: values.mode,
          allowed_roles: values.allowedRoles,
          access_profile_key: values.profileKey || null,
          locked_message: values.message,
          is_active: true,
        }),
      });
      setNotice(`Pravidlo pro „${node.label}“ bylo uloženo.`);
      await loadAccessCatalog();
    } catch (err) {
      setCatalogError(err.message || "Pravidlo se nepodařilo uložit.");
    } finally {
      setSavingAccessKey("");
    }
  }, [loadAccessCatalog]);

  useEffect(() => {
    if (activeTab === "access") loadAccessCatalog();
  }, [activeTab, loadAccessCatalog]);

  const visibleAccessCatalog = useMemo(() => {
    const query = catalogSearch.trim().toLocaleLowerCase("cs");
    if (!query) return accessCatalog;
    const filterNode = (node) => {
      const children = (node.children || []).map(filterNode).filter(Boolean);
      const matches = `${node.label || ""} ${node.type || ""} ${node.key || ""}`.toLocaleLowerCase("cs").includes(query);
      return matches || children.length ? { ...node, children } : null;
    };
    return accessCatalog.map(filterNode).filter(Boolean);
  }, [accessCatalog, catalogSearch]);

  const readyFeatures = useMemo(
    () => features.filter((feature) => feature.implementation_status === "ready").length,
    [features]
  );

  function updateSite(field, value) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  function updateSection(sectionKey, field, value) {
    setSections((current) =>
      current.map((section) =>
        section.section_key === sectionKey ? { ...section, [field]: value } : section
      )
    );
  }

  function toggleRole(section, role) {
    const current = section.allowed_roles || [];
    const next = current.includes(role)
      ? current.filter((item) => item !== role)
      : [...current, role];
    updateSection(section.section_key, "allowed_roles", next);
  }

  async function saveSite(event) {
    event.preventDefault();
    setSavingSite(true);
    setError("");
    setNotice("");
    try {
      const { updated_at, ...payload } = settings;
      payload.expected_restore_at = payload.expected_restore_at
        ? new Date(payload.expected_restore_at).toISOString()
        : null;
      const result = await apiRequest("/admin/site-settings", {
        method: "PUT",
        body: JSON.stringify({ site: payload }),
      });
      setSettings({
        ...result.site,
        expected_restore_at: formatDateTime(result.site?.expected_restore_at),
      });
      setNotice(result.message || "Globální nastavení bylo uloženo.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingSite(false);
    }
  }

  async function saveSections(event) {
    event.preventDefault();
    setSavingSections(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest("/admin/site-settings/sections", {
        method: "PUT",
        body: JSON.stringify({ sections }),
      });
      setSections(result.sections || sections);
      setNotice(result.message || "Nastavení sekcí bylo uloženo.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingSections(false);
    }
  }

  async function toggleFeature(feature) {
    if (feature.implementation_status !== "ready") return;
    setSavingFeature(feature.feature_key);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(
        `/admin/site-settings/features/${encodeURIComponent(feature.feature_key)}`,
        {
          method: "PUT",
          body: JSON.stringify({ is_enabled: !feature.is_enabled }),
        }
      );
      setFeatures((current) =>
        current.map((item) =>
          item.feature_key === feature.feature_key ? result.feature : item
        )
      );
      setNotice(`Funkce „${feature.label}“ byla ${result.feature.is_enabled ? "zapnuta" : "vypnuta"}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingFeature("");
    }
  }

  if (loading) {
    return <div className="site-settings-loading">Načítám centrální nastavení…</div>;
  }

  if (!settings) {
    return (
      <div className="site-settings-error-panel">
        <strong>Nastavení se nepodařilo načíst.</strong>
        <p>{error || "Server nevrátil žádná data."}</p>
        <button type="button" className="site-settings-button" onClick={loadSettings}>
          Zkusit znovu
        </button>
      </div>
    );
  }

  return (
    <div className="site-settings-admin">
      <div className="site-settings-summary">
        <div>
          <span className="site-settings-eyebrow">CENTRÁLNÍ SPRÁVA</span>
          <h3>Centrální nastavení InEveryUnivers</h3>
          <p>Provoz, funkce, účty, přístupová práva a systémové zabezpečení na jednom místě.</p>
        </div>
        <div className="site-settings-summary-status">
          <StatusPill status={settings.site_status} />
          <span>4 hlavní oblasti obsahu</span>
          <span>{readyFeatures} aktivovatelných funkcí</span>
        </div>
      </div>

      {error && <div className="site-settings-alert is-error" role="alert">{error}</div>}
      {notice && <div className="site-settings-alert is-success" role="status">{notice}</div>}

      <div className="site-settings-tabs site-settings-cards" role="tablist" aria-label="Oblasti nastavení">
        <button type="button" className={activeTab === "site" ? "is-active" : ""} onClick={() => setActiveTab("site")}><span className="settings-card-icon">◷</span><strong>Provoz a stav webu</strong><small>Spuštění, odpočet a údržba</small></button>
        <button type="button" className={activeTab === "features" ? "is-active" : ""} onClick={() => setActiveTab("features")}><span className="settings-card-icon">⚙</span><strong>Funkce webu</strong><small>{features.length} technických funkcí</small></button>
        <button type="button" className={activeTab === "accounts" ? "is-active" : ""} onClick={() => setActiveTab("accounts")}><span className="settings-card-icon">♙</span><strong>Účty a komunikace</strong><small>Registrace, zprávy a upozornění</small></button>
        <button type="button" className={activeTab === "access" ? "is-active" : ""} onClick={() => setActiveTab("access")}><span className="settings-card-icon">♙</span><strong>Přístupová práva a zámky</strong><small>Viditelnost, role a profily</small></button>
        <button type="button" className={activeTab === "security" ? "is-active" : ""} onClick={() => setActiveTab("security")}><span className="settings-card-icon">⬡</span><strong>Zabezpečení a systém</strong><small>Ochrana a systémová pravidla</small></button>
      </div>

      {activeTab === "site" && (
        <form className="site-settings-panel" onSubmit={saveSite}>
          <div className="site-settings-panel-heading">
            <div><span className="site-settings-eyebrow">01 / PROVOZ A STAV</span><h4>Stav celého webu</h4></div>
          <div className="site-settings-note">Odpočet do slavnostního spuštění bude samostatným režimem před spuštěním. Jeho datum a veřejnou odpočítávací stránku doplníme po rozšíření databázového nastavení.</div>
            <StatusPill status={settings.site_status} />
          </div>
          <label className="site-settings-field">
            <span>Provozní režim</span>
            <select value={settings.site_status || "active"} onChange={(event) => updateSite("site_status", event.target.value)}>
              {SITE_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <div className="site-settings-two-columns">
            <label className="site-settings-field">
              <span>Nadpis stránky údržby</span>
              <input maxLength={500} value={settings.maintenance_title || ""} onChange={(event) => updateSite("maintenance_title", event.target.value)} />
            </label>
            <label className="site-settings-field">
              <span>Očekávané obnovení</span>
              <input type="datetime-local" value={settings.expected_restore_at || ""} onChange={(event) => updateSite("expected_restore_at", event.target.value)} />
            </label>
          </div>
          <label className="site-settings-field">
            <span>Zpráva pro návštěvníky</span>
            <textarea rows={3} maxLength={2000} value={settings.maintenance_message || ""} onChange={(event) => updateSite("maintenance_message", event.target.value)} />
          </label>
          <label className="site-settings-field">
            <span>Adresa obrázku na pozadí (volitelné)</span>
            <input maxLength={500} placeholder="https://…" value={settings.maintenance_background_url || ""} onChange={(event) => updateSite("maintenance_background_url", event.target.value)} />
          </label>

          <div className="site-settings-subsection">
            <span className="site-settings-eyebrow">PŘÍSTUP BĚHEM ODSTÁVKY</span>
            <p>Urči, které správcovské role se mohou dostat na web, když není v běžném provozu.</p>
            <div className="site-settings-access-grid">
              {[
                ["allow_admin_access", "Vlastník a administrátoři"],
                ["allow_moderator_access", "Moderátoři"],
                ["allow_beta_tester_access", "Beta testeři"],
              ].map(([key, label]) => (
                <label className="site-settings-check-card" key={key}>
                  <input type="checkbox" checked={Boolean(settings[key])} onChange={(event) => updateSite(key, event.target.checked)} />
                  <span><strong>{label}</strong><small>Povolit přístup během odstávky</small></span>
                </label>
              ))}
            </div>
          </div>
          <div className="site-settings-form-footer">
            <span>Změny se projeví po uložení.</span>
            <button className="site-settings-button is-primary" type="submit" disabled={savingSite}>{savingSite ? "Ukládám…" : "Uložit nastavení webu"}</button>
          </div>
        </form>
      )}

      {activeTab === "access" && (
        <section className="site-settings-panel">
          <div className="site-settings-panel-heading">
            <div><span className="site-settings-eyebrow">04 / PŘÍSTUPOVÁ PRÁVA</span><h4>Obsahový katalog</h4><p>Automaticky načtený strom skutečného obsahu webu. Synchronizace pouze eviduje položky; nemění jejich dosavadní přístupová pravidla.</p></div>
            <button type="button" className="site-settings-button" onClick={loadAccessCatalog} disabled={catalogLoading}>{catalogLoading ? "Načítám…" : "Obnovit katalog"}</button>
          </div>
          <div className="settings-roadmap-grid">
            <article><strong>Aktivní</strong><p>Obsah je přístupný podle pravidla a zděděného nastavení.</p></article>
            <article><strong>Zamčené</strong><p>Položka může zůstat viditelná s informačním zámkem; chráněný obsah se nesmí vydat.</p></article>
            <article><strong>Skryté</strong><p>Položka se nezobrazuje uživatelům mimo povolené role nebo účty.</p></article>
          </div>
          {catalogError && <div className="site-settings-alert is-error" role="alert">{catalogError}</div>}
          {catalogLoading && accessCatalog.length === 0 ? <p className="site-settings-note">Načítám obsah z databáze…</p> : null}
          {!catalogLoading && !catalogError && accessCatalog.length === 0 ? <p className="site-settings-note">Katalog zatím neobsahuje žádné položky.</p> : null}
          <label className="access-catalog-search">
            <span>Vyhledat knihu, kapitolu, postavu nebo jiný obsah</span>
            <input value={catalogSearch} onChange={(event) => setCatalogSearch(event.target.value)} placeholder="Začni psát název…" />
          </label>
          <div className="site-settings-note">Rozkliknutím položky otevřeš její pravidla. Vždy zůstane otevřená jen jedna položka, aby se administrace neroztahovala do nepřehledného stromu.</div>
          <div className="access-catalog-grid">
            {visibleAccessCatalog.map((root) => <article className="access-catalog-root" key={root.id}>
              <div className="access-catalog-root-heading"><strong>{root.label}</strong><span>{getRootCountLabel(root)}</span></div>
              <div className="access-catalog-tree"><CatalogNode node={root} onSave={saveAccessRule} roles={accessRoles} profiles={accessProfiles} savingKey={savingAccessKey} activeKey={activeAccessKey} setActiveKey={setActiveAccessKey} /></div>
            </article>)}
          </div>
          <p className="site-settings-note">Pravidla se ukládají centrálně. Položky bez vlastního pravidla dědí nastavení nejbližší nadřazené položky. Před nasazením nových restrikcí je nutné ověřit pokrytí všech veřejných API daného typu obsahu.</p>
        </section>
      )}

      {activeTab === "accounts" && (
        <section className="site-settings-panel">
          <div className="site-settings-panel-heading"><div><span className="site-settings-eyebrow">03 / ČLENSKÝ SYSTÉM</span><h4>Účty a komunikace</h4><p>Souhrn funkcí, které se týkají registrace a komunikace členů.</p></div></div>
          <div className="site-settings-feature-list">
            {features.filter((f) => /registration|login|email|message|notification|comment|profile|member|fan|report/i.test(`${f.feature_key} ${f.label} ${f.description}`)).map((feature) => {
              const ready = feature.implementation_status === "ready";
              return <article className={`site-settings-feature-card ${!ready ? "is-preparing" : ""}`} key={feature.feature_key}>
                <div className="site-settings-feature-copy"><div className="site-settings-feature-title"><h5>{feature.label}</h5><StatusPill status={feature.implementation_status}/></div><p>{feature.description}</p></div>
                <button type="button" role="switch" aria-checked={Boolean(feature.is_enabled)} className={`site-settings-switch ${feature.is_enabled ? "is-on" : ""}`} disabled={!ready || savingFeature === feature.feature_key} onClick={() => toggleFeature(feature)}><span/></button>
              </article>;
            })}
          </div>
          <p className="site-settings-note">Správa konkrétních uživatelských účtů zůstává v administraci Uživatelé. Tady jsou pouze centrální provozní přepínače.</p>
        </section>
      )}

      {activeTab === "security" && (
        <section className="site-settings-panel">
          <div className="site-settings-panel-heading"><div><span className="site-settings-eyebrow">05 / OCHRANA</span><h4>Zabezpečení a systém</h4><p>Souhrn systémových ochran a pravidel pro správu webu.</p></div></div>
          <div className="site-settings-note">Sem budou patřit bezpečnostní zásady účtů, administrátorská oprávnění, auditní záznamy a ochrana API. Stávající zabezpečení zůstává aktivní; tato obrazovka zatím nepřidává duplicitní ovládací prvky.</div>
        </section>
      )}

      {activeTab === "features" && (
        <div className="site-settings-panel">
          <div className="site-settings-panel-heading">
            <div><span className="site-settings-eyebrow">03 / FUNKCE</span><h4>Funkce projektu</h4><p>Zapínej pouze funkce, které jsou technicky připravené. Připravované položky zůstávají vypnuté.</p></div>
          </div>
          <div className="site-settings-feature-list">
            {features.filter((feature) => !/registration|login|email|message|notification|comment|profile|member|fan|report/i.test(`${feature.feature_key} ${feature.label} ${feature.description}`)).map((feature) => {
              const ready = feature.implementation_status === "ready";
              return (
                <article className={`site-settings-feature-card ${!ready ? "is-preparing" : ""}`} key={feature.feature_key}>
                  <div className="site-settings-feature-copy">
                    <div className="site-settings-feature-title"><h5>{feature.label}</h5><StatusPill status={feature.implementation_status} /></div>
                    <p>{feature.description}</p>
                    <code>{feature.feature_key}</code>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(feature.is_enabled)}
                    aria-label={`${feature.is_enabled ? "Vypnout" : "Zapnout"}: ${feature.label}`}
                    className={`site-settings-switch ${feature.is_enabled ? "is-on" : ""}`}
                    disabled={!ready || savingFeature === feature.feature_key}
                    onClick={() => toggleFeature(feature)}
                  ><span /></button>
                </article>
              );
            })}
          </div>
          <p className="site-settings-note">Připravované funkce nelze zapnout, dokud nebude dokončena jejich implementace.</p>
        </div>
      )}
    </div>
  );
}
