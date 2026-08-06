import "./ConstellationDots.css";

const dots = [

  // levé horní křídlo
  { left:"28%", top:"32%", wing:"lt" },
  { left:"38%", top:"27%", wing:"lt" },

  // pravé horní
  { left:"62%", top:"27%", wing:"rt" },
  { left:"72%", top:"32%", wing:"rt" },

  // tělo
  { left:"50%", top:"43%", wing:"body" },
  { left:"50%", top:"55%", wing:"body" },

  // levé spodní
  { left:"34%", top:"67%", wing:"lb" },

  // pravé spodní
  { left:"66%", top:"67%", wing:"rb" },

  // ocas
  { left:"50%", top:"76%", wing:"body" }

];

export default function ConstellationDots({ hoveredWing }) {

  return (

    <div className="constellation-dots">

      {dots.map((dot, i)=>(

        <span
          key={i}
          className={
            `constellation-dot ${
              hoveredWing===dot.wing ? "active" : ""
            }`
          }
          style={{
            left:dot.left,
            top:dot.top
          }}
        />

      ))}

    </div>

  );

}