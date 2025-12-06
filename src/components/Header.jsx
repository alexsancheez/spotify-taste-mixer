'use client';

import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="w-full flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-white">spotify taste mixer</h1>

      <button
        onClick={handleLogout}
        className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 text-white"
      >
        logout
      </button>
    </header>
  );
}
