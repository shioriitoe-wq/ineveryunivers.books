import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import BackButton from "../components/BackButton";
import { getChapters, getParts } from "../services/booksService";

import "./ChaptersPage.css";


const BOOK_ID = 1;


function ChapterSeason({
    title,
    chapters,
    className,
    image,
}) {
    const listRef = useRef(null);

    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);


    function updateScrollState() {
        const element = listRef.current;

        if (!element) return;

        const hasOverflow =
            element.scrollHeight > element.clientHeight + 2;

        setCanScrollUp(
            element.scrollTop > 2
        );

        setCanScrollDown(
            hasOverflow &&
            element.scrollTop + element.clientHeight <
                element.scrollHeight - 2
        );
    }


    useEffect(() => {
        updateScrollState();

        const element = listRef.current;

        if (!element) return;

        element.addEventListener(
            "scroll",
            updateScrollState
        );

        window.addEventListener(
            "resize",
            updateScrollState
        );

        return () => {
            element.removeEventListener(
                "scroll",
                updateScrollState
            );

            window.removeEventListener(
                "resize",
                updateScrollState
            );
        };
    }, [chapters]);


    return (
        <section
            className={`chapter-season ${className}`}
        >

            {/* GIF OBDOBÍ */}

            <img
                src={image}
                alt={title}
                className="chapter-season-image"
            />


            <div className="chapter-season-overlay">

                {/* NÁZEV OBDOBÍ */}

                <h2>{title}</h2>


                {/* KAPITOLY */}

                <div
                    className="chapter-list"
                    ref={listRef}
                    onMouseEnter={updateScrollState}
                >

                    {chapters.map((chapter) => (

                        <Link
                            to={`/books/nezacalo/chapters/${chapter.id}`}
                            key={chapter.id}
                        >
                            Kapitola {chapter.number}
                        </Link>

                    ))}

                </div>


                {/* ŠIPKA NAHORU */}

                {canScrollUp && (
                    <div className="chapter-scroll-arrow chapter-scroll-up">
                        ↑
                    </div>
                )}


                {/* ŠIPKA DOLŮ */}

                {canScrollDown && (
                    <div className="chapter-scroll-arrow chapter-scroll-down">
                        ↓
                    </div>
                )}

            </div>

        </section>
    );
}



export default function ChaptersPage() {

    const [chapters, setChapters] = useState([]);
    const [parts, setParts] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {

        async function loadData() {

            try {

                setLoading(true);
                setError("");

                const [
                    chaptersData,
                    partsData,
                ] = await Promise.all([
                    getChapters(BOOK_ID),
                    getParts(BOOK_ID),
                ]);

                setChapters(
                    Array.isArray(chaptersData)
                        ? chaptersData
                        : []
                );

                setParts(
                    Array.isArray(partsData)
                        ? partsData
                        : []
                );

            } catch (err) {

                console.error(err);

                setError(
                    err.message ||
                    "Nepodařilo se načíst kapitoly."
                );

            } finally {

                setLoading(false);

            }
        }


        loadData();

    }, []);


    /*
     * Najdeme kapitoly podle části.
     *
     * Část 1 = Léto
     * Část 2 = Podzim
     * Část 3 = Zima
     * Část 4 = Jaro
     */

    function chaptersForPart(partNumber) {

        const part = parts.find(
            (item) =>
                Number(item.number) ===
                Number(partNumber)
        );

        if (!part) {
            return [];
        }

        return chapters
            .filter(
                (chapter) =>
                    Number(chapter.part_id) ===
                    Number(part.id)
            )
            .sort(
                (a, b) =>
                    Number(a.number) -
                    Number(b.number)
            );
    }


    if (loading) {

        return (
            <main className="chapters-page">
                <div className="chapters-loading">
                    Načítám kapitoly…
                </div>
            </main>
        );

    }


    if (error) {

        return (
            <main className="chapters-page">
                <div className="chapters-error">
                    {error}
                </div>
            </main>
        );

    }


    const summerChapters =
        chaptersForPart(1);

    const autumnChapters =
        chaptersForPart(2);

    const winterChapters =
        chaptersForPart(3);

    const springChapters =
        chaptersForPart(4);


    return (

        <main className="chapters-page">

            {/* =================================================
                ZPĚT
            ================================================= */}

            <div className="chapters-back">
                <BackButton
                    to="/books/nezacalo"
                />
            </div>


            {/* =================================================
                LÉTO
            ================================================= */}

            <ChapterSeason
                title="LÉTO"
                chapters={summerChapters}
                className="summer-season"
                image="/summer.gif"
            />


            {/* =================================================
                PODZIM
            ================================================= */}

            <ChapterSeason
                title="PODZIM"
                chapters={autumnChapters}
                className="autumn-season"
                image="/autumn.gif"
            />


            {/* =================================================
                ZIMA
            ================================================= */}

            <ChapterSeason
                title="ZIMA"
                chapters={winterChapters}
                className="winter-season"
                image="/winter.gif"
            />


            {/* =================================================
                JARO
            ================================================= */}

            <ChapterSeason
                title="JARO"
                chapters={springChapters}
                className="spring-season"
                image="/spring.gif"
            />

        </main>

    );
}