'use client';

import TrackCard from './TrackCard';

export default function PlaylistDisplay({ playlist, onRemove, onFavorite, favorites }) {
  if (!playlist || playlist.length === 0) {
    return (
      <div className="text-gray-400 text-center p-6 bg-gray-900 rounded">
        no hay canciones todavía
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {playlist.map((track) => (
        <TrackCard
          key={track.id}
          track={track}
          onRemove={onRemove}
          onFavorite={onFavorite}
          isFavorite={favorites.some(f => f.id === track.id)}
        />
      ))}
    </div>
  );
}
