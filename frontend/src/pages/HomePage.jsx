import "./HomePage.css";

import { useState } from "react";

import background from "../assets/images/background-gradient.png";

import Logo from "../components/Logo";
import Stars from "../components/Stars";
import Clouds from "../components/Clouds";
import Dragonfly from "../components/Dragonfly";
import PanelGrid from "../components/PanelGrid";
import ShootingStar from "../components/ShootingStar";

function HomePage() {

    const [hoveredWing, setHoveredWing] = useState(null);

    return (

        <main className="home">

            <img
                src={background}
                alt=""
                className="background"
            />

            <Stars />

            <ShootingStar />

            <Dragonfly hoveredWing={hoveredWing} />

            <Clouds />

            <PanelGrid
                hoveredWing={hoveredWing}
                setHoveredWing={setHoveredWing}
            />

            <Logo />

        </main>

    );

}

export default HomePage;