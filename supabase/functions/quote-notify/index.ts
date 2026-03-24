import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, company, phone, product_code, product_name, message, language } = await req.json();

    console.log("📧 New quote request received:", { name, email, product_code, product_name });

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUsername = Deno.env.get("SMTP_USERNAME");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || "info@nexfluid.it";

    if (!smtpHost || !smtpUsername || !smtpPassword) {
      console.error("SMTP credentials not configured");
      return new Response(
        JSON.stringify({ success: false, error: "SMTP not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build email content
    const subject = `Nuova Richiesta Preventivo${product_code ? ` — ${product_code}` : ""}${product_name ? ` (${product_name})` : ""}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #0f172a; color: #fff; padding: 20px 24px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">📋 Nuova Richiesta Preventivo</h1>
    <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.8;">Nexfluid — Automation in Stock</p>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr><td style="padding: 8px 0; font-weight: bold; width: 120px; vertical-align: top;">Nome:</td><td style="padding: 8px 0;">${name}</td></tr>
      <tr><td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
      ${company ? `<tr><td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Azienda:</td><td style="padding: 8px 0;">${company}</td></tr>` : ""}
      ${phone ? `<tr><td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Telefono:</td><td style="padding: 8px 0;"><a href="tel:${phone}">${phone}</a></td></tr>` : ""}
      ${product_code ? `<tr><td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Codice:</td><td style="padding: 8px 0; font-family: monospace; background: #f1f5f9; padding: 4px 8px; border-radius: 4px;">${product_code}</td></tr>` : ""}
      ${product_name ? `<tr><td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Prodotto:</td><td style="padding: 8px 0;">${product_name}</td></tr>` : ""}
    </table>
    ${message ? `
    <div style="margin-top: 16px; padding: 12px 16px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #f97316;">
      <p style="margin: 0 0 4px; font-weight: bold; font-size: 13px;">Messaggio:</p>
      <p style="margin: 0; font-size: 14px; line-height: 1.5;">${message}</p>
    </div>` : ""}
    <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">Lingua: ${language === "en" ? "English" : "Italiano"} · Ricevuto il ${new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" })}</p>
  </div>
</body>
</html>`.trim();

    const textBody = [
      `Nuova Richiesta Preventivo — Nexfluid`,
      ``,
      `Nome: ${name}`,
      `Email: ${email}`,
      company ? `Azienda: ${company}` : null,
      phone ? `Telefono: ${phone}` : null,
      product_code ? `Codice Prodotto: ${product_code}` : null,
      product_name ? `Prodotto: ${product_name}` : null,
      message ? `\nMessaggio:\n${message}` : null,
      ``,
      `Lingua: ${language === "en" ? "English" : "Italiano"}`,
      `Ricevuto il ${new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome" })}`,
    ].filter(Boolean).join("\n");

    // Connect and send via SMTP
    const client = new SmtpClient();

    await client.connectTLS({
      hostname: smtpHost,
      port: smtpPort,
      username: smtpUsername,
      password: smtpPassword,
    });

    await client.send({
      from: fromEmail,
      to: fromEmail, // Send notification TO the same business email
      subject: subject,
      content: textBody,
      html: htmlBody,
    });

    await client.close();

    console.log("✅ Quote notification email sent successfully to", fromEmail);

    return new Response(
      JSON.stringify({ success: true, message: "Quote notification email sent" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Quote notify error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
