import { useEffect } from "react";

function WatercolorMask() {

    useEffect(() => {

        const turbulence =
            document.getElementById("turbulence");

        const displacement =
            document.getElementById("displacement");

        let value = 0;
        let direction = 1;

        const animate = () => {

            value += direction * 0.003;

            if (value > 0.018)
                direction = -1;

            if (value < 0.010)
                direction = 1;

            turbulence.setAttribute(
                "baseFrequency",
                value
            );

            requestAnimationFrame(animate);

        };

        animate();

        let strength = 0;

        const hover = () => {

            strength += (28 - strength) * .08;

            displacement.setAttribute(
                "scale",
                strength
            );

            requestAnimationFrame(hover);

        };

        hover();

    }, []);

    return (

        <svg
            width="0"
            height="0"
            style={{
                position:"absolute"
            }}
        >

            <defs>

                <filter
                    id="watercolorFilter"
                    x="-60%"
                    y="-60%"
                    width="220%"
                    height="220%"
                >

                    <feTurbulence
                        id="turbulence"
                        type="fractalNoise"
                        baseFrequency="0.010"
                        numOctaves="3"
                        seed="5"
                        result="noise"
                    />

                    <feDisplacementMap
                        id="displacement"
                        in="SourceGraphic"
                        in2="noise"
                        scale="0"
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />

                </filter>

            </defs>

        </svg>

    );

}

export default WatercolorMask;