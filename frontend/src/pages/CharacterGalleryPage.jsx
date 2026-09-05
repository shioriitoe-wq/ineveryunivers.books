import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getCharacter } from "../services/charactersService";
import { resolveCharacterAsset } from "../utils/characterAssetPaths";

import "./CharacterGalleryPage.css";


/* =========================================================
   POMOCNÉ FUNKCE PRO MEDIA
   ========================================================= */

function isVideoFile(path) {
  if (!path) {
    return false;
  }

  const cleanPath = String(path)
    .split("?")[0]
    .split("#")[0]
    .toLowerCase();

  return /\.(mp4|webm|mov|m4v)$/.test(cleanPath);
}


function getVideoType(path) {
  if (!path) {
    return "";
  }

  const cleanPath = String(path)
    .split("?")[0]
    .split("#")[0]
    .toLowerCase();

  if (cleanPath.endsWith(".webm")) {
    return "video/webm";
  }

  if (cleanPath.endsWith(".mp4") || cleanPath.endsWith(".m4v")) {
    return "video/mp4";
  }

  if (cleanPath.endsWith(".mov")) {
    return "video/quicktime";
  }

  return "";
}


function CharacterGalleryPage() {

  const { bookId, characterId } = useParams();
  const navigate = useNavigate();

  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    let cancelled = false;

    async function loadCharacter() {

      setLoading(true);
      setError("");

      try {
        const data = await getCharacter(bookId, characterId);

        if (cancelled) {
          return;
        }

        setCharacter(data);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(err);
        setError(
          err.message ||
          "Nepodařilo se načíst galerii."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }

    }

    loadCharacter();

    return () => {
      cancelled = true;
    };

  }, [bookId, characterId]);


  if (loading) {
    return (
      <main className="character-gallery-page">
        <div className="character-gallery-state">
          Načítám galerii...
        </div>
      </main>
    );
  }


  if (error || !character) {
    return (
      <main className="character-gallery-page">
        <div className="character-gallery-state character-gallery-error">
          <h1>{error || "Postava nebyla nalezena."}</h1>
          <button
            type="button"
            onClick={() =>
              navigate(`/project/${bookId}/characters/${characterId}`)
            }
          >
            ← ZPĚT NA POSTAVU
          </button>
        </div>
      </main>
    );
  }


  const images = Array.isArray(character.images)
    ? character.images
    : [];


  return (
    <main className="character-gallery-page">

      <div className="character-gallery-background" />

      <header className="character-gallery-header">

        <Link
          to={`/project/${bookId}/characters/${characterId}`}
          className="character-gallery-back"
        >
          ← ZPĚT NA POSTAVU
        </Link>

        <div className="character-gallery-title">
          <span>GALERIE</span>
          <h1>{character.name}</h1>
        </div>

      </header>


      {images.length > 0 ? (

        <section className="character-gallery-grid">

          {images.map((image, index) => {

            const source = resolveCharacterAsset(
              image.image,
              null,
              bookId
            );

            const video = isVideoFile(image.image);

            return (
              <figure
                key={image.id || index}
                className="character-gallery-item"
              >

                <div className="character-gallery-image-wrap">

                  {video ? (
                    <video
                      controls
                      playsInline
                      preload="none"
                      aria-label={
                        image.caption ||
                        `${character.name} – video ${index + 1}`
                      }
                    >
                      <source
                        src={source}
                        type={getVideoType(image.image)}
                      />
                    </video>
                  ) : (
                    <img
                      src={source}
                      alt={
                        image.caption ||
                        `${character.name} – obrázek ${index + 1}`
                      }
                      loading="lazy"
                      decoding="async"
                    />
                  )}

                </div>

                {image.caption && (
                  <figcaption>
                    {image.caption}
                  </figcaption>
                )}

              </figure>
            );

          })}

        </section>

      ) : (

        <div className="character-gallery-empty">
          Tato postava zatím nemá žádné obrázky v galerii.
        </div>

      )}

    </main>
  );
}


export default CharacterGalleryPage;
