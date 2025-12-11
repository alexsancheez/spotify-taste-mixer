// =====================================================
// api/token/route.js - endpoint para intercambiar codigo por tokens
// este endpoint se llama desde el cliente despues del callback de oauth
// intercambia el authorization code por access_token y refresh_token
// =====================================================

// importar nextresponse para crear respuestas http
import { NextResponse } from 'next/server';

// handler para peticiones post a /api/token
export async function POST(request) {
  try {
    // obtener el codigo de autorizacion del body de la peticion
    const { code } = await request.json();

    // validar que se recibio el codigo
    if (!code) {
      return NextResponse.json({ error: 'codigo no proporcionado' }, { status: 400 });
    }

    // obtener credenciales de las variables de entorno del servidor
    // nota: estas variables NO tienen el prefijo NEXT_PUBLIC_ porque son secretas
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    // redirect_uri puede ser publica porque no es un secreto
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;

    // hacer peticion a spotify para intercambiar el codigo por tokens
    // endpoint: https://accounts.spotify.com/api/token
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        // content-type requerido por spotify (form urlencoded)
        'Content-Type': 'application/x-www-form-urlencoded',
        // autenticacion basic con client_id:client_secret en base64
        'Authorization':
          'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      // parametros del body
      body: new URLSearchParams({
        grant_type: 'authorization_code', // tipo de grant (intercambio de codigo)
        code: code,                       // el codigo de autorizacion
        redirect_uri: redirectUri,        // debe coincidir con el usado en la autorizacion
      }),
    });

    // parsear la respuesta de spotify
    const data = await response.json();

    // si spotify devolvio un error, retornarlo al cliente
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error_description || 'error al obtener token' },
        { status: response.status }
      );
    }

    // retornar los tokens al cliente
    return NextResponse.json({
      access_token: data.access_token,   // token para hacer peticiones a la api
      refresh_token: data.refresh_token, // token para refrescar el access_token
      expires_in: data.expires_in,       // tiempo en segundos hasta que expire
    });
  } catch (error) {
    // si hay un error inesperado, loguearlo y retornar error 500
    console.error('error en token exchange:', error);
    return NextResponse.json({ error: 'error interno del servidor' }, { status: 500 });
  }
}