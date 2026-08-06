import "./BookCircle.css";
import { Link } from "react-router-dom";

function BookCircle({
    title,
    image,
    frame,
    watercolor,
    splatter,
    link
}) {

    return (

        <Link to={link} className="book-link">

            <article className="book-circle">

                {/* 3. vrstva */}
                <img
                    src={splatter}
                    className="book-splatter splatter-a"
                    alt=""
                />

                {/* 2. vrstva */}
                <img
                    src={watercolor}
                    className="book-watercolor"
                    alt=""
                />

                {/* Barevný obrázek */}
                <img
                    src={image}
                    className="book-image book-image-color"
                    alt={title}
                />

                {/* Vybledlá kopie */}
                <img
                    src={image}
                    className="book-image book-image-faded"
                    alt=""
                    aria-hidden="true"
                />

                {/* Rámeček */}
                <img
                    src={frame}
                    className="book-frame"
                    alt=""
                />

                <h2 className="book-title">
                    {title}
                </h2>

            </article>

        </Link>

    );

}

export default BookCircle;