import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { token, code } = await req.json();

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SERVICE_ROLE_KEY") ?? ""
        );

        // Check verification
        const { data: verification, error: verifyError } = await supabase
            .from("verifications")
            .select("*")
            .eq("token", token)
            .eq("code", code)
            .eq("used", false)
            .gt("expires_at", new Date().toISOString())
            .single();

        if (verifyError || !verification) {
            return new Response(
                JSON.stringify({ error: "Invalid or expired code" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        // Mark as used
        await supabase
            .from("verifications")
            .update({ used: true })
            .eq("id", verification.id);

        // Determine role
        const email = verification.email;
        const role = email === "ayman.23120261@muc.edu.eg" ? "admin" : "student";

        // Upsert user
        const { data: user, error: userError } = await supabase
            .from("users")
            .upsert({ email, role }, { onConflict: "email" })
            .select()
            .single();

        if (userError) throw userError;

        // Create Supabase Auth User if not exists, and sign them in.
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            email_confirm: true,
            user_metadata: { role: role }
        });

        // Generate a session/token for this user.
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
        });

        if (linkError) throw linkError;

        return new Response(
            JSON.stringify({
                message: "Verified",
                user,
                session: linkData
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
