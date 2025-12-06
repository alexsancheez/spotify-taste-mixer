'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveTokens } from '@/lib/auth';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');

      // si spotify devolvió un error
      if (errorParam) {
        console.error('spotify authorization error:', errorParam);
        setError('error al autorizar con spotify');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      // validar state
      const savedState = localStorage.getItem('spotify_auth_state');
      if (state !== savedState) {
        console.error('state mismatch');
        setError('error de seguridad. intenta de nuevo.');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      // validar código
      if (!code) {
        setError('no se recibió código de autorización');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      try {
        // solicitar tokens al backend
        const response = await fetch("/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          console.error('token endpoint error:', await response.text());
          throw new Error('error al obtener tokens');
        }

        const data = await response.json();

        // guardar tokens en localstorage
        saveTokens(
          data.access_token,
          data.refresh_token,
          data.expires_in
        );

        // limpiar el state csrf
        localStorage.removeItem('spotify_auth_state');

        // redirigir al dashboard
        router.push('/dashboard');

      } catch (err) {
        console.error('error exchanging code for token:', err);
        setError('error al completar la autenticación');
        setTimeout(() => router.push('/'), 3000);
      }
    }

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      {error ? (
        <>
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirigiendo...</p>
        </>
      ) : (
        <>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Conectando con Spotify...</h1>
          <p className="text-gray-400">Espera un momento</p>
        </>
      )}
    </div>
  );
}
