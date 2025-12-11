'use client'; // indica que este componente se ejecuta en el cliente (navegador)

// =====================================================
// dashboard/page.js - pagina principal de la aplicacion
// aqui el usuario configura sus preferencias y genera playlists
// =====================================================

// importar hooks de react
import { useState, useEffect, useCallback } from 'react';
// importar hook de navegacion de next.js
import { useRouter } from 'next/navigation';
// importar funcion de verificacion de autenticacion
import { isAuthenticated } from '@/lib/auth';
// importar funciones de la api de spotify
import { generatePlaylist, getCurrentUser, createSpotifyPlaylist, generateMoreTracks } from '@/lib/spotify';
// importar componentes de la aplicacion
import Header from '@/components/Header';
import PlaylistDisplay from '@/components/PlaylistDisplay';
// importar widgets de configuracion
import ArtistWidget from '@/components/widgets/ArtistWidget';
import GenreWidget from '@/components/widgets/GenreWidget';
import DecadeWidget from '@/components/widgets/DecadeWidget';
import PopularityWidget from '@/components/widgets/PopularityWidget';
import MoodWidget from '@/components/widgets/MoodWidget';

// componente principal del dashboard
export default function Dashboard() {
  // hook para navegacion programatica
  const router = useRouter();

  // =====================================================
  // estados de preferencias del usuario (filtros)
  // =====================================================

  // artistas seleccionados por el usuario
  const [selectedArtists, setSelectedArtists] = useState([]);
  // generos seleccionados
  const [selectedGenres, setSelectedGenres] = useState([]);
  // decadas seleccionadas
  const [selectedDecades, setSelectedDecades] = useState([]);
  // nivel de popularidad (0-100)
  const [popularity, setPopularity] = useState(50);
  // configuracion del mood (energia, felicidad, etc)
  const [mood, setMood] = useState({
    energy: 71,
    valence: 58,
    danceability: 58,
    acousticness: 53
  });

  // =====================================================
  // estados de la playlist
  // =====================================================

  // tracks de la playlist generada
  const [playlist, setPlaylist] = useState([]);
  // tracks marcados como favoritos
  const [favorites, setFavorites] = useState([]);

  // =====================================================
  // estados de la interfaz de usuario
  // =====================================================

  // indica si se esta generando la playlist
  const [isLoading, setIsLoading] = useState(false);
  // indica si se esta creando la playlist en spotify
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  // indica si se estan anadiendo mas canciones
  const [isAddingMore, setIsAddingMore] = useState(false);
  // indica si se esta refrescando la playlist
  const [isRefreshing, setIsRefreshing] = useState(false);
  // mensaje de error para mostrar al usuario
  const [error, setError] = useState(null);
  // mensaje de exito para mostrar al usuario
  const [successMessage, setSuccessMessage] = useState(null);
  // preferencias actuales (para refrescar/anadir mas)
  const [currentPreferences, setCurrentPreferences] = useState(null);
  // controla la visibilidad del panel de filtros en movil
  const [showFilters, setShowFilters] = useState(true);
  // datos del usuario actual de spotify
  const [currentUser, setCurrentUser] = useState(null);

  // =====================================================
  // useeffect: verificar autenticacion al cargar
  // =====================================================
  useEffect(() => {
    // si no esta autenticado, redirigir al login
    if (!isAuthenticated()) {
      router.push('/');
      return;
    }

    // funcion asincrona para cargar datos del usuario
    async function loadUser() {
      const user = await getCurrentUser();
      setCurrentUser(user);
    }
    loadUser();
  }, [router]);

  // =====================================================
  // useeffect: cargar favoritos desde localstorage
  // =====================================================
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

  // =====================================================
  // funcion debounced para generar playlist
  // evita hacer multiples peticiones mientras el usuario ajusta filtros
  // =====================================================
  const debouncedGenerate = useCallback(
    debounce(async (preferences) => {
      // no generar si no hay filtros seleccionados
      if (preferences.artists.length === 0 && preferences.genres.length === 0) {
        setPlaylist([]); // limpiar playlist
        return;
      }

      setIsLoading(true); // mostrar indicador de carga
      setError(null); // limpiar errores previos

      try {
        // llamar a la api para generar la playlist
        const tracks = await generatePlaylist(preferences);
        setPlaylist(tracks);

        // si no se encontraron canciones, mostrar mensaje
        if (tracks.length === 0) {
          setError('no se encontraron canciones con estos criterios. intenta con otros filtros.');
        }
      } catch (err) {
        setError('error al generar la playlist. intentalo de nuevo.');
        console.error(err);
      } finally {
        setIsLoading(false); // ocultar indicador de carga
      }
    }, 1000), // esperar 1 segundo despues del ultimo cambio
    []
  );

  // =====================================================
  // useeffect: generar playlist cuando cambien los filtros
  // =====================================================
  useEffect(() => {
    // construir objeto de preferencias
    const preferences = {
      artists: selectedArtists,
      genres: selectedGenres,
      decades: selectedDecades,
      // convertir popularidad a rango (+-40 del valor seleccionado)
      popularity: [Math.max(0, popularity - 40), Math.min(100, popularity + 40)],
      // convertir valores del mood a escala 0-1 (requerido por spotify)
      audioFeatures: {
        energy: mood.energy / 100,
        valence: mood.valence / 100,
        danceability: mood.danceability / 100,
        acousticness: mood.acousticness / 100,
      }
    };

    // guardar preferencias actuales para refrescar/anadir mas
    setCurrentPreferences(preferences);
    // generar playlist con debounce
    debouncedGenerate(preferences);
  }, [selectedArtists, selectedGenres, selectedDecades, popularity, mood, debouncedGenerate]);

  // =====================================================
  // handlers: funciones que manejan las interacciones del usuario
  // =====================================================

  // eliminar un track de la playlist
  const handleRemoveTrack = (trackId) => {
    setPlaylist(prev => prev.filter(t => t.id !== trackId));
  };

  // toggle de favorito para un track
  const handleToggleFavorite = (track) => {
    setFavorites(prev => {
      // verificar si ya es favorito
      const exists = prev.find(f => f.id === track.id);
      // si existe, quitarlo; si no, anadirlo
      const updated = exists
        ? prev.filter(f => f.id !== track.id)
        : [...prev, track];

      // guardar en localstorage para persistencia
      localStorage.setItem('favorites', JSON.stringify(updated));
      return updated;
    });
  };

  // refrescar playlist - genera nueva playlist con los mismos filtros
  const handleRefreshPlaylist = async () => {
    // validar que hay preferencias y filtros
    if (!currentPreferences || (currentPreferences.artists.length === 0 && currentPreferences.genres.length === 0)) {
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      // obtener ids actuales para excluirlos de la nueva playlist
      const excludeIds = playlist.map(t => t.id);
      // generar nueva playlist excluyendo tracks actuales
      const tracks = await generatePlaylist({ ...currentPreferences, excludeIds, forceRefresh: true });

      if (tracks.length === 0) {
        setError('no se encontraron mas canciones con estos criterios.');
      } else {
        setPlaylist(tracks);
        // mostrar mensaje de exito temporalmente
        setSuccessMessage(`playlist refrescada! ${tracks.length} nuevas canciones.`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('error al refrescar la playlist.');
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // anadir mas canciones a la playlist existente
  const handleAddMoreTracks = async () => {
    // validar que hay preferencias y filtros
    if (!currentPreferences || (currentPreferences.artists.length === 0 && currentPreferences.genres.length === 0)) {
      return;
    }

    setIsAddingMore(true);
    setError(null);

    try {
      // obtener ids actuales para no duplicar
      const excludeIds = playlist.map(t => t.id);
      // generar 10 tracks adicionales
      const newTracks = await generateMoreTracks(currentPreferences, excludeIds, 10);

      if (newTracks.length === 0) {
        setError('no se encontraron mas canciones similares.');
      } else {
        // anadir los nuevos tracks a la playlist existente
        setPlaylist(prev => [...prev, ...newTracks]);
        setSuccessMessage(`se anadieron ${newTracks.length} canciones mas!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError('error al anadir mas canciones.');
      console.error(err);
    } finally {
      setIsAddingMore(false);
    }
  };

  // crear la playlist en la cuenta de spotify del usuario
  const handleCreatePlaylist = async () => {
    // validar que hay usuario y playlist
    if (!currentUser || playlist.length === 0) return;

    setIsCreatingPlaylist(true);
    setError(null);

    try {
      // llamar a la api para crear la playlist
      const result = await createSpotifyPlaylist(
        currentUser.id,
        playlist,
        `Taste Mixer - ${new Date().toLocaleDateString()}` // nombre con fecha
      );

      setSuccessMessage(`playlist creada! se anadieron ${playlist.length} canciones.`);

      // abrir la playlist en spotify despues de 1 segundo
      setTimeout(() => {
        window.open(result.external_urls.spotify, '_blank');
      }, 1000);
    } catch (err) {
      setError('error al crear la playlist en spotify. intentalo de nuevo.');
      console.error(err);
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  // limpiar todos los filtros y resetear a valores por defecto
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

  // =====================================================
  // calcular estadisticas de la playlist
  // =====================================================
  const playlistStats = playlist.length > 0 ? {
    count: playlist.length, // numero de canciones
    // duracion total en minutos
    duration: Math.round(playlist.reduce((sum, t) => sum + t.duration_ms, 0) / 60000),
    // popularidad promedio
    avgPopularity: Math.round(playlist.reduce((sum, t) => sum + t.popularity, 0) / playlist.length),
    // numero de artistas unicos
    uniqueArtists: new Set(playlist.flatMap(t => t.artists.map(a => a.name))).size
  } : null;

  // =====================================================
  // renderizado del componente
  // =====================================================
  return (
    // contenedor principal con fondo degradado
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* componente header con logo y boton logout */}
        <Header />

        {/* grid principal: 2 columnas en desktop (filtros + contenido) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">

          {/* =====================================================
              panel lateral izquierdo: filtros/widgets
              ===================================================== */}
          <div className={`lg:col-span-4 xl:col-span-3 space-y-4 ${showFilters ? '' : 'hidden lg:block'}`}>
            {/* contenedor sticky para que los filtros sigan al scroll */}
            <div className="sticky top-4 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto pb-4">

              {/* caja de resumen de filtros activos */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-purple-400">filtros activos</h3>
                  {/* boton limpiar todo (solo visible si hay filtros) */}
                  {(selectedArtists.length > 0 || selectedGenres.length > 0 || selectedDecades.length > 0) && (
                    <button
                      onClick={handleClearFilters}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      limpiar todo
                    </button>
                  )}
                </div>
                {/* contadores de filtros */}
                <div className="text-xs text-gray-400 space-y-1">
                  <div>🎤 {selectedArtists.length} artistas</div>
                  <div>🎵 {selectedGenres.length} generos</div>
                  <div>📅 {selectedDecades.length} decadas</div>
                </div>
              </div>

              {/* widgets de configuracion */}
              {/* cada widget esta envuelto en un contenedor con estilos consistentes */}

              {/* widget de artistas */}
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700">
                <ArtistWidget
                  selectedArtists={selectedArtists}
                  onSelect={setSelectedArtists}
                />
              </div>

              {/* widget de generos */}
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700">
                <GenreWidget
                  selectedGenres={selectedGenres}
                  onSelect={setSelectedGenres}
                />
              </div>

              {/* widget de decadas */}
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700">
                <DecadeWidget
                  selectedDecades={selectedDecades}
                  onSelect={setSelectedDecades}
                />
              </div>

              {/* widget de popularidad */}
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700">
                <PopularityWidget
                  popularity={popularity}
                  onSelect={setPopularity}
                />
              </div>

              {/* widget de mood */}
              <div className="bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700">
                <MoodWidget
                  mood={mood}
                  onSelect={setMood}
                />
              </div>
            </div>
          </div>

          {/* =====================================================
              area principal derecha: playlist y acciones
              ===================================================== */}
          <div className="lg:col-span-8 xl:col-span-9">

            {/* boton toggle filtros (solo visible en movil) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden mb-4 bg-gray-800 px-4 py-2 rounded-lg w-full flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              {showFilters ? 'ocultar filtros' : 'mostrar filtros'}
            </button>

            {/* mensaje de exito (verde) */}
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

            {/* mensaje de error (rojo) */}
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

            {/* caja de estadisticas de la playlist */}
            {playlistStats && (
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-lg p-4 md:p-6 mb-6 border border-purple-500/20">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  {/* numero de canciones */}
                  <div>
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {playlistStats.count}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">canciones</div>
                  </div>
                  {/* duracion total */}
                  <div>
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {playlistStats.duration}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">minutos</div>
                  </div>
                  {/* artistas unicos */}
                  <div>
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {playlistStats.uniqueArtists}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">artistas</div>
                  </div>
                  {/* popularidad promedio */}
                  <div>
                    <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {playlistStats.avgPopularity}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">popularidad</div>
                  </div>
                </div>
              </div>
            )}

            {/* estado de carga (spinner) */}
            {isLoading && (
              <div className="text-center py-12 bg-gray-800/30 rounded-lg">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-400">generando tu playlist perfecta...</p>
              </div>
            )}

            {/* estado: playlist vacia (pero con filtros) */}
            {!isLoading && playlist.length === 0 && (selectedArtists.length > 0 || selectedGenres.length > 0) && (
              <div className="text-center py-12 bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-700">
                <div className="text-6xl mb-4">🎵</div>
                <p className="text-gray-400 mb-2">no se encontraron canciones</p>
                <p className="text-sm text-gray-500">prueba con otros filtros o artistas</p>
              </div>
            )}

            {/* estado inicial: sin filtros seleccionados */}
            {!isLoading && playlist.length === 0 && selectedArtists.length === 0 && selectedGenres.length === 0 && (
              <div className="text-center py-12 bg-gray-800/30 rounded-lg border-2 border-dashed border-gray-700">
                <div className="text-6xl mb-4">👈</div>
                <p className="text-gray-400 mb-2">comienza seleccionando artistas o generos</p>
                <p className="text-sm text-gray-500">tu playlist se generara automaticamente</p>
              </div>
            )}

            {/* playlist con contenido */}
            {!isLoading && playlist.length > 0 && (
              <>
                {/* componente que muestra la lista de tracks */}
                <PlaylistDisplay
                  playlist={playlist}
                  onRemove={handleRemoveTrack}
                  onFavorite={handleToggleFavorite}
                  favorites={favorites}
                />

                {/* botones de accion */}
                <div className="mt-6 flex gap-3 flex-wrap">

                  {/* boton: crear en spotify */}
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

                  {/* boton: refrescar playlist */}
                  <button
                    onClick={handleRefreshPlaylist}
                    disabled={isRefreshing}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    {isRefreshing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>refrescando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>refrescar playlist</span>
                      </>
                    )}
                  </button>

                  {/* boton: anadir mas canciones */}
                  <button
                    onClick={handleAddMoreTracks}
                    disabled={isAddingMore}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    {isAddingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>anadiendo...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>anadir mas</span>
                      </>
                    )}
                  </button>

                  {/* boton: nueva busqueda (limpiar filtros) */}
                  <button
                    onClick={handleClearFilters}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
                  >
                    nueva busqueda
                  </button>

                  {/* boton: ver favoritos (solo si hay favoritos) */}
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

// =====================================================
// funcion utilidad: debounce
// retrasa la ejecucion de una funcion hasta que pase un tiempo
// sin nuevas llamadas (evita ejecutar multiples veces seguidas)
// =====================================================
function debounce(func, wait) {
  let timeout; // variable para almacenar el timer
  return function executedFunction(...args) {
    // funcion que se ejecutara despues del delay
    const later = () => {
      clearTimeout(timeout);
      func(...args); // ejecutar la funcion original con los argumentos
    };
    // cancelar el timer anterior si existe
    clearTimeout(timeout);
    // crear nuevo timer
    timeout = setTimeout(later, wait);
  };
}