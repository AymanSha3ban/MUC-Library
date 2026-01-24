import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.35.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==========================================================
// 🚨 Admin Emails List (Lowercased)
// ==========================================================
const ADMIN_EMAILS = [
  "ayman.23120261@muc.edu.eg",
  "yasmin-abdelnaby@muc.edu.eg",
  "mohamed.abdelsalam@muc.edu.eg"
].map(email => email.toLowerCase());
// ==========================================================

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response('ok', { headers: corsHeaders });

  try {
    // 1. Parse Request
    const { token, code, email } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!
    );

    // 2. Build Query
    let query = supabase
      .from("verifications")
      .select("*")
      .eq("code", code)
      .eq("used", false);

    if (token) {
      query = query.eq("token", token);
    } else if (email) {
      query = query.eq("email", email);
    } else {
      throw new Error("Missing data: email or token required");
    }

    // Get latest verification code
    const { data: record, error: dbError } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbError) throw dbError;

    // 3. Verify Record Exists
    if (!record) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired code." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // 4. Check Expiration
    if (record.expires_at && new Date(record.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "Code expired. Please request a new one." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // --- Success ---

    // Mark as used
    await supabase.from("verifications").update({ used: true }).eq("id", record.id);

    const userEmail = record.email;
    const normalizedEmail = userEmail.toLowerCase();

    // Determine Role
    const role = ADMIN_EMAILS.includes(normalizedEmail) ? "admin" : "student";

    // 5. ID Synchronization Logic
    let authUserId = null;
    try {
      // Find user in Auth
      const { data, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

      if (listError) console.error("List users error:", listError);

      const users = data?.users || [];
      const targetUser = users.find(u => u.email?.toLowerCase() === normalizedEmail);

      if (targetUser) {
        authUserId = targetUser.id;
        // Update Auth metadata
        await supabase.auth.admin.updateUserById(targetUser.id, {
          user_metadata: { role: role }
        });
      } else {
        // Create new Auth user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: userEmail,
          email_confirm: true,
          user_metadata: { role: role }
        });

        if (newUser?.user) {
          authUserId = newUser.user.id;
        } else if (createError) {
          console.error("Create user error:", createError);
        }
      }
    } catch (e) {
      console.error("Auth sync error:", e);
    }

    // Sync with public.users
    try {
      if (authUserId) {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .ilike("email", userEmail)
          .maybeSingle();

        if (existingUser) {
          if (existingUser.id !== authUserId) {
            // ID Mismatch: Update public ID to match Auth ID
            const { error: updateIdError } = await supabase
              .from("users")
              .update({ id: authUserId, role: role })
              .eq("id", existingUser.id);

            if (updateIdError) {
              console.error("Failed to sync ID:", updateIdError);
              // Fallback: just update role
              await supabase.from("users").update({ role }).eq("id", existingUser.id);
            }
          } else {
            // ID Match: Update role
            await supabase.from("users").update({ role }).eq("id", authUserId);
          }
        } else {
          // New public user
          await supabase.from("users").insert({
            id: authUserId,
            email: userEmail,
            role: role
          });
        }
      } else {
        // Fallback if Auth ID not found
        await supabase.from("users").upsert({ email: userEmail, role }, { onConflict: "email" });
      }
    } catch (e) {
      console.error("Public user sync error:", e);
    }

    // 6. Generate Magic Link
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