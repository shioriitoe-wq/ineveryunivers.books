import { useEffect, useState } from "react";
import "./VideosPage.css";
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:5000/api" : "https://ineveryunivers-books-api.onrender.com/api";
export default function VideosPage() {
  const [videos, setVideos] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { let active = true; fetch(`${API_BASE}/videos`).then(r => { if (!r.ok) throw new Error("Videa se nepodařilo načíst."); return r.json(); }).then(data => { if (active) setVideos(Array.isArray(data) ? data : []); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  return <main className="videos-gallery"><p className="videos-eyebrow">INEVERYUNIVERS / ARCHIV</p><h1>Videa</h1><p className="videos-intro">Příběhy, ukázky a videa ze světa knih.</p>{loading ? <p>Načítám videa…</p> : error ? <p>{error}</p> : videos.length ? <div className="videos-grid">{videos.map(v => <article className="videos-card" key={v.id}><video src={v.public_url} controls preload="metadata"/><div><h2>{v.title}</h2>{v.description && <p>{v.description}</p>}</div></article>)}</div> : <p className="videos-empty">Zatím tu nejsou zveřejněná žádná videa.</p>}</main>;
}
