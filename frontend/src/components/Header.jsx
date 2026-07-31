import { Link } from "react-router-dom";

function Header() {
  return (
    <header>
      <h1>ineveryunivers.books</h1>

      <nav>
        <Link to="/">Domů</Link>
        {" | "}
        <Link to="/books">Knihy</Link>
      </nav>

      <hr />
    </header>
  );
}

export default Header;