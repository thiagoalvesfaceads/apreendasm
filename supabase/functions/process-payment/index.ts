import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ASAAS_BASE = "https://sandbox.asaas.com/api/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Validate JWT
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Não autenticado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Token inválido" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { package_id } = await req.json();
    if (!package_id) {
      return new Response(JSON.stringify({ error: "package_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch package
    const { data: pkg, error: pkgErr } = await supabase
      .from("credit_packages")
      .select("*")
      .eq("id", package_id)
      .eq("is_active", true)
      .single();

    if (pkgErr || !pkg) {
      return new Response(JSON.stringify({ error: "Pacote não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user email from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    const email = profile?.email || user.email;
    const name = profile?.full_name || email;

    const asaasKey = Deno.env.get("ASAAS_API_KEY");
    if (!asaasKey) {
      return new Response(
        JSON.stringify({ error: "ASAAS_API_KEY não configurada" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const asaasHeaders = {
      "Content-Type": "application/json",
      access_token: asaasKey,
    };

    // Find or create customer
    const searchRes = await fetch(
      `${ASAAS_BASE}/customers?email=${encodeURIComponent(email!)}`,
      { headers: asaasHeaders }
    );
    const searchData = await searchRes.json();

    let customerId: string;

    if (searchData.data && searchData.data.length > 0) {
      customerId = searchData.data[0].id;
    } else {
      const createRes = await fetch(`${ASAAS_BASE}/customers`, {
        method: "POST",
        headers: asaasHeaders,
        body: JSON.stringify({
          name,
          email,
          notificationDisabled: true,
        }),
      });
      const createData = await createRes.json();
      if (!createData.id) {
        console.error("Failed to create Asaas customer:", createData);
        return new Response(
          JSON.stringify({ error: "Erro ao criar cliente no Asaas" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      customerId = createData.id;
    }

    // Create PIX payment
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    const paymentRes = await fetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers: asaasHeaders,
      body: JSON.stringify({
        customer: customerId,
        billingType: "PIX",
        value: pkg.price_cents / 100,
        dueDate: dueDateStr,
        description: `Content Engine — ${pkg.name} (${pkg.credits} créditos)`,
        externalReference: user.id,
      }),
    });
    const paymentData = await paymentRes.json();

    if (!paymentData.id) {
      console.error("Failed to create Asaas payment:", paymentData);
      return new Response(
        JSON.stringify({ error: "Erro ao criar cobrança" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get PIX QR code
    const qrRes = await fetch(
      `${ASAAS_BASE}/payments/${paymentData.id}/pixQrCode`,
      { headers: asaasHeaders }
    );
    const qrData = await qrRes.json();

    // Save payment record (service role bypasses RLS)
    await supabase.from("payments").insert({
      user_id: user.id,
      package_id: pkg.id,
      asaas_payment_id: paymentData.id,
      asaas_customer_id: customerId,
      status: "pending",
    });

    return new Response(
      JSON.stringify({
        paymentId: paymentData.id,
        pixQrCodeBase64: qrData.encodedImage ?? null,
        pixCopyPaste: qrData.payload ?? null,
        expirationDate: paymentData.dueDate,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("process-payment error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
