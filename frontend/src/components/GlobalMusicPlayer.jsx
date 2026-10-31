import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMusicPlayer } from "../context/MusicPlayerContext";
import "../styles/GlobalMusicPlayer.css";
import "../styles/GlobalMusicPlayer-theme.css";

function formatTime(value = 0) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function normalize(value = "") {
  return String(value || "")
    .toLocaleLowerCase("cs")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getTrackPalette(track) {
  const book = normalize(`${track?.book_title || ""} ${track?.book_name || ""}`);
  const volume = normalize(
    `${track?.volume_title || ""} ${track?.volume_name || ""} ${track?.volume_number || ""}`
  );
  const all = `${book} ${volume}`;

  if (all.includes("aeil")) {
    return { accent: "#e5b84b", accent2: "#b51e32", accent3: "#ffd982", gradient: "linear-gradient(90deg, #e5b84b, #b51e32, #ffd982)" };
  }
  if (all.includes("vespera")) {
    return { accent: "#c8794d", accent2: "#39d7c3", accent3: "#f1ad7b", gradient: "linear-gradient(90deg, #c8794d, #39d7c3, #f1ad7b)" };
  }
  if (all.includes("temnote") || all.includes("temnota")) {
    return { accent: "#7438bd", accent2: "#c9ff9b", accent3: "#a98aff", gradient: "linear-gradient(90deg, #7438bd, #a98aff, #c9ff9b)" };
  }
  if (all.includes("spravne")) {
    return { accent: "#ff28b8", accent2: "#19aaff", accent3: "#ff83df", gradient: "linear-gradient(90deg, #ff28b8, #19aaff, #ff83df)" };
  }
  if (all.includes("tady")) {
    return { accent: "#f6fbff", accent2: "#9bdfff", accent3: "#d4f4ff", gradient: "linear-gradient(90deg, #9bdfff, #f6fbff, #d4f4ff)" };
  }
  if (all.includes("pribehem") || all.includes("nasim pribeh") || all.includes("pribeh")) {
    return { accent: "#f02d43", accent2: "#4169e1", accent3: "#ff9aa5", gradient: "linear-gradient(90deg, #f02d43, #4169e1, #ff9aa5)" };
  }
  if (all.includes("letem") || all.includes("leto") || book.includes("nezacalo")) {
    return { accent: "#073b5c", accent2: "#ff8a32", accent3: "#38d8f2", gradient: "linear-gradient(90deg, #073b5c, #ff8a32, #38d8f2)" };
  }
  return { accent: "#bd8aff", accent2: "#54d8e5", accent3: "#f0a2ee", gradient: "linear-gradient(90deg, #bd8aff, #54d8e5, #f0a2ee)" };
}


export default function GlobalMusicPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const player = useMusicPlayer();
  const track = player.currentTrack;

  // Stránka soundtracků má vlastní plnohodnotný přehrávač.
  // Globální přehrávač se proto ukazuje až mimo sekci soundtracků.
  const isSoundtracksPage =
    location.pathname === "/soundtracks" ||
    location.pathname.startsWith("/soundtracks/");

  if (!track || isSoundtracksPage) return null;

  const duration = Math.max(0, Number(player.duration) || 0);
  const currentTime = Math.max(0, Number(player.currentTime) || 0);
  const progress = duration ? Math.min(100, (currentTime / duration) * 100) : 0;
  const palette = getTrackPalette(track);
  const themeStyle = {
    "--global-accent": palette.accent,
    "--global-accent-2": palette.accent2,
    "--global-accent-3": palette.accent3,
    "--global-gradient": palette.gradient,
    "--progress": `${progress}%`,
  };

  if (hidden) {
    return (
      <button
        type="button"
        className="global-player-reopen"
        onClick={() => setHidden(false)}
        aria-label="Zobrazit hudební přehrávač"
        title="Zobrazit hudební přehrávač"
        style={themeStyle}
      >♫</button>
    );
  }

  return (
    <aside className={`global-music-player ${expanded ? "is-expanded" : ""}`} style={themeStyle} aria-label="Hudební přehrávač">
      <div className="global-player-main">
        <button
          type="button"
          className="global-player-back"
          onClick={() => {
            setHidden(false);
            navigate("/soundtracks");
          }}
          aria-label="Zpět na hlavní stránku soundtracků"
          title="Zpět na hlavní stránku soundtracků"
        >‹</button>

        <button
          type="button"
          className="global-player-track"
          onClick={() => setExpanded(value => !value)}
          title={track.title || "Neznámá skladba"}
        >
          <strong>{track.title || "Neznámá skladba"}</strong>
        </button>

        <span className="global-player-separator" aria-hidden="true">|</span>

        <span
          className="global-player-book"
          title={track.book_title || track.book_name || "InEveryUnivers"}
        >
          {track.book_title || track.book_name || "InEveryUnivers"}
        </span>

        <div className="global-player-controls">
          <button type="button" onClick={player.previous} aria-label="Předchozí skladba" title="Předchozí skladba">|◀</button>
          <button type="button" className="global-player-play" onClick={player.togglePlay} aria-label={player.isPlaying ? "Pozastavit" : "Přehrát"} title={player.isPlaying ? "Pozastavit" : "Přehrát"}>{player.isPlaying ? "Ⅱ" : "▶"}</button>
          <button type="button" onClick={player.next} aria-label="Další skladba" title="Další skladba">▶|</button>
        </div>

        <button type="button" className="global-player-expand" onClick={() => setExpanded(value => !value)} aria-label={expanded ? "Sbalit přehrávač" : "Rozbalit přehrávač"} title={expanded ? "Sbalit" : "Rozbalit"}>{expanded ? "⌄" : "⌃"}</button>
        <button type="button" className="global-player-close" onClick={() => setHidden(true)} aria-label="Skrýt přehrávač" title="Skrýt přehrávač; hudba bude pokračovat"><span className="global-player-close-icon" aria-hidden="true">×</span></button>
      </div>

      <div className="global-player-progress-row">
        <span>{formatTime(currentTime)}</span>
        <input aria-label="Pozice ve skladbě" type="range" min="0" max={duration} step="0.1" value={Math.min(currentTime, duration)} onChange={event => player.seek(Number(event.target.value))} style={{ "--progress": `${progress}%` }} />
        <span>{formatTime(duration)}</span>
      </div>

      {expanded && (
        <div className="global-player-extra">
          <label>Hlasitost<input aria-label="Hlasitost" type="range" min="0" max="1" step="0.01" value={player.volume} onChange={event => player.setVolume(Number(event.target.value))} /></label>
          <button type="button" className={player.shuffle ? "active" : ""} onClick={() => player.setShuffle(value => !value)}>⇄ Náhodně</button>
          <button type="button" className={player.repeat !== "off" ? "active" : ""} onClick={() => player.setRepeat(value => value === "off" ? "all" : value === "all" ? "one" : "off")}>
            ↻ {player.repeat === "one" ? "Opakovat skladbu" : player.repeat === "all" ? "Opakovat playlist" : "Opakování vypnuto"}
          </button>
        </div>
      )}
      {player.playError && <p className="global-player-error">{player.playError}</p>}
    </aside>
  );
}
