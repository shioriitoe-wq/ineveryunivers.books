
import { Routes, Route } from "react-router-dom";
import AccountDragonfly from "./components/AccountDragonfly";

import HomePage from "./pages/HomePage";
import AdminPage from "./pages/AdminPage";
import AccountPage from "./pages/AccountPage";
import BooksPage from "./pages/BooksPage";
import ProjectPage from "./pages/ProjectPage";
import CommunityPage from "./pages/CommunityPage";
import UsersAdminPage from "./pages/UsersAdminPage";

/* AEIL */
import AEILPage from "./pages/AEILPage";
import AEILcharactersPage from "./pages/AEILcharactersPage";
import AEILChaptersPage from "./pages/AEILChaptersPage";
import AEILChapterPage from "./pages/AEILChapterPage";
import AEILMap from "./pages/AEILMap";
import AEILRacesPage from "./pages/AEILRacesPage";
import AEILWord from "./pages/AEILWord";

/* VESPERA */
import VesperaPage from "./pages/VesperaPage";
import VesperaDocuments from "./pages/VesperaDocuments";
import VesperaMap from "./pages/VesperaMap";
import VesperaDictionary from "./pages/VesperaDictionary";
import VesperaCharactersPage from "./pages/VesperaCharactersPage";
import VesperaCharacterPage from "./pages/VesperaCharacterPage";
import VesperaCharacterGalleryPage from "./pages/VesperaCharacterGalleryPage";

/* (NE)ZAČALO TO... */
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

/* VIDEA / SOUNDTRACKY */
import VideosPage from "./pages/VideosPage";
import VideoLibraryAdminPage from "./pages/VideoLibraryAdminPage";
import SoundtracksPage from "./pages/SoundtracksPage";

import "./App.css";

function App() {
  return (
    <>
      <Routes>
        {/* DOMŮ */}
        <Route path="/" element={<HomePage />} />

        {/* ADMIN */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/admin/videos" element={<VideoLibraryAdminPage />} />
        <Route path="/admin/users" element={<UsersAdminPage />} />

        {/* KNIHY */}
        <Route path="/books" element={<BooksPage />} />

        {/* AEIL */}
        <Route path="/books/aeil" element={<AEILPage />} />
        <Route path="/books/aeil/characters" element={<AEILcharactersPage />} />
        <Route path="/books/aeil/chapters" element={<AEILChaptersPage />} />
        <Route path="/books/aeil/chapters/:chapterId" element={<AEILChapterPage />} />
        <Route path="/books/aeil/map" element={<AEILMap />} />
        <Route path="/books/aeil/races" element={<AEILRacesPage />} />
        <Route path="/books/aeil/word" element={<AEILWord />} />

        {/* VESPERA */}
        <Route path="/books/vespera" element={<VesperaPage />} />
        <Route path="/books/vespera/characters/:id" element={<VesperaCharacterPage />} />
        <Route path="/books/vespera/characters/:id/gallery" element={<VesperaCharacterGalleryPage />} />
        <Route path="/books/vespera/characters" element={<VesperaCharactersPage />} />
        <Route path="/books/vespera/documents" element={<VesperaDocuments />} />
        <Route path="/books/vespera/map" element={<VesperaMap />} />
        <Route path="/books/vespera/word" element={<VesperaDictionary />} />

        {/* (NE)ZAČALO TO... */}
        <Route path="/books/nezacalo" element={<NezacaloToLetemPage />} />
        <Route path="/books/nezacalo/volume/2" element={<NezacaloVolume2Page />} />
        <Route path="/books/nezacalo/volume/3" element={<NezacaloVolume3Page />} />
        <Route path="/books/nezacalo/volume/4" element={<NezacaloVolume4Page />} />
        <Route path="/books/nezacalo/volume/5" element={<NezacaloVolume5Page />} />
        <Route path="/books/nezacalo-series" element={<BooksSeriesPage />} />
        <Route path="/books/nezacalo/chapters" element={<ChaptersPage />} />
        <Route path="/books/nezacalo/chapters/:chapterId" element={<ChapterPageNezacaloletem />} />

        {/* PROJEKT A POSTAVY */}
        <Route path="/project/:id" element={<ProjectPage />} />
        <Route path="/project/:bookId/volume/:volumeId/characters" element={<CharactersPage />} />
        <Route path="/project/:bookId/characters/:characterId" element={<CharacterPage />} />
        <Route path="/project/:bookId/characters/:characterId/gallery" element={<CharacterGalleryPage />} />

        {/* VIDEA */}
        <Route path="/videos" element={<VideosPage />} />

        {/* SOUNDTRACKY */}
        <Route path="/soundtracks" element={<SoundtracksPage />} />
        <Route path="/soundtracks/*" element={<SoundtracksPage />} />
        <Route path="/soundtracks/all" element={<SoundtracksPage />} />
        <Route path="/soundtracks/books" element={<SoundtracksPage />} />
        <Route path="/soundtracks/surprise" element={<SoundtracksPage />} />
        <Route path="/soundtracks/track/:slug" element={<SoundtracksPage />} />

        {/* COMMUNITY */}
        <Route path="/community" element={<CommunityPage />} />
      </Routes>

      {/* Globální vstup do účtu – zobrazuje se na všech stránkách */}
      <AccountDragonfly />
    </>
  );
}

export default App;
