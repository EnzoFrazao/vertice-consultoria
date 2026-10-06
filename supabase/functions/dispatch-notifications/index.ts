// Consumes the notification_deliveries outbox and sends emails through Resend.
// Never throws to the caller: failures are recorded on the delivery row.
import { createClient } from "npm:@supabase/supabase-js@2";

const BATCH_SIZE = 10;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

interface DeliveryRow {
  id: string;
  notifications: {
    title: string;
    message: string;
    user_id: string;
    profiles: { email: string } | { email: string }[] | null;
  } | null;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function recipientOf(row: DeliveryRow): string | null {
  // Resend without a verified domain only delivers to the account owner's email.
  const override = Deno.env.get("TEST_RECIPIENT");
  if (override) return override;
  const profile = row.notifications?.profiles;
  if (!profile) return null;
  return Array.isArray(profile) ? (profile[0]?.email ?? null) : profile.email;
}

async function processDelivery(row: DeliveryRow): Promise<"sent" | "failed"> {
  const now = () => new Date().toISOString();
  try {
    const to = recipientOf(row);
    if (!row.notifications || !to) {
      throw new Error("Notification or recipient email not found");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
        // Retries of the same delivery never produce a second email.
        "Idempotency-Key": row.id
      },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM") ?? "Vertice <onboarding@resend.dev>",
        to: [to],
        subject: row.notifications.title,
        html: `<h2>${escapeHtml(row.notifications.title)}</h2><p>${escapeHtml(row.notifications.message)}</p>`
      })
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`Resend ${response.status}: ${JSON.stringify(body)}`);
    }

    await supabase
      .from("notification_deliveries")
      .update({
        status: "sent",
        provider_message_id: body.id ?? null,
        attempted_at: now(),
        delivered_at: now(),
        error_message: null
      })
      .eq("id", row.id)
      .eq("status", "queued");
    return "sent";
  } catch (error) {
    await supabase
      .from("notification_deliveries")
      .update({
        status: "failed",
        attempted_at: now(),
        error_message: error instanceof Error ? error.message : String(error)
      })
      .eq("id", row.id)
      .eq("status", "queued");
    return "failed";
  }
}

Deno.serve(async (request) => {
  const secret = Deno.env.get("DISPATCH_SECRET");
  if (!secret || request.headers.get("x-dispatch-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data, error } = await supabase
    .rpc("claim_notification_deliveries", { batch_size: BATCH_SIZE })
    .select("id, notifications(title, message, user_id, profiles(email))");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const results = { sent: 0, failed: 0 };
  for (const row of (data ?? []) as unknown as DeliveryRow[]) {
    results[await processDelivery(row)]++;
  }

  return Response.json(results);
});
