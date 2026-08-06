import "./Stars.css";

const stars = [];

for(let i=0;i<180;i++){

    stars.push({

        id:i,

        type:
            i<150
            ? "small"
            : i<174
            ? "medium"
            : "big",

        left:Math.random()*100,
        top:Math.random()*100,

        size:
            i<150
            ? Math.random()*.6+.4
            : i<174
            ? Math.random()*1+.9
            : Math.random()*1.5+1.5,

        delay:Math.random()*20,

        duration:
            i<150
            ? 10+Math.random()*6
            : i<174
            ? 6+Math.random()*5
            : 3+Math.random()*3

    });

}

export default function Stars(){

    return(

        <div className="stars">

            {stars.map(star=>(

                <span

                    key={star.id}

                    className={`star ${star.type}`}

                    style={{

                        left:`${star.left}%`,
                        top:`${star.top}%`,

                        width:`${star.size}px`,
                        height:`${star.size}px`,

                        animationDelay:`${star.delay}s`,
                        animationDuration:`${star.duration}s`

                    }}

                />

            ))}

        </div>

    );

}