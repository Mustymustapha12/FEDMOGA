# FEDMOGA Sites test portal

This is the Sites-native source. It is a private test deployment, separate from the Next.js/PostgreSQL source in the earlier archive.

## Current capabilities

- ChatGPT authentication plus server-checked Admin and Super Admin roles. Initial Super Admin bootstraps for the private Site owner account `abduljalilmustapha007@gmail.com` on first admin access.
- Server-side D1 records, registration details, fee and form editor, admin creation and role management.
- Encrypted-at-rest Paystack test and live keys, with secret values never returned from the settings endpoint.
- Paystack test checkout can be enabled by Super Admin. It initializes transactions server-side, verifies amount/currency/reference/email and signature-checks webhooks.
- Live credentials may be saved but live checkout activation is intentionally locked.

## Before public or live use

Private Sites access prevents ordinary applicants and Paystack webhooks from reaching the portal. A public access policy, tested public webhook, reliable emailed continuation links for interrupted payments, receipt PDFs, mature admin invitation/access flow, audit logging, abuse controls, and full acceptance tests are required. Do not enter real member data or publish this as a production membership system. The test checkout is a trial and must use Paystack test keys only.

## Paystack test setup

In Admin → Settings save `pk_test_...` and `sk_test_...` then check Enable Paystack test checkout. In Paystack, set callback (passed per transaction) and webhook `https://fedmoga-membership-test.abduljalilmustapha00.chatgpt.site/api/paystack/webhook`. This private Site currently blocks external webhooks, so callback verification is the only available test path until public hosting is configured. Never set live keys in the test checkout.
