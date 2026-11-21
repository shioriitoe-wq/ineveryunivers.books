import { useEffect, useState } from "react";
import "./BookGrid.css";

import BookCircle from "./BookCircle";
import { getBooks } from "../services/booksService";

/* =========================================================
   KNIHY – veřejný katalog z backendu
   Backend vrací pouze položky, ke kterým má aktuální návštěvník
   přístup. Skryté knihy proto nesmí být vykresleny ani v katalogu.
========================================================= */

import nezacalo from "../assets/images/nezacalo-to.png";
import vespera from "../assets/images/Vespera/vespera.webp";
import aeil from "../assets/images/AEIL/aeil.png";

/* =========================================================
   HLAVNÍ TEXTOVÉ RÁMEČKY
========================================================= */

import sageFrame from "../assets/frames/frame-sage.png";
import silverFrame from "../assets/frames/frame-ochre.png";
import redFrame from "../assets/frames/frame-red.png";

/* =========================================================
   2. VRSTVA - JEMNÝ AKVAREL
========================================================= */

import sageWatercolor from "../assets/overlays/sage-watercolor.png";
import silverWatercolor from "../assets/overlays/silver-watercolor.png";
import redWatercolor from "../assets/overlays/red-watercolor.png";

/* =========================================================
   3. VRSTVA - SILNĚJŠÍ AKVAREL
========================================================= */

import sageSplatter from "../assets/overlays/sage-splatter.png";
import silverSplatter from "../assets/overlays/silver-splatter.png";
import redSplatter from "../assets/overlays/red-splatter.png";

const BOOK_CARDS = [
  {
    id: 1,
    title: "(Ne)začalo to...",
    hoverTitle: "Kluci, city a absolutní nedostatek zdravého rozumu.",
    image: nezacalo,
    frame: sageFrame,
    watercolor: sageWatercolor,
    splatter: sageSplatter,
    link: "/books/nezacalo-series",
  },
  {
    id: 3,
    title: "Vespera",
    hoverTitle: "Genetická apokalypsa. Nadpřirozené schopnosti. Běžná sobota.",
    image: vespera,
    frame: silverFrame,
    watercolor: silverWatercolor,
    splatter: silverSplatter,
    link: "/books/vespera",
  },
  {
    id: 2,
    title: "AEIL",
    hoverTitle: "Magie existuje. Bohužel s ní přišly i následky.",
    image: aeil,
    frame: redFrame,
    watercolor: redWatercolor,
    splatter: redSplatter,
    link: "/books/aeil",
  },
];

function BookGrid() {
  const [visibleBookIds, setVisibleBookIds] = useState(null);

  useEffect(() => {
    let active = true;

    getBooks()
      .then((books) => {
        if (!active) return;
        const ids = new Set(
          (Array.isArray(books) ? books : [])
            .map((book) => Number(book.id))
            .filter(Number.isFinite)
        );
        setVisibleBookIds(ids);
      })
      .catch((error) => {
        // Fail closed: pokud katalog nelze ověřit, nezobrazujeme
        // natvrdo zadané karty, které mohou být skryté.
        console.error("Nepodařilo se ověřit veřejně dostupné knihy.", error);
        if (active) setVisibleBookIds(new Set());
      });

    return () => {
      active = false;
    };
  }, []);

  if (visibleBookIds === null) {
    return null;
  }

  const visibleBooks = BOOK_CARDS.filter((book) =>
    visibleBookIds.has(book.id)
  );

  if (visibleBooks.length === 0) {
    return null;
  }

  return (
    <section className="book-grid">
      {visibleBooks.map((book) => (
        <BookCircle
          key={book.id}
          title={book.title}
          hoverTitle={book.hoverTitle}
          image={book.image}
          frame={book.frame}
          watercolor={book.watercolor}
          splatter={book.splatter}
          link={book.link}
        />
      ))}
    </section>
  );
}

export default BookGrid;
