import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import BackButton from "../components/BackButton";
import { getChapters, getParts } from "../services/booksService";

import "./ChaptersPage.css";

const BOOK_ID = 1;

const SEASONS = [
  { title: "LÉTO", partNumber: 1, className: "summer-season", video: "/season-videos/summer.mp4" },
  { title: "PODZIM", partNumber: 2, className: "autumn-season", video: "/season-videos/autumn.mp4" },
  { title: "ZIMA", partNumber: 3, className: "winter-season", video: "/season-videos/winter.mp4" },
  { title: "JARO", partNumber: 4, className: "spring-season", video: "/season-videos/spring.mp4" },
];

function ChapterSeason({ title, chapters, className, video }) {
  const listRef = useRef(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  function updateScrollState() {
    const element = listRef.current;
    if (!element) return;

    const hasOverflow = element.scrollHeight > element.clientHeight + 2;
    setCanScrollUp(element.scrollTop > 2);
    setCanScrollDown(
      hasOverflow &&
      element.scrollTop + element.clientHeight < element.scrollHeight - 2
    );
  }

  useEffect(() => {
    const element = listRef.current;
    if (!element) return undefined;

    const update = () => requestAnimationFrame(updateScrollState);
    update();
    element.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", update);

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    resizeObserver?.observe(element);

    return () => {
      element.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", update);
      resizeObserver?.disconnect();
    };
  }, [chapters]);

  return (
    <section className={`chapter-season ${className}`}>
      <video
        className="chapter-season-image"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={`${title} – animované pozadí`}
      >
        <source src={video} type="video/mp4" />
      </video>

      <div className="chapter-season-overlay">
        <h2>{title}</h2>

        <div
          className="chapter-list"
          ref={listRef}
          onMouseEnter={updateScrollState}
          onScroll={updateScrollState}
          aria-label={`Kapitoly – ${title.toLowerCase()}`}
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

        {canScrollUp && (
          <div className="chapter-scroll-arrow chapter-scroll-up" aria-hidden="true">↑</div>
        )}
        {canScrollDown && (
          <div className="chapter-scroll-arrow chapter-scroll-down" aria-hidden="true">↓</div>
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
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [chaptersData, partsData] = await Promise.all([
          getChapters(BOOK_ID),
          getParts(BOOK_ID),
        ]);

        if (cancelled) return;
        setChapters(Array.isArray(chaptersData) ? chaptersData : []);
        setParts(Array.isArray(partsData) ? partsData : []);
      } catch (err) {
        console.error("ChaptersPage – načítání kapitol:", err);
        if (!cancelled) {
          setError(err?.message || "Nepodařilo se načíst kapitoly.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  function chaptersForPart(partNumber) {
    const part = parts.find(
      (item) => Number(item.number) === Number(partNumber)
    );
    if (!part) return [];

    return chapters
      .filter((chapter) => Number(chapter.part_id) === Number(part.id))
      .sort((a, b) => Number(a.number) - Number(b.number));
  }

  if (loading) {
    return (
      <main className="chapters-page">
        <div className="chapters-loading">Načítám kapitoly…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="chapters-page">
        <div className="chapters-error">
          <p>{error}</p>
          <BackButton to="/books/nezacalo" />
        </div>
      </main>
    );
  }

  return (
    <main className="chapters-page">
      <div className="chapters-back">
        <BackButton to="/books/nezacalo" />
      </div>

      {SEASONS.map((season) => (
        <ChapterSeason
          key={season.partNumber}
          title={season.title}
          chapters={chaptersForPart(season.partNumber)}
          className={season.className}
          video={season.video}
        />
      ))}
    </main>
  );
}
