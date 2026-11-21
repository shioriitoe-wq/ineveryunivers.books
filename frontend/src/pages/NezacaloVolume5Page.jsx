import { Link } from "react-router-dom";

import BookAccessGate from "../components/BookAccessGate";
import "./NezacaloVolume5Page.css";


function NezacaloVolume5PageContent() {

    return (

        <main className="nezacalo-volume-5-page">

            <header>

                <Link to="/books/nezacalo-series">
                    ← (Ne)začalo to..
                </Link>

            </header>


            <section>

                <span>
                    DÍL 5
                </span>

                <h1>
                    (Ne)začalo to naším příběhem
                </h1>


                <div>

                    <Link to="/books/nezacalo/volume/5/characters">
                        POSTAVY
                    </Link>

                </div>

            </section>

        </main>

    );

}

export default function NezacaloVolume5Page() {
    return (
        <BookAccessGate bookId={1} volumeId={5}>
            <NezacaloVolume5PageContent />
        </BookAccessGate>
    );
}
