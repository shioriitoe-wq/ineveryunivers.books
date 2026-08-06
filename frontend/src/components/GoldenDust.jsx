import "./GoldenDust.css";

function random(min, max){

    return Math.random() * (max - min) + min;

}

function pickSize(){

    const r=Math.random();

    if(r<0.72){

        return random(.7,1.6);

    }

    if(r<0.93){

        return random(1.7,2.8);

    }

    return random(3,4.6);

}

function pickBlur(){

    const r=Math.random();

    if(r<0.35){

        return 0;

    }

    if(r<0.82){

        return random(.12,.35);

    }

    return random(.8,1.3);

}

function pickDuration(){

    const r=Math.random();

    if(r<.60){

        return random(90,180);

    }

    if(r<.92){

        return random(40,90);

    }

    return random(18,32);

}

function pickType(){

    const r=Math.random();

    if(r<.42){

        return 0;

    }

    if(r<.72){

        return 1;

    }

    if(r<.92){

        return 2;

    }

    return 3;

}

function createParticles(count,layer){

    return Array.from({length:count},(_,i)=>{

        let x;
        let y;

        // ============================
        // MAPA HUSTOTY
        // ============================

        const zone=Math.random();

        if(zone<.35){

            // levý horní roh

            x=random(2,28);
            y=random(2,26);

        }

        else if(zone<.50){

            // pravý horní roh

            x=random(72,98);
            y=random(2,24);

        }

        else if(zone<.82){

            // světelný kužel

            x=random(8,62);
            y=random(5,60);

        }

        else{

            // zbytek stránky

            x=random(3,97);
            y=random(3,97);

        }

        const lightZone=(x<62 && y<60);

        const cornerGlow=(y<28 && (x<30 || x>70));

        let color;

        const c=Math.random();
        if(cornerGlow){

            if(c<.45){

                color="#c9a96b";

            }
            else if(c<.82){

                color="#ead7a4";

            }
            else{

                color="#fff8e7";

            }

        }

        else if(lightZone){

            if(c<.48){

                color="#65594d";

            }
            else if(c<.78){

                color="#85715c";

            }
            else if(c<.94){

                color="#b79663";

            }
            else{

                color="#efe1bd";

            }

        }

        else{

            if(c<.15){

                color="#6b6055";

            }
            else if(c<.45){

                color="#b99767";

            }
            else if(c<.80){

                color="#dcc38f";

            }
            else{

                color="#faf4e0";

            }

        }

        return{

            id:`${layer}-${i}`,

            type:pickType(),

            x,
            y,

            size:pickSize(),

            blur:pickBlur(),

            duration:pickDuration(),

            delay:random(-180,0),

            opacity:random(.18,.62),

            driftX:random(-120,120),

            driftY:random(-180,-20),

            rotate:random(-180,180),

            color

        };

    });

}

function renderLayer(name,particles){

    return(

        <div className={`dust-layer ${name}`}>

            {particles.map(p=>(

                <span

                    key={p.id}

                    className={`dust dust-${name} dust-${p.type}`}

                    style={{

                        "--x":`${p.x}vw`,
                        "--y":`${p.y}vh`,

                        "--size":`${p.size}px`,

                        "--blur":`${p.blur}px`,

                        "--opacity":p.opacity,

                        "--duration":`${p.duration}s`,

                        "--delay":`${p.delay}s`,

                        "--driftX":`${p.driftX}px`,

                        "--driftY":`${p.driftY}px`,

                        "--rotate":`${p.rotate}deg`,

                        "--color":p.color

                    }}

                />

            ))}

        </div>

    );

}

function GoldenDust(){

    const micro=createParticles(220,"micro");

    const far=createParticles(120,"far");

    const mid=createParticles(80,"mid");

    const near=createParticles(35,"near");

    return(

        <>

            {renderLayer("micro",micro)}

            {renderLayer("far",far)}

            {renderLayer("mid",mid)}

            {renderLayer("near",near)}

        </>

    );

}

export default GoldenDust;        