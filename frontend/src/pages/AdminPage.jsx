import { useEffect, useState } from "react";
import ProjectsPage from "./ProjectsPage";
import MusicAdminPage from "./MusicAdminPage";
import VideoLibraryAdminPage from "./VideoLibraryAdminPage";
import CoversAdminPage from "./CoversAdminPage";
import "./AdminPage.css";

const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://ineveryunivers-books-api.onrender.com/api";

function AdminPage() {
  const [activeSection, setActiveSection] = useState("books");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const savedToken = sessionStorage.getItem("adminToken");

      if (!savedToken) {
        if (!cancelled) setChecking(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/admin/check`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });

        if (!response.ok) {
          sessionStorage.removeItem("adminToken");
          if (!cancelled) setToken("");
          return;
        }

        const data = await response.json();

        if (!cancelled && data.authenticated) {
          setToken(savedToken);
        } else {
          sessionStorage.removeItem("adminToken");
        }
      } catch {
        if (!cancelled) {
          setError("Nepodařilo se spojit se serverem. Zkus stránku obnovit.");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(
          data.message ||
            (response.status === 503
              ? "Přihlášení není na serveru nakonfigurováno."
              : "Přihlášení se nezdařilo.")
        );
        return;
      }

      if (!data.token) {
        setError("Server nevrátil přihlašovací token.");
        return;
      }

      sessionStorage.setItem("adminToken", data.token);
      setToken(data.token);
      setPassword("");
      setError("");
    } catch {
      setError("Nepodařilo se spojit se serverem. Zkontroluj, zda backend běží.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("adminToken");
    setToken("");
    setPassword("");
    setError("");
    setActiveSection("books");
  }

  const sections = [
    { id: "books", label: "Knihy", icon: "📚" },
    { id: "covers", label: "Obálky", icon: "▧" },
    { id: "music", label: "Hudba", icon: "♫" },
    { id: "videos", label: "Videa", icon: "▶" },
  ];

  if (checking) {
    return (
      <main className="admin-hub admin-auth-screen">
        <div className="admin-auth-card">
          <div className="admin-hub-brand">ineveryunivers.books</div>
          <p className="admin-hub-subtitle">Ověřuji přihlášení…</p>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="admin-hub admin-auth-screen">
        <form className="admin-auth-card" onSubmit={handleLogin}>
          <div className="admin-auth-symbol" aria-hidden="true">✦</div>
          <div className="admin-hub-brand">ineveryunivers.books</div>
          <p className="admin-hub-subtitle">Zabezpečené centrum administrace</p>

          <label className="admin-auth-label" htmlFor="admin-password">
            Administrační heslo
          </label>
          <input
            id="admin-password"
            className="admin-auth-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Zadej heslo"
            required
            autoFocus
          />

          {error && (
            <p className="admin-auth-error" role="alert">{error}</p>
          )}

          <button
            className="admin-auth-submit"
            type="submit"
            disabled={submitting || !password}
          >
            {submitting ? "Ověřuji…" : "Přihlásit se"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-hub">
      <header className="admin-hub-header">
        <div className="admin-hub-header-inner">
          <div>
            <div className="admin-hub-brand">ineveryunivers.books</div>
            <p className="admin-hub-subtitle">Centrum administrace</p>
          </div>
          <button
            type="button"
            className="admin-auth-logout"
            onClick={handleLogout}
          >
            Odhlásit se
          </button>
        </div>
      </header>

      <nav className="admin-hub-nav" aria-label="Sekce administrace">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`admin-hub-tab ${
              activeSection === section.id ? "active" : ""
            }`}
            aria-current={activeSection === section.id ? "page" : undefined}
            onClick={() => setActiveSection(section.id)}
          >
            <span className="admin-hub-tab-icon" aria-hidden="true">
              {section.icon}
            </span>
            <span>{section.label}</span>
          </button>
        ))}
      </nav>

      <div className="admin-hub-content">
        {activeSection === "books" && <ProjectsPage />}

        {activeSection === "covers" && <CoversAdminPage />}

        {activeSection === "music" && <MusicAdminPage />}

        {activeSection === "videos" && <VideoLibraryAdminPage />}
      </div>
    </main>
  );
}

export default AdminPage;
