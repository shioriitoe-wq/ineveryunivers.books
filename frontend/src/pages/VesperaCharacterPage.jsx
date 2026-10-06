import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "./VesperaCharacterPage.css";

import vesperaCharacterBack from "../assets/images/Vespera/Characters/vespera-character-back.png";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://ineveryunivers-books-api.onrender.com/api"
    : "http://localhost:5000/api");

export default function VesperaCharacterPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRecording, setShowRecording] = useState(false);

  useEffect(() => {
    const loadCharacter = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/vespera/characters/${id}`
        );

        if (!response.ok) {
          throw new Error("Postava nebyla nalezena.");
        }

        const data = await response.json();

        if (!data.published) {
          throw new Error("Tato postava není publikována.");
        }

        setCharacter(data);
      } catch (err) {
        console.error("Vespera character:", err);
        setError(err.message || "Postavu se nepodařilo načíst.");
      } finally {
        setLoading(false);
      }
    };

    loadCharacter();
  }, [id]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return "";
    }

    if (
      imagePath.startsWith("http://") ||
      imagePath.startsWith("https://") ||
      imagePath.startsWith("/")
    ) {
      return imagePath;
    }

    return `/characters/${imagePath}`;
  };

  const getMediaUrl = (mediaPath) => {
    if (!mediaPath) {
      return "";
    }

    if (
      mediaPath.startsWith("http://") ||
      mediaPath.startsWith("https://") ||
      mediaPath.startsWith("/")
    ) {
      return mediaPath;
    }

    return `/characters/${mediaPath}`;
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    return value;
  };

  // Starší záznamy mohou mít klasifikaci uloženou česky.
  // Na veřejné stránce ji vždy zobrazíme v angličtině.
  const formatClassification = (value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const classifications = {
      "Extrémně nebezpečný": "Extremely dangerous",
      "Nebezpečný": "Dangerous",
      "Civilista": "Civilian",
      "Neznámá": "Unknown",
      "Extremely dangerous": "Extremely dangerous",
      "Dangerous": "Dangerous",
      "Civilian": "Civilian",
      "Unknown": "Unknown",
    };

    return classifications[value] || value;
  };

  if (loading) {
    return (
      <main
        className="vespera-character-page vespera-character-loading"
        style={{
          "--vespera-character-background": `url("${vesperaCharacterBack}")`,
        }}
      >
        <button
          type="button"
          className="vespera-character-back"
          onClick={() => navigate(-1)}
          aria-label="Zpět"
        >
          ←
        </button>

        <div className="vespera-character-message">
          Načítání spisu…
        </div>
      </main>
    );
  }

  if (error || !character) {
    return (
      <main
        className="vespera-character-page vespera-character-loading"
        style={{
          "--vespera-character-background": `url("${vesperaCharacterBack}")`,
        }}
      >
        <button
          type="button"
          className="vespera-character-back"
          onClick={() => navigate(-1)}
          aria-label="Zpět"
        >
          ←
        </button>

        <div className="vespera-character-message">
          {error || "Postavu se nepodařilo načíst."}
        </div>
      </main>
    );
  }

  return (
    <main
      className="vespera-character-page"
      style={{
        "--vespera-character-background": `url("${vesperaCharacterBack}")`,
      }}
    >
      <button
        type="button"
        className="vespera-character-back"
        onClick={() => navigate(-1)}
        aria-label="Zpět"
      >
        ←
      </button>

      {/* =================================================
          SPOT NA KAMEŘE
          Otevře video / MP3.
      ================================================= */}

      <button
        type="button"
        className="vespera-camera-hotspot"
        onClick={() => setShowRecording(true)}
        aria-label="Otevřít záznam"
        title="Otevřít záznam"
      />

      {/* =================================================
          SPOT NA VIZITCE
          Vrací na hlavní stránku Vespery.
      ================================================= */}

      <button
        type="button"
        className="vespera-mainpage-hotspot"
        onClick={() => navigate("/books/vespera")}
        aria-label="Hlavní stránka Vespery"
        title="Hlavní stránka Vespery"
      />
            {/* =================================================
          SPOT NA OSOBNÍ GALERII
          Zatím pouze viditelný červený spot.
      ================================================= */}

      <button
        type="button"
        className="vespera-gallery-hotspot"
        onClick={() =>
          navigate(`/books/vespera/characters/${character.id}/gallery`)
        }
        aria-label="Osobní galerie"
        title="Osobní galerie"
      />

      <div className="vespera-character-sheet">
        {/* =================================================
            FOTOGRAFIE 1
        ================================================= */}

        {character.image_1 && (
          <img
            src={getImageUrl(character.image_1)}
            alt={character.name || "Postava"}
            className="vespera-file-photo vespera-file-photo-1"
            draggable="false"
          />
        )}

        {/* =================================================
            FOTOGRAFIE 2
        ================================================= */}

        {character.image_2 && (
          <img
            src={getImageUrl(character.image_2)}
            alt=""
            className="vespera-file-photo vespera-file-photo-2"
            draggable="false"
          />
        )}

        {/* =================================================
            FOTOGRAFIE 3
        ================================================= */}

        {character.image_3 && (
          <img
            src={getImageUrl(character.image_3)}
            alt=""
            className="vespera-file-photo vespera-file-photo-3"
            draggable="false"
          />
        )}

        {/* =================================================
            SPISOVÉ ÚDAJE
        ================================================= */}

        <div className="vespera-file-value vespera-file-case-number">
          {formatValue(character.case_number)}
        </div>

        <div className="vespera-file-value vespera-file-classification">
          {formatClassification(character.classification)}
        </div>

        <div className="vespera-file-value vespera-file-name">
          {formatValue(character.name)}
        </div>

        <div className="vespera-file-value vespera-file-age">
          {formatValue(character.age)}
        </div>

        <div className="vespera-file-value vespera-file-location">
          {formatValue(character.location)}
        </div>

        <div className="vespera-file-value vespera-file-nexis">
          {character.nexis_level === null ||
          character.nexis_level === undefined ||
          character.nexis_level === ""
            ? "—"
            : `${character.nexis_level} %`}
        </div>

        <div className="vespera-file-value vespera-file-operational">
          {formatValue(character.operational_assignment)}
        </div>

        <div className="vespera-file-value vespera-file-information">
          {formatValue(character.available_information)}
        </div>

        <div className="vespera-file-value vespera-file-status">
          {formatValue(character.status)}
        </div>

        <div className="vespera-file-value vespera-file-last-record">
          {formatValue(character.last_record)}
        </div>

        <div className="vespera-file-value vespera-file-rank">
          {formatValue(character.case_manager)}
        </div>

        {/* =================================================
            ZÁZNAM
        ================================================= */}

        {showRecording && (
          <div
            className="vespera-recording-overlay"
            onClick={() => setShowRecording(false)}
          >
            <div
              className="vespera-recording-window"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="vespera-recording-close"
                onClick={() => setShowRecording(false)}
                aria-label="Zavřít záznam"
              >
                ×
              </button>

              {character.media ? (
                character.media_type === "video" ? (
                  <video
                    src={getMediaUrl(character.media)}
                    controls
                    autoPlay
                    preload="metadata"
                  />
                ) : (
                  <audio
                    src={getMediaUrl(character.media)}
                    controls
                    autoPlay
                    preload="metadata"
                  />
                )
              ) : (
                <div style={{ color: "#fff", padding: "30px" }}>
                  Záznam není k dispozici.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}