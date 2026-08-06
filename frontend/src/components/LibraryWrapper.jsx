import "./LibraryWrapper.css";

function LibraryWrapper({ children }) {

  return (

    <div className="library-wrapper">

      {children}

    </div>

  );

}

export default LibraryWrapper;