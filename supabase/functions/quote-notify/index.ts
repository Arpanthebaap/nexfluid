const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// The SSL cert on Shellrent's SMTP is for *.shellrent.com, not smtp.nexfluid.it
// We connect to the IP but present the matching SNI hostname for TLS validation
const SMTP_TLS_HOSTNAME = "smtpmaster127.shellrent.com";
const SMTP_IP = "185.169.25.106";

async function sendSmtpEmail(
  port: number,
  username: string,
  password: string,
  from: string,
  to: string,
  subject: string,
  textBody: string,
  htmlBody: string
): Promise<void> {
  const conn = await Deno.connectTls({
    hostname: SMTP_IP,
    port,
    // SNI hostname must match the certificate CN
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  async function readResponse(): Promise<string> {
    const buf = new Uint8Array(4096);
    const n = await conn.read(buf);
    if (n === null) throw new Error("Connection closed");
    return decoder.decode(buf.subarray(0, n));
  }

  async function sendCommand(cmd: string): Promise<string> {
    await conn.write(encoder.encode(cmd + "\r\n"));
    return await readResponse();
  }

  try {
    // Read greeting
    const greeting = await readResponse();
    console.log("SMTP greeting:", greeting.trim());

    // EHLO
    await sendCommand("EHLO nexfluid.it");

    // AUTH LOGIN
    await sendCommand("AUTH LOGIN");
    await sendCommand(btoa(username));
    const authResult = await sendCommand(btoa(password));
    if (!authResult.startsWith("235")) {
      throw new Error(`SMTP Auth failed: ${authResult.trim()}`);
    }

    // MAIL FROM
    const fromResult = await sendCommand(`MAIL FROM:<${from}>`);
    if (!fromResult.startsWith("250")) throw new Error(`MAIL FROM failed: ${fromResult.trim()}`);

    // RCPT TO
    const rcptResult = await sendCommand(`RCPT TO:<${to}>`);
    if (!rcptResult.startsWith("250")) throw new Error(`RCPT TO failed: ${rcptResult.trim()}`);

    // DATA
    const dataResult = await sendCommand("DATA");
    if (!dataResult.startsWith("354")) throw new Error(`DATA failed: ${dataResult.trim()}`);

    // Build MIME message
    const boundary = `----=_Part_${Date.now()}`;
    const message = [
      `From: "Nexfluid" <${from}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      `Date: ${new Date().toUTCString()}`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      textBody,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      htmlBody,
      ``,
      `--${boundary}--`,
      ``,
      `.`,
    ].join("\r\n");

    const sendResult = await sendCommand(message);
    if (!sendResult.startsWith("250")) throw new Error(`Send failed: ${sendResult.trim()}`);

    // QUIT
    await sendCommand("QUIT");
  } finally {
    try { conn.close(); } catch { /* ignore */ }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, company, phone, product_code, product_name, message, language } = await req.json();

    console.log("📧 Quote request:", { name, email, product_code, product_name });

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

    await sendSmtpEmail(smtpPort, smtpUsername, smtpPassword, fromEmail, fromEmail, subject, textBody, htmlBody);

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
