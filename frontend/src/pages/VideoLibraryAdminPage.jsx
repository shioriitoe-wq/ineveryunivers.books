import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./VideoLibraryAdminPage.css";

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000/api" : "https://ineveryunivers-books-api.onrender.com/api";
const MAX_SIZE = 500 * 1024 * 1024;

export default function VideoLibraryAdminPage() {
  const [videos, setVideos] = useState([]);
  const [books, setBooks] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(false);
  const [trackAssignments, setTrackAssignments] = useState([]);
  const [bookAssignments, setBookAssignments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const api = useCallback(async (path, options = {}) => {
    const token = sessionStorage.getItem("adminToken");
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`, ...options.headers,
    }});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Chyba ${response.status}`);
    return data;
  }, []);

  const load = useCallback(async () => {
    setError("");
    try {
      const [v, b, t] = await Promise.all([api("/admin/videos"), api("/books"), api("/admin/soundtracks")]);
      setVideos(Array.isArray(v) ? v : []); setBooks(Array.isArray(b) ? b : []); setTracks(Array.isArray(t) ? t : []);
    } catch (e) { setError(e.message); }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  function choose(video) {
    setSelected(video); setTitle(video.title); setDescription(video.description || ""); setPublished(video.published);
    setTrackAssignments((video.tracks || []).map(x => ({ id: x.id, role: x.role || "karaoke" })));
    setBookAssignments((video.books || []).map(x => ({ id: x.id, volume_id: x.volume_id || "" })));
    setMessage(""); setError("");
  }

  async function upload(file) {
    if (!file) return;
    setError(""); setMessage("");
    if (file.size > MAX_SIZE) { setError("Video je větší než povolených 500 MB."); return; }
    setUploading(true);
    try {
      const prep = await api("/admin/videos/upload-url", { method: "POST", body: JSON.stringify({ filename: file.name, mime_type: file.type || "application/octet-stream", size: file.size }) });
      const uploaded = await fetch(prep.upload_url, { method: "PUT", headers: { "Content-Type": prep.mime_type, "x-upsert": "false" }, body: file });
      if (!uploaded.ok) throw new Error(`Nahrání do Supabase selhalo (${uploaded.status}).`);
      const created = await api("/admin/videos", { method: "POST", body: JSON.stringify({ title: file.name.replace(/\.[^.]+$/, ""), storage_path: prep.storage_path, public_url: prep.public_url, mime_type: prep.mime_type, file_size: file.size }) });
      await load();
      const fresh = (await api("/admin/videos")).find(v => v.id === created.id);
      if (fresh) choose(fresh);
      setMessage("Video bylo nahráno do společné knihovny.");
    } catch (e) { setError(e.message); }
    finally { setUploading(false); }
  }

  function toggleTrack(id) {
    setTrackAssignments(old => old.some(x => x.id === id) ? old.filter(x => x.id !== id) : [...old, { id, role: "karaoke" }]);
  }
  function setTrackRole(id, role) { setTrackAssignments(old => old.map(x => x.id === id ? { ...x, role } : x)); }
  function toggleBook(id) {
    setBookAssignments(old => old.some(x => x.id === id) ? old.filter(x => x.id !== id) : [...old, { id, volume_id: "" }]);
  }
  function setBookVolume(id, volume_id) { setBookAssignments(old => old.map(x => x.id === id ? { ...x, volume_id } : x)); }

  async function save() {
    if (!selected) return;
    setSaving(true); setError(""); setMessage("");
    try {
      await api(`/admin/videos/${selected.id}`, { method: "PUT", body: JSON.stringify({ title, description, published }) });
      await api(`/admin/videos/${selected.id}/assignments`, { method: "PUT", body: JSON.stringify({ tracks: trackAssignments, books: bookAssignments }) });
      await load(); setMessage("Údaje a přiřazení byly uloženy.");
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  async function remove() {
    if (!selected || !window.confirm("Opravdu odstranit video z knihovny i ze Supabase Storage?")) return;
    try { await api(`/admin/videos/${selected.id}`, { method: "DELETE" }); setSelected(null); await load(); setMessage("Video bylo odstraněno."); }
    catch (e) { setError(e.message); }
  }

  const fmt = bytes => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  return <main className="video-admin">
    <header className="video-admin-header"><div><p className="video-admin-kicker">ADMINISTRACE / MÉDIA</p><h1>Knihovna videí</h1><p>Každý soubor nahraješ pouze jednou a můžeš ho sdílet mezi soundtracky i knihami.</p></div><Link to="/admin" className="video-admin-back">← Administrace</Link></header>
    {message && <div className="video-admin-message success">{message}</div>}{error && <div className="video-admin-message error">{error}</div>}
    <section className="video-admin-upload"><div><strong>Nahrát nové video</strong><span>MP4, WebM, MOV, AVI nebo MKV · maximálně 500 MB</span></div><label className="video-admin-upload-button">{uploading ? "Nahrávám…" : "＋ Vybrat video"}<input type="file" accept=".mp4,.webm,.mov,.avi,.mkv,video/*" disabled={uploading} onChange={e => { upload(e.target.files?.[0]); e.target.value = ""; }} /></label></section>
    <div className="video-admin-layout"><section className="video-admin-library"><h2>Všechna videa <span>{videos.length}</span></h2>{videos.length === 0 ? <p className="video-admin-empty">Zatím tu nejsou žádná videa.</p> : videos.map(v => <button key={v.id} className={`video-admin-item ${selected?.id === v.id ? "active" : ""}`} onClick={() => choose(v)}><span className="video-admin-play">▶</span><span className="video-admin-item-text"><strong>{v.title}</strong><small>{fmt(v.file_size)} · {(v.tracks?.length || 0) + (v.books?.length || 0)} přiřazení</small></span><span className={`video-admin-status ${v.published ? "on" : ""}`}>{v.published ? "Publikováno" : "Koncept"}</span></button>)}</section>
    {selected ? <section className="video-admin-editor"><div className="video-admin-preview"><video src={selected.public_url} controls preload="metadata" /></div><label>Název videa<input value={title} onChange={e => setTitle(e.target.value)} /></label><label>Popis<textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" /></label>
      <h3>Přiřadit ke skladbám</h3><p className="video-admin-hint">U každé skladby určíš, zda jde o karaoke video se synchronizovaným textem, nebo videostory.</p><div className="video-admin-checks">{tracks.map(t => { const a = trackAssignments.find(x => x.id === t.id); return <div className="video-admin-checkrow" key={t.id}><label><input type="checkbox" checked={!!a} onChange={() => toggleTrack(t.id)} />{t.title}</label>{a && <select value={a.role} onChange={e => setTrackRole(t.id, e.target.value)}><option value="karaoke">Karaoke video</option><option value="story">Videostory</option></select>}</div>; })}</div>
      <h3>Přiřadit ke knihám</h3><div className="video-admin-checks">{books.map(b => { const a = bookAssignments.find(x => x.id === b.id); return <div className="video-admin-checkrow" key={b.id}><label><input type="checkbox" checked={!!a} onChange={() => toggleBook(b.id)} />{b.title}</label></div>; })}</div>
      <label className="video-admin-publish"><input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} /> Zveřejnit video</label><div className="video-admin-actions"><button onClick={save} disabled={saving}>{saving ? "Ukládám…" : "Uložit změny"}</button><button className="danger" onClick={remove}>Smazat video</button></div><small className="video-admin-storage">Soubor: {selected.storage_path} · {fmt(selected.file_size)}</small>
    </section> : <section className="video-admin-editor video-admin-placeholder">Vyber video z knihovny nebo nahraj nové.</section>}</div>
  </main>;
}
