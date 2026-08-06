import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getBook } from "../services/booksService";

function ProjectPage() {
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      try {
        const data = await getBook(id);
        setProject(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [id]);

  if (loading) {
    return (
      <main>
        <h1>Načítám projekt...</h1>
      </main>
    );
  }

  if (!project) {
    return (
      <main>
        <h1>Projekt nebyl nalezen.</h1>
      </main>
    );
  }

  return (
    <main>
      <h1>{project.title}</h1>

      <p>
        <strong>Typ:</strong>{" "}
        {project.type === "series"
          ? "Série"
          : "Samostatná kniha"}
      </p>

      <p>
        <strong>Stav:</strong> {project.status}
      </p>

      <p>
        <strong>ID:</strong> {project.id}
      </p>
    </main>
  );
}

export default ProjectPage;