import HomePanel from "./HomePanel";

import books from "../assets/images/books.png";
import videos from "../assets/images/videos.png";
import soundtrack from "../assets/images/soundtrack.png";
import community from "../assets/images/community.png";

function PanelGrid({

    hoveredWing,

    setHoveredWing,


}) {

    return (

        <section className="panel-grid">

            <HomePanel
                image={books}
                title="KNIHY"
                link="/books"
                wing="lt"
                hoveredWing={hoveredWing}
                setHoveredWing={setHoveredWing}
            />

            <HomePanel
                image={videos}
                title="VIDEA"
                link="/videos"
                wing="rt"
                hoveredWing={hoveredWing}
                setHoveredWing={setHoveredWing}
            />

            <HomePanel
                image={soundtrack}
                title="SOUNDTRACK"
                link="/soundtracks"
                wing="lb"
                hoveredWing={hoveredWing}
                setHoveredWing={setHoveredWing}
            />

            <HomePanel
                image={community}
                title="KOMUNITA"
                link="/community"
                wing="rb"
                hoveredWing={hoveredWing}
                setHoveredWing={setHoveredWing}
            />

        </section>

    );

}

export default PanelGrid;