import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { projectId, displayName, role, contractorRole, password } = await req.json();

    if (!projectId || !displayName || !role || !password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 4) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 4 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const nameNorm = normalizeName(displayName);

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("user_token, display_name, role, contractor_role, password_hash")
      .eq("project_id", projectId)
      .eq("name_norm", nameNorm)
      .eq("role", role)
      .maybeSingle();

    let user;
    let mode = "register";

    if (existingUser) {
      // User exists - verify password
      if (!existingUser.password_hash) {
        return new Response(
          JSON.stringify({ error: "This account was created before passwords were added. Please contact an administrator." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const passwordMatch = await bcrypt.compare(password, existingUser.password_hash);
      
      if (!passwordMatch) {
        // Add delay to prevent brute force
        await new Promise(resolve => setTimeout(resolve, 1000));
        return new Response(
          JSON.stringify({ error: "Wrong password for this name and role" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update last_seen
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({ last_seen: new Date().toISOString() })
        .eq("user_token", existingUser.user_token)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      
      user = updatedUser;
      mode = "login";
    } else {
      // Create new user
      const passwordHash = await bcrypt.hash(password);

      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          project_id: projectId,
          display_name: displayName,
          name_norm: nameNorm,
          role: role,
          contractor_role: role === 'contractor' ? contractorRole : null,
          password_hash: passwordHash,
        })
        .select()
        .single();

      if (userError) {
        // Check if it's a unique constraint violation (race condition)
        if (userError.code === '23505') {
          // Try again as login
          const { data: retryUser } = await supabase
            .from("users")
            .select("user_token, display_name, role, contractor_role, password_hash")
            .eq("project_id", projectId)
            .eq("name_norm", nameNorm)
            .eq("role", role)
            .maybeSingle();

          if (retryUser && await bcrypt.compare(password, retryUser.password_hash || "")) {
            await supabase
              .from("users")
              .update({ last_seen: new Date().toISOString() })
              .eq("user_token", retryUser.user_token);
            user = retryUser;
            mode = "login";
          } else {
            return new Response(
              JSON.stringify({ error: "This name and role combination already exists with a different password" }),
              { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          throw userError;
        }
      } else {
        user = newUser;
      }
    }

    // Create session
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const clientIp = req.headers.get("x-forwarded-for") || "unknown";

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_token: user.user_token,
        session_token: sessionToken,
        project_id: projectId,
        expires_at: expiresAt.toISOString(),
        ip_address: clientIp,
      })
      .select()
      .single();

    if (sessionError) {
      throw sessionError;
    }

    // Log action
    await supabase.from("audit_logs").insert({
      user_token: user.user_token,
      action: mode === "login" ? "sign_in" : "register",
      details: { display_name: user.display_name, role: user.role, mode },
      ip_address: clientIp,
    });

    return new Response(
      JSON.stringify({
        success: true,
        mode: mode,
        session: {
          session_token: sessionToken,
          user_token: user.user_token,
          display_name: user.display_name,
          role: user.role,
          contractor_role: user.contractor_role,
          expires_at: expiresAt.toISOString(),
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
