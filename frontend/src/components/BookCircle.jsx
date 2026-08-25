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

        {/* CÁKANEC */}
        <img
          src={splatter}
          className="book-splatter splatter-a"
          alt=""
        />

        {/* AKVAREL */}
        <img
          src={watercolor}
          className="book-watercolor"
          alt=""
        />

        {/* OBRÁZEK */}
        <img
          src={image}
          className="book-image book-image-color"
          alt={title}
        />

        {/* VYBLEDLÁ KOPIE */}
        <img
          src={image}
          className="book-image book-image-faded"
          alt=""
          aria-hidden="true"
        />

        {/* RÁMEČEK */}
        <img
          src={frame}
          className="book-frame"
          alt=""
        />

        {/* TEXT */}
        <h2 className="book-title">

          <span className="book-title-normal">
            {title}
          </span>

          <span className="book-title-hover">
            {hoverTitle}
          </span>

        </h2>

      </article>

    </Link>
  );
}

export default BookCircle;