'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { generatePlaylist, getCurrentUser, createSpotifyPlaylist } from '@/lib/spotify';
import Header from '@/components/Header';
import PlaylistDisplay from '@/components/PlaylistDisplay';
import ArtistWidget from '@/components/widgets/ArtistWidget';
import GenreWidget from '@/components/widgets/GenreWidget';
import DecadeWidget from '@/components/widgets/DecadeWidget';
import PopularityWidget from '@/components/widgets/PopularityWidget';
import MoodWidget from '@/components/widgets/MoodWidget';

export default function Dashboard() {
  const router = useRouter();

  // Estados principales
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedDecades, setSelectedDecades] = useState([]);
  const [popularity, setPopularity] = useState(50);
  const [mood, setMood] = useState({
    energy: 71,
    valence: 58,
    danceability: 58,
    acousticness: 53
  });

  // Estados de playlist
  const [playlist, setPlaylist] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Verificar autenticación y cargar usuario
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }

    async function loadUser() {
      const user = await getCurrentUser();
      setCurrentUser(user);
    }
    loadUser();
  }, [router]);

  // Cargar favoritos desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading favorites:', e);
      }
    }
  }, []);

  // Función debounced para generar playlist
  const debouncedGenerate = useCallback(
    debounce(async (preferences) => {
      // No generar si no hay filtros seleccionados
      if (preferences.artists.length === 0 && preferences.genres.length === 0) {
        setPlaylist([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const tracks = await generatePlaylist(preferences);
        setPlaylist(tracks);

        if (tracks.length === 0) {
          setError('No se encontraron canciones con estos criterios. Intenta con otros filtros.');
        }
      } catch (err) {
        setError('Error al generar la playlist. Inténtalo de nuevo.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 1000),
    []
  );

  // Generar playlist cuando cambien los filtros
  useEffect(() => {
    const preferences = {
      artists: selectedArtists,
      genres: selectedGenres,
      decades: selectedDecades,
      popularity: [Math.max(0, popularity - 40), Math.min(100, popularity + 40)],
      audioFeatures: {
        energy: mood.energy / 100,
        valence: mood.valence / 100,
        danceability: mood.danceability / 100,
        acousticness: mood.acousticness / 100,
      }
    };

    debouncedGenerate(preferences);
  }, [selectedArtists, selectedGenres, selectedDecades, popularity, mood, debouncedGenerate]);

  // Handlers
  const handleRemoveTrack = (trackId) => {
    setPlaylist(prev => prev.filter(t => t.id !== trackId));
  };

  const handleToggleFavorite = (track) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.id === track.id);
      const updated = exists
        ? prev.filter(f => f.id !== track.id)
        : [...prev, track];

      localStorage.setItem('favorites', JSON.stringify(updated));
      return updated;
    });
  };

  const handleCreatePlaylist = async () => {
    if (!currentUser || playlist.length === 0) return;

    setIsCreatingPlaylist(true);
    setError(null);

    try {
      const result = await createSpotifyPlaylist(
        currentUser.id,
        playlist,
        `Taste Mixer - ${new Date().toLocaleDateString()}`
      );

      setSuccessMessage(`¡Playlist creada! Se añadieron ${playlist.length} canciones.`);

      // Abrir playlist en Spotify
      setTimeout(() => {
        window.open(result.external_urls.spotify, '_blank');
      }, 1000);
    } catch (err) {
      setError('Error al crear la playlist en Spotify. Inténtalo de nuevo.');
      console.error(err);
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedArtists([]);
    setSelectedGenres([]);
    setSelectedDecades([]);
    setPopularity(50);
    setMood({
      energy: 50,
      valence: 50,
      danceability: 50,
      acousticness: 50
    });
  };

  // Estadísticas de la playlist
  const playlistStats = playlist.length > 0 ? {
    count: playlist.length,
    duration: Math.round(playlist.reduce((sum, t) => sum + t.duration_ms, 0) / 60000),
    avgPopularity: Math.round(playlist.reduce((sum, t) => sum + t.popularity, 0) / playlist.length),
    uniqueArtists: new Set(playlist.flatMap(t => t.artists.map(a => a.name))).size
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <Header />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Panel lateral de filtros */}
          <div className={`lg:col-span-4 xl:col-span-3 space-y-4 ${showFilters ? '' : 'hidden lg:block'}`}>
            <div className="sticky top-4 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto pb-4">

              {/* Info de filtros activos */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-purple-400">filtros activos</h3>
                  {(selectedArtists.length > 0 || selectedGenres.length > 0 || selectedDecades.length > 0) && (
                    <button
                      onClick={handleClearFilters}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      limpiar todo
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>🎤 {selectedArtists.length} artistas</div>
                  <div>🎵 {selectedGenres.length} géneros</div>
                  <div>📅 {selectedDecades.length} décadas</div>
                </div>
              </div>

              {/* Widgets */}
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700">
                <ArtistWidget
                  selectedArtists={selectedArtists}
                  onSelect={setSelectedArtists}
                />
              </div>

              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700">
                <GenreWidget
                  selectedGenres={selectedGenres}
                  onSelect={setSelectedGenres}
                />
              </div>

              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700">
                <DecadeWidget
                  selectedDecades={selectedDecades}
                  onSelect={setSelectedDecades}
                />
              </div>

              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700">
                <PopularityWidget
                  popularity={popularity}
                  onSelect={setPopularity}
                />
              </div>

              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700">
                <MoodWidget
                  mood={mood}
                  onSelect={setMood}
                />
              </div>
            </div>
          </div>

          {/* Área principal de contenido */}
          <div className="lg:col-span-8 xl:col-span-9">
            {/* Botón toggle filtros en móvil */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden mb-4 bg-gray-800 px-4 py-2 rounded-lg w-full flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {showFilters ? 'ocultar filtros' : 'mostrar filtros'}
            </button>

            {/* Mensajes de éxito/error */}
            {successMessage && (
              <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 mb-6 flex items-center justify-between">
                <p className="text-green-400">{successMessage}</p>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="text-green-400 hover:text-green-300"
                >
                  ×
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6 flex items-center justify-between">
                <p className="text-red-400">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </div>
            )}

            {/* Estadísticas de la playlist */}
            {playlistStats && (
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-lg p-4 md:p-6 mb-6 border border-purple-500/20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {playlistStats.count}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">canciones</div>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {playlistStats.duration}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">minutos</div>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {playlistStats.uniqueArtists}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">artistas</div>
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {playlistStats.avgPopularity}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">popularidad</div>
                  </div>
                </div>
              </div>
            )}

            {/* Estado de carga */}
            {isLoading && (
              <div className="text-center py-12 bg-gray-800/30 rounded-lg">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-400">generando tu playlist perfecta...</p>
              </div>
            )}

            {/* Playlist vacía */}
            {!isLoading && playlist.length === 0 && (selectedArtists.length > 0 || selectedGenres.length > 0) && (
              <div className="text-center py-12 bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-700">
                <div className="text-6xl mb-4">🎵</div>
                <p className="text-gray-400 mb-2">no se encontraron canciones</p>
                <p className="text-sm text-gray-500">prueba con otros filtros o artistas</p>
              </div>
            )}

            {/* Estado inicial */}
            {!isLoading && playlist.length === 0 && selectedArtists.length === 0 && selectedGenres.length === 0 && (
              <div className="text-center py-12 bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-700">
                <div className="text-6xl mb-4">👈</div>
                <p className="text-gray-400 mb-2">comienza seleccionando artistas o géneros</p>
                <p className="text-sm text-gray-500">tu playlist se generará automáticamente</p>
              </div>
            )}

            {/* Playlist */}
            {!isLoading && playlist.length > 0 && (
              <>
                <PlaylistDisplay
                  playlist={playlist}
                  onRemove={handleRemoveTrack}
                  onFavorite={handleToggleFavorite}
                  favorites={favorites}
                />

                {/* Botones de acción */}
                <div className="mt-6 flex gap-3 flex-wrap">
                  <button
                    onClick={handleCreatePlaylist}
                    disabled={isCreatingPlaylist || !currentUser}
                    className="flex-1 md:flex-none bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {isCreatingPlaylist ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>creando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                        </svg>
                        <span>crear en spotify</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleClearFilters}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                  >
                    nueva búsqueda
                  </button>

                  {favorites.length > 0 && (
                    <button
                      onClick={() => setPlaylist(favorites)}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      ver favoritos ({favorites.length})
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Utilidad debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}