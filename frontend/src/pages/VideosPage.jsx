import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./VideosPage.css";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://ineveryunivers-books-api.onrender.com")
).replace(/\/$/, "");

function parseTags(tags) {
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (typeof tags === "string" && tags.trim()) {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
    return tags.split(/[;,]/).map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

function normalizeLabel(value = "") {
  return String(value).toLocaleLowerCase("cs").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").trim();
}

function getPrimaryBook(video) {
  return video?.books?.[0] || null;
}

function getSoundtrackBookKey(book) {
  return book?.volume_id
    ? `volume:${book.volume_id}`
    : book?.id ? `book:${book.id}` : "";
}

function getBookHref(book) {
  const label = normalizeLabel(`${book?.title || ""} ${book?.parentTitle || ""}`);
  if (label.includes("aeil")) return "/books/aeil";
  if (label.includes("vespera")) return "/books/vespera";
  if (label.includes("nezacalo")) return "/books/nezacalo";
  return "/books";
}

function getBookCover(book) {
  return book?.cover_url || book?.coverUrl || book?.volume_cover_url ||
    book?.volumeCoverUrl || book?.image_url || "";
}

function getVideoPoster(video) {
  return video?.poster_url || video?.thumbnail_url || video?.thumbnail ||
    video?.cover_url || video?.cover || "";
}

function VideoTag({ tag, active, onClick }) {
  return (
    <button
      type="button"
      className={`videos-tag ${active ? "is-active" : ""}`}
      onClick={onClick}
    >
      {tag}
    </button>
  );
}

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [bookCatalog, setBookCatalog] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("all");
  const [bookFilter, setBookFilter] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/videos`)
      .then((response) => {
        if (!response.ok) throw new Error("Videa se nepodařilo načíst.");
        return response.json();
      })
      .then((data) => {
        if (active) {
          const list = Array.isArray(data) ? data : [];
          setVideos(list);
          setSelectedId(list[0]?.id ?? null);
        }
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Stejný zdroj knih a svazků jako v Hudbě – neomezujeme se na knihy,
  // které už mají přiřazené video.
  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/books`)
      .then((response) => {
        if (!response.ok) throw new Error("Katalog knih se nepodařilo načíst.");
        return response.json();
      })
      .then(async (data) => {
        const catalog = Array.isArray(data) ? data : [];
        const expanded = await Promise.all(catalog.map(async (book) => {
          if (!book.uses_volumes && !book.uses_parts) return { ...book, volumes: [] };
          try {
            const response = await fetch(`${API_BASE}/api/books/${book.id}/volumes`);
            if (!response.ok) return { ...book, volumes: [] };
            const volumes = await response.json();
            return { ...book, volumes: Array.isArray(volumes) ? volumes : [] };
          } catch {
            return { ...book, volumes: [] };
          }
        }));
        if (active) setBookCatalog(expanded);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const visibleVideos = useMemo(() => {
    let result = videos;
    if (mode === "books" && bookFilter) {
      result = result.filter((video) => video.books?.some((book) =>
        String(book.id) === String(bookFilter.bookId) &&
        (bookFilter.volumeId == null || String(book.volume_id) === String(bookFilter.volumeId))
      ));
    } else if (mode === "books") {
      result = result.filter((video) => video.books?.length);
    }
    if (activeTag) {
      result = result.filter((video) => {
        const tags = parseTags(activeTag.type === "genre" ? video.genre_tags : video.mood_tags);
        return tags.some((tag) => normalizeLabel(tag) === normalizeLabel(activeTag.label));
      });
    }
    return result;
  }, [videos, mode, bookFilter, activeTag]);

  const selectedVideo = useMemo(
    () => visibleVideos.find((video) => String(video.id) === String(selectedId)) || visibleVideos[0] || null,
    [visibleVideos, selectedId]
  );

  useEffect(() => {
    if (selectedVideo && String(selectedVideo.id) !== String(selectedId)) {
      setSelectedId(selectedVideo.id);
    }
  }, [selectedVideo, selectedId]);

  const primaryBook = getPrimaryBook(selectedVideo);
  const soundtrackKey = getSoundtrackBookKey(primaryBook);
  const characterHref = primaryBook
    ? normalizeLabel(primaryBook.title).includes("aeil")
      ? "/books/aeil/characters"
      : normalizeLabel(primaryBook.title).includes("vespera")
        ? "/books/vespera/characters"
        : "/books"
    : "/books";

  function surpriseMe() {
    if (!visibleVideos.length) return;
    const choices = visibleVideos.filter((video) => String(video.id) !== String(selectedVideo?.id));
    const pool = choices.length ? choices : visibleVideos;
    setSelectedId(pool[Math.floor(Math.random() * pool.length)].id);
  }

  function showAll() {
    setMode("all");
    setBookFilter("");
    setActiveTag(null);
  }

  // Katalog knih se skládá z hlavních knih a jejich svazků stejně jako v Hudbě.
  const bookCards = useMemo(() => {
    const cards = [];
    bookCatalog.forEach((book, bookIndex) => {
      const parentTitle = String(book.title || "").trim();
      if (book.volumes?.length) {
        book.volumes.forEach((volume, volumeIndex) => {
          cards.push({
            key: `volume:${volume.id}`,
            bookId: book.id,
            volumeId: volume.id,
            title: volume.title || `${parentTitle} – ${volume.number ? `SVAZEK ${volume.number}` : "SVÁZEK"}`,
            parentTitle,
            cover: getBookCover(volume) || getBookCover(book),
            order: bookIndex * 1000 + volumeIndex
          });
        });
      } else {
        cards.push({
          key: `book:${book.id}`,
          bookId: book.id,
          volumeId: null,
          title: parentTitle,
          parentTitle: "",
          cover: getBookCover(book),
          order: bookIndex * 1000
        });
      }
    });
    return cards;
  }, [bookCatalog]);

  const genreTags = parseTags(selectedVideo?.genre_tags);
  const moodTags = parseTags(selectedVideo?.mood_tags);
  const tagResults = activeTag ? visibleVideos : [];

  return (
    <main className="videos-cinema-page">
      <div className="videos-cinema-glow videos-cinema-glow-one" aria-hidden="true" />
      <div className="videos-cinema-glow videos-cinema-glow-two" aria-hidden="true" />
      <div className="videos-cinema-grain" aria-hidden="true" />
      <div className="videos-cinema-sparkles" aria-hidden="true">
        {Array.from({ length: 38 }, (_, i) => (
          <i key={i} style={{
            "--sparkle-x": `${(i * 29 + 11) % 100}%`,
            "--sparkle-y": `${(i * 41 + 5) % 100}%`,
            "--sparkle-delay": `${(i % 17) * -0.8}s`,
            "--sparkle-duration": `${7 + (i % 8)}s`
          }} />
        ))}
      </div>

      <header className="videos-cinema-header">
        <Link to="/books" className="videos-back"><span>‹</span> ZPĚT</Link>
        <div className="videos-title-block">
          <p className="videos-eyebrow">INEVERYUNIVERS / ARCHIV</p>
          <h1>FILMOTÉKA</h1>
          <p className="videos-intro">Příběhy, ukázky a pohyblivé obrazy ze světů knih.</p>
        </div>
        <span className="videos-header-mark">ARCHIV · 01</span>
      </header>

      <nav className="videos-main-nav" aria-label="Navigace filmotékou">
        <button type="button" className={mode === "all" && !activeTag ? "is-active" : ""} onClick={showAll}>VŠECHNO</button>
        <button type="button" className={mode === "books" ? "is-active" : ""} onClick={() => { setMode("books"); setBookFilter(""); setActiveTag(null); }}>KNIHY</button>
        <button type="button" onClick={surpriseMe}>PŘEKVAP MĚ <span>⤨</span></button>
      </nav>

      {mode === "books" && (
        <section className="videos-book-shelf" aria-label="Knihovna knih a svazků">
          <button type="button" className={`videos-book-cover videos-book-cover-all ${!bookFilter ? "is-active" : ""}`}
            onClick={() => { setBookFilter(""); setActiveTag(null); }}>
            <span className="videos-book-cover-art">✦</span>
            <b>VŠECHNY KNIHY</b><small>CELÁ FILMOTÉKA</small>
          </button>
          {bookCards.map((book, index) => (
            <button type="button" key={book.key}
              className={`videos-book-cover ${bookFilter?.bookId === book.bookId && bookFilter?.volumeId === book.volumeId ? "is-active" : ""}`}
              onClick={() => { setBookFilter({ bookId: book.bookId, volumeId: book.volumeId }); setActiveTag(null); }}>
              {book.cover ? <img src={book.cover} alt="" loading="lazy" /> : <span className="videos-book-cover-art">✦</span>}
              <b>{book.title}</b>
              {book.parentTitle && <small>{book.parentTitle}</small>}
              <small>{videos.filter((video) => video.books?.some((item) =>
                String(item.id) === String(book.bookId) &&
                (book.volumeId == null || String(item.volume_id) === String(book.volumeId))
              )).length} VIDEÍ</small>
            </button>
          ))}
        </section>
      )}

      {loading ? <p className="videos-state">Načítám filmotéku…</p> :
       error ? <p className="videos-state videos-state-error">{error}</p> :
       !visibleVideos.length ? <p className="videos-state">V této části zatím nejsou žádná odpovídající zveřejněná videa.</p> : (
        <div className="videos-cinema-layout">
          <aside className="videos-film-library" aria-label="Filmotéka – seznam videí">
            <div className="videos-library-heading">
              <span className="videos-library-rule" />
              <div><p>ARCHIV FILMŮ</p><h2>Filmotéka</h2></div>
              <span className="videos-library-count">{String(visibleVideos.length).padStart(2, "0")}</span>
            </div>
            <div
              className="videos-library-list"
              aria-label="Plakáty videí – automaticky se posouvající seznam"
              style={{ "--library-loop-duration": `${Math.max(34, visibleVideos.length * 11)}s` }}
            >
              <div className="videos-library-track">
              {[0, 1].map((copyIndex) => (
                <div
                  className="videos-library-loop-group"
                  key={`library-loop-${copyIndex}`}
                  aria-hidden={copyIndex === 1 ? "true" : undefined}
                >
                  {visibleVideos.map((video) => (
                    <button
                      type="button"
                      key={`${copyIndex}-${video.id}`}
                      className={`videos-library-item ${String(selectedVideo?.id) === String(video.id) ? "active" : ""}`}
                      onClick={() => setSelectedId(video.id)}
                      aria-current={copyIndex === 0 && String(selectedVideo?.id) === String(video.id) ? "true" : undefined}
                      tabIndex={copyIndex === 1 ? -1 : 0}
                    >
                      <span className="videos-library-poster">
                        {getVideoPoster(video) ? (
                          <img src={getVideoPoster(video)} alt={`Plakát videa ${video.title}`} loading="lazy" />
                        ) : (
                          <span className="videos-library-poster-placeholder">✦</span>
                        )}
                      </span>
                      <span className="videos-library-item-copy">
                        <strong>{video.title}</strong>
                        <small>{video.books?.[0]?.title || "INEVERYUNIVERS"}</small>
                      </span>
                    </button>
                  ))}
                </div>
              ))}
              </div>
            </div>
            <div className="videos-library-footer">VÝBĚR Z AUTORSKÉHO ARCHIVU</div>
          </aside>

          <section className="videos-screen-column" aria-label="Přehrávač videa">
            {selectedVideo && (
              <article className="videos-featured-card" key={selectedVideo.id}>
                <div className="videos-screen-frame">
                  <div className="videos-screen-light" aria-hidden="true" />
                  <video key={selectedVideo.id} src={selectedVideo.public_url}
                    poster={getVideoPoster(selectedVideo) || undefined}
                    controls preload="metadata" playsInline />
                </div>

                <div className="videos-featured-content">
                  <div className="videos-video-heading">
                    <span className="videos-eyebrow">PRÁVĚ PROMÍTÁME</span>
                    <span className="videos-film-number">FILM · {String(selectedVideo.id).padStart(3, "0")}</span>
                  </div>
                  <h2>{selectedVideo.title}</h2>
                  {selectedVideo.description && <p className="videos-description">{selectedVideo.description}</p>}

                  {/* Metadata je stále viditelné, žádné rozbalovací okno. */}
                  <div className="videos-meta-grid">
                    <section className="videos-meta-section">
                      <h3>KNIHA / SVAZEK</h3>
                      {selectedVideo.books?.length ? <ul>{selectedVideo.books.map((book) => (
                        <li key={`${book.id}-${book.volume_id || "all"}`}>
                          <Link to={getBookHref(book)}>{book.title}</Link>
                          {book.volume_title && <small className="videos-volume-label">{book.volume_title}</small>}
                        </li>
                      ))}</ul> : <p className="videos-meta-empty">—</p>}
                    </section>
                    <section className="videos-meta-section">
                      <h3>POSTAVY</h3>
                      {selectedVideo.characters?.length ? <ul>{selectedVideo.characters.map((character) => (
                        <li key={character.id}>{character.name}</li>
                      ))}</ul> : <p className="videos-meta-empty">—</p>}
                    </section>
                    <section className="videos-meta-section">
                      <h3>TYP VIDEA</h3>
                      <div className="videos-tag-list">
                        {genreTags.length ? genreTags.map((tag) => (
                          <VideoTag key={tag} tag={tag} active={activeTag?.type === "genre" && normalizeLabel(activeTag.label) === normalizeLabel(tag)}
                            onClick={() => setActiveTag({ type: "genre", label: tag })} />
                        )) : <span className="videos-meta-empty">—</span>}
                      </div>
                    </section>
                    <section className="videos-meta-section">
                      <h3>NÁLADA</h3>
                      <div className="videos-tag-list">
                        {moodTags.length ? moodTags.map((tag) => (
                          <VideoTag key={tag} tag={tag} active={activeTag?.type === "mood" && normalizeLabel(activeTag.label) === normalizeLabel(tag)}
                            onClick={() => setActiveTag({ type: "mood", label: tag })} />
                        )) : <span className="videos-meta-empty">—</span>}
                      </div>
                    </section>
                  </div>

                  {activeTag && (
                    <section className="videos-tag-results">
                      <div className="videos-tag-results-heading">
                        <div><span className="videos-eyebrow">VÝBĚR PODLE ŠTÍTKU</span>
                          <h3>{activeTag.type === "genre" ? "Žánr" : "Nálada"}: {activeTag.label}</h3></div>
                        <button type="button" onClick={() => setActiveTag(null)}>ZRUŠIT FILTR ×</button>
                      </div>
                      {tagResults.length ? (
                        <div className="videos-tag-result-list">
                          {tagResults.map((video) => (
                            <button type="button" key={video.id}
                              className={String(selectedVideo.id) === String(video.id) ? "active" : ""}
                              onClick={() => setSelectedId(video.id)}>
                              <span className="videos-tag-result-thumb">
                                {getVideoPoster(video) ? <img src={getVideoPoster(video)} alt="" loading="lazy" /> : "▶"}
                              </span>
                              <span><b>{video.title}</b><small>{video.books?.[0]?.title || "INEVERYUNIVERS"}</small></span>
                            </button>
                          ))}
                        </div>
                      ) : <p className="videos-meta-empty">Žádná další videa s tímto štítkem.</p>}
                    </section>
                  )}

                  <nav className="videos-universe-links" aria-label="Odkazy ke knize">
                    <Link to={primaryBook ? `/soundtracks/books?book=${encodeURIComponent(soundtrackKey)}` : "/soundtracks"}>
                      <span>♫</span><b>HUDBA</b><small>SOUNDTRACK KNIHY</small>
                    </Link>
                    <Link to={characterHref}><span>♙</span><b>POSTAVY</b><small>{primaryBook ? "POSTAVY KNIHY" : "SVĚT KNIH"}</small></Link>
                    <Link to={primaryBook ? getBookHref(primaryBook) : "/books"}><span>▤</span><b>KNIHA</b><small>OTEVŘÍT KNIHU</small></Link>
                    <Link to="/community"><span>✧</span><b>KOMUNITA</b><small>PŘIDEJ SE K NÁM</small></Link>
                  </nav>
                </div>
              </article>
            )}

            {selectedVideo?.author_comment?.trim() && (
              <section className="videos-author-comment">
                <div className="videos-comment-mark">“</div>
                <div><h3>POZNÁMKA AUTORKY</h3><p>{selectedVideo.author_comment}</p></div>
              </section>
            )}
          </section>
        </div>
      )}

      <footer className="videos-cinema-footer">
        INEVERYUNIVERS.BOOKS <span>·</span> PŘÍBĚHY V POHYBU
      </footer>
    </main>
  );
}
