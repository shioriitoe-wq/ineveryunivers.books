import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import BooksPage from "./pages/BooksPage";
import ProjectPage from "./pages/ProjectPage";
import CommunityPage from "./pages/CommunityPage";

import AEILPage from "./pages/AEILPage";
import VesperaPage from "./pages/VesperaPage";
import NezacaloPage from "./pages/NezacaloPage";
import BooksSeriesPage from "./pages/BooksSeriesPage";

import "./App.css";

function App() {
  return (
    <Routes>

      <Route path="/" element={<HomePage />} />

      <Route path="/books" element={<BooksPage />} />

      <Route path="/books/aeil" element={<AEILPage />} />

      <Route path="/books/vespera" element={<VesperaPage />} />

      <Route path="/books/nezacalo" element={<NezacaloPage />} />

      <Route path="/books/series" element={<BooksSeriesPage />} />

      <Route path="/project/:id" element={<ProjectPage />} />

      <Route path="/videos" element={<h1>Videa</h1>} />

      <Route path="/soundtracks" element={<h1>Soundtracky</h1>} />

      <Route path="/community" element={<CommunityPage />} />

    </Routes>
  );
}

export default App;