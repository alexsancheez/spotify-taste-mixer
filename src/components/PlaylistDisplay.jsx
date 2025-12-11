'use client'; // indica que este componente se ejecuta en el cliente (navegador)

// importamos el componente TrackCard que muestra cada cancion individual
import TrackCard from './TrackCard';

// componente que muestra la lista completa de canciones de la playlist
// props:
// - playlist: array de tracks a mostrar
// - onRemove: callback para eliminar un track
// - onFavorite: callback para marcar/desmarcar favorito
// - favorites: array de tracks marcados como favoritos
export default function PlaylistDisplay({ playlist, onRemove, onFavorite, favorites }) {

  // si no hay playlist o esta vacia, mostrar mensaje
  if (!playlist || playlist.length === 0) {
    return (
      // contenedor con mensaje de estado vacio
      <div className="text-gray-400 text-center p-6 bg-gray-900 rounded">
        no hay canciones todavia
      </div>
    );
  }

  // renderizado de la lista de tracks
  return (
    // contenedor flex con direccion columna y espacio entre elementos
    <div className="flex flex-col gap-3">
      {/* mapear cada track del array playlist */}
      {playlist.map((track) => (
        // componente TrackCard para cada cancion
        <TrackCard
          key={track.id} // key unica para react (usa el id del track)
          track={track} // pasar el objeto track completo
          onRemove={onRemove} // callback para eliminar
          onFavorite={onFavorite} // callback para favoritos
          // verificar si este track esta en favoritos (comparando ids)
          isFavorite={favorites.some(f => f.id === track.id)}
        />
      ))}
    </div>
  );
}
