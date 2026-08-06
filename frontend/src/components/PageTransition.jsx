import { motion } from "framer-motion";

function PageTransition({ children }) {

    return (

        <motion.div

            initial={{

                rotateY: -80,

                opacity: 0,

                transformOrigin: "left center"

            }}

            animate={{

                rotateY: 0,

                opacity: 1

            }}

            exit={{

                rotateY: 80,

                opacity: 0,

                transformOrigin: "left center"

            }}

            transition={{

                duration: 0.8,

                ease: [0.22, 1, 0.36, 1]

            }}

            style={{

                width: "100%",

                height: "100%",

                transformStyle: "preserve-3d"

            }}

        >

            {children}

        </motion.div>

    );

}

export default PageTransition;