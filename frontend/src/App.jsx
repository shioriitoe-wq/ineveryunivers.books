import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import BooksPage from "./pages/BooksPage";
import ProjectPage from "./pages/ProjectPage";
import CommunityPage from "./pages/CommunityPage";

import AEILPage from "./pages/AEILPage";
import VesperaPage from "./pages/VesperaPage";
import NezacaloToLetemPage from "./pages/nezacalo-to-letem-page";
import BooksSeriesPage from "./pages/BooksSeriesPage";
import ChaptersPage from "./pages/ChaptersPage";
import ChapterPageNezacaloletem from "./pages/ChapterPageNezacaloletem";

import "./App.css";

function App() {
  return (
    <Routes>

      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/books" element={<BooksPage />} />

      <Route path="/books/aeil" element={<AEILPage />} />

      <Route path="/books/vespera" element={<VesperaPage />} />

      <Route path="/books/nezacalo" element={<NezacaloToLetemPage />} />

      <Route path="/books/nezacalo-series" element={<BooksSeriesPage />} />
      <Route path="/books/nezacalo/chapters" element={<ChaptersPage />} />
      <Route path="/books/nezacalo/chapters/:chapterId" element={<ChapterPageNezacaloletem />} />
      <Route path="/project/:id" element={<ProjectPage />} />

      <Route path="/videos" element={<h1>Videa</h1>} />

      <Route path="/soundtracks" element={<h1>Soundtracky</h1>} />

      <Route path="/community" element={<CommunityPage />} />

    </Routes>
  );
}

export default App;
