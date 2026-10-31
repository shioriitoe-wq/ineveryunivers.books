import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import BooksPage from "./pages/BooksPage";
import ProjectPage from "./pages/ProjectPage";
import CommunityPage from "./pages/CommunityPage";

/* =================================================
   AEIL
================================================= */

import AEILPage from "./pages/AEILPage";
import AEILcharactersPage from "./pages/AEILcharactersPage";
import AEILChaptersPage from "./pages/AEILChaptersPage";
import AEILChapterPage from "./pages/AEILChapterPage";
import AEILMap from "./pages/AEILMap";
import AEILRacesPage from "./pages/AEILRacesPage";
import AEILWord from "./pages/AEILWord";

/* =================================================
   VESPERA
================================================= */

import VesperaPage from "./pages/VesperaPage";
import VesperaDocuments from "./pages/VesperaDocuments";
import VesperaMap from "./pages/VesperaMap";
import VesperaDictionary from "./pages/VesperaDictionary";
import VesperaCharactersPage from "./pages/VesperaCharactersPage";
import VesperaCharacterPage from "./pages/VesperaCharacterPage";
import VesperaCharacterGalleryPage from "./pages/VesperaCharacterGalleryPage";
/* =================================================
   (NE)ZAČALO TO...
================================================= */

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

/* =================================================
   VIDEA / SOUNDTRACKY
================================================= */

import VideosPage from "./pages/VideosPage";
import VideoLibraryAdminPage from "./pages/VideoLibraryAdminPage";
import SoundtracksPage from "./pages/SoundtracksPage";

import "./App.css";


function App() {
  return (
    <Routes>

      {/* =================================================
          DOMŮ
      ================================================= */}

      <Route
        path="/"
        element={<HomePage />}
      />


      {/* =================================================
          ADMIN
      ================================================= */}

      <Route
        path="/admin"
        element={<AdminPage />}
      />
      <Route
        path="/admin/videos"
        element={<VideoLibraryAdminPage />}
      />


      {/* =================================================
          KNIHY
      ================================================= */}

      <Route
        path="/books"
        element={<BooksPage />}
      />


      {/* =================================================
          AEIL
      ================================================= */}

      <Route
        path="/books/aeil"
        element={<AEILPage />}
      />


      {/* =================================================
          AEIL – POSTAVY
      ================================================= */}

      <Route
        path="/books/aeil/characters"
        element={<AEILcharactersPage />}
      />


      {/* =================================================
          AEIL – KAPITOLY
      ================================================= */}

      <Route
        path="/books/aeil/chapters"
        element={<AEILChaptersPage />}
      />

      <Route
        path="/books/aeil/chapters/:chapterId"
        element={<AEILChapterPage />}
      />


      {/* =================================================
          AEIL – MAPA
      ================================================= */}

      <Route
        path="/books/aeil/map"
        element={<AEILMap />}
      />


      {/* =================================================
          AEIL – RASY
      ================================================= */}

      <Route
        path="/books/aeil/races"
        element={<AEILRacesPage />}
      />


      {/* =================================================
          AEIL – SLOVNÍK
      ================================================= */}

      <Route
        path="/books/aeil/word"
        element={<AEILWord />}
      />


      {/* =================================================
          VESPERA
      ================================================= */}

      <Route
        path="/books/vespera"
        element={<VesperaPage />}
      />

<Route
  path="/books/vespera/characters/:id"
  element={<VesperaCharacterPage />}
/>
<Route
  path="/books/vespera/characters/:id/gallery"
  element={<VesperaCharacterGalleryPage />}
/>

      {/* =================================================
          VESPERA – POSTAVY
      ================================================= */}

      <Route
        path="/books/vespera/characters"
        element={<VesperaCharactersPage />}
      />


      {/* =================================================
          VESPERA – DOKUMENTY
      ================================================= */}

      <Route
        path="/books/vespera/documents"
        element={<VesperaDocuments />}
      />


      {/* =================================================
          VESPERA – MAPA
      ================================================= */}

      <Route
        path="/books/vespera/map"
        element={<VesperaMap />}
      />


      {/* =================================================
          VESPERA – SLOVNÍK
      ================================================= */}

      <Route
        path="/books/vespera/word"
        element={<VesperaDictionary />}
      />


      {/* =================================================
          (NE)ZAČALO TO..
      ================================================= */}

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


      {/* =================================================
          PROJEKT
      ================================================= */}

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


      {/* =================================================
          GALERIE POSTAVY
      ================================================= */}

      <Route
        path="/project/:bookId/characters/:characterId/gallery"
        element={<CharacterGalleryPage />}
      />


      {/* =================================================
          VIDEA
      ================================================= */}

      <Route
        path="/videos"
        element={<VideosPage />}
      />


      {/* =================================================
          SOUNDTRACKY
      ================================================= */}

            <Route
        path="/soundtracks"
        element={<SoundtracksPage />}
      />
<Route
  path="/soundtracks/*"
  element={<SoundtracksPage />}
/>
      <Route
        path="/soundtracks/all"
        element={<SoundtracksPage />}
      />

      <Route
        path="/soundtracks/books"
        element={<SoundtracksPage />}
      />

      <Route
        path="/soundtracks/surprise"
        element={<SoundtracksPage />}
      />

      <Route
        path="/soundtracks/track/:slug"
        element={<SoundtracksPage />}
      />


      {/* =================================================
          COMMUNITY
      ================================================= */}

      <Route
        path="/community"
        element={<CommunityPage />}
      />

    </Routes>
  );
}


export default App;
