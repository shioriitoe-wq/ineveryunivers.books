import { useEffect, useState } from "react";
import {
  getBooks,
  addBook,
  updateBook,
  deleteBook,
} from "../services/booksService";

import ProjectCard from "../components/ProjectCard";
import ProjectForm from "../components/ProjectForm";

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function loadProjects() {
    setLoading(true);
    setError(false);

    try {
      const data = await getBooks();
      setProjects(data);
    } catch (error) {
      console.error(error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleSaveProject(project) {
    try {
      if (selectedProject) {
        await updateBook(selectedProject.id, project);
        setSelectedProject(null);
      } else {
        await addBook(project);
      }

      await loadProjects();
    } catch (error) {
      console.error(error);
    }
  }

  function handleEditProject(project) {
    setSelectedProject(project);
  }

  async function handleDeleteProject(id) {
    try {
      await deleteBook(id);

      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }

      await loadProjects();
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <main>
        <h2>Projekty</h2>
        <p>Načítám projekty...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h2>Projekty</h2>
        <p>Nepodařilo se načíst projekty.</p>
        <button onClick={loadProjects}>Zkusit znovu</button>
      </main>
    );
  }

  return (
    <main>
      <h2>Projekty</h2>

      <ProjectForm
        onSaveProject={handleSaveProject}
        selectedProject={selectedProject}
      />

      {selectedProject && (
        <p>
          Upravuješ projekt: <strong>{selectedProject.title}</strong>
        </p>
      )}

      <hr />

      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onDelete={handleDeleteProject}
          onEdit={handleEditProject}
        />
      ))}
    </main>
  );
}

export default ProjectsPage;