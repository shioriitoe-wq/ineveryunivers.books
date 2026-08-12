import "./BookCircle.css";
import { Link } from "react-router-dom";

function BookCircle({
  title,
  hoverTitle,
  image,
  frame,
  watercolor,
  splatter,
  link
}) {

  return (

    <Link to={link} className="book-link">

      <article className="book-circle">

        {/* =========================================
            3. VRSTVA – CÁKANEC
            ========================================= */}

        <img
          src={splatter}
          className="book-splatter splatter-a"
          alt=""
        />


        {/* =========================================
            2. VRSTVA – AKVAREL
            ========================================= */}

        <img
          src={watercolor}
          className="book-watercolor"
          alt=""
        />


        {/* =========================================
            OBRÁZEK KNIHY – BAREVNÝ
            ========================================= */}

        <img
          src={image}
          className="book-image book-image-color"
          alt={title}
        />


        {/* =========================================
            OBRÁZEK KNIHY – VYBLEDLÁ KOPIE
            ========================================= */}

        <img
          src={image}
          className="book-image book-image-faded"
          alt=""
          aria-hidden="true"
        />


        {/* =========================================
            RÁMEČEK
            ========================================= */}

        <img
          src={frame}
          className="book-frame"
          alt=""
        />


        {/* =========================================
            TEXT
            ========================================= */}

        <h2 className="book-title">

          {/* TEXT NORMÁLNĚ */}

          <span className="book-title-normal">
            {title}
          </span>


          {/* TEXT PO NAJETÍ */}

          <span className="book-title-hover">
            {hoverTitle || "Máš odvahu?"}
          </span>

        </h2>


      </article>

    </Link>

  );
}

export default BookCircle;