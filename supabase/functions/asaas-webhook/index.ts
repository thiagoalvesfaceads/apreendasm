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

  const ok = (data = { ok: true }) =>
    new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const body = await req.json();
    const event = body.event;

    if (event !== "PAYMENT_CONFIRMED" && event !== "PAYMENT_RECEIVED") {
      console.log(`Ignoring event: ${event}`);
      return ok();
    }

    const payment = body.payment;
    const asaasPaymentId = payment?.id;
    const userId = payment?.externalReference;
    const valueReais = payment?.value;

    if (!asaasPaymentId) {
      console.error("Missing payment.id in webhook payload");
      return ok();
    }

    // Try to find payment in our payments table first
    const { data: localPayment } = await supabase
      .from("payments")
      .select("*, credit_packages(*)")
      .eq("asaas_payment_id", asaasPaymentId)
      .maybeSingle();

    let targetUserId: string;
    let pkg: { id: string; name: string; credits: number } | null = null;

    if (localPayment && localPayment.status === "pending") {
      targetUserId = localPayment.user_id;
      pkg = localPayment.credit_packages as any;

      // Update payment status
      await supabase
        .from("payments")
        .update({ status: "confirmed", updated_at: new Date().toISOString() })
        .eq("id", localPayment.id);
    } else if (localPayment && localPayment.status === "confirmed") {
      console.log("Payment already confirmed, skipping:", asaasPaymentId);
      return ok();
    } else {
      // Fallback: find by externalReference + price
      if (!userId || !valueReais) {
        console.error("No local payment found and missing externalReference/value", { asaasPaymentId });
        return ok();
      }
      targetUserId = userId;
      const priceCents = Math.round(valueReais * 100);

      const { data: foundPkg } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("price_cents", priceCents)
        .eq("is_active", true)
        .maybeSingle();

      if (!foundPkg) {
        console.error("Package not found for price_cents:", priceCents);
        return ok();
      }
      pkg = foundPkg;
    }

    if (!pkg) {
      console.error("No package resolved for payment:", asaasPaymentId);
      return ok();
    }

    // Credit the user
    const { data: userCredits } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (userCredits) {
      await supabase
        .from("user_credits")
        .update({
          balance: userCredits.balance + pkg.credits,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", targetUserId);
    } else {
      await supabase.from("user_credits").insert({
        user_id: targetUserId,
        balance: pkg.credits,
      });
    }

    // Log the purchase
    await supabase.from("usage_log").insert({
      user_id: targetUserId,
      function_name: "asaas-purchase",
      ai_model: "system",
      credits_used: 0,
      metadata: {
        description: `Compra: ${pkg.name}`,
        package_id: pkg.id,
        package_name: pkg.name,
        credits_added: pkg.credits,
        payment_id: asaasPaymentId,
        payment_value: valueReais,
      },
    });

    console.log(`Credits added: ${pkg.credits} to user ${targetUserId} (package: ${pkg.name})`);
    return ok();
  } catch (err) {
    console.error("Webhook processing error:", err);
    return ok();
  }
});
