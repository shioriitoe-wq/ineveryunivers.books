import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const MusicPlayerContext = createContext(null);

export function MusicPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState("off");
  const [playRequested, setPlayRequested] = useState(false);
  const [playError, setPlayError] = useState("");

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.audio_url) {
      setIsPlaying(false);
      return;
    }

    audio.pause();
    audio.load();
    setCurrentTime(0);
    setDuration(Number(currentTrack.duration_seconds) || 0);
    setPlayError("");

    if (playRequested) {
      const attempt = audio.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(false);
          setPlayError("Přehrávání se nepodařilo spustit. Zkus to prosím znovu tlačítkem Play.");
        });
      }
    } else {
      setIsPlaying(false);
    }
  // Track changes reset/load the media element. Play/pause controls below
  // operate directly on the same element so resuming never resets the track.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id, currentTrack?.audio_url]);

  const selectTrack = useCallback((track, tracks = []) => {
    if (!track) return;
    const nextQueue = tracks.length ? tracks : [track];
    const index = nextQueue.findIndex((item) => String(item.id) === String(track.id));
    setQueue(nextQueue);
    setQueueIndex(index >= 0 ? index : 0);
    setCurrentTrack(track);
    setPlayRequested(false);
    setPlayError("");
  }, []);

  const setPlaybackQueue = useCallback((tracks = [], selectedTrack = currentTrack) => {
    const nextQueue = tracks.length ? tracks : selectedTrack ? [selectedTrack] : [];
    const index = nextQueue.findIndex((item) => String(item.id) === String(selectedTrack?.id));
    setQueue(nextQueue);
    setQueueIndex(index >= 0 ? index : 0);
  }, [currentTrack]);

  const playTrack = useCallback((track, tracks = []) => {
    if (!track) return;
    const nextQueue = tracks.length ? tracks : [track];
    const index = nextQueue.findIndex((item) => String(item.id) === String(track.id));
    setQueue(nextQueue);
    setQueueIndex(index >= 0 ? index : 0);
    setCurrentTrack(track);
    setPlayRequested(Boolean(track.audio_url));
    setPlayError("");
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!currentTrack) return;
    if (!currentTrack.audio_url) {
      setPlayError("Tato skladba zatím nemá přiřazený audio soubor.");
      return;
    }
    if (audio?.paused) {
      setPlayRequested(true);
      const attempt = audio.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.then(() => setIsPlaying(true)).catch(() => {
          setIsPlaying(false);
          setPlayError("Přehrávání se nepodařilo spustit. Zkontroluj audio soubor.");
        });
      }
    } else if (audio) {
      audio.pause();
      setIsPlaying(false);
      setPlayRequested(false);
    }
  }, [currentTrack]);

  const seek = useCallback((time) => {
    if (audioRef.current && Number.isFinite(time)) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const playIndex = useCallback((requestedIndex) => {
    if (!queue.length) return;
    let nextIndex = requestedIndex;
    if (shuffle && queue.length > 1) {
      do { nextIndex = Math.floor(Math.random() * queue.length); }
      while (nextIndex === queueIndex);
    }
    if (nextIndex < 0) nextIndex = queue.length - 1;
    if (nextIndex >= queue.length) nextIndex = 0;
    const track = queue[nextIndex];
    setQueueIndex(nextIndex);
    setCurrentTrack(track);
    setPlayRequested(Boolean(track?.audio_url));
  }, [queue, queueIndex, shuffle]);

  const next = useCallback(() => {
    if (repeat === "one" && currentTrack && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      return;
    }
    if (queue.length) playIndex(queueIndex + 1);
  }, [currentTrack, playIndex, queue.length, queueIndex, repeat]);

  const previous = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      seek(0);
      return;
    }
    if (queue.length) playIndex(queueIndex - 1);
  }, [playIndex, queue.length, queueIndex, seek]);

  const onEnded = useCallback(() => {
    if (repeat === "one" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      return;
    }
    if (queueIndex < queue.length - 1 || repeat === "all") next();
    else setIsPlaying(false);
  }, [next, queue.length, queueIndex, repeat]);

  const value = useMemo(() => ({
    currentTrack, queue, queueIndex, isPlaying, currentTime, duration, volume,
    shuffle, repeat, playError, selectTrack, playTrack, setPlaybackQueue, togglePlay, seek, next, previous,
    setVolume, setShuffle, setRepeat,
  }), [currentTrack, queue, queueIndex, isPlaying, currentTime, duration, volume, shuffle, repeat, playError, selectTrack, playTrack, setPlaybackQueue, togglePlay, seek, next, previous]);

  return (
    <MusicPlayerContext.Provider value={value}>
      <audio
        ref={audioRef}
        src={currentTrack?.audio_url || undefined}
        preload="metadata"
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || Number(currentTrack?.duration_seconds) || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={onEnded}
        onError={() => {
          if (currentTrack?.audio_url) {
            setIsPlaying(false);
            setPlayError("Audio soubor se nepodařilo načíst. Zkontroluj jeho adresu nebo dostupnost.");
          }
        }}
      />
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) throw new Error("useMusicPlayer musí být použit uvnitř MusicPlayerProvider.");
  return context;
}
