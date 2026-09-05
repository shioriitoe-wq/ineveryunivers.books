import "./BooksPage.css";

import background from "../assets/images/Nezacalo-to/paper-background.png";

import windowShadow from "../assets/overlays/window-shadow.png";
import watercolorCorners from "../assets/overlays/watercolor-corners.png";
import watercolorCornersBack from "../assets/overlays/watercolor-corners-back.png";
import dustTexture from "../assets/overlays/window-dust.png";

import LibraryLogo from "../components/LibraryLogo";
import BookGrid from "../components/BookGrid";
import GoldenDust from "../components/GoldenDust";
import GoldenGlow from "../components/GoldenGlow";
import BackButton from "../components/BackButton";

function BooksPage() {

    return (

        <main className="books-page">

            {/* Background */}

            <img
                src={background}
                alt=""
                className="paper-background"
            />

            {/* Back watercolor */}

            <img
                src={watercolorCornersBack}
                alt=""
                className="watercolor-corners-back"
            />

            {/* Front watercolor */}

            <img
                src={watercolorCorners}
                alt=""
                className="watercolor-corners"
            />

            {/* Window shadow */}

            <img
                src={windowShadow}
                alt=""
                className="window-shadow shadow-back"
            />

            <img
                src={windowShadow}
                alt=""
                className="window-shadow shadow-front"
            />

            {/* Dust texture */}

            <img
                src={dustTexture}
                alt=""
                className="window-dust"
            />

            {/* Animated particles */}

            <GoldenDust />

            <GoldenGlow />

            {/* Soft vignette */}

            <div className="page-vignette"></div>

            {/* Content */}
            <BackButton
                to="/"
                color="#d9c39b"
                hoverColor="#f0e4cf"
            />
            <LibraryLogo />

            <BookGrid />

        </main>

    );

}

export default BooksPage;
