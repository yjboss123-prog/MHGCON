import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CONTRACTOR_CODE = "BUILD2025";
const ELEVATED_CODE = "ADMINMASTER";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { code, displayName, role } = await req.json();

    if (!code || !displayName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let userRole: string;
    let contractorRole: string | null = null;

    if (code === CONTRACTOR_CODE) {
      userRole = "contractor";
      contractorRole = role || "Construction Contractor";
    } else if (code === ELEVATED_CODE) {
      if (!role || !["admin", "developer", "project_manager"].includes(role)) {
        return new Response(
          JSON.stringify({ error: "Invalid role for elevated code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userRole = role;
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return new Response(
        JSON.stringify({ error: "Invalid access code" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user already exists with same display name, role, and contractor_role
    let user;
    const { data: existingUser } = await supabase
      .from("users")
      .select()
      .eq("display_name", displayName)
      .eq("role", userRole)
      .eq("contractor_role", contractorRole || null)
      .maybeSingle();

    if (existingUser) {
      // Update last_active_at for existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({ last_active_at: new Date().toISOString() })
        .eq("user_token", existingUser.user_token)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      user = updatedUser;
    } else {
      // Create new user
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          display_name: displayName,
          role: userRole,
          contractor_role: contractorRole,
        })
        .select()
        .single();

      if (userError) {
        throw userError;
      }
      user = newUser;
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const clientIp = req.headers.get("x-forwarded-for") || "unknown";

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_token: user.user_token,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: clientIp,
      })
      .select()
      .single();

    if (sessionError) {
      throw sessionError;
    }

    await supabase.from("audit_logs").insert({
      user_token: user.user_token,
      action: "sign_in",
      details: { display_name: displayName, role: userRole },
      ip_address: clientIp,
    });

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          session_token: sessionToken,
          user_token: user.user_token,
          display_name: displayName,
          role: userRole,
          contractor_role: contractorRole,
          expires_at: expiresAt.toISOString(),
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});