import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Beta Supabase OAuth namespace — declare a local typed shape so TS can call it.
type OAuthClient = {
  name?: string;
  redirect_uris?: string[];
};
type AuthorizationDetails = {
  client?: OAuthClient;
  scope?: string;
  requested_scopes?: string[];
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthResult = { data?: AuthorizationDetails; error?: { message: string } };
type OAuthNamespace = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};
function getOAuth(): OAuthNamespace {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.auth as any).oauth as OAuthNamespace;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      const { data, error } = await getOAuth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data ?? null);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const oauth = getOAuth();
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl mb-3">Yetkilendirme yüklenemedi</h1>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Yükleniyor…</p>
      </main>
    );
  }

  const clientName = details.client?.name ?? "Bir uygulama";
  const scopes = details.requested_scopes ?? (details.scope ? details.scope.split(" ") : []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
        <h1 className="font-display text-2xl mb-2 text-center">
          {clientName} uygulamasını Alpenzo hesabınıza bağlayın
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Bu bağlantı, {clientName} uygulamasının siz olarak Alpenzo araçlarını kullanmasına izin verir. Uygulama izinleri
          ve arka uç politikaları geçerli olmaya devam eder.
        </p>

        {scopes.length > 0 && (
          <div className="mb-6 rounded-md border border-border p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">İstenen izinler</p>
            <ul className="text-sm space-y-1">
              {scopes.map((s) => (
                <li key={s}>• {s}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" disabled={busy} onClick={() => decide(false)}>
            Reddet
          </Button>
          <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
            Onayla
          </Button>
        </div>
      </div>
    </main>
  );
}
