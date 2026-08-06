import "./ConstellationStars.css";
import star from "../assets/images/star.png";

const stars = [
  { left: "15%", top: "12%", size: 22, delay: "0s" },
  { left: "30%", top: "22%", size: 18, delay: "2s" },
  { left: "52%", top: "18%", size: 28, delay: "4s" },
  { left: "73%", top: "15%", size: 22, delay: "1s" },
  { left: "86%", top: "32%", size: 18, delay: "5s" },

  { left: "20%", top: "58%", size: 18, delay: "3s" },
  { left: "46%", top: "74%", size: 22, delay: "7s" },
  { left: "78%", top: "66%", size: 24, delay: "2.5s" }
];

export default function ConstellationStars() {

  return (

    <div className="constellation-stars">

      {stars.map((starData, index) => (

        <img
          key={index}
          src={star}
          alt=""
          className="constellation-star"
          style={{
            left: starData.left,
            top: starData.top,
            width: `${starData.size}px`,
            animationDelay: starData.delay
          }}
        />

      ))}

    </div>

  );

}