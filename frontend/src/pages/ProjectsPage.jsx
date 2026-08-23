import { useEffect, useState } from "react";

import {
  getBooks,
  addBook,
  updateBook,
  deleteBook,
  getCharacters,
  addCharacter,
  updateCharacter,
  deleteCharacter,
  getVolumes,
} from "../services/booksService";

import ProjectForm from "../components/ProjectForm";
import BookStructure from "../components/BookStructure";
import CharacterForm from "../components/CharacterForm";

import "./ProjectsPage.css";

function ProjectsPage() {
  const [projects, setProjects] = useState([]);

  const [selectedProject, setSelectedProject] = useState(null);
  const [structureBook, setStructureBook] = useState(null);

  const [characters, setCharacters] = useState([]);
  const [volumes, setVolumes] = useState([]);

  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showCharacterForm, setShowCharacterForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function loadProjects() {
    setLoading(true);
    setError(false);

    try {
      const data = await getBooks();

      setProjects(data);

      if (structureBook) {
        const refreshed = data.find(
          (project) => project.id === structureBook.id
        );

        setStructureBook(refreshed || null);
      }
    } catch (error) {
      console.error(error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }


  async function loadCharacters(bookId) {
    if (!bookId) {
      setCharacters([]);
      setVolumes([]);
      return;
    }

    try {
      const [characterData, volumeData] =
        await Promise.all([
          getCharacters(bookId),
          getVolumes(bookId),
        ]);

      setCharacters(characterData);
      setVolumes(volumeData);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }


  useEffect(() => {
    document.documentElement.style.overflowY = "auto";
    document.body.style.overflowY = "auto";

    loadProjects();

    return () => {
      document.documentElement.style.overflowY = "";
      document.body.style.overflowY = "";
    };
  }, []);


  async function handleSaveProject(project) {
    try {
      if (selectedProject?.id) {
        await updateBook(
          selectedProject.id,
          project
        );
      } else {
        await addBook(project);
      }

      setSelectedProject(null);

      await loadProjects();

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }


  function handleEditProject(project) {
    setSelectedProject(project);
  }


  function handleManageStructure(project) {
    setSelectedProject(null);
    setSelectedCharacter(null);
    setShowCharacterForm(false);

    setStructureBook(project);

    loadCharacters(project.id);
  }


  async function handleDeleteProject(id) {
    try {
      await deleteBook(id);

      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }

      if (structureBook?.id === id) {
        setStructureBook(null);
      }

      setCharacters([]);
      setVolumes([]);

      await loadProjects();

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }


  function handleAddCharacter() {
    setSelectedCharacter(null);
    setShowCharacterForm(true);
  }


  function handleEditCharacter(character) {
    setSelectedCharacter(character);
    setShowCharacterForm(true);
  }


  async function handleSaveCharacter(characterData) {
    if (!structureBook?.id) {
      return;
    }

    try {
      if (selectedCharacter?.id) {
        await updateCharacter(
          structureBook.id,
          selectedCharacter.id,
          characterData
        );
      } else {
        await addCharacter(
          structureBook.id,
          characterData
        );
      }

      setSelectedCharacter(null);
      setShowCharacterForm(false);

      await loadCharacters(
        structureBook.id
      );

    } catch (error) {
      console.error(error);
      throw error;
    }
  }


  async function handleDeleteCharacter(
    characterId
  ) {
    if (!structureBook?.id) {
      return;
    }

    const confirmed = window.confirm(
      "Opravdu chceš tuto postavu smazat?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCharacter(
        structureBook.id,
        characterId
      );

      if (
        selectedCharacter?.id ===
        characterId
      ) {
        setSelectedCharacter(null);
        setShowCharacterForm(false);
      }

      await loadCharacters(
        structureBook.id
      );

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }


  function handleCancelCharacter() {
    setSelectedCharacter(null);
    setShowCharacterForm(false);
  }


  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-loading">
          Načítám projekty...
        </div>
      </main>
    );
  }


  if (error) {
    return (
      <main className="admin-page">
        <div className="admin-error">

          <p>
            Nepodařilo se načíst projekty.
          </p>

          <button
            type="button"
            onClick={loadProjects}
          >
            Zkusit znovu
          </button>

        </div>
      </main>
    );
  }


  return (
    <main className="admin-page">

      {/* =================================================
          HLAVIČKA
      ================================================= */}

      <header className="admin-header">

        <div className="admin-brand">

          <div className="admin-logo">
            ineveryunivers.books
          </div>

          <div className="admin-subtitle">
            Administrace knih
          </div>

        </div>


        <div className="admin-header-actions">

          <button type="button">
            Náhled stránky
          </button>

          <button type="button">
            Profil
          </button>

          <button type="button">
            Odhlásit
          </button>

        </div>

      </header>


      {/* =================================================
          MOJE KNIHY
      ================================================= */}

      <section className="admin-book-selector">

        <div className="admin-book-selector-title">

          <span>📖</span>

          <div>

            <strong>
              MOJE KNIHY
            </strong>

            <small>
              Vyber knihu, kterou chceš spravovat
            </small>

          </div>

        </div>


        <div className="admin-book-list">

          {projects.map((project) => (

            <button
              key={project.id}
              type="button"
              className={
                structureBook?.id === project.id
                  ? "admin-book-item active"
                  : "admin-book-item"
              }
              onClick={() =>
                handleManageStructure(
                  project
                )
              }
            >
              {project.title}
            </button>

          ))}

        </div>


        <button
          type="button"
          className="admin-add-book"
          onClick={() => {
            setStructureBook(null);
            setSelectedCharacter(null);
            setShowCharacterForm(false);

            setSelectedProject({});
          }}
        >
          ＋ Přidat novou knihu
        </button>

      </section>


      {/* =================================================
          FORMULÁŘ KNIHY
      ================================================= */}

      {selectedProject && (

        <section className="admin-book-form">

          <div className="admin-section-heading">

            <h2>
              {selectedProject.id
                ? "Upravit knihu"
                : "Nová kniha"}
            </h2>

            <button
              type="button"
              onClick={() =>
                setSelectedProject(null)
              }
            >
              Zavřít
            </button>

          </div>


          <ProjectForm
            onSaveProject={
              handleSaveProject
            }
            selectedProject={
              selectedProject.id
                ? selectedProject
                : null
            }
          />

        </section>

      )}


      {/* =================================================
          VYBRANÁ KNIHA
      ================================================= */}

      {structureBook && (

        <section className="admin-workspace">

          <div className="admin-workspace-header">

            <div>

              <span className="admin-eyebrow">
                AKTUÁLNĚ VYBRANÁ KNIHA
              </span>

              <h1>
                {structureBook.title}
              </h1>

              <p>
                {structureBook.type ===
                "series"
                  ? "Série"
                  : "Samostatná kniha"}

                {" · "}

                {structureBook.status}
              </p>

            </div>


            <div className="admin-workspace-actions">

              <button
                type="button"
                onClick={() =>
                  handleEditProject(
                    structureBook
                  )
                }
              >
                ✎ Upravit knihu
              </button>

              <button
                type="button"
                onClick={() => {
                  setStructureBook(null);
                  setCharacters([]);
                  setVolumes([]);
                  setShowCharacterForm(false);
                  setSelectedCharacter(null);
                }}
              >
                Zavřít
              </button>

            </div>

          </div>


          {/* =================================================
              STRUKTURA KNIHY
          ================================================= */}

          <div className="admin-structure">

            <BookStructure
              book={structureBook}
            />

          </div>


          {/* =================================================
              MOJE POSTAVY
          ================================================= */}

          <section className="admin-characters">

            <div className="admin-characters-header">

              <div>

                <span className="admin-eyebrow">
                  OBSAH KNIHY
                </span>

                <h2>
                  MOJE POSTAVY
                </h2>

                <p>
                  Postavy této knihy můžeš
                  přiřadit k jednomu nebo více
                  dílům.
                </p>

              </div>


              <button
                type="button"
                className="admin-add-character"
                onClick={
                  handleAddCharacter
                }
              >
                ＋ Přidat postavu
              </button>

            </div>


            {showCharacterForm && (

              <div className="admin-character-form">

                <CharacterForm
  bookId={structureBook?.id}
  character={selectedCharacter}
  volumes={volumes}
  onSave={handleSaveCharacter}
  onCancel={handleCancelCharacter}
/>

              </div>

            )}


            {!showCharacterForm && (

              <>

                {characters.length === 0 ? (

                  <div className="admin-characters-empty">

                    <div>
                      ✦
                    </div>

                    <h3>
                      Zatím tu nejsou žádné
                      postavy
                    </h3>

                    <p>
                      Přidej první postavu
                      této knihy.
                    </p>

                    <button
                      type="button"
                      onClick={
                        handleAddCharacter
                      }
                    >
                      ＋ Přidat první postavu
                    </button>

                  </div>

                ) : (

                  <div className="admin-character-list">

                    {characters.map(
                      (character) => (

                        <article
                          key={
                            character.id
                          }
                          className="admin-character-card"
                        >

                          <div className="admin-character-card-image">

                            {character.main_image ? (

                              <img
                                src={
                                  character.main_image
                                }
                                alt={
                                  character.name
                                }
                              />

                            ) : (

                              <div>
                                Bez obrázku
                              </div>

                            )}

                          </div>


                          <div className="admin-character-card-content">

                            <span className="admin-eyebrow">
                              POSTAVA
                            </span>

                            <h3>
                              {character.name}
                            </h3>

                            {character.quote && (

                              <p className="admin-character-quote">
                                „
                                {character.quote}
                                “
                              </p>

                            )}


                            {character.volume_ids?.length >
                              0 && (

                              <div className="admin-character-volumes">

                                {character.volume_ids.map(
                                  (volumeId) => {

                                    const volume =
                                      volumes.find(
                                        (item) =>
                                          item.id ===
                                          volumeId
                                      );

                                    if (!volume) {
                                      return null;
                                    }

                                    return (
                                      <span
                                        key={
                                          volumeId
                                        }
                                      >
                                        {volume.number
                                          ? `Díl ${volume.number}`
                                          : volume.title}
                                      </span>
                                    );
                                  }
                                )}

                              </div>

                            )}


                            <div className="admin-character-actions">

                              <button
                                type="button"
                                onClick={() =>
                                  handleEditCharacter(
                                    character
                                  )
                                }
                              >
                                Upravit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteCharacter(
                                    character.id
                                  )
                                }
                              >
                                Smazat
                              </button>

                            </div>

                          </div>

                        </article>

                      )
                    )}

                  </div>

                )}

              </>

            )}

          </section>

        </section>

      )}


      {/* =================================================
          PRÁZDNÝ STAV
      ================================================= */}

      {!structureBook &&
        !selectedProject && (

          <section className="admin-empty">

            <div className="admin-empty-icon">
              📚
            </div>

            <h2>
              Vyber knihu
            </h2>

            <p>
              Vyber knihu nahoře nebo vytvoř
              novou.
            </p>

          </section>

        )}

    </main>
  );
}

export default ProjectsPage;