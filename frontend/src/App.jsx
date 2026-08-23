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

import CharactersPage from "./pages/CharactersPage";
import CharacterPage from "./pages/CharacterPage";
import CharacterGalleryPage from "./pages/CharacterGalleryPage";
import NezacaloVolume2Page from "./pages/NezacaloVolume2Page";
import NezacaloVolume3Page from "./pages/NezacaloVolume3Page";
import NezacaloVolume4Page from "./pages/NezacaloVolume4Page";
import NezacaloVolume5Page from "./pages/NezacaloVolume5Page";

import "./App.css";


function App() {

  return (

    <Routes>

      <Route
        path="/"
        element={<HomePage />}
      />

      <Route
        path="/admin"
        element={<AdminPage />}
      />

      <Route
        path="/books"
        element={<BooksPage />}
      />

      <Route
        path="/books/aeil"
        element={<AEILPage />}
      />

      <Route
        path="/books/vespera"
        element={<VesperaPage />}
      />

      <Route
        path="/books/nezacalo"
        element={<NezacaloToLetemPage />}
      />
      <Route
  path="/books/nezacalo/volume/2"
  element={<NezacaloVolume2Page />}
/>

<Route
  path="/books/nezacalo/volume/3"
  element={<NezacaloVolume3Page />}
/>

<Route
  path="/books/nezacalo/volume/4"
  element={<NezacaloVolume4Page />}
/>

<Route
  path="/books/nezacalo/volume/5"
  element={<NezacaloVolume5Page />}
/>

      <Route
        path="/books/nezacalo-series"
        element={<BooksSeriesPage />}
      />

      <Route
        path="/books/nezacalo/chapters"
        element={<ChaptersPage />}
      />

      <Route
        path="/books/nezacalo/chapters/:chapterId"
        element={<ChapterPageNezacaloletem />}
      />

      <Route
        path="/project/:id"
        element={<ProjectPage />}
      />


      {/* =================================================
          POSTAVY DÍLU
      ================================================= */}

      <Route
        path="/project/:bookId/volume/:volumeId/characters"
        element={<CharactersPage />}
      />


      {/* =================================================
          DETAIL POSTAVY
      ================================================= */}

      <Route
        path="/project/:bookId/characters/:characterId"
        element={<CharacterPage />}
      />


      <Route
        path="/project/:bookId/characters/:characterId/gallery"
        element={<CharacterGalleryPage />}
      />


      <Route
        path="/videos"
        element={<h1>Videa</h1>}
      />

      <Route
        path="/soundtracks"
        element={<h1>Soundtracky</h1>}
      />

      <Route
        path="/community"
        element={<CommunityPage />}
      />

    </Routes>

  );

}


export default App;