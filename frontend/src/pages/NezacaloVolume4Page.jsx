import { Link } from "react-router-dom";

import "./NezacaloVolume4Page.css";


export default function NezacaloVolume4Page() {

    return (

        <main className="nezacalo-volume-4-page">

            <header>

                <Link to="/books/nezacalo-series">
                    ← (Ne)začalo to..
                </Link>

            </header>


            <section>

                <span>
                    DÍL 4
                </span>

                <h1>
                    (Ne)začalo to tady
                </h1>


                <div>

                    <Link to="/books/nezacalo/volume/4/characters">
                        POSTAVY
                    </Link>

                </div>

            </section>

        </main>

    );

}