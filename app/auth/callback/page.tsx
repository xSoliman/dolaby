"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    const supabase = getSupabaseBrowserClient();
    if (!code || !supabase) {
      setError("This sign-in link is incomplete or has expired.");
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
      if (exchangeError) setError(exchangeError.message);
      else router.replace("/home");
    });
  }, [router]);

  return (
    <main className="callback-page">
      <Logo href="/" />
      {error ? (
        <div><h1>We couldn&apos;t sign you in.</h1><p>{error}</p><Link href="/">Return to sign in</Link></div>
      ) : (
        <div><span className="loading-ring" /><h1>Opening your wardrobe…</h1></div>
      )}
    </main>
  );
}
