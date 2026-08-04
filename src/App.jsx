import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'beatwave-state-v1'

const SONG_LIBRARY = [
  {
    id: 'song-1',
    title: 'Neon Sunrise',
    artist: 'Luna Bloom',
    album: 'Glow City',
    duration: '3:24',
    genre: 'Synthwave',
    accent: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'song-2',
    title: 'Midnight Avenue',
    artist: 'Aero Pulse',
    album: 'Skyline Motion',
    duration: '4:02',
    genre: 'Alt Pop',
    accent: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 'song-3',
    title: 'Golden Echo',
    artist: 'Nova Harbor',
    album: 'Soft Signals',
    duration: '2:57',
    genre: 'Indie',
    accent: 'linear-gradient(135deg, #f59e0b, #f97316)',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 'song-4',
    title: 'Velvet Clouds',
    artist: 'Solar Drift',
    album: 'Daybreak',
    duration: '3:41',
    genre: 'Dream Pop',
    accent: 'linear-gradient(135deg, #14b8a6, #22c55e)',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
]

const DEFAULT_PLAYLISTS = [
  {
    id: 'playlist-focus',
    name: 'Focus Flow',
    songs: ['song-1', 'song-2', 'song-4'],
  },
  {
    id: 'playlist-night',
    name: 'Night Drive',
    songs: ['song-2', 'song-3'],
  },
]

function getInitialState() {
  const fallback = {
    playlists: DEFAULT_PLAYLISTS,
    favorites: ['song-1', 'song-4'],
    selectedPlaylistId: 'playlist-focus',
  }

  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)

    if (!saved) {
      return fallback
    }

    const parsed = JSON.parse(saved)

    return {
      playlists: Array.isArray(parsed.playlists) ? parsed.playlists : fallback.playlists,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : fallback.favorites,
      selectedPlaylistId: parsed.selectedPlaylistId || fallback.selectedPlaylistId,
    }
  } catch {
    return fallback
  }
}

function App() {
  const initialState = getInitialState()
  const audioRef = useRef(null)
  const [playlists, setPlaylists] = useState(initialState.playlists)
  const [favorites, setFavorites] = useState(initialState.favorites)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(initialState.selectedPlaylistId)
  const [currentSongId, setCurrentSongId] = useState('song-1')
  const [search, setSearch] = useState('')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [playlistName, setPlaylistName] = useState('')
  const [playlistError, setPlaylistError] = useState('')
  const [isPlaying, setIsPlaying] = useState(true)
  const [volume, setVolume] = useState(0.75)
  const [trackProgress, setTrackProgress] = useState(0)
  const [trackDuration, setTrackDuration] = useState(0)

  const selectedPlaylist =
    playlists.find((playlist) => playlist.id === selectedPlaylistId) || playlists[0]

  const currentSong =
    SONG_LIBRARY.find((song) => song.id === currentSongId) || SONG_LIBRARY[0]

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ playlists, favorites, selectedPlaylistId }),
    )
  }, [favorites, playlists, selectedPlaylistId])

  useEffect(() => {
    const audioElement = audioRef.current

    if (!audioElement) {
      return
    }

    audioElement.volume = volume
  }, [volume])

  useEffect(() => {
    const audioElement = audioRef.current

    if (!audioElement) {
      return
    }

    audioElement.src = currentSong.audioUrl
    audioElement.load()
    setTrackProgress(0)
    setTrackDuration(0)

    if (isPlaying) {
      audioElement.play().catch(() => {
        setIsPlaying(false)
      })
    } else {
      audioElement.pause()
    }
  }, [currentSong, isPlaying])

  const playlistSongs = useMemo(() => {
    if (!selectedPlaylist) {
      return []
    }

    return selectedPlaylist.songs
      .map((songId) => SONG_LIBRARY.find((song) => song.id === songId))
      .filter(Boolean)
  }, [selectedPlaylist])

  const filteredSongs = useMemo(() => {
    return SONG_LIBRARY.filter((song) => {
      const matchesSearch = song.title.toLowerCase().includes(search.toLowerCase()) ||
        song.artist.toLowerCase().includes(search.toLowerCase()) ||
        song.genre.toLowerCase().includes(search.toLowerCase())

      const matchesFavorite = showFavoritesOnly ? favorites.includes(song.id) : true

      return matchesSearch && matchesFavorite
    })
  }, [favorites, search, showFavoritesOnly])

  const currentIndex = filteredSongs.findIndex((song) => song.id === currentSongId)

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ playlists, favorites, selectedPlaylistId }),
    )
  }, [favorites, playlists, selectedPlaylistId])

  function createPlaylistId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }

    return `playlist-${Date.now()}`
  }

  function handleAddPlaylist(event) {
    event.preventDefault()

    const trimmedName = playlistName.trim()

    if (!trimmedName) {
      setPlaylistError('Playlist name is required before saving.')
      return
    }

    if (playlists.some((playlist) => playlist.name.toLowerCase() === trimmedName.toLowerCase())) {
      setPlaylistError('A playlist with that name already exists.')
      return
    }

    const newPlaylist = {
      id: createPlaylistId(),
      name: trimmedName,
      songs: [],
    }

    setPlaylists((current) => [newPlaylist, ...current])
    setSelectedPlaylistId(newPlaylist.id)
    setPlaylistName('')
    setPlaylistError('')
  }

  function handleDeletePlaylist(playlistId) {
    const updatedPlaylists = playlists.filter((playlist) => playlist.id !== playlistId)
    setPlaylists(updatedPlaylists)

    if (selectedPlaylistId === playlistId) {
      setSelectedPlaylistId(updatedPlaylists[0]?.id || '')
    }
  }

  function toggleFavorite(songId) {
    setFavorites((currentFavorites) =>
      currentFavorites.includes(songId)
        ? currentFavorites.filter((id) => id !== songId)
        : [...currentFavorites, songId],
    )
  }

  function toggleSongInSelectedPlaylist(songId) {
    if (!selectedPlaylist) {
      return
    }

    setPlaylists((currentPlaylists) =>
      currentPlaylists.map((playlist) => {
        if (playlist.id !== selectedPlaylist.id) {
          return playlist
        }

        const alreadyAdded = playlist.songs.includes(songId)

        return {
          ...playlist,
          songs: alreadyAdded
            ? playlist.songs.filter((id) => id !== songId)
            : [...playlist.songs, songId],
        }
      }),
    )
  }

  function handleSongSelect(songId) {
    setCurrentSongId(songId)
    setIsPlaying(true)
  }

  function handleSeek(event) {
    const nextTime = Number(event.target.value)
    const audioElement = audioRef.current

    if (audioElement) {
      audioElement.currentTime = nextTime
    }

    setTrackProgress(nextTime)
  }

  function handleVolumeChange(event) {
    setVolume(Number(event.target.value))
  }

  function handleNextSong() {
    if (filteredSongs.length === 0) {
      return
    }

    const nextIndex = (currentIndex + 1) % filteredSongs.length
    setCurrentSongId(filteredSongs[nextIndex].id)
    setIsPlaying(true)
  }

  function handlePreviousSong() {
    if (filteredSongs.length === 0) {
      return
    }

    const previousIndex = currentIndex <= 0 ? filteredSongs.length - 1 : currentIndex - 1
    setCurrentSongId(filteredSongs[previousIndex].id)
    setIsPlaying(true)
  }

  return (
    <div className="app-shell">
      <div className="spotify-layout">
        <aside className="sidebar panel-card">
          <div className="brand-block">
            <img className="brand-logo" src="/beatwave-logo.svg" alt="BeatWave logo" />
            <div>
              <p className="eyebrow">BeatWave</p>
              <h2>Curate your vibe</h2>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button type="button" className="sidebar-link active">Home</button>
            <button type="button" className="sidebar-link">Library</button>
            <button type="button" className="sidebar-link">Favorites</button>
          </nav>

          <div className="panel-header">
            <h2>Playlists</h2>
            <span className="badge text-bg-success">{playlists.length}</span>
          </div>

          <div className="playlist-list">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                type="button"
                className={`playlist-item ${selectedPlaylistId === playlist.id ? 'active' : ''}`}
                onClick={() => setSelectedPlaylistId(playlist.id)}
              >
                <span>{playlist.name}</span>
                <span className="playlist-count">{playlist.songs.length} tracks</span>
              </button>
            ))}
          </div>

          <form className="playlist-form" onSubmit={handleAddPlaylist}>
            <label className="form-label" htmlFor="playlistName">
              New playlist
            </label>
            <input
              id="playlistName"
              type="text"
              className="form-control"
              value={playlistName}
              onChange={(event) => setPlaylistName(event.target.value)}
              placeholder="Enter a playlist name"
            />
            {playlistError ? <p className="error-text">{playlistError}</p> : null}
            <button type="submit" className="btn btn-primary w-100 mt-2">
              Save playlist
            </button>
          </form>
        </aside>

        <main className="main-content">
          <header className="topbar">
            <div>
              <p className="eyebrow">Curating your mood</p>
              <h1>Curate your next vibe.</h1>
            </div>
            <div className="topbar-actions">
              <input
                type="search"
                className="form-control"
                placeholder="Search songs or artists"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={() => setShowFavoritesOnly((active) => !active)}
              >
                {showFavoritesOnly ? 'Showing favorites' : 'Filter favorites'}
              </button>
            </div>
          </header>

          <section className="content-area panel-card">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Now browsing</p>
                <h2>{selectedPlaylist?.name || 'No playlist selected'}</h2>
              </div>
              {selectedPlaylist ? (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                >
                  Delete playlist
                </button>
              ) : null}
            </div>

            <div className="song-grid">
              {filteredSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  isFavorite={favorites.includes(song.id)}
                  isInPlaylist={selectedPlaylist?.songs.includes(song.id) ?? false}
                  isActive={song.id === currentSongId}
                  onPlay={() => handleSongSelect(song.id)}
                  onToggleFavorite={() => toggleFavorite(song.id)}
                  onTogglePlaylist={() => toggleSongInSelectedPlaylist(song.id)}
                />
              ))}

              {filteredSongs.length === 0 ? (
                <div className="empty-state">
                  <h3>No songs match this filter.</h3>
                  <p>Try another search term or use the playlist button to add a track to {selectedPlaylist?.name || 'your playlist'}.</p>
                </div>
              ) : null}
            </div>
          </section>
        </main>
      </div>

      <footer className="player-bar panel-card">
        <div className="player-meta">
          <div className="cover-art" style={{ background: currentSong.accent }} />
          <div>
            <p className="eyebrow">Now playing</p>
            <h3>{currentSong.title}</h3>
            <small>
              {currentSong.artist} • {currentSong.album}
            </small>
          </div>
        </div>

        <div className="player-actions">
          <div className="player-controls">
            <button type="button" className="btn btn-light" onClick={handlePreviousSong}>
              ⏮
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsPlaying((playState) => !playState)}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button type="button" className="btn btn-light" onClick={handleNextSong}>
              ⏭
            </button>
          </div>

          <div className="player-progress-wrap">
            <input
              type="range"
              min="0"
              max={trackDuration || 100}
              value={trackProgress}
              onChange={handleSeek}
              className="player-progress"
            />
            <div className="player-status">
              <span>{isPlaying ? 'Playing' : 'Paused'}</span>
              <span>{Math.floor(trackProgress / 60)}:{String(Math.floor(trackProgress % 60)).padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        <div className="volume-panel">
          <label className="volume-label" htmlFor="volume-control">
            Volume
          </label>
          <input
            id="volume-control"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>

        <audio
          ref={audioRef}
          preload="auto"
          onLoadedMetadata={(event) => setTrackDuration(event.target.duration || 0)}
          onTimeUpdate={(event) => setTrackProgress(event.target.currentTime || 0)}
          onEnded={handleNextSong}
          className="d-none"
        />
      </footer>
    </div>
  )
}

function SongCard({ song, isFavorite, isInPlaylist, isActive, onPlay, onToggleFavorite, onTogglePlaylist }) {
  return (
    <article className={`song-card ${isActive ? 'active' : ''}`}>
      <div className="song-cover" style={{ background: song.accent }} />
      <div className="song-body">
        <div className="song-title-row">
          <h3>{song.title}</h3>
          <div className="song-action-group">
            <button
              type="button"
              className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
              onClick={onToggleFavorite}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? '♥' : '♡'}
            </button>
            <button
              type="button"
              className={`playlist-action-button ${isInPlaylist ? 'in-playlist' : ''}`}
              onClick={onTogglePlaylist}
              aria-label={isInPlaylist ? 'Remove from playlist' : 'Add to playlist'}
            >
              {isInPlaylist ? '− Playlist' : '+ Playlist'}
            </button>
          </div>
        </div>
        <p>{song.artist}</p>
        <div className="song-meta">
          <span>{song.genre}</span>
          <span>{song.duration}</span>
        </div>
        <button type="button" className="btn btn-primary" onClick={onPlay}>
          {isActive ? 'Now playing' : 'Play song'}
        </button>
      </div>
    </article>
  )
}

export default App
