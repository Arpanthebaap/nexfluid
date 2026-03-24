// deno-lint-ignore-file
import nodemailer from "npm:nodemailer@6.9.16";

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

    console.log("📧 Quote request:", { name, email, product_code, product_name });
    console.log("SMTP config:", { host: Deno.env.get("SMTP_HOST"), user: Deno.env.get("SMTP_USERNAME"), hasPass: !!Deno.env.get("SMTP_PASSWORD"), passLen: Deno.env.get("SMTP_PASSWORD")?.length });

    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.nexfluid.it";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
    const smtpUsername = Deno.env.get("SMTP_USERNAME")!;
    const smtpPassword = Deno.env.get("SMTP_PASSWORD")!;
    const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || "info@nexfluid.it";

    if (!smtpUsername || !smtpPassword) {
      return new Response(
        JSON.stringify({ success: false, error: "SMTP not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use port 587 with STARTTLS — Shellrent's cert is *.shellrent.com, not smtp.nexfluid.it
    // servername tells nodemailer/TLS to validate against the actual cert CN
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: 587,
      secure: false, // STARTTLS
      auth: { user: smtpUsername, pass: smtpPassword },
      tls: { servername: "shellrent.com" },
    });

    const subject = `Nuova Richiesta Preventivo${product_code ? ` — ${product_code}` : ""}${product_name ? ` (${product_name})` : ""}`;

    const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#0f172a;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
    <h1 style="margin:0;font-size:20px;">📋 Nuova Richiesta Preventivo</h1>
    <p style="margin:4px 0 0;font-size:13px;opacity:0.8;">Nexfluid — Automation in Stock</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:8px 0;font-weight:bold;width:120px;">Nome:</td><td>${name}</td></tr>
      <tr><td style="padding:8px 0;font-weight:bold;">Email:</td><td><a href="mailto:${email}">${email}</a></td></tr>
      ${company ? `<tr><td style="padding:8px 0;font-weight:bold;">Azienda:</td><td>${company}</td></tr>` : ""}
      ${phone ? `<tr><td style="padding:8px 0;font-weight:bold;">Telefono:</td><td>${phone}</td></tr>` : ""}
      ${product_code ? `<tr><td style="padding:8px 0;font-weight:bold;">Codice:</td><td style="font-family:monospace;">${product_code}</td></tr>` : ""}
      ${product_name ? `<tr><td style="padding:8px 0;font-weight:bold;">Prodotto:</td><td>${product_name}</td></tr>` : ""}
    </table>
    ${message ? `<div style="margin-top:16px;padding:12px 16px;background:#f8fafc;border-radius:6px;border-left:3px solid #f97316;"><p style="margin:0 0 4px;font-weight:bold;font-size:13px;">Messaggio:</p><p style="margin:0;font-size:14px;line-height:1.5;">${message}</p></div>` : ""}
    <p style="margin-top:20px;font-size:12px;color:#94a3b8;">Lingua: ${language === "en" ? "English" : "Italiano"}</p>
  </div>
</body></html>`;

    const textBody = [
      `Nuova Richiesta Preventivo — Nexfluid`,
      ``, `Nome: ${name}`, `Email: ${email}`,
      company ? `Azienda: ${company}` : null,
      phone ? `Telefono: ${phone}` : null,
      product_code ? `Codice: ${product_code}` : null,
      product_name ? `Prodotto: ${product_name}` : null,
      message ? `\nMessaggio:\n${message}` : null,
    ].filter(Boolean).join("\n");

    await transporter.sendMail({
      from: `"Nexfluid" <${fromEmail}>`,
      to: fromEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });

    console.log("✅ Email sent to", fromEmail);

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
