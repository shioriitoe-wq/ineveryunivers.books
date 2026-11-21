import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./VideoLibraryAdminPage.css";

const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000/api" : "https://ineveryunivers-books-api.onrender.com/api";
const MAX_SIZE = 50 * 1024 * 1024;
const GENRE_OPTIONS = ["Videostory", "Lyrics", "Trailer", "Teaser", "Příběh", "Charakterové video", "Rozhovor", "Ukázka ze scény", "Behind the Scenes", "Promo", "Komediální scénka", "Animace / Visualizer"];
const MOOD_OPTIONS = ["Romantická", "Energická", "Temná", "Epická", "Snová", "Melancholická", "Napínavá", "Nostalgická", "Tajemná", "Veselá", "Dramatická", "Smyslná", "Dojemná", "Odlehčená", "Provokativní", "Vtipná"];

export default function VideoLibraryAdminPage() {
  const [videos, setVideos] = useState([]);
  const [books, setBooks] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [bookVolumes, setBookVolumes] = useState({});
  const [genreTags, setGenreTags] = useState([]);
  const [moodTags, setMoodTags] = useState([]);
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [authorComment, setAuthorComment] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [posterUploading, setPosterUploading] = useState(false);
  const [published, setPublished] = useState(false);
  const [trackAssignments, setTrackAssignments] = useState([]);
  const [bookAssignments, setBookAssignments] = useState([]);
  const [characterAssignments, setCharacterAssignments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const api = useCallback(async (path, options = {}) => {
    const token = sessionStorage.getItem("userToken");
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
      setVideos(Array.isArray(v) ? v : []);
      setBooks(Array.isArray(b) ? b : []);
      setTracks(Array.isArray(t) ? t : []);
    } catch (e) { setError(e.message); }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let active = true;
    const ids = bookAssignments.map(x => x.id);
    if (!ids.length) { setAvailableCharacters([]); setBookVolumes({}); return () => { active = false; }; }
    Promise.all(ids.map(async id => {
      const [characters, volumes] = await Promise.all([
        api(`/books/${id}/characters`).then(rows => Array.isArray(rows) ? rows : []).catch(() => []),
        api(`/books/${id}/volumes`).then(rows => Array.isArray(rows) ? rows : []).catch(() => []),
      ]);
      return { id, characters, volumes };
    })).then(groups => {
      if (!active) return;
      const unique = new Map();
      const volumeMap = {};
      groups.forEach(group => {
        group.characters.forEach(c => unique.set(c.id, c));
        volumeMap[group.id] = group.volumes;
      });
      setAvailableCharacters([...unique.values()]);
      setBookVolumes(volumeMap);
    });
    return () => { active = false; };
  }, [api, bookAssignments]);

  function choose(video) {
    setSelected(video);
    setTitle(video.title || "");
    setDescription(video.description || "");
    setAuthorComment(video.author_comment || "");
    setGenreTags(Array.isArray(video.genre_tags) ? video.genre_tags : []);
    setMoodTags(Array.isArray(video.mood_tags) ? video.mood_tags : []);
    setPosterUrl(video.poster_url || "");
    setPublished(!!video.published);
    setTrackAssignments((video.tracks || []).map(x => ({ id: x.id, role: x.role || "karaoke" })));
    setBookAssignments((video.books || []).map(x => ({ id: x.id, volume_id: x.volume_id || "" })));
    setCharacterAssignments((video.characters || []).map(x => x.id));
    setMessage(""); setError("");
  }

  async function upload(file) {
    if (!file) return;
    setError(""); setMessage("");
    if (file.size > MAX_SIZE) { setError("Video je větší než povolených 50 MB."); return; }
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

  async function uploadPoster(file) {
    if (!file) return;
    setError(""); setMessage("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Obrázek musí být JPG, PNG nebo WebP."); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Obrázek může mít maximálně 5 MB."); return;
    }
    setPosterUploading(true);
    try {
      const prep = await api("/admin/videos/poster-upload-url", { method: "POST", body: JSON.stringify({ filename: file.name, mime_type: file.type, size: file.size }) });
      const uploaded = await fetch(prep.upload_url, { method: "PUT", headers: { "Content-Type": prep.mime_type, "x-upsert": "false" }, body: file });
      if (!uploaded.ok) throw new Error(`Nahrání obrázku selhalo (${uploaded.status}).`);
      setPosterUrl(prep.public_url);
      setMessage("Obrázek videa byl nahrán. Nezapomeň uložit změny.");
    } catch (e) { setError(e.message); }
    finally { setPosterUploading(false); }
  }

  function toggleTrack(id) {
    setTrackAssignments(old => old.some(x => x.id === id) ? old.filter(x => x.id !== id) : [...old, { id, role: "karaoke" }]);
  }
  function setTrackRole(id, role) { setTrackAssignments(old => old.map(x => x.id === id ? { ...x, role } : x)); }
  function toggleBook(id) {
    setBookAssignments(old => {
      const exists = old.some(x => x.id === id);
      if (exists) {
        const remaining = old.filter(x => x.id !== id);
        const remainingBookIds = new Set(remaining.map(x => x.id));
        setCharacterAssignments(chars => chars.filter(characterId => availableCharacters.some(c => c.id === characterId && remainingBookIds.has(c.book_id))));
        return remaining;
      }
      return [...old, { id, volume_id: "" }];
    });
  }
  function toggleCharacter(id) {
    setCharacterAssignments(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  }
  function setBookVolume(id, volume_id) {
    setBookAssignments(old => old.map(item => item.id === id ? { ...item, volume_id } : item));
  }
  function toggleTag(setter, value) {
    setter(old => old.includes(value) ? old.filter(item => item !== value) : [...old, value]);
  }

  async function save() {
    if (!selected) return;
    setSaving(true); setError(""); setMessage("");
    try {
      await api(`/admin/videos/${selected.id}`, { method: "PUT", body: JSON.stringify({ title, description, author_comment: authorComment, poster_url: posterUrl, genre_tags: genreTags, mood_tags: moodTags, published }) });
      await api(`/admin/videos/${selected.id}/assignments`, { method: "PUT", body: JSON.stringify({ tracks: trackAssignments, books: bookAssignments, characters: characterAssignments.map(id => ({ id })) }) });
      await load();
      const fresh = (await api("/admin/videos")).find(v => v.id === selected.id);
      if (fresh) choose(fresh);
      setMessage("Údaje a přiřazení byly uloženy.");
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  async function remove() {
    if (!selected || !window.confirm("Opravdu odstranit video z knihovny i ze Supabase Storage?")) return;
    try { await api(`/admin/videos/${selected.id}`, { method: "DELETE" }); setSelected(null); await load(); setMessage("Video bylo odstraněno."); }
    catch (e) { setError(e.message); }
  }

  const fmt = bytes => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  const selectedCharacterIds = useMemo(() => new Set(characterAssignments), [characterAssignments]);

  return <main className="video-admin">
    <header className="video-admin-header"><div><p className="video-admin-kicker">ADMINISTRACE / MÉDIA</p><h1>Knihovna videí</h1><p>Každý soubor nahraješ pouze jednou a můžeš ho sdílet mezi soundtracky i knihami.</p></div><Link to="/admin" className="video-admin-back">← Administrace</Link></header>
    {message && <div className="video-admin-message success">{message}</div>}{error && <div className="video-admin-message error">{error}</div>}
    <section className="video-admin-upload"><div><strong>Nahrát nové video</strong><span>MP4, WebM, MOV, AVI nebo MKV · maximálně 50 MB</span></div><label className="video-admin-upload-button">{uploading ? "Nahrávám…" : "＋ Vybrat video"}<input type="file" accept=".mp4,.webm,.mov,.avi,.mkv,video/*" disabled={uploading} onChange={e => { upload(e.target.files?.[0]); e.target.value = ""; }} /></label></section>
    <div className="video-admin-layout"><section className="video-admin-library"><h2>Všechna videa <span>{videos.length}</span></h2>{videos.length === 0 ? <p className="video-admin-empty">Zatím tu nejsou žádná videa.</p> : videos.map(v => <button key={v.id} className={`video-admin-item ${selected?.id === v.id ? "active" : ""}`} onClick={() => choose(v)}><span className="video-admin-play">▶</span><span className="video-admin-item-text"><strong>{v.title}</strong><small>{fmt(v.file_size)} · {(v.tracks?.length || 0) + (v.books?.length || 0) + (v.characters?.length || 0)} přiřazení</small></span><span className={`video-admin-status ${v.published ? "on" : ""}`}>{v.published ? "Publikováno" : "Koncept"}</span></button>)}</section>
    {selected ? <section className="video-admin-editor"><div className="video-admin-preview"><video src={selected.public_url} poster={posterUrl || undefined} controls preload="metadata" /></div>
      <div className="video-admin-poster-editor">
        <h3>Úvodní obrázek videa</h3>
        {posterUrl ? <img className="video-admin-poster-preview" src={posterUrl} alt="Náhled úvodního obrázku videa" /> : <div className="video-admin-poster-empty">Zatím není vybraný obrázek</div>}
        <div className="video-admin-poster-actions">
          <label className="video-admin-poster-button">{posterUploading ? "Nahrávám obrázek…" : "＋ Vybrat obrázek"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={posterUploading} onChange={e => { uploadPoster(e.target.files?.[0]); e.target.value = ""; }} /></label>
          {posterUrl && <button type="button" className="video-admin-poster-remove" onClick={() => setPosterUrl("")}>Odebrat obrázek</button>}
        </div>
        <small className="video-admin-hint">JPG, PNG nebo WebP · maximálně 5 MB. Obrázek se zobrazí jako náhled videa.</small>
      </div>
      <label>Název videa<input value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label>Popis<textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" /></label>
      <h3>Přiřadit ke skladbám</h3><p className="video-admin-hint">U každé skladby určíš, zda jde o karaoke video se synchronizovaným textem, nebo videostory.</p><div className="video-admin-checks">{tracks.map(t => { const a = trackAssignments.find(x => x.id === t.id); return <div className="video-admin-checkrow" key={t.id}><label><input type="checkbox" checked={!!a} onChange={() => toggleTrack(t.id)} />{t.title}</label>{a && <select value={a.role} onChange={e => setTrackRole(t.id, e.target.value)}><option value="karaoke">Karaoke video</option><option value="story">Videostory</option></select>}</div>; })}</div>
      <h3>Přiřadit ke knize a svazku</h3>
      <p className="video-admin-hint">Vyber knihu. Pokud má svazky, můžeš určit konkrétní svazek; bez výběru svazku bude video přiřazené celé knize.</p>
      <div className="video-admin-checks">{books.map(b => { const a = bookAssignments.find(x => String(x.id) === String(b.id)); const volumes = bookVolumes[b.id] || []; return <div className="video-admin-book-assignment" key={b.id}>
        <label className="video-admin-book-toggle"><input type="checkbox" checked={!!a} onChange={() => toggleBook(b.id)} />{b.title}</label>
        {a && volumes.length > 0 && <label className="video-admin-volume-select">Svazek<select value={a.volume_id || ""} onChange={e => setBookVolume(b.id, e.target.value)}><option value="">Celá kniha / bez konkrétního svazku</option>{volumes.map(volume => <option key={volume.id} value={volume.id}>{volume.title || `Svazek ${volume.number || ""}`}</option>)}</select></label>}
        {a && !volumes.length && b.uses_volumes && <small className="video-admin-hint">Tato kniha zatím nemá načtené svazky.</small>}
      </div>; })}</div>
      <h3>Žánr</h3><p className="video-admin-hint">Můžeš vybrat více žánrů.</p><div className="video-admin-tag-grid">{GENRE_OPTIONS.map(tag => <label key={tag} className={`video-admin-tag ${genreTags.includes(tag) ? "selected" : ""}`}><input type="checkbox" checked={genreTags.includes(tag)} onChange={() => toggleTag(setGenreTags, tag)} />{tag}</label>)}</div>
      <h3>Nálada</h3><p className="video-admin-hint">Můžeš vybrat více nálad.</p><div className="video-admin-tag-grid">{MOOD_OPTIONS.map(tag => <label key={tag} className={`video-admin-tag ${moodTags.includes(tag) ? "selected" : ""}`}><input type="checkbox" checked={moodTags.includes(tag)} onChange={() => toggleTag(setMoodTags, tag)} />{tag}</label>)}</div>
      <h3>Přiřadit postavy</h3><p className="video-admin-hint">Zobrazí se postavy z knih, které jsou přiřazené k tomuto videu.</p><div className="video-admin-checks">{availableCharacters.length ? availableCharacters.map(c => <div className="video-admin-checkrow" key={c.id}><label><input type="checkbox" checked={selectedCharacterIds.has(c.id)} onChange={() => toggleCharacter(c.id)} />{c.name}</label><small className="video-admin-character-book">{books.find(b => b.id === c.book_id)?.title || "Kniha"}</small></div>) : <p className="video-admin-empty">Nejprve přiřaď alespoň jednu knihu s postavami.</p>}</div>
      <label className="video-admin-comment">Poznámka autorky<textarea value={authorComment} onChange={e => setAuthorComment(e.target.value)} rows="4" placeholder="Osobní komentář k videu…" /></label>
      <label className="video-admin-publish"><input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} /> Zveřejnit video</label><div className="video-admin-actions"><button onClick={save} disabled={saving}>{saving ? "Ukládám…" : "Uložit změny"}</button><button className="danger" onClick={remove}>Smazat video</button></div><small className="video-admin-storage">Soubor: {selected.storage_path} · {fmt(selected.file_size)}</small>
    </section> : <section className="video-admin-editor video-admin-placeholder">Vyber video z knihovny nebo nahraj nové.</section>}</div>
  </main>;
}
