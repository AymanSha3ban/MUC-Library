import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.35.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. التعامل مع CORS
  if (req.method === "OPTIONS") {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, code } = await req.json();
    console.log(`Verifying Code: ${code} for Token: ${token}`);

    // التأكد من وجود المفاتيح
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 2. التحقق من الكود في جدول verifications
    const { data: verification, error: verifyError } = await supabase
      .from("verifications")
      .select("*")
      .eq("token", token)
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString()) // التأكد إنه لسه ساري
      .single();

    if (verifyError || !verification) {
      console.error("Verification failed:", verifyError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Code verified successfully, updating status...");

    // 3. حرق الكود (عشان مايستخدمش تاني)
    await supabase
      .from("verifications")
      .update({ used: true })
      .eq("id", verification.id);

    const email = verification.email;
    // تحديد الصلاحية (Admin لصاحب الإيميل ده، Student للباقي)
    const role = email === "ayman.23120261@muc.edu.eg" ? "admin" : "student";

    // 4. تسجيل المستخدم في جدول users (الخاص بيك)
    const { error: userError } = await supabase
      .from("users")
      .upsert({ email, role }, { onConflict: "email" });

    if (userError) {
      console.error("User Upsert Error:", userError);
      throw userError;
    }

    console.log("Creating/Checking Auth User...");

    // 5. إنشاء المستخدم في Supabase Auth (لو مش موجود)
    // بنستخدم try/catch هنا عشان لو المستخدم موجود ميديناش Error
    try {
      const { error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: { role: role }
      });
      if (createError) throw createError;
    } catch (e) {
      // لو الخطأ إن المستخدم موجود، كمل عادي. لو خطأ تاني، ارمي Error
      if (!e.message?.includes("already registered")) {
        console.log("User already exists, proceeding to login...");
      } else {
         console.error("Create User Error:", e);
      }
    }

    // 6. توليد رابط تسجيل الدخول السحري (Magic Link)
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (linkError) throw linkError;

    // الرابط ده هو اللي بيخلي المستخدم يعمل Login فعلياً
    const actionLink = linkData.properties.action_link;

    console.log("Login link generated successfully");

    return new Response(
      JSON.stringify({
        message: "Verified",
        redirectUrl: actionLink, // الـ Frontend لازم يوجه المستخدم للرابط ده
        role: role
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Critical Function Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});