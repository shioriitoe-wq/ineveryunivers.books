import dragonfly from "../assets/images/dragonfly.png";
import ConstellationDots from "./ConstellationDots";

function Dragonfly({ hoveredWing }) {
  return (
    <div className="dragonfly-wrapper">

      <ConstellationDots hoveredWing={hoveredWing} />

      <img
        src={dragonfly}
        alt=""
        className="dragonfly"
      />

    </div>
  );
}

export default Dragonfly;