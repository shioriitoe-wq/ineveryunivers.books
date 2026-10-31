import './adminAuthFetch.js'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { MusicPlayerProvider } from './context/MusicPlayerContext.jsx'
import GlobalMusicPlayer from './components/GlobalMusicPlayer.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <MusicPlayerProvider>
        <App />
        <GlobalMusicPlayer />
      </MusicPlayerProvider>
    </BrowserRouter>
  </StrictMode>,
)
