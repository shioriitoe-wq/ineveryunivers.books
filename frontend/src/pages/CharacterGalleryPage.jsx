import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getCharacter } from "../services/charactersService";

import "./CharacterGalleryPage.css";


function CharacterGalleryPage() {

  const { bookId, characterId } = useParams();
  const navigate = useNavigate();

  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {

    async function loadCharacter() {

      setLoading(true);
      setError("");

      try {
        const data = await getCharacter(bookId, characterId);
        setCharacter(data);
      } catch (err) {
        console.error(err);
        setError(
          err.message ||
          "Nepodařilo se načíst galerii."
        );
      } finally {
        setLoading(false);
      }

    }

    loadCharacter();

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

          {images.map((image, index) => (

            <figure
              key={image.id || index}
              className="character-gallery-item"
            >

              <div className="character-gallery-image-wrap">
                <img
                  src={image.image}
                  alt={image.caption || `${character.name} – obrázek ${index + 1}`}
                  loading="lazy"
                />
              </div>

              {image.caption && (
                <figcaption>
                  {image.caption}
                </figcaption>
              )}

            </figure>

          ))}

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