import "./LibraryLogo.css";

import logo from "../assets/images/library-logo.png";

function LibraryLogo(){

    return(

        <img
            src={logo}
            alt=""
            className="library-logo"
        />

    );

}

export default LibraryLogo;