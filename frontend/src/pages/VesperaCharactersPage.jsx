import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./VesperaCharactersPage.css";

import vesperaCharactersBack
  from "../assets/images/Vespera/Characters/vespera-characters-back.png";

import vesperaPhoto from "../assets/frames/vespera-photo.png";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://ineveryunivers-books-api.onrender.com/api"
    : "http://localhost:5000/api");

export default function VesperaCharactersPage() {
  const navigate = useNavigate();

  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/vespera/characters`
        );

        if (!response.ok) {
          throw new Error("Nepodařilo se načíst postavy.");
        }

        const data = await response.json();

        const publishedCharacters = Array.isArray(data)
          ? data.filter(
              (character) => character.published === true
            )
          : [];

        setCharacters(publishedCharacters);
      } catch (err) {
        console.error("Vespera characters:", err);
        setError("Postavy se nepodařilo načíst.");
      } finally {
        setLoading(false);
      }
    };

    loadCharacters();
  }, []);

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

  return (
    <main
      className="vespera-characters-page"
      style={{
        "--vespera-characters-background": `url("${vesperaCharactersBack}")`,
      }}
    >
      <button
        type="button"
        className="vespera-characters-back"
        onClick={() => navigate(-1)}
        aria-label="Zpět"
      >
        ←
      </button>

      <section className="vespera-characters-content">
        {loading && (
          <div className="vespera-characters-message">
            Načítání postav…
          </div>
        )}

        {!loading && error && (
          <div className="vespera-characters-message">
            {error}
          </div>
        )}

        {!loading &&
          !error &&
          characters.length === 0 && (
            <div className="vespera-characters-message">
              Zatím nejsou publikovány žádné postavy.
            </div>
          )}

        {!loading &&
          !error &&
          characters.length > 0 && (
            <div className="vespera-characters-grid">
              {characters.map((character) => {
                console.log(
                  "VESPERA IMAGE:",
                  character.name,
                  character.image_1
                );

                return (
                  <button
                    key={character.id}
                    type="button"
                    className="vespera-character-card"
                    onClick={() =>
                      navigate(
                        `/books/vespera/characters/${character.id}`
                      )
                    }
                  >
                    <div className="vespera-character-photo">
                      {character.image_1 && (
                        <img
                          src={getImageUrl(character.image_1)}
                          alt={character.name || "Postava"}
                          draggable="false"
                        />
                      )}

                      <img
                        src={vesperaPhoto}
                        alt=""
                        className="vespera-character-frame"
                        draggable="false"
                      />

                      <div className="vespera-character-name">
                        {character.name ? (
                          <>
                            {character.name.split(" ")[0]}
                            <br />
                            {character.name
                              .split(" ")
                              .slice(1)
                              .join(" ")}
                          </>
                        ) : (
                          "Neznámá"
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
      </section>
    </main>
  );
}