// Generar string aleatorio para el parámetro 'state'
export function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Construir URL de autorización de Spotify
export function getSpotifyAuthUrl() {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '';
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || '';
  const state = generateRandomString(16);

  // Guardar el state para validación posterior (prevenir CSRF)
  if (typeof window !== 'undefined') {
    localStorage.setItem('spotify_auth_state', state);
  }

 const scope = [
  "user-read-private",
  "user-read-email",
  "user-top-read",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-follow-read",
  "user-library-read"
].join(" ");


  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    state: state,
    scope: scope
  });

  // Asegúrate de que esta URL sea la correcta de Spotify (no el placeholder)
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// Guardar tokens en localStorage
export function saveTokens(accessToken, refreshToken, expiresIn) {
  const expirationTime = Date.now() + expiresIn * 1000;
  localStorage.setItem('spotify_token', accessToken);
  localStorage.setItem('spotify_refresh_token', refreshToken);
  localStorage.setItem('spotify_token_expiration', expirationTime.toString());
}

// Variable para evitar múltiples refreshes simultáneos
let isRefreshing = false;
let refreshPromise = null;

// Refrescar token cuando expire
async function refreshAccessToken() {
  // Si ya hay un refresh en progreso, esperar a que termine
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  
  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('spotify_refresh_token');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // IMPORTANTE: Esta ruta DEBE coincidir con la de tu route.js
      const response = await fetch('/api/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();

      // Guardar nuevos tokens
      // Si el refresh_token no viene, usamos el que ya teníamos
      saveTokens(
        data.access_token,
        data.refresh_token || refreshToken,
        data.expires_in
      );

      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Si falla el refresh, limpiar todo y forzar re-login
      logout();
      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Obtener token actual (con auto-refresh si expiró)
export async function getAccessToken() {
  const token = localStorage.getItem('spotify_token');
  const expiration = localStorage.getItem('spotify_token_expiration');
  
  if (!token || !expiration) return null;
  
  const expirationTime = parseInt(expiration);
  const now = Date.now();
  
  // Si el token expira en menos de 5 minutos, refrescarlo proactivamente
  const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutos
  
  if (now > expirationTime - REFRESH_THRESHOLD) {
    try {
      const newToken = await refreshAccessToken();
      return newToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }
  
  return token;
}

// Obtener token de forma síncrona (sin auto-refresh)
export function getAccessTokenSync() {
  const token = localStorage.getItem('spotify_token');
  const expiration = localStorage.getItem('spotify_token_expiration');
  
  if (!token || !expiration) return null;
  
  // Si el token expiró, retornar null
  if (Date.now() > parseInt(expiration)) {
    return null;
  }
  
  return token;
}

// Verificar si hay token válido
export function isAuthenticated() {
  const token = localStorage.getItem('spotify_token');
  const expiration = localStorage.getItem('spotify_token_expiration');
  
  if (!token || !expiration) return false;
  
  // Considerar autenticado incluso si el token está cerca de expirar
  // porque se refrescará automáticamente
  return Date.now() < parseInt(expiration);
}

// Cerrar sesión
export function logout() {
  localStorage.removeItem('spotify_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_token_expiration');
  localStorage.removeItem('spotify_auth_state');
}