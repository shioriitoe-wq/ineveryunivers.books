import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "./VesperaCharacterGalleryPage.css";

import vesperaCharactersBack from "../assets/images/Vespera/Characters/vespera-characters-back.png";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://ineveryunivers-books-api.onrender.com/api"
    : "http://localhost:5000/api");

export default function VesperaCharacterGalleryPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        console.error("Vespera character gallery:", err);
        setError(
          err.message || "Galerii se nepodařilo načíst."
        );
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

  if (loading) {
    return (
      <main
        className="vespera-character-gallery-page vespera-character-gallery-loading"
        style={{
          "--vespera-gallery-background": `url("${vesperaCharactersBack}")`,
        }}
      >
        <button
          type="button"
          className="vespera-character-gallery-back"
          onClick={() => navigate(-1)}
          aria-label="Zpět"
        >
          ←
        </button>

        <div className="vespera-character-gallery-message">
          Načítání galerie…
        </div>
      </main>
    );
  }

  if (error || !character) {
    return (
      <main
        className="vespera-character-gallery-page vespera-character-gallery-loading"
        style={{
          "--vespera-gallery-background": `url("${vesperaCharactersBack}")`,
        }}
      >
        <button
          type="button"
          className="vespera-character-gallery-back"
          onClick={() => navigate(-1)}
          aria-label="Zpět"
        >
          ←
        </button>

        <div className="vespera-character-gallery-message">
          {error || "Galerii se nepodařilo načíst."}
        </div>
      </main>
    );
  }

  const images = [
    character.image_1,
    character.image_2,
    character.image_3,
  ].filter(Boolean);

  return (
    <main
      className="vespera-character-gallery-page"
      style={{
        "--vespera-gallery-background": `url("${vesperaCharactersBack}")`,
      }}
    >
      <button
        type="button"
        className="vespera-character-gallery-back"
        onClick={() => navigate(-1)}
        aria-label="Zpět"
      >
        ←
      </button>

      <section className="vespera-character-gallery-content">
        <h1>
          {character.name || "Osobní galerie"}
        </h1>

        <div className="vespera-character-gallery-grid">
          {images.map((imagePath, index) => (
            <div
              className="vespera-character-gallery-item"
              key={`${imagePath}-${index}`}
            >
              <img
                src={getImageUrl(imagePath)}
                alt={`${character.name || "Postava"} – fotografie ${
                  index + 1
                }`}
                draggable="false"
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}