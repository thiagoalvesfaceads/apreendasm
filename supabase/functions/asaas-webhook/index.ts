import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const webhookToken = Deno.env.get("ASAAS_WEBHOOK_TOKEN");
  const incomingToken = req.headers.get("asaas-access-token");

  if (!webhookToken || incomingToken !== webhookToken) {
    console.error("Invalid or missing webhook token");
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const event = body.event;

    if (event !== "PAYMENT_CONFIRMED" && event !== "PAYMENT_RECEIVED") {
      console.log(`Ignoring event: ${event}`);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payment = body.payment;
    const userId = payment?.externalReference;
    const valueReais = payment?.value;

    if (!userId || !valueReais) {
      console.error("Missing externalReference or value in payment payload", { userId, valueReais });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const priceCents = Math.round(valueReais * 100);

    const { data: pkg, error: pkgError } = await supabase
      .from("credit_packages")
      .select("*")
      .eq("price_cents", priceCents)
      .eq("is_active", true)
      .maybeSingle();

    if (pkgError || !pkg) {
      console.error("Package not found for price_cents:", priceCents, pkgError);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: creditError } = await supabase
      .from("user_credits")
      .update({ balance: supabase.rpc ? undefined : undefined })
      .eq("user_id", userId);

    // Use raw SQL via rpc to atomically increment balance
    const { error: rpcError } = await supabase.rpc("debit_credits", {
      p_user_id: userId,
      p_amount: -pkg.credits, // negative amount = credit
    }).then(() => ({ error: null })).catch(() => {
      // debit_credits doesn't support negative, do manual update
      return { error: "fallback" as any };
    });

    // Fallback: direct update with increment
    if (rpcError) {
      const { data: current } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (!current) {
        // User has no credits row yet, insert one
        await supabase.from("user_credits").insert({
          user_id: userId,
          balance: pkg.credits,
        });
      } else {
        await supabase
          .from("user_credits")
          .update({ balance: current.balance + pkg.credits, updated_at: new Date().toISOString() })
          .eq("user_id", userId);
      }
    }

    // Log the purchase
    await supabase.from("usage_log").insert({
      user_id: userId,
      function_name: "asaas-purchase",
      ai_model: "system",
      credits_used: 0,
      metadata: {
        description: `Compra: ${pkg.name}`,
        package_id: pkg.id,
        package_name: pkg.name,
        credits_added: pkg.credits,
        payment_id: payment.id,
        payment_value: valueReais,
      },
    });

    console.log(`Credits added: ${pkg.credits} to user ${userId} (package: ${pkg.name})`);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
