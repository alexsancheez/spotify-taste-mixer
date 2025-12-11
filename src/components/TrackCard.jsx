'use client'; // indica que este componente se ejecuta en el cliente (navegador)

// importamos hooks de react
import { useState, useRef } from 'react';

// componente que muestra una tarjeta individual de cancion/track
// props:
// - track: objeto con los datos de la cancion
// - onRemove: callback para eliminar el track
// - onFavorite: callback para marcar/desmarcar favorito
// - isFavorite: boolean que indica si esta en favoritos
export default function TrackCard({ track, onRemove, onFavorite, isFavorite }) {
  // estado para controlar si se esta reproduciendo el preview
  const [isPlaying, setIsPlaying] = useState(false);
  // estado para mostrar/ocultar los detalles expandidos
  const [showDetails, setShowDetails] = useState(false);
  // referencia al elemento audio html5 (persistente entre renders)
  const audioRef = useRef(null);

  // funcion para reproducir o pausar el preview de 30 segundos
  const handlePlayPreview = () => {
    // si no hay url de preview, no hacer nada
    if (!track.preview_url) return;

    // si ya esta reproduciendo, pausar
    if (isPlaying) {
      audioRef.current?.pause(); // pausar el audio
      setIsPlaying(false); // actualizar estado
    } else {
      // si no esta reproduciendo, iniciar
      if (!audioRef.current) {
        // crear el elemento audio si no existe
        audioRef.current = new Audio(track.preview_url);
        audioRef.current.volume = 0.3; // volumen al 30%
        // listener para cuando termine el audio
        audioRef.current.addEventListener('ended', () => setIsPlaying(false));
      }
      audioRef.current.play(); // reproducir
      setIsPlaying(true); // actualizar estado
    }
  };

  // funcion auxiliar para formatear la duracion de milisegundos a minutos:segundos
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000); // obtener minutos
    const seconds = ((ms % 60000) / 1000).toFixed(0); // obtener segundos
    return `${minutes}:${seconds.padStart(2, '0')}`; // formato m:ss
  };

  // funcion para abrir el track en spotify en una nueva pestana
  const openInSpotify = () => {
    window.open(track.external_urls.spotify, '_blank');
  };

  // renderizado del componente
  return (
    // contenedor principal con efectos de hover y grupo para estilos condicionales
    <div className="group relative bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-4 hover:bg-gray-700 transition-all duration-300 border border-gray-700 hover:border-purple-500/50">
      <div className="flex gap-4">
        {/* seccion: imagen del album */}
        <div className="relative flex-shrink-0">
          {/* contenedor de la imagen con bordes redondeados */}
          <div className="relative w-16 h-16 rounded overflow-hidden">
            {/* si hay imagen del album, mostrarla */}
            {track.album?.images?.[0]?.url ? (
              <img
                src={track.album.images[0].url}
                alt={track.album.name}
                className="w-full h-full object-cover"
              />
            ) : (
              // si no hay imagen, mostrar placeholder con emoji
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
            )}
          </div>

          {/* boton de play/pause (solo si hay preview disponible) */}
          {track.preview_url && (
            <button
              onClick={handlePlayPreview}
              // overlay oscuro que aparece al hacer hover sobre el grupo
              className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              {/* icono condicional: pausa si reproduciendo, play si no */}
              {isPlaying ? (
                // icono de pausa (dos barras verticales)
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
                </svg>
              ) : (
                // icono de play (triangulo)
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* seccion: informacion del track */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            {/* contenedor del titulo y artista */}
            <div className="flex-1 min-w-0">
              {/* nombre de la cancion (truncado si es muy largo) */}
              <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                {track.name}
              </h3>
              {/* nombres de los artistas separados por coma */}
              <p className="text-sm text-gray-400 truncate">
                {track.artists?.map(a => a.name).join(', ')}
              </p>
            </div>

            {/* botones de accion */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* boton favorito */}
              <button
                onClick={() => onFavorite(track)}
                className="p-2 hover:bg-gray-600 rounded-full transition-colors"
                title={isFavorite ? 'quitar de favoritos' : 'anadir a favoritos'}
              >
                {/* icono de corazon: lleno si es favorito, vacio si no */}
                {isFavorite ? (
                  // corazon rojo relleno
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                ) : (
                  // corazon vacio (solo borde)
                  <svg className="w-5 h-5 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
              </button>

              {/* boton abrir en spotify */}
              <button
                onClick={openInSpotify}
                className="p-2 hover:bg-gray-600 rounded-full transition-colors"
                title="abrir en spotify"
              >
                {/* icono de spotify en verde */}
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </button>

              {/* boton ver detalles */}
              <button
                onClick={() => setShowDetails(!showDetails)} // toggle del estado
                className="p-2 hover:bg-gray-600 rounded-full transition-colors"
                title="ver detalles"
              >
                {/* icono de informacion (circulo con i) */}
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* boton eliminar */}
              <button
                onClick={() => onRemove(track.id)} // llamar callback con el id del track
                className="p-2 hover:bg-red-600 rounded-full transition-colors"
                title="eliminar"
              >
                {/* icono x para cerrar/eliminar */}
                <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* seccion: info adicional (duracion, popularidad, explicit) */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            {/* duracion formateada */}
            <span>{formatDuration(track.duration_ms)}</span>
            {/* popularidad con icono de estrella */}
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {track.popularity}
            </span>
            {/* badge explicit (solo si el track es explicito) */}
            {track.explicit && (
              <span className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">EXPLICIT</span>
            )}
          </div>

          {/* seccion: detalles expandidos (solo visible si showDetails es true) */}
          {showDetails && (
            <div className="mt-3 pt-3 border-t border-gray-700 text-xs space-y-1">
              {/* nombre del album */}
              <p className="text-gray-400">
                <span className="text-gray-500">album:</span> {track.album?.name}
              </p>
              {/* fecha de lanzamiento */}
              <p className="text-gray-400">
                <span className="text-gray-500">lanzamiento:</span> {track.album?.release_date}
              </p>
              {/* indicador de disponibilidad del preview */}
              {track.preview_url ? (
                <p className="text-green-500">✓ preview disponible</p>
              ) : (
                <p className="text-gray-500">preview no disponible</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* indicador de reproduccion (barra animada en la parte inferior) */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-pulse"></div>
      )}
    </div>
  );
}