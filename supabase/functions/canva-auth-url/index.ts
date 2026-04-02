const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function base64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const clientId = Deno.env.get("CANVA_CLIENT_ID");
  if (!clientId) {
    return new Response(JSON.stringify({ error: "CANVA_CLIENT_ID not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Generate PKCE code_verifier (43-128 chars, base64url-encoded random bytes)
  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const codeVerifier = base64url(verifierBytes.buffer);

  // Derive code_challenge = base64url(SHA-256(code_verifier))
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(codeVerifier));
  const codeChallenge = base64url(digest);

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: "https://apreendasm.lovable.app/canva-callback",
    response_type: "code",
    scope: "design:content:read design:content:write",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const url = `https://www.canva.com/api/oauth/authorize?${params.toString()}`;

  return new Response(JSON.stringify({ url, code_verifier: codeVerifier }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
