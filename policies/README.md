# SUPERNOVA — Store Policies

These are the legal/store policies referenced by the footer
(`shop.policies.*`). **The text does not live in the theme** — Shopify stores
it in the admin under **Settings → Policies**. The theme only links to it.

## How to publish them

1. In Shopify admin, go to **Settings → Policies**.
2. For each policy below, paste the matching file's content into the right box:
   - `refund-policy.md` → **Return and refund policy**
   - `privacy-policy.md` → **Privacy policy**
   - `terms-of-service.md` → **Terms of service**
   - `shipping-policy.md` → **Shipping policy**
   - `legal-notice.md` → **Legal notice** (a.k.a. Impressum)
3. Click **Save**. The footer links appear automatically once a policy has content.

> Shopify's policy editor is rich text. Pasting the text works fine; you can
> bold headings and add the tables manually if you want them styled.

## Before you go live — fill these in

Every `[BRACKETED]` field is real business info only you have. Search each
file for `[` and replace:

- `[LEGAL ENTITY NAME]` — the registered company / sole-trader name behind SUPERNOVA
- `[STREET ADDRESS]`, `[POSTAL CODE]`, `[CITY]` — registered business address (NL)
- `[KVK NUMBER]` — your Dutch Chamber of Commerce (KvK) number
- `[BTW / VAT NUMBER]` — your VAT (BTW) number
- `[SUPPORT EMAIL]` — e.g. `hello@supernova.store`
- `[RETURNS EMAIL]` — can be the same as support
- `[CARRIER]` — e.g. PostNL
- `[STANDARD SHIPPING COST]` — flat NL rate under the free threshold
- `[ORDER PROCESSING TIME]` — e.g. 1–2 business days

## ⚠️ Important notes

- **This is a solid, EU/NL-aware template, not certified legal advice.** Have a
  lawyer or your accountant glance at it before launch, especially the VAT,
  refund-window, and data-controller details.
- **Announcement bar vs. reality:** the site currently announces *"FREE EU
  SHIPPING OVER €50"*, but you're starting NL-only. Either narrow the banner to
  the Netherlands for now, or keep the EU promise and enable EU shipping zones in
  **Settings → Shipping and delivery**. The shipping policy below is written
  NL-first with an "International (coming soon)" section to match.
