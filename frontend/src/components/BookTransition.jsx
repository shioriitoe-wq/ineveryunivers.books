import { motion, AnimatePresence } from "framer-motion";

import "./BookTransition.css";

function BookTransition({

    children,

    isOpen

}) {

    return (

        <AnimatePresence>

            <motion.div

                className="book-transition"

                animate={

                    isOpen

                        ? {

                            rotateY: -92,

                            x: -160,

                            scale: .985

                        }

                        : {

                            rotateY: 0,

                            x: 0,

                            scale: 1

                        }

                }

                transition={{

                    duration:1.2,

                    ease:[0.22,0.61,0.36,1]

                }}

            >

                <div className="book-shadow"></div>

                <div className="book-highlight"></div>

                {children}

            </motion.div>

        </AnimatePresence>

    );

}

export default BookTransition;