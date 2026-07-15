import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function sanitizeNext(next: string | null): string {
  if (!next) return "/";
  // Only allow same-origin relative paths.
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = sanitizeNext(params.get("next"));
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate(next, { replace: true });
    });
  }, [navigate, next]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + next },
        });
        if (error) throw error;
        toast.success("Hesap oluşturuldu. Giriş yapılıyor…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate(next, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth/callback?next=" + encodeURIComponent(next),
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google ile giriş başarısız");
      setBusy(false);
      return;
    }
    if (result.redirected) return; // browser redirect
    // Popup path: session set by helper.
    navigate(next, { replace: true });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <h1 className="font-display text-3xl font-light tracking-[0.3em] text-gradient-gold text-center mb-2">
          ALPENZO
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-6">
          {mode === "signin" ? "Hesabınıza giriş yapın" : "Yeni hesap oluşturun"}
        </p>

        <Button onClick={handleGoogle} disabled={busy} variant="outline" className="w-full mb-4">
          Google ile devam et
        </Button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">veya</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Parola</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {mode === "signin" ? "Giriş yap" : "Kayıt ol"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "signin" ? (
            <>
              Hesabınız yok mu?{" "}
              <button type="button" onClick={() => setMode("signup")} className="text-primary underline">
                Kayıt olun
              </button>
            </>
          ) : (
            <>
              Zaten hesabınız var mı?{" "}
              <button type="button" onClick={() => setMode("signin")} className="text-primary underline">
                Giriş yapın
              </button>
            </>
          )}
        </p>
        <p className="text-center mt-6">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary">Ana sayfaya dön</Link>
        </p>
      </div>
    </main>
  );
}
