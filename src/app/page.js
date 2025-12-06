'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getSpotifyAuthUrl } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = () => {
    window.location.href = getSpotifyAuthUrl();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <h1 className="text-3xl font-bold mb-6">🎵 Spotify Taste Mixer</h1>

      <button
        onClick={handleLogin}
        className="bg-green-500 px-6 py-3 rounded font-semibold hover:bg-green-600"
      >
        iniciar sesión con spotify
      </button>
    </div>
  );
}
