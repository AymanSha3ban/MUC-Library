import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.35.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response('ok', { headers: corsHeaders });

  try {
    // 1. استقبال الإيميل أيضاً
    const { token, code, email } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!
    );

    // 2. بناء الاستعلام حسب المتوفر (إيميل أو توكن)
    let query = supabase
      .from("verifications")
      .select("*")
      .eq("code", code)
      .eq("used", false); // الكود لازم يكون غير مستخدم

    if (token) {
      // لو جاي من الرابط
      query = query.eq("token", token);
    } else if (email) {
      // لو جاي من صفحة الدخول (بالإيميل)
      query = query.eq("email", email);
    } else {
      throw new Error("البيانات ناقصة: يجب إرسال الإيميل أو التوكن");
    }

    // نجيب أحدث كود (عشان لو طلب كذا مرة)
    const { data: record, error: dbError } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbError) throw dbError;

    // 3. التحقق من وجود السجل
    if (!record) {
      return new Response(
        JSON.stringify({ error: "الكود غير صحيح أو منتهي الصلاحية." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 4. التحقق من الوقت (اختياري: ممكن توقفه لو لسه بيعمل مشاكل)
    if (record.expires_at && new Date(record.expires_at) < new Date()) {
       return new Response(
        JSON.stringify({ error: "لقد انتهت صلاحية هذا الكود. حاول طلب كود جديد." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // --- النجاح ---

    // حرق الكود
    await supabase.from("verifications").update({ used: true }).eq("id", record.id);

    const userEmail = record.email;
    const role = userEmail === "ayman.23120261@muc.edu.eg" ? "admin" : "student";

    // تحديث جدول المستخدمين
    await supabase.from("users").upsert({ email: userEmail, role }, { onConflict: "email" });

    // إنشاء المستخدم في Auth (لو مش موجود)
    try {
      await supabase.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        user_metadata: { role: role }
      });
    } catch (e) {}

    // توليد رابط الدخول
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    return new Response(
      JSON.stringify({
        message: "Verified",
        redirectUrl: linkData?.properties?.action_link,
        role: role
      }),
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