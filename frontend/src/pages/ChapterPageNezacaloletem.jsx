import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getChapters } from "../services/booksService";

import "./ChapterPageNezacaloletem.css";

import libraryLogo from "../assets/images/library-logo.png";
import hotdog from "../assets/images/hotdog.png";

const BOOK_ID = 1;

export default function ChapterPageNezacaloletem() {
    const { chapterId } = useParams();
    const navigate = useNavigate();

    const [chapter, setChapter] = useState(null);
    const [chapters, setChapters] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadChapter() {
            try {
                setLoading(true);
                setError("");

                const data = await getChapters(BOOK_ID);

                setChapters(data);

                const foundChapter = data.find(
                    (item) =>
                        Number(item.id) === Number(chapterId)
                );

                if (!foundChapter) {
                    setError("Kapitola nebyla nalezena.");
                    setChapter(null);
                    return;
                }

                setChapter(foundChapter);
            } catch (err) {
                console.error(err);

                setError(
                    err.message ||
                    "Nepodařilo se načíst kapitolu."
                );
            } finally {
                setLoading(false);
            }
        }

        loadChapter();
    }, [chapterId]);

    if (loading) {
        return (
            <main className="chapter-page chapter-summer">
                <div className="chapter-loading">
                    Načítám kapitolu…
                </div>
            </main>
        );
    }

    if (error || !chapter) {
        return (
            <main className="chapter-page chapter-summer">
                <div className="chapter-error">
                    <h1>
                        {error ||
                            "Kapitola nebyla nalezena."}
                    </h1>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/books/nezacalo/chapters"
                            )
                        }
                    >
                        ← Zpět na kapitoly
                    </button>
                </div>
            </main>
        );
    }

    const currentIndex = chapters.findIndex(
        (item) =>
            Number(item.id) === Number(chapterId)
    );

    const previousChapter =
        currentIndex > 0
            ? chapters[currentIndex - 1]
            : null;

    const nextChapter =
        currentIndex >= 0 &&
        currentIndex < chapters.length - 1
            ? chapters[currentIndex + 1]
            : null;

    return (
        <main className="chapter-page chapter-summer">

            {/* =========================================
                VOZÍČEK – DEKORACE
            ========================================= */}

            <img
                src={hotdog}
                alt=""
                className="chapter-hotdog"
                aria-hidden="true"
            />


            {/* =========================================
                HLAVIČKA
            ========================================= */}

            <header className="chapter-header">

                <img
                    src={libraryLogo}
                    alt=""
                    className="chapter-library-logo"
                    aria-hidden="true"
                />

                <button
                    type="button"
                    className="chapter-back"
                    onClick={() =>
                        navigate(
                            "/books/nezacalo/chapters"
                        )
                    }
                >
                    ← ZPĚT NA KAPITOLY
                </button>

            </header>


            {/* =========================================
                OBSAH KAPITOLY
            ========================================= */}

            <article className="chapter-content">

                <h1>
                    {chapter.title}
                </h1>

            


                {/* =====================================
                    SKUTEČNÝ TEXT Z EDITORU
                ===================================== */}

                <div
                    className="chapter-text"
                    dangerouslySetInnerHTML={{
                        __html:
                            chapter.content_html ||
                            "<p>Kapitola zatím nemá žádný text.</p>",
                    }}
                />

            </article>


            {/* =========================================
                SPODNÍ PANELY
            ========================================= */}

            <div className="chapter-tools">

                <button
                    type="button"
                    onClick={() =>
                        navigate("/books/nezacalo")
                    }
                >
                    KNIHA
                </button>

                <button
                    type="button"
                    onClick={() =>
                        navigate("/books/nezacalo/characters")
                    }
                >
                    POSTAVY
                </button>

                <button
                    type="button"
                    onClick={() =>
                        navigate("/books/nezacalo/videos")
                    }
                >
                    VIDEA
                </button>

                <button
                    type="button"
                    onClick={() =>
                        navigate("/books/nezacalo/soundtracks")
                    }
                >
                    SOUNDTRACK
                </button>

            </div>


            {/* =========================================
                PŘEDCHOZÍ / DALŠÍ DÍL
            ========================================= */}

            <nav className="chapter-navigation">

                {previousChapter ? (
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                `/books/nezacalo/chapters/${previousChapter.id}`
                            )
                        }
                    >
                        ← PŘEDCHOZÍ DÍL
                    </button>
                ) : (
                    <span></span>
                )}


                {nextChapter ? (
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                `/books/nezacalo/chapters/${nextChapter.id}`
                            )
                        }
                    >
                        DALŠÍ DÍL →
                    </button>
                ) : (
                    <span></span>
                )}

            </nav>

        </main>
    );
}