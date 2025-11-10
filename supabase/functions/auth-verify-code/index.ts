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

    if (code === CONTRACTOR_CODE) {
      userRole = "contractor";
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

    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        display_name: displayName,
        role: userRole,
      })
      .select()
      .single();

    if (userError) {
      throw userError;
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
