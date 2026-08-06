import "./GoldenGlow.css";

function GoldenGlow(){

    const sparks = Array.from({length:22},(_,i)=>{

        let x;
        let y;

        const zone=Math.random();

        if(zone<0.55){

            // levý horní roh

            x=3+Math.random()*28;
            y=2+Math.random()*24;

        }
        else{

            // pravý horní roh

            x=72+Math.random()*24;
            y=2+Math.random()*22;

        }

        return{

            id:i,

            x,

            y,

            size:.8+Math.random()*2.2,

            delay:-Math.random()*20,

            duration:16+Math.random()*22,

            rotate:Math.random()*180

        };

    });

    return(

        <div className="golden-glow">

            {sparks.map(s=>(

                <span

                    key={s.id}

                    className="spark"

                    style={{

                        "--x":`${s.x}vw`,
                        "--y":`${s.y}vh`,
                        "--size":`${s.size}px`,
                        "--delay":`${s.delay}s`,
                        "--duration":`${s.duration}s`,
                        "--rotate":`${s.rotate}deg`

                    }}

                />

            ))}

        </div>

    );

}

export default GoldenGlow;