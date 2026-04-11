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
    const { package_id, cpf_cnpj, billing_type, credit_card, card_holder_info } = await req.json();

    if (!package_id) {
      return new Response(JSON.stringify({ error: "package_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!cpf_cnpj) {
      return new Response(JSON.stringify({ error: "CPF/CNPJ obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const billingType = billing_type === "CREDIT_CARD" ? "CREDIT_CARD" : "PIX";

    if (billingType === "CREDIT_CARD" && (!credit_card || !card_holder_info)) {
      return new Response(JSON.stringify({ error: "Dados do cartão obrigatórios" }), {
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

    // Find or create customer (now with cpfCnpj)
    const cleanCpfCnpj = cpf_cnpj.replace(/\D/g, "");

    const searchRes = await fetch(
      `${ASAAS_BASE}/customers?cpfCnpj=${cleanCpfCnpj}`,
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
          cpfCnpj: cleanCpfCnpj,
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

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    const paymentBody: Record<string, unknown> = {
      customer: customerId,
      billingType,
      value: pkg.price_cents / 100,
      dueDate: dueDateStr,
      description: `Content Engine — ${pkg.name} (${pkg.credits} créditos)`,
      externalReference: user.id,
    };

    // For credit card, include card data directly in payment creation
    if (billingType === "CREDIT_CARD") {
      paymentBody.creditCard = {
        holderName: credit_card.holder_name,
        number: credit_card.number.replace(/\s/g, ""),
        expiryMonth: credit_card.expiry_month,
        expiryYear: credit_card.expiry_year,
        ccv: credit_card.ccv,
      };
      paymentBody.creditCardHolderInfo = {
        name: card_holder_info.name,
        email,
        cpfCnpj: cleanCpfCnpj,
        postalCode: card_holder_info.postal_code?.replace(/\D/g, "") || "00000000",
        addressNumber: card_holder_info.address_number || "0",
        phone: card_holder_info.phone?.replace(/\D/g, "") || "",
      };
    }

    const paymentRes = await fetch(`${ASAAS_BASE}/payments`, {
      method: "POST",
      headers: asaasHeaders,
      body: JSON.stringify(paymentBody),
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

    // Save payment record
    await supabase.from("payments").insert({
      user_id: user.id,
      package_id: pkg.id,
      asaas_payment_id: paymentData.id,
      asaas_customer_id: customerId,
      status: paymentData.status === "CONFIRMED" || paymentData.status === "RECEIVED" ? "confirmed" : "pending",
    });

    // If credit card payment was confirmed immediately, credit the user
    if (paymentData.status === "CONFIRMED" || paymentData.status === "RECEIVED") {
      await supabase.rpc("debit_credits", { p_user_id: user.id, p_amount: -pkg.credits });
      // Actually we need to ADD credits. debit_credits subtracts. Let's update balance directly.
      const { data: currentCredits } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (currentCredits) {
        await supabase
          .from("user_credits")
          .update({ balance: currentCredits.balance + pkg.credits, updated_at: new Date().toISOString() })
          .eq("user_id", user.id);
      }

      return new Response(
        JSON.stringify({
          paymentId: paymentData.id,
          billingType: "CREDIT_CARD",
          status: "confirmed",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // PIX flow: get QR code with retry (Asaas needs time to generate)
    let qrData: Record<string, unknown> = {};
    for (let attempt = 1; attempt <= 3; attempt++) {
      const qrRes = await fetch(
        `${ASAAS_BASE}/payments/${paymentData.id}/pixQrCode`,
        { headers: asaasHeaders }
      );
      qrData = await qrRes.json();
      console.log(`PIX QR attempt ${attempt}:`, JSON.stringify(qrData));
      if (qrData.encodedImage && qrData.payload) break;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
    }

    return new Response(
      JSON.stringify({
        paymentId: paymentData.id,
        billingType: "PIX",
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
