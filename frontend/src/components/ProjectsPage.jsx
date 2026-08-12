import { useEffect, useState } from "react";

import {
  getBooks,
  addBook,
  updateBook,
  deleteBook,
} from "../services/booksService";

import ProjectForm from "../components/ProjectForm";
import BookStructure from "../components/BookStructure";

import "./ProjectsPage.css";

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [structureBook, setStructureBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function loadProjects() {
    setLoading(true);
    setError(false);

    try {
      const data = await getBooks();

      setProjects(Array.isArray(data) ? data : []);

      if (structureBook?.id != null) {
        const refreshed = data.find(
          (project) => String(project.id) === String(structureBook.id)
        );

        setStructureBook(refreshed || null);
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
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
      /*
       * DŮLEŽITÉ:
       * Nová kniha = POST /books
       * Existující kniha = PUT /books/:id
       *
       * Nikdy neposíláme PUT na /books/undefined.
       */

      const projectId = selectedProject?.id;

      if (projectId !== undefined && projectId !== null && projectId !== "") {
        await updateBook(projectId, project);
      } else {
        await addBook(project);
      }

      setSelectedProject(null);

      await loadProjects();
    } catch (err) {
      console.error("Chyba při ukládání knihy:", err);
      alert(err.message);
    }
  }

  async function handleDeleteProject(id) {
    if (id === undefined || id === null || id === "") {
      console.error("Pokus o smazání knihy bez ID.");
      alert("Knihu nelze smazat, protože nemá platné ID.");
      return;
    }

    if (!window.confirm("Opravdu chceš tuto knihu smazat?")) {
      return;
    }

    try {
      await deleteBook(id);

      if (
        selectedProject?.id !== undefined &&
        String(selectedProject.id) === String(id)
      ) {
        setSelectedProject(null);
      }

      if (
        structureBook?.id !== undefined &&
        String(structureBook.id) === String(id)
      ) {
        setStructureBook(null);
      }

      await loadProjects();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <div className="admin-loading">
          Načítám knihy...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="admin-page">
        <div className="admin-error">
          <h2>Nepodařilo se načíst knihy.</h2>

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

      {/* =====================================================
          HLAVIČKA
          ===================================================== */}

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


      {/* =====================================================
          VÝBĚR KNIHY
          ===================================================== */}

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
              onClick={() => {
                setSelectedProject(null);
                setStructureBook(project);
              }}
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

            /*
             * Prázdný objekt znamená:
             * otevři formulář pro NOVOU knihu.
             *
             * Nemá ID, takže se nikdy nesmí zavolat updateBook().
             */
            setSelectedProject({});
          }}
        >
          ＋ Přidat novou knihu
        </button>

      </section>


      {/* =====================================================
          FORMULÁŘ KNIHY
          ===================================================== */}

      {selectedProject && (

        <section className="admin-book-form">

          <div className="admin-section-heading">

            <div>

              <span className="admin-eyebrow">
                ADMINISTRACE KNIHY
              </span>

              <h2>
                {selectedProject.id
                  ? "Upravit knihu"
                  : "Nová kniha"}
              </h2>

            </div>


            <button
              type="button"
              onClick={() => setSelectedProject(null)}
            >
              Zavřít
            </button>

          </div>


          <ProjectForm
            onSaveProject={handleSaveProject}
            selectedProject={
              selectedProject.id
                ? selectedProject
                : null
            }
          />

        </section>

      )}


      {/* =====================================================
          HLAVNÍ PRACOVNÍ PROSTOR
          ===================================================== */}

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

                {structureBook.type === "series"
                  ? "Série"
                  : "Samostatná kniha"}

                {" · "}

                {structureBook.status || "Rozpracováno"}

              </p>

            </div>


            <div className="admin-workspace-actions">

              <button
                type="button"
                onClick={() =>
                  setSelectedProject(structureBook)
                }
              >
                ✎ Upravit knihu
              </button>


              <button
                type="button"
                onClick={() => {
                  setStructureBook(null);
                  setSelectedProject(null);
                }}
              >
                Zavřít
              </button>

            </div>

          </div>


          <BookStructure
            book={structureBook}
            onDeleteBook={handleDeleteProject}
          />

        </section>

      )}


      {/* =====================================================
          PRÁZDNÝ STAV
          ===================================================== */}

      {!structureBook && !selectedProject && (

        <section className="admin-empty">

          <div className="admin-empty-icon">
            📚
          </div>

          <h2>
            Vyber knihu
          </h2>

          <p>
            Vyber knihu nahoře nebo vytvoř novou.
          </p>

        </section>

      )}

    </main>
  );
}

export default ProjectsPage;