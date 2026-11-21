import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./PrivateMessagesPanel.css";

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000/api"
  : "https://ineveryunivers-books-api.onrender.com/api";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Avatar({ user, large = false }) {
  const label = user?.display_name || user?.username || "?";
  return <div className={`iu-pm-avatar${large ? " large" : ""}`}>
    {user?.avatar_url ? <img src={user.avatar_url} alt={`Avatar ${label}`} /> : label.slice(0, 1).toUpperCase()}
  </div>;
}

export default function PrivateMessagesPanel({ userId }) {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showNew, setShowNew] = useState(false);
  const conversationsRef = useRef([]);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  const token = () => sessionStorage.getItem("userToken");
  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token()}`,
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Požadavek se nezdařil.");
    return data;
  }, []);

  const loadConversations = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await request("/messages/conversations");
      setConversations(data.conversations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [request]);

  const loadMembers = useCallback(async (term = "") => {
    try {
      const data = await request(`/community/members?limit=60&q=${encodeURIComponent(term)}`);
      setMembers(data.members || []);
    } catch (err) {
      setError(err.message);
    }
  }, [request]);

  const loadConversation = useCallback(async (id, quiet = false) => {
    if (!id) return;
    if (!quiet) setChatLoading(true);
    try {
      const data = await request(`/messages/conversations/${id}?limit=100`);
      setMessages(data.messages || []);
      const found = conversationsRef.current.find(item => item.id === id);
      if (found) setOtherUser(found.other_user);
      else if (data.other_user) setOtherUser(data.other_user);
      await loadConversations(true);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!quiet) setChatLoading(false);
    }
  }, [request, loadConversations]);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => {
    if (!showNew) return;
    loadMembers(search);
  }, [showNew, search, loadMembers]);
  useEffect(() => {
    if (!selectedId) return;
    loadConversation(selectedId);
    const timer = window.setInterval(() => {
      loadConversation(selectedId, true);
    }, 12000);
    return () => window.clearInterval(timer);
  }, [selectedId, loadConversation]);

  const filteredMembers = useMemo(() => members, [members]);

  async function startConversation(member) {
    setError(""); setNotice("");
    try {
      const data = await request("/messages/conversations", {
        method: "POST", body: JSON.stringify({ recipient_id: member.id }),
      });
      await loadConversations();
      setShowNew(false); setSearch(""); setSelectedId(data.conversation_id);
      setOtherUser(member); setMessages([]);
    } catch (err) { setError(err.message); }
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!draft.trim() || !selectedId || sending) return;
    setSending(true); setError("");
    try {
      const data = await request(`/messages/conversations/${selectedId}/messages`, {
        method: "POST", body: JSON.stringify({ body: draft.trim() }),
      });
      setMessages(current => [...current, data.message]);
      setDraft("");
      await loadConversations(true);
    } catch (err) { setError(err.message); }
    finally { setSending(false); }
  }

  async function archiveConversation() {
    if (!selectedId || !window.confirm("Opravdu chceš tuto konverzaci archivovat?")) return;
    try {
      await request(`/messages/conversations/${selectedId}/archive`, { method: "POST" });
      setSelectedId(null); setOtherUser(null); setMessages([]); await loadConversations();
      setNotice("Konverzace byla archivována.");
    } catch (err) { setError(err.message); }
  }

  async function blockUser() {
    if (!otherUser || !window.confirm(`Opravdu chceš zablokovat uživatele ${otherUser.display_name || otherUser.username}?`)) return;
    try {
      await request(`/messages/users/${otherUser.id}/block`, { method: "POST" });
      setSelectedId(null); setOtherUser(null); setMessages([]); await loadConversations();
      setNotice("Uživatel byl zablokován.");
    } catch (err) { setError(err.message); }
  }

  async function reportMessage(message) {
    const reason = window.prompt("Důvod nahlášení: harassment, spam, threat, inappropriate nebo other", "other");
    if (!reason) return;
    const normalized = reason.trim().toLowerCase();
    if (!["harassment", "spam", "threat", "inappropriate", "other"].includes(normalized)) {
      setError("Použij důvod harassment, spam, threat, inappropriate nebo other."); return;
    }
    const details = window.prompt("Doplňující informace (nepovinné):", "") || "";
    try {
      await request(`/messages/${message.id}/report`, { method: "POST", body: JSON.stringify({ reason: normalized, details }) });
      setNotice("Hlášení bylo předáno moderátorům.");
    } catch (err) { setError(err.message); }
  }

  return <div className="iu-pm">
    <div className="iu-pm-heading">
      <div><span className="iu-pm-eyebrow">OSOBNÍ KOMUNIKACE</span><h2>Soukromé zprávy</h2><p>Tvoje osobní konverzace s ostatními členy InEveryUniverse.</p></div>
      <button className="iu-pm-gold-button" onClick={() => { setShowNew(value => !value); setSelectedId(null); setError(""); }}>{showNew ? "Zavřít" : "+ Nová zpráva"}</button>
    </div>
    {error && <div className="iu-pm-alert error">{error}</div>}
    {notice && <div className="iu-pm-alert success">{notice}</div>}

    {showNew ? <section className="iu-pm-new">
      <h3>Komu chceš napsat?</h3>
      <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Vyhledat člena podle jména…" aria-label="Vyhledat člena" />
      <div className="iu-pm-member-list">
        {filteredMembers.length ? filteredMembers.map(member => <button className="iu-pm-member" key={member.id} onClick={() => startConversation(member)}>
          <Avatar user={member}/><span><strong>{member.display_name || member.username}</strong><small>@{member.username}</small></span><b>Otevřít →</b>
        </button>) : <p className="iu-pm-muted">Nenašli jsme žádné členy.</p>}
      </div>
    </section> : <div className="iu-pm-layout">
      <aside className="iu-pm-inbox">
        <div className="iu-pm-inbox-title"><h3>Schránka</h3><button onClick={() => loadConversations()} title="Obnovit">↻</button></div>
        {loading ? <p className="iu-pm-muted">Načítám konverzace…</p> : conversations.length ? conversations.map(item => <button key={item.id} className={`iu-pm-conversation${selectedId === item.id ? " active" : ""}`} onClick={() => { setSelectedId(item.id); setShowNew(false); setError(""); }}>
          <Avatar user={item.other_user}/><span className="iu-pm-conversation-copy"><strong>{item.other_user.display_name || item.other_user.username}</strong><small>{item.last_message || "Zatím bez zpráv"}</small><em>{formatDate(item.last_message_at)}</em></span>{item.unread_count > 0 && <b className="iu-pm-unread">{item.unread_count}</b>}
        </button>) : <div className="iu-pm-empty"><span>✉</span><strong>Schránka je zatím prázdná</strong><p>Až si s někým napíšeš, objeví se vaše konverzace tady.</p><button onClick={() => { setShowNew(true); setSelectedId(null); }}>Napsat první zprávu</button></div>}
      </aside>
      <section className="iu-pm-chat">
        {selectedId ? <>
          <header className="iu-pm-chat-header"><div><Avatar user={otherUser} /><span><strong>{otherUser?.display_name || otherUser?.username || "Konverzace"}</strong><small>Soukromá konverzace 1 : 1</small></span></div><div className="iu-pm-chat-actions"><button onClick={blockUser}>Zablokovat</button><button onClick={archiveConversation}>Archivovat</button></div></header>
          <div className="iu-pm-message-list">
            {chatLoading ? <p className="iu-pm-muted">Načítám zprávy…</p> : messages.length ? messages.map(item => <article key={item.id} className={`iu-pm-message${item.sender_id === Number(userId) ? " mine" : ""}`}>
              <div>{item.body}</div><small>{formatDate(item.created_at)}{item.edited_at ? " · upraveno" : ""}</small>{item.sender_id !== Number(userId) && <button className="iu-pm-report" onClick={() => reportMessage(item)}>Nahlásit</button>}
            </article>) : <div className="iu-pm-empty"><span>✧</span><strong>Začni konverzaci</strong><p>Tahle schránka zatím neobsahuje žádné zprávy.</p></div>}
          </div>
          <form className="iu-pm-compose" onSubmit={sendMessage}><textarea value={draft} onChange={event => setDraft(event.target.value)} maxLength={5000} rows={2} placeholder="Napiš zprávu…" /><button className="iu-pm-gold-button" disabled={!draft.trim() || sending}>{sending ? "Odesílám…" : "Odeslat"}</button><small>{draft.length}/5000</small></form>
        </> : <div className="iu-pm-empty iu-pm-chat-placeholder"><span>✉</span><strong>Vyber konverzaci</strong><p>Otevři některou ze svých zpráv, nebo začni novou konverzaci.</p></div>}
      </section>
    </div>}
    <p className="iu-pm-privacy-note">Soukromé zprávy jsou určeny pouze dvěma účastníkům konverzace. Pokud narazíš na nevhodnou zprávu, můžeš ji nahlásit moderátorům.</p>
  </div>;
}
