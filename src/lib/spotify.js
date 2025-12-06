import { getAccessToken } from './auth';

// Cache para resultados de búsqueda
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

function getCacheKey(type, query) {
  return `${type}:${JSON.stringify(query)}`;
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Función auxiliar para hacer peticiones a Spotify con retry
async function fetchSpotify(url, options = {}, retries = 3) {
  const token = getAccessToken();
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 1;
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      if (retries > 0) return fetchSpotify(url, options, retries - 1);
    }

    if (!response.ok) {
      throw new Error(`Spotify API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchSpotify(url, options, retries - 1);
    }
    throw error;
  }
}

export async function generatePlaylist(preferences) {
  const { artists, genres, decades, popularity, audioFeatures } = preferences;
  let allTracks = [];
  const trackIds = new Set(); // Para evitar duplicados

  try {
    // 1. Obtener tracks de artistas seleccionados
    if (artists && artists.length > 0) {
      const cacheKey = getCacheKey('artists', artists.map(a => a.id));
      const cached = getFromCache(cacheKey);
      
      if (cached) {
        allTracks.push(...cached);
      } else {
        const artistTracks = await Promise.all(
          artists.map(async (artist) => {
            const data = await fetchSpotify(
              `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`
            );
            return data.tracks || [];
          })
        );
        
        const tracks = artistTracks.flat();
        setCache(cacheKey, tracks);
        allTracks.push(...tracks);
      }
    }

    // 2. Buscar por géneros
    if (genres && genres.length > 0) {
      const genreTracks = await Promise.all(
        genres.map(async (genre) => {
          const cacheKey = getCacheKey('genre', genre);
          const cached = getFromCache(cacheKey);
          
          if (cached) return cached;
          
          const data = await fetchSpotify(
            `https://api.spotify.com/v1/search?type=track&q=genre:${encodeURIComponent(genre)}&limit=30`
          );
          
          const tracks = data.tracks?.items || [];
          setCache(cacheKey, tracks);
          return tracks;
        })
      );
      
      allTracks.push(...genreTracks.flat());
    }

    // Si no hay artistas ni géneros, buscar tracks populares
    if (allTracks.length === 0) {
      const data = await fetchSpotify(
        'https://api.spotify.com/v1/search?type=track&q=year:2020-2024&limit=50'
      );
      allTracks = data.tracks?.items || [];
    }

    // 3. Filtrar por década
    if (decades && decades.length > 0) {
      allTracks = allTracks.filter(track => {
        if (!track.album?.release_date) return false;
        const year = new Date(track.album.release_date).getFullYear();
        return decades.some(decade => {
          const decadeStart = parseInt(decade);
          return year >= decadeStart && year < decadeStart + 10;
        });
      });
    }

    // 4. Filtrar por popularidad
    if (popularity && popularity.length === 2) {
      const [min, max] = popularity;
      allTracks = allTracks.filter(
        track => track.popularity >= min && track.popularity <= max
      );
    }

    // 5. Eliminar duplicados
    const uniqueTracks = [];
    for (const track of allTracks) {
      if (!trackIds.has(track.id)) {
        trackIds.add(track.id);
        uniqueTracks.push(track);
      }
    }

    // 6. Filtrar por audio features si están especificadas
    if (audioFeatures && uniqueTracks.length > 0) {
      const tracksWithFeatures = await filterByAudioFeatures(
        uniqueTracks,
        audioFeatures
      );
      return tracksWithFeatures.slice(0, 30);
    }

    // 7. Ordenar por popularidad y limitar
    return uniqueTracks
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 30);

  } catch (error) {
    console.error('Error generating playlist:', error);
    throw error;
  }
}

async function filterByAudioFeatures(tracks, targetFeatures) {
  try {
    // Obtener audio features en lotes de 50 (límite de Spotify)
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < tracks.length; i += batchSize) {
      const batch = tracks.slice(i, i + batchSize);
      batches.push(batch);
    }

    const allFeatures = await Promise.all(
      batches.map(async (batch) => {
        const ids = batch.map(t => t.id).join(',');
        const data = await fetchSpotify(
          `https://api.spotify.com/v1/audio-features?ids=${ids}`
        );
        return data.audio_features || [];
      })
    );

    const features = allFeatures.flat();

    // Calcular score para cada track basado en qué tan cerca está de los targets
    const tracksWithScores = tracks.map((track, index) => {
      const feature = features[index];
      
      if (!feature) return { track, score: 0 };

      // Calcular diferencia normalizada para cada feature
      let score = 0;
      let count = 0;

      if (targetFeatures.energy !== undefined) {
        score += 1 - Math.abs(feature.energy - targetFeatures.energy);
        count++;
      }
      
      if (targetFeatures.valence !== undefined) {
        score += 1 - Math.abs(feature.valence - targetFeatures.valence);
        count++;
      }
      
      if (targetFeatures.danceability !== undefined) {
        score += 1 - Math.abs(feature.danceability - targetFeatures.danceability);
        count++;
      }
      
      if (targetFeatures.acousticness !== undefined) {
        score += 1 - Math.abs(feature.acousticness - targetFeatures.acousticness);
        count++;
      }

      // Score promedio
      score = count > 0 ? score / count : 0;

      return { track, score, features: feature };
    });

    // Ordenar por score y retornar los mejores matches
    return tracksWithScores
      .filter(item => item.score > 0.5) // Solo tracks que matchean razonablemente bien
      .sort((a, b) => b.score - a.score)
      .map(item => item.track);

  } catch (error) {
    console.error('Error filtering by audio features:', error);
    // Si falla, retornar los tracks originales
    return tracks;
  }
}

export async function searchArtists(query) {
  if (!query || query.trim().length < 2) return [];

  const cacheKey = getCacheKey('search_artists', query);
  const cached = getFromCache(cacheKey);
  
  if (cached) return cached;

  try {
    const data = await fetchSpotify(
      `https://api.spotify.com/v1/search?type=artist&q=${encodeURIComponent(query)}&limit=10`
    );
    
    const artists = data.artists?.items || [];
    setCache(cacheKey, artists);
    return artists;
  } catch (error) {
    console.error('Error searching artists:', error);
    return [];
  }
}

export async function getAvailableGenres() {
  const cacheKey = 'available_genres';
  const cached = getFromCache(cacheKey);
  
  if (cached) return cached;

  try {
    const data = await fetchSpotify(
      'https://api.spotify.com/v1/recommendations/available-genre-seeds'
    );
    
    const genres = data.genres || [];
    setCache(cacheKey, genres);
    return genres;
  } catch (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
}

export async function getTrackFeatures(trackId) {
  try {
    const data = await fetchSpotify(
      `https://api.spotify.com/v1/audio-features/${trackId}`
    );
    return data;
  } catch (error) {
    console.error('Error fetching track features:', error);
    return null;
  }
}

export async function createSpotifyPlaylist(userId, tracks, playlistName = 'Mi Playlist Personalizada') {
  try {
    // Crear la playlist
    const createData = await fetchSpotify(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: playlistName,
          description: 'Creada con Spotify Taste Mixer',
          public: false
        })
      }
    );

    // Añadir tracks a la playlist
    const trackUris = tracks.map(track => track.uri);
    await fetchSpotify(
      `https://api.spotify.com/v1/playlists/${createData.id}/tracks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: trackUris
        })
      }
    );

    return createData;
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  const cacheKey = 'current_user';
  const cached = getFromCache(cacheKey);
  
  if (cached) return cached;

  try {
    const data = await fetchSpotify('https://api.spotify.com/v1/me');
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

// Limpiar cache periódicamente
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key);
      }
    }
  }, CACHE_DURATION);
}