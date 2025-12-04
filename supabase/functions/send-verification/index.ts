import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import { SmtpClient } from "smtp";
import { qrcode } from "qrcode";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || !email.endsWith("@muc.edu.eg")) {
      return new Response(
        JSON.stringify({ error: "Invalid email domain" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    // Generate token and code
    const token = crypto.randomUUID();
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in database
    const { error: dbError } = await supabase
      .from("verifications")
      .insert({ email, token, code });

    if (dbError) throw dbError;

    // Generate QR Code
    const verifyUrl = `${Deno.env.get("FRONTEND_URL")}/verify?token=${token}`;
    const qrImage = await qrcode(verifyUrl); // Base64 data URL

    // Send Email
    const client = new SmtpClient();
    await client.connectTLS({
      hostname: Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com",
      port: parseInt(Deno.env.get("SMTP_PORT") ?? "465"),
      username: Deno.env.get("SMTP_USER") ?? "",
      password: Deno.env.get("SMTP_PASS") ?? "",
    });

    await client.send({
      from: Deno.env.get("FROM_EMAIL") ?? "noreply@muc.edu.eg",
      to: email,
      subject: "MUC Library Verification",
      content: `
        <h1>Verify your email</h1>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>Or scan this QR code:</p>
        <img src="${qrImage}" alt="QR Code" />
        <p><a href="${verifyUrl}">Click here to verify</a></p>
      `,
      html: `
        <h1>Verify your email</h1>
        <p>Your verification code is: <strong>${code}</strong></p>
        <p>Or scan this QR code:</p>
        <img src="${qrImage}" alt="QR Code" />
        <p><a href="${verifyUrl}">Click here to verify</a></p>
      `,
    });

    await client.close();

    return new Response(
      JSON.stringify({ message: "Verification email sent" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
