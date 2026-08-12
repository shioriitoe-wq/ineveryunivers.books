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
       *
       * selectedProject může být {} při vytváření nové knihy.
       * Proto nesmíme kontrolovat pouze:
       *
       * if (selectedProject)
       *
       * protože {} je v JavaScriptu truthy.
       *
       * Existující kniha = má ID
       * Nová kniha = ID nemá
       */

      if (selectedProject?.id) {
        await updateBook(selectedProject.id, project);
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
    setStructureBook(project);
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

      await loadProjects();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
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
          <p>Nepodařilo se načíst projekty.</p>

          <button type="button" onClick={loadProjects}>
            Zkusit znovu
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">

      {/* HLAVIČKA */}

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


      {/* HORNÍ KARTA KNIHY */}

      <section className="admin-book-selector">

        <div className="admin-book-selector-title">

          <span>📖</span>

          <div>

            <strong>MOJE KNIHY</strong>

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
              onClick={() => handleManageStructure(project)}
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
             * handleSaveProject už kontroluje selectedProject?.id,
             * takže {} se správně uloží přes POST.
             */
            setSelectedProject({});
          }}
        >
          ＋ Přidat novou knihu
        </button>

      </section>


      {/* FORMULÁŘ PRO KNIHU */}

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


      {/* SPRÁVA VYBRANÉ KNIHY */}

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
                {structureBook.status}
              </p>

            </div>


            <div className="admin-workspace-actions">

              <button
                type="button"
                onClick={() =>
                  handleEditProject(structureBook)
                }
              >
                ✎ Upravit knihu
              </button>

              <button
                type="button"
                onClick={() =>
                  setStructureBook(null)
                }
              >
                Zavřít
              </button>

            </div>

          </div>


          <div className="admin-structure">

            <BookStructure
              book={structureBook}
            />

          </div>

        </section>

      )}


      {/* KNIHY – POKUD NENÍ VYBRANÁ KNIHA */}

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