'use client';

import { useState, useRef } from 'react';

export default function TrackCard({ track, onRemove, onFavorite, isFavorite }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const audioRef = useRef(null);

  const handlePlayPreview = () => {
    if (!track.preview_url) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(track.preview_url);
        audioRef.current.volume = 0.3;
        audioRef.current.addEventListener('ended', () => setIsPlaying(false));
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  const openInSpotify = () => {
    window.open(track.external_urls.spotify, '_blank');
  };

  return (
    <div className="group relative bg-gray-800 bg-opacity-50 backdrop-blur-sm rounded-lg p-4 hover:bg-gray-700 transition-all duration-300 border border-gray-700 hover:border-purple-500/50">
      <div className="flex gap-4">
        {/* Album Art */}
        <div className="relative flex-shrink-0">
          <div className="relative w-16 h-16 rounded overflow-hidden">
            {track.album?.images?.[0]?.url ? (
              <img
                src={track.album.images[0].url}
                alt={track.album.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
            )}
          </div>
          
          {/* Play Button Overlay */}
          {track.preview_url && (
            <button
              onClick={handlePlayPreview}
              className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              {isPlaying ? (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                {track.name}
              </h3>
              <p className="text-sm text-gray-400 truncate">
                {track.artists?.map(a => a.name).join(', ')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onFavorite(track)}
                className="p-2 hover:bg-gray-600 rounded-full transition-colors"
                title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              >
                {isFavorite ? (
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                )}
              </button>

              <button
                onClick={openInSpotify}
                className="p-2 hover:bg-gray-600 rounded-full transition-colors"
                title="Abrir en Spotify"
              >
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </button>

              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-2 hover:bg-gray-600 rounded-full transition-colors"
                title="Ver detalles"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </button>

              <button
                onClick={() => onRemove(track.id)}
                className="p-2 hover:bg-red-600 rounded-full transition-colors"
                title="Eliminar"
              >
                <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>{formatDuration(track.duration_ms)}</span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              {track.popularity}
            </span>
            {track.explicit && (
              <span className="px-1.5 py-0.5 bg-gray-700 rounded text-[10px]">EXPLICIT</span>
            )}
          </div>

          {/* Detailed Info (Expandable) */}
          {showDetails && (
            <div className="mt-3 pt-3 border-t border-gray-700 text-xs space-y-1">
              <p className="text-gray-400">
                <span className="text-gray-500">Álbum:</span> {track.album?.name}
              </p>
              <p className="text-gray-400">
                <span className="text-gray-500">Lanzamiento:</span> {track.album?.release_date}
              </p>
              {track.preview_url ? (
                <p className="text-green-500">✓ Preview disponible</p>
              ) : (
                <p className="text-gray-500">Preview no disponible</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Waveform indicator when playing */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-pulse"></div>
      )}
    </div>
  );
}