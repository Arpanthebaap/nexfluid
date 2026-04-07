

# Create Privacy Policy and Cookie Policy Pages

## Context

The site is Nexfluid — an Italian B2B industrial components distributor based in Saccolongo (PD), Italy. It collects user data via a quote request form (name, surname, email, phone, message) stored in the database. The footer has placeholder `#` links for "Privacy Policy" and "Cookie Policy" that need real pages.

Key data points for policy content:
- **Company**: Nexfluid, Via De Gasperi 6 Z.I., Saccolongo (PD), Italy
- **Email**: info@nexfluid.it | **Phone**: 049.8016529
- **Data collected**: Name, email, phone, message (via quote request form)
- **Third-party services**: WhatsApp chat button, analytics (if any)
- **Cookies**: Session/functional cookies from the app, potential analytics cookies
- **Applicable law**: GDPR (EU), Italian Privacy Code (D.Lgs. 196/2003 as amended by D.Lgs. 101/2018)
- **Languages**: Italian (primary) + English

## Plan

### 1. Create `src/pages/PrivacyPolicy.tsx`
- Professional GDPR-compliant privacy policy page
- Bilingual (IT/EN) using the existing i18n system
- Sections: Data Controller, Data Collected, Purpose & Legal Basis, Data Retention, Third Parties, User Rights, Contact
- Styled consistently with the site (same layout, heading styles, spacing)

### 2. Create `src/pages/CookiePolicy.tsx`
- Cookie policy page explaining technical/functional cookies used
- Bilingual (IT/EN)
- Sections: What Are Cookies, Types Used (technical, functional), Third-Party Cookies, How to Manage Cookies, Contact

### 3. Update `src/App.tsx`
- Add lazy-loaded routes: `/privacy-policy` and `/cookie-policy` under PublicLayout

### 4. Update `src/components/layout/Footer.tsx`
- Change `<a href="#">Privacy Policy</a>` → `<Link to="/privacy-policy">`
- Change `<a href="#">Cookie Policy</a>` → `<Link to="/cookie-policy">`

### Files to modify
| File | Change |
|------|--------|
| `src/pages/PrivacyPolicy.tsx` | New — full privacy policy page with IT/EN content |
| `src/pages/CookiePolicy.tsx` | New — full cookie policy page with IT/EN content |
| `src/App.tsx` | Add two new lazy routes |
| `src/components/layout/Footer.tsx` | Link footer policy links to new pages |

