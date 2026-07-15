import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function sanitizeNext(next: string | null): string {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = sanitizeNext(params.get("next"));

  useEffect(() => {
    // Wait for the Supabase client to hydrate the session from the URL fragment.
    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate(next, { replace: true });
    });
    // In case the session was already restored.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(next, { replace: true });
    });
    return () => sub.data.subscription.unsubscribe();
  }, [navigate, next]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Giriş tamamlanıyor…</p>
    </main>
  );
}
