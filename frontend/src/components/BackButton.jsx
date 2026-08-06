import { useNavigate } from "react-router-dom";

import ArrowLeft from "./icons/ArrowLeft";

import "./BackButton.css";

function BackButton({

    to = -1,

    color = "#8b6235",

    hoverColor = "#b07a43"

}) {

    const navigate = useNavigate();

    return (

        <button

            className="back-button"

            style={{

                "--back-color": color,

                "--back-hover": hoverColor

            }}

            onClick={() => navigate(to)}

        >

            <ArrowLeft className="back-arrow" />

            <span className="back-text">

                Zpět

            </span>

        </button>

    );

}

export default BackButton;