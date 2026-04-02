const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: "https://apreendasm.lovable.app/canva-callback",
    response_type: "code",
    scope: "design:content:read design:content:write",
    state,
  });

  const url = `https://www.canva.com/api/oauth/authorize?${params.toString()}`;

  return new Response(JSON.stringify({ url }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
