"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Callback() {
  const router = useRouter();
  const params = useSearchParams();

  const code = params.get("code");
  const state = params.get("state");

  useEffect(() => {
    if (!code) return;

    const exchangeToken = async () => {
      const res = await fetch("/api/spotify-token", {
        method: "POST",
      });

      // Intercambiar codigo por token
      const params = new URLSearchParams();
      params.append("grant_type", "authorization_code");
      params.append("code", code);
      params.append("redirect_uri", process.env.NEXT_PUBLIC_REDIRECT_URI);

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            btoa(
              process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID +
                ":" +
                process.env.SPOTIFY_CLIENT_SECRET
            ),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      const data = await response.json();

      // Guardar tokens
      localStorage.setItem("spotify_token", data.access_token);
      localStorage.setItem("spotify_refresh_token", data.refresh_token);
      localStorage.setItem(
        "spotify_token_expiration",
        Date.now() + data.expires_in * 1000
      );

      router.push("/dashboard");
    };

    exchangeToken();
  }, [code]);

  return (
    <div className="flex items-center justify-center h-screen text-white">
      Procesando autenticación…
    </div>
  );
}
