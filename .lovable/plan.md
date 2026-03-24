
## Quick answer first
- **Website/server IP:** `185.158.133.1` (this is for your website A record, not mail hosting).
- I also checked your current setup: **no app email domain is configured yet**.

## Best path for your requirement (keep email on your current server)
You said you do **not** want to change nameservers and want email to stay on your own server.  
So the best plan is:

1. **Do not use delegated app-email domain setup** (the flow that asks for NS delegation).
2. Keep your existing DNS + MX exactly as-is at Goentri.
3. Configure quote notifications to send through **your existing mail server (SMTP)** instead.

## Implementation plan
1. **Collect SMTP details from your current mail host**
   - SMTP host
   - Port
   - Username
   - Password
   - Encryption (TLS/SSL)
   - Sender address (e.g. `info@nexfluid.it`)

2. **Store SMTP credentials securely**
   - Add them as backend secrets (not in frontend code).

3. **Upgrade quote notification function**
   - Your current quote notification function logs requests but does not send real emails.
   - I will update it to send actual emails via your SMTP server to `info@nexfluid.it`.

4. **Keep quote saving behavior safe**
   - Quote requests remain saved in database even if email delivery temporarily fails.
   - Add clear logging and error handling so delivery issues are traceable.

5. **End-to-end verification**
   - Submit a quote from product page + contact page.
   - Confirm email arrives in inbox (and check spam once).
   - Verify quote is still stored in admin inbox.

## Technical details
- You do **not** need to change your domain’s main nameservers for this SMTP approach.
- If in future you want app-managed emails, that requires **subdomain NS delegation** (not root NS), but for now we will avoid that entirely.
- This approach fully matches your requirement: **email stays on your server**.
