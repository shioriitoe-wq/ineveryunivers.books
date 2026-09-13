import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getChapters } from "../services/booksService";
import { getChapterNarrator } from "../services/aeilService";

import aeilCharactersBack from "../assets/images/AEIL/aeil-characters-back.png";
import libraryLogo from "../assets/images/library-logo.png";

import "./AEILChaptersPage.css";

const BOOK_ID = 2;

export default function AEILChaptersPage() {
    const navigate = useNavigate();

    const [chapters, setChapters] = useState([]);
    const [narrators, setNarrators] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadChapters() {
            try {
                setLoading(true);
                setError("");

                const data = await getChapters(BOOK_ID);

                if (cancelled) return;

                const published = Array.isArray(data)
                    ? data.filter(
                          (chapter) =>
                              chapter.status === "published"
                      )
                    : [];

                setChapters(published);

                const narratorEntries =
                    await Promise.all(
                        published.map(async (chapter) => {
                            try {
                                const result =
                                    await getChapterNarrator(
                                        chapter.id
                                    );

                                return [
                                    chapter.id,
                                    result?.character || null,
                                ];
                            } catch {
                                return [
                                    chapter.id,
                                    null,
                                ];
                            }
                        })
                    );

                if (cancelled) return;

                setNarrators(
                    Object.fromEntries(
                        narratorEntries
                    )
                );
            } catch (err) {
                if (cancelled) return;

                console.error(err);

                setError(
                    err?.message ||
                        "Nepodařilo se načíst kapitoly."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadChapters();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <main
            className="aeil-chapters-page"
            style={{
                "--aeil-chapters-background":
                    `url(${aeilCharactersBack})`,
            }}
        >
                <div className="aeil-chapters-loading">
                    Načítám kapitoly…
                </div>
            </main>
        );
    }

    return (
        <main
            className="aeil-chapters-page"
            style={{
                "--aeil-chapters-background":
                    `url(${aeilCharactersBack})`,
            }}
        >
            <header className="aeil-chapters-header">

                <button
                    type="button"
                    onClick={() =>
                        navigate("/books/aeil")
                    }
                    className="aeil-chapters-back"
                >
                    ← ZPĚT KE KNIZE
                </button>

                <div className="aeil-chapters-library-logo">
                    <img
                        src={libraryLogo}
                        alt=""
                        aria-hidden="true"
                    />
                </div>

                <h1>Kapitoly</h1>

            </header>

            {error && (
                <div className="aeil-chapters-error">
                    {error}
                </div>
            )}

            {!error && chapters.length === 0 && (
                <div className="aeil-chapters-empty">
                    Zatím nejsou zveřejněné žádné kapitoly.
                </div>
            )}

            <section className="aeil-chapters-list">
                {chapters.map((chapter) => {
                    const narrator =
                        narrators[chapter.id];

                    return (
                        <button
                            key={chapter.id}
                            type="button"
                            className="aeil-chapter-list-item"
                            onClick={() =>
                                navigate(
                                    `/books/aeil/chapters/${chapter.number}`
                                )
                            }
                        >
                            <span className="aeil-chapter-list-number">
                                {String(
                                    chapter.number ?? ""
                                ).padStart(2, "0")}
                            </span>

                            <span className="aeil-chapter-list-main">
                                <strong>
                                    {chapter.title}
                                </strong>

                                {narrator?.name && (
                                    <small>
                                        Vypráví{" "}
                                        {narrator.name}
                                    </small>
                                )}
                            </span>

                            
                        </button>
                    );
                })}
            </section>
        </main>
    );
}
