import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Log the quote request for now
    console.log("📧 New quote request received:", {
      name, email, company, phone, product_code, product_name, message, language
    });

    // Build notification email body
    const emailBody = `
New Quote Request from Nexfluid

Customer: ${name}
Email: ${email}
${company ? `Company: ${company}` : ""}
${phone ? `Phone: ${phone}` : ""}
${product_code ? `Product Code: ${product_code}` : ""}
${product_name ? `Product: ${product_name}` : ""}
${message ? `Message: ${message}` : ""}
Language: ${language || "it"}

---
This is an automated notification from Nexfluid.
    `.trim();

    console.log("Email body prepared:", emailBody);

    // When email domain is configured, this will send via Lovable's email infrastructure.
    // For now, the quote is safely stored in the database.

    return new Response(
      JSON.stringify({ success: true, message: "Quote notification processed" }),
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
