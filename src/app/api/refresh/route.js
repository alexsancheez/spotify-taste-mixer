// =====================================================
// api/refresh/route.js - endpoint para refrescar el access token
// cuando el access_token expira, el cliente llama aqui con el refresh_token
// para obtener un nuevo access_token sin requerir login del usuario
// =====================================================

// importar nextresponse para crear respuestas http
import { NextResponse } from 'next/server';

// handler para peticiones post a /api/refresh
export async function POST(request) {
  try {
    // obtener el refresh_token del body de la peticion
    const { refresh_token } = await request.json();

    // validar que se recibio el refresh_token
    if (!refresh_token) {
      return NextResponse.json(
        { error: 'refresh token is required' },
        { status: 400 }
      );
    }

    // obtener credenciales de las variables de entorno del servidor
    // intentar primero la variable privada, luego la publica como fallback
    const clientId = process.env.SPOTIFY_CLIENT_ID || process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    console.log('🔄 refrescando token...');

    // hacer peticion a spotify para refrescar el token
    // endpoint: https://accounts.spotify.com/api/token
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        // content-type requerido por spotify (form urlencoded)
        'Content-Type': 'application/x-www-form-urlencoded',
        // autenticacion basic con client_id:client_secret en base64
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
      },
      // parametros del body
      body: new URLSearchParams({
        grant_type: 'refresh_token',    // tipo de grant (refrescar token)
        refresh_token: refresh_token,   // el refresh token actual
      }).toString(),
    });

    // si spotify devolvio un error, loguearlo y retornarlo
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ spotify refresh error:', errorData);
      return NextResponse.json(
        { error: 'failed to refresh token' },
        { status: response.status }
      );
    }

    // parsear la respuesta exitosa de spotify
    const data = await response.json();
    console.log('✅ token refrescado exitosamente!');

    // retornar los nuevos tokens al cliente
    // nota: spotify no siempre devuelve un nuevo refresh_token
    // si no lo devuelve, usamos el anterior
    return NextResponse.json({
      access_token: data.access_token,                    // nuevo access token
      expires_in: data.expires_in,                        // tiempo hasta expiracion
      refresh_token: data.refresh_token || refresh_token, // nuevo o anterior refresh token
    });

  } catch (error) {
    // si hay un error inesperado, loguearlo y retornar error 500
    console.error('❌ token refresh error(debug):', error);
    return NextResponse.json(
      { error: 'internal server error' },
      { status: 500 }
    );
  }
}