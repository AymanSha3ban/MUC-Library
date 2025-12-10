import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.35.0";
import { qrcode } from "https://deno.land/x/qrcode/mod.ts";
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";
import { writeAll } from "https://deno.land/std@0.168.0/streams/write_all.ts";

// حل مشكلة Deno.writeAll
if (!(Deno as any).writeAll) {
  (Deno as any).writeAll = writeAll;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || !email.endsWith("@muc.edu.eg")) {
      return new Response(
        JSON.stringify({ error: "Invalid email domain. Must be @muc.edu.eg" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Keys");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const token = crypto.randomUUID();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // صلاحية الكود 15 دقيقة
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: dbError } = await supabase
      .from("verifications")
      .insert({ 
        email, 
        token, 
        code, 
        expires_at: expiresAt 
      });

    if (dbError) throw dbError;

    const frontendUrl = Deno.env.get("FRONTEND_URL") ?? "http://localhost:5173";
    const verifyUrl = `${frontendUrl}/verify?token=${token}`;
    const qrImage = await qrcode(code);

    // إرسال الإيميل
    const client = new SmtpClient();
    await client.connectTLS({
      hostname: Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com",
      port: parseInt(Deno.env.get("SMTP_PORT") ?? "465"),
      username: Deno.env.get("SMTP_USER") ?? "",
      password: Deno.env.get("SMTP_PASS") ?? "",
    });

    await client.send({
      from:"muclibrary@muc.edu.eg",
      to: email,
      subject: "MUC Library Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>Your Verification Code</h2>
          <h1 style="color: #2563eb; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          <p>This code will expire in 15 minutes.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <img src="${qrImage}" alt="QR Code" width="200" height="200" />
        </div>
      `,
    });

    await client.close();

    return new Response(
      JSON.stringify({ message: "Sent" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
