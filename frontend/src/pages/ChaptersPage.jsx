import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getCharacters,
} from "../services/charactersService";

import {
  getBook,
  getVolumes,
} from "../services/booksService";

import "./CharactersPage.css";
import { resolveCharacterAsset } from "../utils/characterAssetPaths";


function CharactersPage() {

  const {
    bookId,
    volumeId,
  } = useParams();

  const [book, setBook] = useState(null);
  const [volume, setVolume] = useState(null);
  const [characters, setCharacters] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {

    async function loadData() {

      setLoading(true);
      setError("");

      try {

        const [
          loadedBook,
          loadedCharacters,
          loadedVolumes,
        ] = await Promise.all([
          getBook(bookId),
          getCharacters(bookId),
          getVolumes(bookId),
        ]);


        setBook(loadedBook);


        /*
         * Najdeme konkrétní díl,
         * ze kterého byla stránka otevřená.
         */

        const selectedVolume =
          loadedVolumes.find(
            (item) =>
              Number(item.id) === Number(volumeId)
          ) || null;


        setVolume(selectedVolume);


        /*
         * Postavy filtrujeme podle volume_ids.
         *
         * Alex:
         * volume_ids = [1, 2]
         *
         * Díl 1 → Alex ano
         * Díl 2 → Alex ano
         *
         * Danny:
         * volume_ids = [2]
         *
         * Díl 1 → Danny ne
         * Díl 2 → Danny ano
         */

        const filteredCharacters =
          loadedCharacters.filter(
            (character) => {

              const ids =
                Array.isArray(
                  character.volume_ids
                )
                  ? character.volume_ids
                  : [];


              return ids.some(
                (id) =>
                  Number(id) ===
                  Number(volumeId)
              );

            }
          );


        setCharacters(
          filteredCharacters
        );


      } catch (error) {

        console.error(error);

        setError(
          error.message ||
          "Nepodařilo se načíst postavy."
        );

      } finally {

        setLoading(false);

      }

    }


    if (bookId && volumeId) {
      loadData();
    }

  }, [
    bookId,
    volumeId,
  ]);


  /*
   * Postavy seřadíme podle sort_order.
   */

  const sortedCharacters = useMemo(() => {

    return [
      ...characters,
    ].sort(
      (a, b) =>
        Number(a.sort_order || 0) -
        Number(b.sort_order || 0)
    );

  }, [
    characters,
  ]);


  if (loading) {

    return (
      <main className="characters-page">

        <div className="characters-page-state">
          Načítám postavy...
        </div>

      </main>
    );

  }


  if (error) {

    return (
      <main className="characters-page">

        <div className="characters-page-state characters-page-error">
          {error}
        </div>

      </main>
    );

  }


  if (!book) {

    return (
      <main className="characters-page">

        <div className="characters-page-state">
          Kniha nebyla nalezena.
        </div>

      </main>
    );

  }


  return (

    <main className="characters-page">


      {/* =================================================
          POZADÍ
      ================================================= */}

      <div className="characters-background" />


      {/* =================================================
          OBSAH
      ================================================= */}

      <section className="characters-content">


        {/* =================================================
            HLAVIČKA
        ================================================= */}

        <header className="characters-header">

          <span className="characters-eyebrow">
            POSTAVY
          </span>


          <h1>
            {volume?.title || "Postavy"}
          </h1>


          <p>
            {book.title}
          </p>

        </header>


        {/* =================================================
            POSTAVY
        ================================================= */}

        {sortedCharacters.length === 0 ? (

          <div className="characters-empty">

            V tomto dílu zatím nejsou
            přiřazeny žádné postavy.

          </div>

        ) : (

          <div className="characters-grid">

            {sortedCharacters.map(
              (character) => (

                <Link
                  key={character.id}
                  to={`/project/${bookId}/characters/${character.id}`}
                  className="character-card"
                >


                  {/* -----------------------------------------
                      FOTOGRAFIE
                  ----------------------------------------- */}

                  <div className="character-card-photo">

                    {character.main_image ? (

                      <img
                        src={
                          resolveCharacterAsset(
                            character.main_image,
                            null,
                            bookId
                          ) || character.main_image
                        }
                        alt={character.name}
                      />

                    ) : (

                      <div className="character-card-no-image">
                        {character.name}
                      </div>

                    )}

                  </div>


                  {/* -----------------------------------------
                      TEXT
                  ----------------------------------------- */}

                  <div className="character-card-info">

                    <span className="character-card-label">
                      POSTAVA
                    </span>


                    <h2>
                      {character.name}
                    </h2>


                    {character.quote && (

                      <p className="character-card-quote">
                        „{character.quote}“
                      </p>

                    )}

                  </div>


                </Link>

              )
            )}

          </div>

        )}

      </section>

    </main>

  );

}


export default CharactersPage;