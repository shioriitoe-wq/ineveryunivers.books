import { motion } from "framer-motion";
import "./PageTurn.css";

function PageTurn({

    children,

    isTurning = false

}) {

    return (

        <motion.div

            className={`page-turn ${isTurning ? "turning" : ""}`}

            animate={
                isTurning
                    ? {
                        rotateY: -82,
                        rotateX: 2,
                        x: -140,
                        scale: 0.985,
                        opacity: 0.7
                    }
                    : {
                        rotateY: 0,
                        rotateX: 0,
                        x: 0,
                        scale: 1,
                        opacity: 1
                    }
            }

            transition={{
                duration: 1.15,
                ease: [0.22, 0.61, 0.36, 1]
            }}

        >

            <div className="page-shadow"></div>

            <div className="page-highlight"></div>

            {children}

        </motion.div>

    );

}

export default PageTurn;