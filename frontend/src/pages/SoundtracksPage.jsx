import { useEffect, useMemo, useState } from "react";

import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { useMusicPlayer } from "../context/MusicPlayerContext";

import "../styles/SoundtracksPage.css";

// Obálky hlavních knih z hlavní knihovny webu (ne obaly jednotlivých skladeb).
import nezacaloBookCover from "../assets/images/nezacalo-to.png";
import vesperaBookCover from "../assets/images/Vespera/vespera.webp";
import aeilBookCover from "../assets/images/AEIL/aeil.png";

const API_BASE = (

  import.meta.env.VITE_API_URL ||

  (window.location.hostname === "localhost" ||

  window.location.hostname === "127.0.0.1"

    ? "http://localhost:5000"

    : "https://ineveryunivers-books-api.onrender.com")

).replace(/\/$/, "");

const MOOD_OPTIONS = ["Romantická", "Energická", "Temná", "Epická", "Snová", "Melancholická", "Napínavá", "Nostalgická", "Tajemná", "Veselá"];

const GENRE_OPTIONS = ["Ambient", "Pop", "Rock", "Metal", "Orchestrální", "Indie", "Elektronická", "Akustická", "Soundtrack", "Alternativní", "Stories"];

function getBookTheme(bookName = "", volumeName = "", volumeNumber = "") {
  const normalize = (value) => String(value || "").toLocaleLowerCase("cs").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const book = normalize(bookName);
  const volume = normalize(volumeName);
  const combined = `${book} ${volume} ${normalize(volumeNumber)}`;
  // API obvykle vrací název hlavní knihy a samostatný název svazku.
  // Podsvazek může obsahovat jen poslední část názvu, proto kontrolujeme i krátké varianty.
  if (combined.includes("aeil")) return "theme-aeil";
  if (combined.includes("vespera")) return "theme-vespera";
  if (combined.includes("nezacalo")) {
    if (combined.includes("nasim pribeh") || combined.includes("nas pribeh") || combined.includes("pribehem") || combined.includes("pribeh")) return "theme-nezacalo theme-nezacalo-pribehem";
    if (combined.includes("v temnote") || combined.includes("temnote") || combined.includes("temnota")) return "theme-nezacalo theme-nezacalo-temnote";
    if (combined.includes("spravne")) return "theme-nezacalo theme-nezacalo-spravne";
    if (combined.includes("tady")) return "theme-nezacalo theme-nezacalo-tady";
    if (combined.includes("letem") || combined.includes("leto")) return "theme-nezacalo theme-nezacalo-letem";
    return "theme-nezacalo";
  }
  // Názvy poddílů někdy přijdou bez názvu série.
  if (volume.includes("letem") || volume.includes("leto")) return "theme-nezacalo theme-nezacalo-letem";
  if (volume.includes("temnote") || volume.includes("temnota")) return "theme-nezacalo theme-nezacalo-temnote";
  if (volume.includes("spravne")) return "theme-nezacalo theme-nezacalo-spravne";
  if (volume.includes("tady")) return "theme-nezacalo theme-nezacalo-tady";
  if (volume.includes("pribeh")) return "theme-nezacalo theme-nezacalo-pribehem";
  return "";
}

function normalizeLabel(value = "") {
  return String(value || "")
    .toLocaleLowerCase("cs")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function uniqueLabels(values = []) {
  const seen = new Set();
  return values.filter((value) => {
    const key = normalizeLabel(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}


// ZDE MŮŽEŠ UPRAVIT VÝCHOZÍ POŘADÍ KNIH A DÍLŮ.
// První položka se zobrazí nejdřív. Pořadí neznámých knih se zachová podle katalogu.
const CUSTOM_BOOK_ORDER = [
  { name: "Nezačalo to létem", matches: ["letem", "leto"] },
  { name: "Nezačalo to v temnotě", matches: ["temnote", "temnota"] },
  { name: "Nezačalo to správně", matches: ["spravne"] },
  { name: "Nezačalo to tady", matches: ["tady"] },
  { name: "Nezačalo to naším příběhem", matches: ["nasim pribeh", "pribehem"] },
  { name: "AEIL", matches: ["aeil"] },
  { name: "Vespera", matches: ["vespera"] },
];

function getCustomBookRank(...labels) {
  const candidates = labels.map((label) => normalizeLabel(label)).filter(Boolean);
  for (let index = 0; index < CUSTOM_BOOK_ORDER.length; index += 1) {
    const matches = CUSTOM_BOOK_ORDER[index].matches;
    if (matches.some((match) => candidates.some((candidate) => candidate.includes(match)))) {
      return index;
    }
  }
  return -1;
}

function getTrackVolumeRank(track) {
  const volumeTitle = String(track?.volume_title || track?.volume_name || "").trim();
  const parentTitle = String(track?.book_title || track?.book_name || "").trim();
  const volumeLabel = normalizeLabel(volumeTitle);
  const volumeRank = getCustomBookRank(volumeTitle);
  if (volumeRank >= 0) return volumeRank;

  // Pokud administrace používá obecné názvy „Svazek 1/2/3…“, využijeme číslo svazku.
  const genericVolume = !volumeLabel || /^(SVAZEK|volume|dil)? ?[0-9]+$/.test(volumeLabel);
  const volumeNumber = Number(track?.volume_number);
  if (genericVolume && (normalizeLabel(parentTitle).includes("nezacalo") || normalizeLabel(parentTitle).includes("ne zacalo")) && Number.isFinite(volumeNumber) && volumeNumber >= 1 && volumeNumber <= 5) {
    return volumeNumber - 1;
  }

  return getCustomBookRank(parentTitle);
}

function getBookVolumeRank(book) {
  const titleRank = getCustomBookRank(book?.title, book?.volumeTitle);
  if (titleRank >= 0) return titleRank;

  const volumeLabel = normalizeLabel(book?.title || book?.volumeTitle || "");
  const volumeNumber = Number(book?.volumeNumber);
  if (/^(SVAZEK|volume|dil)? ?[0-9]+$/.test(volumeLabel) && (normalizeLabel(book?.parentTitle).includes("nezacalo") || normalizeLabel(book?.parentTitle).includes("ne zacalo")) && Number.isFinite(volumeNumber) && volumeNumber >= 1 && volumeNumber <= 5) {
    return volumeNumber - 1;
  }

  return getCustomBookRank(book?.parentTitle);
}

function getTrackBookLabel(track) {
  return String(
    track?.volume_title || track?.volume_name || track?.book_title || track?.book_name || "Samostatná skladba"
  ).trim();
}

function getBookCoverImage(book) {
  // Pokud někdy API/administrace poskytne samostatnou obálku knihy či svazku,
  // použijeme ji před lokální obálkou hlavní série.
  const suppliedCover = (book?.tracks || []).map((track) =>
    track.book_cover_url ||
    track.bookCoverUrl ||
    track.volume_cover_url ||
    track.volumeCoverUrl ||
    track.book_image_url ||
    track.bookImageUrl ||
    track.cover_book_url ||
    ""
  ).find(Boolean);
  if (suppliedCover) return suppliedCover;

  const title = normalizeLabel(`${book?.parentTitle || ""} ${book?.title || ""} ${book?.volumeTitle || ""}`);
  if (title.includes("aeil")) return aeilBookCover;
  if (title.includes("vespera")) return vesperaBookCover;
  if (title.includes("nezacalo")) return nezacaloBookCover;
  return "";
}

function getBookCardPalette(bookTitle = "", volumeTitle = "", volumeNumber = "") {
  const all = normalizeLabel(`${bookTitle} ${volumeTitle} ${volumeNumber}`);
  // Barvy odpovídají aktuálním --music-ui-accent proměnným v SoundtracksPage.css.
  if (all.includes("aeil")) return { accent: "#ffdc79", accent2: "#d30420", accent3: "#ce3c13" };
  if (all.includes("vespera")) return { accent: "#858889", accent2: "#29dbc0", accent3: "#63a9fe" };
  if (all.includes("temnote") || all.includes("temnota")) return { accent: "#c5a0ff", accent2: "#7ed60a", accent3: "#eee0ff" };
  if (all.includes("spravne")) return { accent: "#ff65c7", accent2: "#68caff", accent3: "#ffc0e8" };
  if (all.includes("tady")) return { accent: "#ffffff", accent2: "#1fc0ff", accent3: "#d8f5ff" };
  if (all.includes("pribehem") || all.includes("nasim pribeh") || all.includes("pribeh")) return { accent: "#900011", accent2: "#2548b9", accent3: "#ffd0d6" };
  if (all.includes("letem") || all.includes("leto") || all.includes("nezacalo")) return { accent: "#0ed1f4", accent2: "#f5811a", accent3: "#ffe2aa" };
  return { accent: "#f17bcf", accent2: "#55c9ff", accent3: "#d8b8ff" };
}

function getTrackBookKey(track) {
  const parentTitle = String(track?.book_title || track?.book_name || "").trim();
  const volumeTitle = String(track?.volume_title || track?.volume_name || "").trim();
  const volumeNumber = track?.volume_number ?? "";
  const volumeId = track?.volume_id;
  if (!parentTitle && !volumeTitle && !volumeNumber && volumeId == null) return "";

  // Používáme primárně názvy, aby se záznamy se stejnou knihou neseskupily
  // odděleně jen kvůli chybějícímu book_id v některém záznamu.
  const parentKey = normalizeLabel(parentTitle) || (track?.book_id != null ? `id-${track.book_id}` : "unknown-book");
  const volumeKey = normalizeLabel(volumeTitle) || (volumeNumber !== "" ? `number-${normalizeLabel(volumeNumber)}` : (volumeId != null ? `id-${volumeId}` : ""));
  if (volumeKey) return `volume:${parentKey}:${volumeKey}`;
  return parentTitle ? `book:${parentKey}` : "";
}

function formatTime(value = 0) {

  const seconds = Math.max(0, Math.floor(Number(value) || 0));

  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

}

function splitTags(value) {

  if (Array.isArray(value)) return value;

  if (!value) return [];

  try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed; } catch {}

  return String(value).split(/[;,]/).map((item) => item.trim()).filter(Boolean);

}

function normalizeTrack(track) {

  return {

    ...track,

    mood_tags: splitTags(track.mood_tags ?? track.mood),

    genre_tags: splitTags(track.genre_tags ?? track.genre),

    duration_seconds: Number(track.duration_seconds || track.duration || 0),

    audio_url: track.audio_url || track.audio || "",

    cover_url: track.cover_url || track.cover || "",

    lyrics_lines: Array.isArray(track.lyrics_lines)
      ? track.lyrics_lines.map((line) => typeof line === "string"
          ? { text_original: line, text_cs: "", start_ms: null, end_ms: null }
          : {
              ...line,
              text_original: line.text_original ?? line.text_en ?? line.original ?? line.en ?? "",
              text_cs: line.text_cs ?? line.cs ?? line.translation ?? "",
              start_ms: line.start_ms ?? line.startMs ?? null,
              end_ms: line.end_ms ?? line.endMs ?? null,
            })
      : [],

  };

}

function TrackRow({ track, active, onSelect, showCover = false }) {
  return (
    <button
      type="button"
      className={`music-track-row ${showCover ? "has-cover" : ""} ${active ? "is-active" : ""}`}
      onClick={() => onSelect(track)}
    >
      {showCover && (
        <span className="music-track-row-cover" aria-hidden="true">
          {track.cover_url ? (
            <img src={track.cover_url} alt="" loading="lazy" />
          ) : (
            <span className="music-track-row-cover-placeholder">♫</span>
          )}
        </span>
      )}
      <span className="music-track-row-content">
        <span className="music-track-row-title">{track.title}</span>
        <span className="music-track-row-book">
          {[track.book_title || track.book_name, track.volume_title || (track.volume_number ? `SVAZEK ${track.volume_number}` : "")]
            .filter(Boolean)
            .join(" · ") || "Samostatná skladba"}
        </span>
        <span className="music-track-row-meta">
          <span>{track.mood_tags?.length ? track.mood_tags.slice(0, 2).join(" · ") : "Atmosféra neuvedena"}</span>
          <time>{formatTime(track.duration_seconds)}</time>
        </span>
      </span>
    </button>
  );
}

function LyricsPanel({ track, expanded, onToggle, fullPage = false }) {

  const player = useMusicPlayer();

  const [karaoke, setKaraoke] = useState(false);

  const lines = track?.lyrics_lines || [];
  const downloadLyrics = () => {
    const content = lines.map((line) => {
      const original = line.text_original ?? line.text_en ?? line.en ?? "";
      const translation = line.text_cs ?? line.cs ?? "";
      return [original, translation].filter(Boolean).join("\n");
    }).join("\n\n");
    const blob = new Blob([`${track.title || "Text písně"}\n\n${content}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(track.title || "text-pisne").replace(/[^a-z0-9-_ ]/gi, "").trim().replace(/\s+/g, "-")}-lyrics.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const activeLine = useMemo(() => {

    // Nečasované řádky (např. [Kai], názvy slok nebo mezititulky)
    // zůstávají v textu, ale nesmí se účastnit karaoke zvýrazňování.
    const timedLines = lines
      .map((line, index) => {
        const rawStart = line.start_ms ?? line.startMs;
        if (rawStart === null || rawStart === undefined || String(rawStart).trim() === "") {
          return null;
        }

        const startMs = Number(rawStart);
        if (!Number.isFinite(startMs) || startMs < 0) return null;

        const rawEnd = line.end_ms ?? line.endMs;
        const endMs = rawEnd === null || rawEnd === undefined || String(rawEnd).trim() === ""
          ? null
          : Number(rawEnd);

        return {
          index,
          start: startMs / 1000,
          end: Number.isFinite(endMs) && endMs > startMs ? endMs / 1000 : null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);

    const time = Number(player.currentTime) || 0;

    for (let index = 0; index < timedLines.length; index += 1) {
      const item = timedLines[index];
      const nextStart = timedLines[index + 1]?.start;
      const effectiveEnd = item.end ?? nextStart ?? Infinity;

      if (time >= item.start && time < effectiveEnd) {
        return item.index;
      }
    }

    return -1;

  }, [lines, player.currentTime]);

  return (

    <section className={`music-lyrics-panel ${fullPage ? "is-full-page" : ""} ${expanded ? "is-open" : ""}`}>

      <button className="music-lyrics-toggle" onClick={onToggle} aria-expanded={expanded}>

        <span><b>{expanded ? "−" : "+"}</b> LYRICS</span>

        <span>{expanded ? "ZOBRAZIT MÉNĚ" : "ZOBRAZIT TEXT"} <b>{expanded ? "⌃" : "⌄"}</b></span>

      </button>

      {expanded && (

        <>

          <div className="music-lyrics-toolbar">

            <span>ORIGINÁL <i>·</i> ČESKÝ PŘEKLAD</span>

            <div className="music-lyrics-toolbar-actions"><button type="button" onClick={downloadLyrics} disabled={!lines.length}>↓ STÁHNOUT TEXT</button><button className={karaoke ? "is-active" : ""} onClick={() => setKaraoke((value) => !value)}>♫ {karaoke ? "VYPNOUT KARAOKE" : "KARAOKE REŽIM"}</button></div>

          </div>

          {lines.length ? (

            <div className={`music-lyrics-columns ${karaoke ? "karaoke-on" : ""}`}>

              <div className="music-lyrics-language"><h3>ORIGINÁL</h3>{lines.map((line, index) => <button key={line.id ?? index} style={{ color: "#eee6dc", opacity: 1, display: "block", width: "100%", textAlign: "left", whiteSpace: "pre-wrap" }} className={karaoke && index === activeLine ? "is-current" : ""} onClick={() => line.start_ms != null && player.seek(Number(line.start_ms) / 1000)}>{line.text_original ?? line.text_en ?? line.en ?? ""}</button>)}</div>

              <div className="music-lyrics-language"><h3>ČESKÝ PŘEKLAD</h3>{lines.map((line, index) => <button key={line.id ?? index} style={{ color: "#eee6dc", opacity: 1, display: "block", width: "100%", textAlign: "left", whiteSpace: "pre-wrap" }} className={karaoke && index === activeLine ? "is-current" : ""} onClick={() => line.start_ms != null && player.seek(Number(line.start_ms) / 1000)}>{line.text_cs ?? line.cs ?? ""}</button>)}</div>

            </div>

          ) : (

            <div className="music-lyrics-empty">Text této skladby zatím není doplněný. Originál, překlad a časování bude možné spravovat v administraci Hudby.</div>

          )}

        </>

      )}

    </section>

  );

}

export default function SoundtracksPage() {

  const navigate = useNavigate();

  const location = useLocation();

  const { slug } = useParams();

  const player = useMusicPlayer();

  const [tracks, setTracks] = useState([]);
  const [bookCatalog, setBookCatalog] = useState([]);

  // Levý playlist je nezávislý na aktuální stránce, filtru nebo vybrané knize.
  // Náhodné pořadí se vytvoří při načtení katalogu a během běžného renderování se nemění.
  const leftPlaylistTracks = useMemo(() => {
    const shuffled = [...tracks];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }
    return shuffled;
  }, [tracks]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [lyricsExpanded, setLyricsExpanded] = useState(false);
  const [playerView, setPlayerView] = useState(0);
  const [trackVideos, setTrackVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);


  const [activeMood, setActiveMood] = useState("");

  const [activeGenre, setActiveGenre] = useState("");

  const [bookSort, setBookSort] = useState("catalog");
  const [allSort, setAllSort] = useState("order");

  useEffect(() => {

    let alive = true;

    setLoading(true);

    fetch(`${API_BASE}/api/soundtracks`)

      .then((response) => { if (!response.ok) throw new Error("Hudební katalog se nepodařilo načíst."); return response.json(); })

      .then((data) => { if (alive) setTracks(Array.isArray(data) ? data.map(normalizeTrack) : []); })

      .catch((fetchError) => { if (alive) setError(fetchError.message || "Nepodařilo se připojit ke katalogu Hudby."); })

      .finally(() => { if (alive) setLoading(false); });

    // Katalog knih a svazků je zdrojem pravdivého pořadí i obálek.
    // Karty tak nezávisí na tom, zda už má daný SVAZEK přiřazenou skladbu.
    fetch(`${API_BASE}/api/books`)
      .then((response) => {
        if (!response.ok) throw new Error("Katalog knih se nepodařilo načíst.");
        return response.json();
      })
      .then(async (data) => {
        const catalog = Array.isArray(data) ? data : [];
        const expanded = await Promise.all(catalog.map(async (book) => {
          if (!book.uses_volumes) return { ...book, volumes: [] };
          try {
            const response = await fetch(`${API_BASE}/api/books/${book.id}/volumes`);
            if (!response.ok) return { ...book, volumes: [] };
            const volumes = await response.json();
            return { ...book, volumes: Array.isArray(volumes) ? volumes : [] };
          } catch {
            return { ...book, volumes: [] };
          }
        }));
        if (alive) setBookCatalog(expanded);
      })
      .catch((catalogError) => {
        if (alive) setError((current) => current || catalogError.message || "Katalog knih se nepodařilo načíst.");
      });

    return () => { alive = false; };

  }, []);

  const routeMode = location.pathname.endsWith("/all")
    ? "all"
    : location.pathname.endsWith("/books")
      ? "books"
      : location.pathname.endsWith("/surprise")
        ? "surprise"
        : slug
          ? "track"
          : "home";

  const currentTrack = (slug && tracks.find((track) => track.slug === slug)) || player.currentTrack || tracks[0] || null;

  useEffect(() => {
    let alive = true;
    if (!currentTrack?.id) {
      setTrackVideos([]);
      return () => { alive = false; };
    }

    setVideosLoading(true);
    fetch(`${API_BASE}/api/videos?track_id=${encodeURIComponent(currentTrack.id)}`)
      .then((response) => {
        if (!response.ok) throw new Error("Videa se nepodařilo načíst.");
        return response.json();
      })
      .then((data) => {
        if (alive) setTrackVideos(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (alive) setTrackVideos([]);
      })
      .finally(() => {
        if (alive) setVideosLoading(false);
      });

    return () => { alive = false; };
  }, [currentTrack?.id]);

  const lyricsVideos = trackVideos.filter((video) => video.role === "karaoke");
  const storyVideos = trackVideos.filter((video) => video.role === "story");

  const selectedBookKey = new URLSearchParams(location.search).get("book") || "";

  // Vycházíme ze všech knih a svazků v administraci, nikoli jen ze skladeb.
  // Díky tomu se zobrazí i svazky bez skladeb a zachová se pořadí katalogu.
  const books = useMemo(() => {
    const trackGroups = new Map();
    tracks.forEach((track) => {
      const key = track.volume_id != null
        ? `volume:${track.volume_id}`
        : `book:${track.book_id ?? normalizeLabel(track.book_title || track.book_name || "")}`;
      if (!trackGroups.has(key)) trackGroups.set(key, []);
      trackGroups.get(key).push(track);
    });

    const result = [];
    bookCatalog.forEach((book, bookIndex) => {
      const parentTitle = String(book.title || "").trim();
      if (book.uses_volumes && book.volumes?.length) {
        book.volumes.forEach((volume, volumeIndex) => {
          const key = `volume:${volume.id}`;
          const volumeTracks = trackGroups.get(key) || tracks.filter((track) =>
            String(track.book_id ?? "") === String(book.id) && (
              String(track.volume_number ?? "") === String(volume.number ?? "") ||
              normalizeLabel(track.volume_title || track.volume_name || "") === normalizeLabel(volume.title)
            )
          );
          result.push({
            key,
            title: String(volume.title || (volume.number ? `${parentTitle} — SVAZEK ${volume.number}` : parentTitle)).trim(),
            parentTitle,
            volumeTitle: volume.title || "",
            volumeNumber: volume.number ?? "",
            bookId: book.id,
            volumeId: volume.id,
            coverUrl: volume.cover_url || book.cover_url || "",
            firstIndex: bookIndex * 1000 + volumeIndex,
            tracks: volumeTracks,
            themeClass: getBookTheme(parentTitle, volume.title, volume.number),
            palette: getBookCardPalette(parentTitle, volume.title, volume.number),
          });
        });
      } else {
        const key = `book:${book.id}`;
        result.push({
          key,
          title: parentTitle,
          parentTitle: "",
          volumeTitle: "",
          volumeNumber: "",
          bookId: book.id,
          volumeId: null,
          coverUrl: book.cover_url || "",
          firstIndex: bookIndex * 1000,
          tracks: trackGroups.get(key) || tracks.filter((track) => String(track.book_id ?? "") === String(book.id) && track.volume_id == null),
          themeClass: getBookTheme(parentTitle),
          palette: getBookCardPalette(parentTitle),
        });
      }
    });

    // Zachytí i samostatné soundtracky přiřazené ke knize, kterou katalog nevrátil.
    return result;
  }, [tracks, bookCatalog]);

  const sortedBooks = useMemo(() => {
    const result = [...books];
    if (bookSort === "alpha") {
      result.sort((a, b) => a.title.localeCompare(b.title, "cs", { sensitivity: "base" }));
    } else if (bookSort === "count") {
      result.sort((a, b) => b.tracks.length - a.tracks.length || a.firstIndex - b.firstIndex);
    } else {
      result.sort((a, b) => a.firstIndex - b.firstIndex);
    }
    return result;
  }, [books, bookSort]);

  const sortedAllTracks = useMemo(() => {
    const indexed = tracks.map((track, index) => ({ track, index }));

    indexed.sort((a, b) => {
      if (allSort === "alpha") {
        return String(a.track.title || "").localeCompare(String(b.track.title || ""), "cs", { sensitivity: "base" }) || a.index - b.index;
      }

      if (allSort === "book") {
        const labelCompare = getTrackBookLabel(a.track).localeCompare(getTrackBookLabel(b.track), "cs", { sensitivity: "base" });
        return labelCompare || a.index - b.index;
      }

      const rankA = getTrackVolumeRank(a.track);
      const rankB = getTrackVolumeRank(b.track);
      if (rankA >= 0 && rankB >= 0 && rankA !== rankB) return rankA - rankB;
      if (rankA >= 0 && rankB < 0) return -1;
      if (rankA < 0 && rankB >= 0) return 1;
      return a.index - b.index;
    });

    return indexed.map(({ track }) => track);
  }, [tracks, allSort]);

  // Odkaz z detailu svazku může používat stabilní klíč podle ID knihy a čísla svazku.
  // ID svazků v databázi se tak nemusí natvrdo zapisovat do jednotlivých stránek.
  const volumeNumberMatch = selectedBookKey.match(/^volume-number:(\d+):(\d+)$/);
  const selectedBook = selectedBookKey
    ? books.find((book) => book.key === selectedBookKey) || (
        volumeNumberMatch
          ? books.find((book) =>
              String(book.bookId) === volumeNumberMatch[1] &&
              String(book.volumeNumber) === volumeNumberMatch[2]
            ) || null
          : null
      )
    : null;
  const selectedBookTracks = selectedBook?.tracks || [];
  const playlistTracks = selectedBook
    ? selectedBookTracks
    : routeMode === "all"
      ? sortedAllTracks
      : tracks;
  const themeTrack = selectedBook ? selectedBookTracks[0] : routeMode === "books" ? null : currentTrack;

  const moodOptions = uniqueLabels([
    ...MOOD_OPTIONS,
    ...tracks.flatMap((track) => track.mood_tags || []),
  ]);
  const genreOptions = uniqueLabels([
    ...GENRE_OPTIONS,
    ...tracks.flatMap((track) => track.genre_tags || []),
  ]);

  const sourceTracks = selectedBook
    ? selectedBookTracks
    : routeMode === "all"
      ? sortedAllTracks
      : tracks;
  const filteredTracks = sourceTracks.filter((track) => {
    const moodMatch = !activeMood || (track.mood_tags || []).some((tag) => normalizeLabel(tag) === normalizeLabel(activeMood));
    const genreMatch = !activeGenre || (track.genre_tags || []).some((tag) => normalizeLabel(tag) === normalizeLabel(activeGenre));
    return moodMatch && genreMatch;
  });

  useEffect(() => {

    if (tracks.length && !player.currentTrack) {

      const first = tracks[Math.floor(Math.random() * tracks.length)];

      player.selectTrack(first, tracks);

    }

  // Select a random default track once the catalog loads; do not autoplay.

  // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [tracks.length]);

  useEffect(() => {

    if (routeMode === "track" && slug && tracks.length) {

      const requested = tracks.find((track) => track.slug === slug);

      if (requested && String(player.currentTrack?.id) !== String(requested.id)) {

        player.selectTrack(requested, tracks);

      }

    }

  // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [routeMode, slug, tracks.length]);

  useEffect(() => {

    if (routeMode === "surprise" && tracks.length) {

      const shuffled = [...tracks].sort(() => Math.random() - 0.5);

      const first = shuffled[0];

      if (first) {

        player.playTrack(first, shuffled);

        

      }

    }

  // Deliberately run when entering surprise mode, not on each render.

  // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [routeMode, tracks.length]);

  function chooseTrack(track, list = tracks) {
    if (!track) return;
    const queueToUse = list.length ? list : [track];
    const isSameTrack = String(player.currentTrack?.id) === String(track.id);

    if (isSameTrack) {
      // I když už skladba hraje, změň frontu na právě zvolený seznam (vše / konkrétní kniha).
      player.setPlaybackQueue(queueToUse, track);
      player.togglePlay();
    } else {
      player.playTrack(track, queueToUse);
    }
    setLyricsExpanded(false);
  }

  // Přehledy fungují jako přepínače: druhé kliknutí vrátí hlavní stránku soundtracků.
  function showAllTracks() {
    setActiveMood("");
    setActiveGenre("");
    navigate(routeMode === "all" ? "/soundtracks" : "/soundtracks/all");
  }

  function showBooks() {
    setActiveMood("");
    setActiveGenre("");
    navigate(routeMode === "books" ? "/soundtracks" : "/soundtracks/books");
  }

  function surpriseMe() {

    if (!tracks.length) return;

    const shuffled = [...tracks].sort(() => Math.random() - 0.5);

    const first = shuffled[0];

    player.playTrack(first, shuffled);

    

  }

  // Odkazy mapujeme jen na stránky, které v aplikaci skutečně existují.
  // ID knih: 1 = Nezačalo to létem, 2 = AEIL, 3 = Vespera.
  const activeBookName = String(currentTrack?.book_title || currentTrack?.book_name || "").trim().toLowerCase();
  const activeBookId = Number(currentTrack?.book_id || currentTrack?.bookId || 0);
  const bookConfig = (() => {
    if (activeBookId === 3 || /vespera/.test(activeBookName)) {
      return { title: "Vespera", bookUrl: "/books/vespera", charactersUrl: "/project/3/characters" };
    }
    if (activeBookId === 2 || /aeil/.test(activeBookName)) {
      return { title: "AEIL", bookUrl: "/books/aeil", charactersUrl: "/books/aeil/characters" };
    }
    if (activeBookId === 1 || /nezačalo|nezacalo/.test(activeBookName)) {
      return { title: "Nezačalo to létem", bookUrl: "/books/nezacalo", charactersUrl: "/books/nezacalo" };
    }
    return null;
  })();

  const isDetail = routeMode === "track";

  const isListing = routeMode === "all" || routeMode === "books" || routeMode === "surprise";

  return (

    <main className={`soundtracks-page ${isDetail ? "soundtracks-page-detail" : ""} ${themeTrack ? getBookTheme(themeTrack.book_title || themeTrack.book_name, themeTrack.volume_title, themeTrack.volume_number) : ""}`}>

      <div className="soundtracks-background-glow" aria-hidden="true" /><div className="soundtracks-sparkles" aria-hidden="true">{Array.from({ length: 34 }, (_, index) => <i key={index} style={{ "--sparkle-x": `${(index * 37 + 9) % 100}%`, "--sparkle-y": `${(index * 23 + 7) % 100}%`, "--sparkle-delay": `${(index % 13) * -0.7}s`, "--sparkle-duration": `${4 + (index % 6)}s` }} />)}</div>

      <header className="soundtracks-header">

        <Link to="/books" className="soundtracks-back"><span>‹</span> ZPĚT KE KNIHÁM</Link>

        <div className="soundtracks-header-actions"><button aria-label="Vyhledávání" onClick={() => navigate("/soundtracks/all")}>⌕</button><button aria-label="Otevřít menu" onClick={() => navigate("/soundtracks/books")}>☰</button></div>

      </header>

      <div className="soundtracks-title-block">

        <div className="soundtracks-universe-label">INEVERYUNIVERS.BOOKS</div>

        <h1>S O U N D T R A C K</h1>

        <p>HUDBA, KTERÁ VYPRÁVÍ PŘÍBĚH.</p>

      </div>

      <div className="soundtracks-layout">

        <aside className="soundtracks-playlist-column">

          <div className="soundtracks-playlist-heading"><span>PLAYLIST</span><span className="soundtracks-wave" aria-hidden="true">▁▂▃▅▃▂▁▃▆▂</span></div>

          <div className="soundtracks-floating-list" aria-label="Seznam skladeb">

            {loading && <p className="soundtracks-status">Načítám skladby…</p>}

            {!loading && tracks.length === 0 && <p className="soundtracks-status">{error || "Až přidáš první skladby v administraci, objeví se tady jejich názvy, knihy, atmosféra a délka."}</p>}

            {leftPlaylistTracks.length > 0 && (
              <div className="soundtracks-floating-list-track">
                <div className="soundtracks-floating-list-group">
                  {leftPlaylistTracks.map((track, index) => (
                    <TrackRow
                      key={`playlist-a-${track.id ?? track.slug ?? "track"}-${index}`}
                      track={track}
                      active={currentTrack && String(currentTrack.id) === String(track.id)}
                      onSelect={(item) => chooseTrack(item, leftPlaylistTracks)}
                    />
                  ))}
                </div>
                <div className="soundtracks-floating-list-group" aria-label="Pokračování playlistu">
                  {leftPlaylistTracks.map((track, index) => (
                    <TrackRow
                      key={`playlist-b-${track.id ?? track.slug ?? "track"}-${index}`}
                      track={track}
                      active={currentTrack && String(currentTrack.id) === String(track.id)}
                      onSelect={(item) => chooseTrack(item, leftPlaylistTracks)}
                    />
                  ))}
                </div>
                <div className="soundtracks-floating-list-group" aria-hidden="true">
                  {leftPlaylistTracks.map((track, index) => (
                    <TrackRow
                      key={`playlist-c-${track.id ?? track.slug ?? "track"}-${index}`}
                      track={track}
                      active={currentTrack && String(currentTrack.id) === String(track.id)}
                      onSelect={(item) => chooseTrack(item, leftPlaylistTracks)}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>


        </aside>

        <section className="soundtracks-main-column">

          <nav className="soundtracks-main-nav" aria-label="Hudební navigace">

            <button
              type="button"
              className={routeMode === "all" ? "is-active" : ""}
              onClick={showAllTracks}
              aria-expanded={routeMode === "all"}
            >
              VŠECHNO
            </button>

            <button
              type="button"
              className={routeMode === "books" ? "is-active" : ""}
              onClick={showBooks}
              aria-expanded={routeMode === "books"}
            >
              KNIHY
            </button>

            <button onClick={surpriseMe}>PŘEKVAP MĚ <span>⤨</span></button>

          </nav>

          {isListing && (
            <section className={`soundtracks-listing-panel ${routeMode === "books" ? "is-books-mode" : ""} ${selectedBook ? "has-selected-book" : ""}`}>
              {routeMode === "books" ? (
                selectedBook ? (
                  <div className="soundtracks-book-detail">
                    <div className="soundtracks-section-heading soundtracks-book-detail-heading">
                      <div>
                        <span className="soundtracks-eyebrow">KNIHOVNA SOUNDTRACKŮ</span>
                        <h2>{selectedBook.title}</h2>
                        {selectedBook.parentTitle && normalizeLabel(selectedBook.parentTitle) !== normalizeLabel(selectedBook.title) && (
                          <p className="soundtracks-book-series">SÉRIE / KNIHA: {selectedBook.parentTitle}</p>
                        )}
                      </div>
                      <span className="soundtracks-count">{selectedBookTracks.length} {selectedBookTracks.length === 1 ? "SKLADBA" : "SKLADEB"}</span>
                    </div>
                    <button className="soundtracks-book-detail-back" type="button" onClick={showBooks}>
                      <span>‹</span> VŠECHNY KNIHY
                    </button>
                    <div className="soundtracks-listing-rows soundtracks-book-track-list">
                      {selectedBookTracks.map((track) => (
                        <TrackRow
                          key={track.id ?? track.slug}
                          track={track}
                          showCover
                          active={currentTrack && String(currentTrack.id) === String(track.id)}
                          onSelect={(item) => chooseTrack(item, selectedBookTracks)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="soundtracks-section-heading soundtracks-books-heading">
                      <div>
                        <span className="soundtracks-eyebrow">PROZKOUMEJ HUDEBNÍ KNIHOVNU</span>
                        <h2>Hudba podle knih</h2>
                        <p>Vyber knihu a otevři všechny skladby, které k jejímu příběhu patří.</p>
                      </div>
                      <span className="soundtracks-count">{books.length} {books.length === 1 ? "KNIHA" : "KNIH"}</span>
                    </div>
                    <div className="soundtracks-books-toolbar">
                      <span>SEŘADIT KNIHY</span>
                      <label>
                        Pořadí
                        <select value={bookSort} onChange={(event) => setBookSort(event.target.value)}>
                          <option value="catalog">Vlastní pořadí knih a dílů</option>
                          <option value="alpha">Abecedně A–Z</option>
                          <option value="count">Počet skladeb</option>
                        </select>
                      </label>
                    </div>
                    {loading ? (
                      <p className="soundtracks-status">Načítám knihy a skladby…</p>
                    ) : sortedBooks.length ? (
                      <div className="soundtracks-book-grid">
                        {sortedBooks.map((book, index) => {
                          const bookCover = book.coverUrl || getBookCoverImage(book);
                          return (
                          <button
                            type="button"
                            key={book.key}
                            className={`soundtracks-book-card ${book.themeClass}`}
                            style={{
                              "--book-accent": book.palette.accent,
                              "--book-accent-2": book.palette.accent2,
                              "--book-accent-3": book.palette.accent3,
                            }}
                            onClick={() => navigate(`/soundtracks/books?book=${encodeURIComponent(book.key)}`)}
                          >
                            <span className="soundtracks-book-card-cover">
                              {bookCover ? (
                                <img src={bookCover} alt={`Obálka ${book.title}`} loading="lazy" />
                              ) : (
                                <span className="soundtracks-book-card-placeholder">▤</span>
                              )}
                              <span className="soundtracks-book-card-index">{String(index + 1).padStart(2, "0")}</span>
                            </span>
                            <span className="soundtracks-book-card-content">
                              <span className="soundtracks-book-card-kicker">SOUNDTRACK COLLECTION</span>
                              <strong>{book.title}</strong>
                              {book.parentTitle && normalizeLabel(book.parentTitle) !== normalizeLabel(book.title) && (
                                <small>{book.parentTitle}</small>
                              )}
                              <span className="soundtracks-book-card-count">{book.tracks.length} {book.tracks.length === 1 ? "SKLADBA" : "SKLADEB"}</span>
                            </span>
                            <span className="soundtracks-book-card-arrow" aria-hidden="true">↗</span>
                          </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="soundtracks-status">V katalogu zatím nejsou skladby přiřazené ke knihám.</p>
                    )}
                  </>
                )
              ) : (
                <>
                  <div className="soundtracks-section-heading">
                    <div>
                      <span className="soundtracks-eyebrow">PROZKOUMEJ HUDBU</span>
                      <h2>{routeMode === "surprise" ? "Náhodný výběr" : "Všechny skladby"}</h2>
                    </div>
                    <span className="soundtracks-count">{filteredTracks.length} SKLADEB</span>
                  </div>
                  {routeMode === "all" && (
                    <div className="soundtracks-books-toolbar soundtracks-all-sort-toolbar">
                      <span>SEŘADIT SKLADBY</span>
                      <label>
                        Pořadí
                        <select value={allSort} onChange={(event) => setAllSort(event.target.value)}>
                          <option value="order">Pořadí knih a dílů</option>
                          <option value="alpha">Abecedně A–Z (skladby)</option>
                          <option value="book">Podle knihy A–Z</option>
                        </select>
                      </label>
                    </div>
                  )}
                  <div className="soundtracks-listing-rows">
                    {filteredTracks.map((track) => (
                      <TrackRow
                        key={track.id ?? track.slug}
                        track={track}
                        showCover
                        active={currentTrack && String(currentTrack.id) === String(track.id)}
                        onSelect={(item) => chooseTrack(item, filteredTracks)}
                      />
                    ))}
                    {!filteredTracks.length && <p className="soundtracks-status">Těmto filtrům zatím neodpovídá žádná skladba.</p>}
                  </div>
                </>
              )}
            </section>
          )}

          <section className="soundtracks-player-card">
  <button
    type="button"
    className="soundtracks-player-arrow soundtracks-player-arrow-left"
    aria-label="Předchozí zobrazení"
    onClick={() => setPlayerView((view) => (view + 2) % 3)}
  >‹</button>

  <div className="soundtracks-player-viewport">
    {currentTrack ? (
      <>
        {playerView === 0 ? (
          <>

                <div className="soundtracks-record-art">

                  {currentTrack.cover_url ? <img src={currentTrack.cover_url} alt={`Obal skladby ${currentTrack.title}`} /> : <div className="soundtracks-record-placeholder"><span>♫</span><i /></div>}

                </div>

                <div className="soundtracks-player-details">

                  <span className="soundtracks-eyebrow">PRÁVĚ HRAJE</span>

                  <span className="soundtracks-track-number">{String(Math.max(0, tracks.findIndex((track) => track.id === currentTrack.id) + 1)).padStart(2, "0")}</span>

                  <h2>{currentTrack.title}</h2>

                  <p className="soundtracks-artist">{currentTrack.book_title || currentTrack.book_name || "Samostatná skladba"}</p>

                  <div className="soundtracks-equalizer" aria-hidden="true">{Array.from({ length: 48 }, (_, index) => <i key={index} style={{ "--bar": `${12 + ((index * 17 + 9) % 35)}px`, "--delay": `${(index % 9) * -0.13}s` }} />)}</div>

                  <div className="soundtracks-player-controls">

                    <button aria-label="Náhodné přehrávání" className={player.shuffle ? "is-active" : ""} onClick={() => player.setShuffle((value) => !value)}>⤨</button>

                    <button aria-label="Předchozí skladba" onClick={player.previous}>|◀</button>

                    <button className="soundtracks-play-button" aria-label={player.isPlaying ? "Pozastavit" : "Přehrát"} onClick={() => { if (!player.currentTrack || String(player.currentTrack.id) !== String(currentTrack.id)) player.playTrack(currentTrack, playlistTracks); else player.togglePlay(); }}>{player.isPlaying && String(player.currentTrack?.id) === String(currentTrack.id) ? "Ⅱ" : "▶"}</button>

                    <button aria-label="Další skladba" onClick={player.next}>▶|</button>

                    <button aria-label="Opakování" className={player.repeat !== "off" ? "is-active" : ""} onClick={() => player.setRepeat((value) => value === "off" ? "all" : value === "all" ? "one" : "off")}>↻</button>

                  </div>
                  <label className="soundtracks-volume-control">
                    <span>HLASITOST</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={player.volume ?? 0.8}
                      onChange={(event) => player.setVolume(Number(event.target.value))}
                      aria-label="Hlasitost"
                    />
                    <small>{Math.round((player.volume ?? 0.8) * 100)} %</small>
                  </label>


                </div>

                <div className="soundtracks-timeline"><span>{formatTime(player.currentTrack?.id === currentTrack.id ? player.currentTime : 0)}</span><input aria-label="Pozice ve skladbě" type="range" min="0" max={player.duration || currentTrack.duration_seconds || 0} step="0.1" value={player.currentTrack?.id === currentTrack.id ? Math.min(player.currentTime, player.duration || 0) : 0} onChange={(event) => player.seek(Number(event.target.value))} /><span>{formatTime(player.duration || currentTrack.duration_seconds)}</span></div>

              </>
        ) : playerView === 1 ? (
          <div className="soundtracks-media-view">
            <span className="soundtracks-eyebrow">VIDEO S LYRICS</span>
            {videosLoading ? (
              <p className="soundtracks-status">Načítám video…</p>
            ) : lyricsVideos.length ? (
              <div className="soundtracks-media-video-list">
                {lyricsVideos.map((video) => (
                  <div className="soundtracks-media-video" key={video.id}>
                    <video controls playsInline preload="metadata" src={video.public_url} onPlay={() => { if (player.isPlaying) player.togglePlay(); }} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="soundtracks-status">K této skladbě zatím není přiřazené video s lyrics.</p>
            )}
          </div>
        ) : (
          <div className="soundtracks-media-view">
            <span className="soundtracks-eyebrow">VIDEOSTORIES</span>
            {videosLoading ? (
              <p className="soundtracks-status">Načítám videostories…</p>
            ) : storyVideos.length ? (
              <div className="soundtracks-media-video-list">
                {storyVideos.map((video) => (
                  <div className="soundtracks-media-video" key={video.id}>
                    <video controls playsInline preload="metadata" src={video.public_url} onPlay={() => { if (player.isPlaying) player.togglePlay(); }} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="soundtracks-status">K této skladbě zatím nejsou přiřazené videostories.</p>
            )}
          </div>
        )}
      </>
    ) : (
      <div className="soundtracks-no-track"><div className="soundtracks-record-placeholder"><span>♫</span><i /></div><h2>Tvůj další příběh začíná hudbou.</h2><p>{loading ? "Načítám katalog skladeb…" : "Zatím tu není publikovaná žádná skladba. Až ji přidáš v administraci, objeví se tady."}</p>{error && <small>{error}</small>}</div>
    )}
  </div>

  <button
    type="button"
    className="soundtracks-player-arrow soundtracks-player-arrow-right"
    aria-label="Další zobrazení"
    onClick={() => setPlayerView((view) => (view + 1) % 3)}
  >›</button>
</section>

          {currentTrack && <section className="soundtracks-track-details">
            <div className="soundtracks-section-heading"><div><span className="soundtracks-eyebrow">PŘÍBĚH SKLADBY</span><h2>{currentTrack.title}</h2></div><span className="soundtracks-count">{formatTime(currentTrack.duration_seconds)}</span></div>
            <div className="soundtracks-track-facts">
              {(currentTrack.book_title || currentTrack.book_name) && <div><span>KNIHA</span><strong>{currentTrack.book_title || currentTrack.book_name}</strong></div>}
              {(currentTrack.volume_title || currentTrack.volume_number) && <div><span>SVAZEK</span><strong>{currentTrack.volume_title || `SVAZEK ${currentTrack.volume_number}`}</strong></div>}
              {((Array.isArray(currentTrack.character_names) ? currentTrack.character_names : splitTags(currentTrack.character_names || currentTrack.characters)).length > 0) && <div><span>POSTAVY</span><strong>{(Array.isArray(currentTrack.character_names) ? currentTrack.character_names : splitTags(currentTrack.character_names || currentTrack.characters)).join(" · ")}</strong></div>}
              {currentTrack.genre_tags?.length > 0 && <div><span>ŽÁNR</span><strong>{currentTrack.genre_tags.join(" · ")}</strong></div>}
              {currentTrack.mood_tags?.length > 0 && <div><span>NÁLADA</span><strong>{currentTrack.mood_tags.join(" · ")}</strong></div>}
            </div>
            {(currentTrack.description || currentTrack.author_comment || currentTrack.commentary) && <div className="soundtracks-track-description">{currentTrack.description && <p>{currentTrack.description}</p>}{(currentTrack.author_comment || currentTrack.commentary) && <blockquote className="soundtracks-author-quote"><span>POZNÁMKA AUTORKY</span><p>{currentTrack.author_comment || currentTrack.commentary}</p></blockquote>}</div>}
            <LyricsPanel track={currentTrack} expanded={lyricsExpanded} onToggle={() => setLyricsExpanded((value) => !value)} />
            {currentTrack.allow_download && currentTrack.audio_url && <div className="soundtracks-detail-buttons"><a href={currentTrack.audio_url} download>↓ STÁHNOUT SKLADBU</a></div>}
          </section>}

          <section className="soundtracks-discovery">

            <div className="soundtracks-section-heading"><div><span className="soundtracks-eyebrow">NAJDI SVOU ATMOSFÉRU</span><h2>Podle nálady a žánru</h2></div></div>

            <div className="soundtracks-tag-group"><span className="soundtracks-tag-label">NÁLADA</span><div className="soundtracks-tags">{moodOptions.map((tag) => <button type="button" key={normalizeLabel(tag)} className={normalizeLabel(activeMood) === normalizeLabel(tag) ? "is-active" : ""} aria-pressed={normalizeLabel(activeMood) === normalizeLabel(tag)} onClick={() => setActiveMood((value) => normalizeLabel(value) === normalizeLabel(tag) ? "" : tag)}>{tag}</button>)}</div></div>

            <div className="soundtracks-tag-group"><span className="soundtracks-tag-label">ŽÁNR</span><div className="soundtracks-tags">{genreOptions.map((tag) => <button type="button" key={normalizeLabel(tag)} className={normalizeLabel(activeGenre) === normalizeLabel(tag) ? "is-active" : ""} aria-pressed={normalizeLabel(activeGenre) === normalizeLabel(tag)} onClick={() => setActiveGenre((value) => normalizeLabel(value) === normalizeLabel(tag) ? "" : tag)}>{tag}</button>)}</div></div>

            {(activeMood || activeGenre) && <div className="soundtracks-filter-results"><div className="soundtracks-section-heading"><h3>Odpovídající skladby</h3><button onClick={() => { setActiveMood(""); setActiveGenre(""); }}>VYMAZAT FILTRY</button></div>{filteredTracks.length ? filteredTracks.map((track) => <TrackRow key={track.id} track={track} showCover active={currentTrack && String(currentTrack.id) === String(track.id)} onSelect={(item) => chooseTrack(item, filteredTracks)} />) : <p className="soundtracks-status">Této kombinaci zatím neodpovídá žádná publikovaná skladba.</p>}</div>}

          </section>

          <section className={`soundtracks-universe-links ${bookConfig?.charactersUrl ? "has-character-link" : "without-character-link"}`}>

            {bookConfig ? (
              <Link to={bookConfig.bookUrl} aria-label={`Otevřít knihu ${bookConfig.title}`}><span>♧</span><b>KNIHY</b><small>{bookConfig.title.toUpperCase()}</small><i>↗</i></Link>
            ) : (
              <Link to="/books"><span>♧</span><b>KNIHY</b><small>PROHLÉDNOUT KNIHOVNU</small><i>↗</i></Link>
            )}

            {bookConfig && <Link to={bookConfig.charactersUrl || bookConfig.bookUrl} aria-label={`Otevřít postavy knihy ${bookConfig.title}`}><span>♙</span><b>POSTAVY</b><small>{`POSTAVY · ${bookConfig.title.toUpperCase()}`}</small><i>↗</i></Link>}

            <Link to="/videos"><span>▻</span><b>VIDEA</b><small>SLEDOVAT</small><i>↗</i></Link>

            <Link to="/community"><span>…</span><b>KOMUNITA</b><small>POJĎ DÁL</small><i>↗</i></Link>
            <button
              type="button"
              className="soundtracks-full-playlist soundtracks-full-playlist-bottom"
              onClick={showAllTracks}
              aria-expanded={routeMode === "all"}
            >
              {routeMode === "all" ? "SKRÝT CELÝ PLAYLIST" : "ZOBRAZIT CELÝ PLAYLIST"}
              <span>{routeMode === "all" ? "⌃" : "⌄"}</span>
            </button>

          </section>

        </section>

      </div>

      <footer className="soundtracks-footer"><span>INEVERYUNIVERS.BOOKS</span><span>EVERY STORY HAS ITS SOUNDTRACK</span><Link to="/admin">SPRÁVA HUDBY ↗</Link></footer>

    </main>

  );

}
