import { Link } from "react-router-dom";

import "./HomePanel.css";

function HomePanel({

    image,
    title,
    link,
    wing,
    setHoveredWing

}) {

    return (

        <Link

            to={link}

            className="home-panel"

            viewTransition

            onMouseEnter={() => setHoveredWing(wing)}
            onMouseLeave={() => setHoveredWing(null)}

        >

            <img

                src={image}
                alt={title}

                className="home-panel-image"

            />

        </Link>

    );

}

export default HomePanel;