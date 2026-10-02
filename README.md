# FEDMOGA membership portal — Hostinger Business

Standard Next.js app on Node.js 22 with a MySQL/MariaDB database. This repository is the Hostinger edition; it does not use ChatGPT login, Cloudflare Workers, D1 or Wrangler. The earlier private ChatGPT Site is separate and is not changed by these commits.

## Deploy from GitHub

1. In hPanel select **Websites → Add Website → Deploy Web App → Import Git Repository**. Connect GitHub and select `Mustymustapha12/FEDMOGA`, branch `main`.
2. Choose **Next.js**, **Node.js 22**, repository root `.`. Install command: `npm ci`. Build command: `npm run build`. Start command, if requested: `npm start`. Build output: `.next`. Use a Node.js server deployment, not a static export or an upload of HTML files. Hostinger supplies the listening port; do not hardcode it.
3. Create a new empty database under **Website Dashboard → Databases → Management**. Record its full database name, username, password and host. Hostinger normally uses `localhost:3306`; use the values shown in your dashboard. If the app cannot reach that host, confirm the app's database endpoint with Hostinger support rather than exposing the database to every IP.
4. In deployment **Environment variables**, add the values below. Use the final HTTPS domain (or your actual Hostinger temporary HTTPS address) as `APP_URL`. Do not include a trailing path. When you connect/change the domain, update `APP_URL` and redeploy before accepting payments.
5. Deploy. Open `/api/health`: expect `{"status":"ok","database":"connected"}`. Tables are created automatically, on first database access, using `CREATE TABLE IF NOT EXISTS`. The database user needs permission to create tables. No CLI or manual SQL import is required.
6. Open the portal, click **Admin**, and sign in with your configured initial Super Admin email/password. The account is created at the first login only when the database contains no admins. There is no default password or public signup.
7. Remove `SUPER_ADMIN_PASSWORD` from Hostinger's environment after successful setup and redeploy. Account credentials persist as salted scrypt hashes in MySQL; later deploys do not reset the password. Change passwords through **Account**. Super Admins can create accounts and reset other admins' passwords under **Admin users**.

## Required environment variables

| Variable | Value |
|---|---|
| `APP_URL` | Your exact public HTTPS origin, e.g. `https://members.example.org` |
| `DB_HOST` | MySQL host from hPanel, normally `localhost` |
| `DB_PORT` | `3306` |
| `DB_NAME` | Full database name, including Hostinger's prefix |
| `DB_USER` | Full MySQL username, including prefix |
| `DB_PASSWORD` | Database password |
| `SUPER_ADMIN_EMAIL` | Initial Super Admin email, e.g. `mustymustapha12@gmail.com` |
| `SUPER_ADMIN_PASSWORD` | A unique private password of 12–128 characters; remove after setup |
| `FEDMOGA_ENCRYPTION_KEY` | A permanent randomly generated 64-character hexadecimal key |
| `ALLOW_LIVE_PAYMENTS` | `false` initially |

Generate the encryption key on your own computer using:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save that value in your password manager and Hostinger environment. Do not commit it or send it in chat. Losing or changing the key makes saved Paystack secrets and outstanding encrypted registration links unreadable. Database credentials, passwords and Paystack keys are not included in this repository.

## Paystack setup

1. Sign in as Super Admin, open **Settings**, set the membership fee, and save both Paystack **test** keys. Check **Activate test checkout**. Credentials are encrypted on the server; secret values are never returned to the browser.
2. In your Paystack dashboard set the webhook to `https://YOUR-DOMAIN/api/paystack/webhook`. The callback is supplied by the app as `https://YOUR-DOMAIN/api/paystack/callback`.
3. Complete a Paystack test payment. Confirm it opens the registration form, submit the form and view the entire entry in Admin. A registration requires a verified, unexpired, single-use token. Database locking prevents simultaneous reuse. Test registration numbers include `TEST`.
4. Configure SMTP and test delivery of continuation emails and **Already paid? Recover your registration link**. Admins can also email a link from **Paid but incomplete**. The recovery link is private and expires after 30 days. Re-verifying an expired, uncompleted payment issues a fresh link.
5. Verify the webhook is accessible publicly, valid signed events succeed and invalid signatures are rejected. Test interrupted checkout, pending payments, duplicate callbacks/webhooks and duplicate registration submissions. Check that a standard Admin cannot change keys, fees, form fields or users.
6. Only after those checks, set `ALLOW_LIVE_PAYMENTS=true` in Hostinger and redeploy. Save the separate Paystack **live** keys and select **Activate live checkout**. Live activation requires HTTPS and SMTP credentials. The app does not turn on live charging automatically.

`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` configure delivery. For Hostinger mail, the typical host is `smtp.hostinger.com`, port `465`; confirm your mailbox's connection settings. `SMTP_FROM` should be the authenticated mailbox, optionally `FEDMOGA <members@your-domain.com>`. Port 587 uses mandatory STARTTLS. Callback verification permits continuing in the browser if email is temporarily unavailable; Paystack webhook retries attempt undelivered continuation emails again. Recovery and admin resend can also retry delivery.

## Local development and checks

```sh
npm ci
# Copy .env.example to .env.local and fill in your local database and secrets.
# Use APP_URL=http://localhost:3000 for npm run dev.
npm run dev
npm run typecheck
npm run build
npm test
```

Unit tests run without a database. Database integration tests require a **dedicated empty test database** (never a member/production database), `FEDMOGA_RUN_DB_TESTS=true` and the test DB environment variables. They test amount matching, signed webhooks, one-time tokens and concurrent registration using mocked Paystack responses. `FEDMOGA_APP_TEST_URL` optionally adds HTTP tests against a running app using the same dedicated test DB.

## Operations and limits

Admin sessions last eight hours, use HttpOnly/Secure/SameSite cookies in production and are revoked by password, role or active-status changes. Mutations require the exact configured origin. Login and recovery attempts are limited in MySQL. Admin changes write audit records. Simulated payment routes cannot authorize registration. Back up MySQL and the encryption key before updates. The admin screen currently shows the latest 500 payments and registrations; older records remain in MySQL.

This conversion is suitable for deployment and acceptance testing on Hostinger Business. It has not been tested against your actual Hostinger account, SMTP mailbox or real Paystack credentials. It starts in test mode. Existing D1 preview records are not copied into MySQL; use a fresh database. Receipt PDFs and automated membership confirmation emails are not implemented in this edition.

## Troubleshoot a successful build with failed login or checkout

A successful build does not connect to MySQL or create the first administrator. Open `/api/health` after deployment. It now returns a safe error code and guidance, or `database: connected` with any missing setup variable names. It never returns credentials, hostnames, SQL statements or passwords. Runtime logs also record the safe error code.

- `DB_CONFIG_MISSING`: listed variables are absent from the running app; edit Hostinger deployment environment variables and restart/redeploy. Build-time `.env` loading alone does not prove runtime values are present.
- `ECONNREFUSED`: confirm the database endpoint. `localhost` now uses IPv4 `127.0.0.1`. If Hostinger support confirms local socket access, optionally set `DB_SOCKET=/var/lib/mysql/mysql.sock` (or the confirmed path); socket mode ignores DB_HOST/DB_PORT. Do not guess an external endpoint.
- `ER_ACCESS_DENIED_ERROR`: use the complete prefixed MySQL username and the correct database password.
- `ER_BAD_DB_ERROR`: use the complete prefixed database name.
- `ER_TABLEACCESS_DENIED_ERROR`: the MySQL user needs permission to create and access the FEDMOGA tables.
- `SUPER_ADMIN_CONFIG_MISSING`: set both initial Super Admin variables while the admins table is empty. Only remove the initial password after successful login.

Once `/api/health` reports a connected database and `adminSetup: pending_first_login` without missing variables, sign in with the initial Super Admin credentials. Then configure Paystack test keys in Settings before attempting checkout. For any unresolved error, share the diagnostic JSON or safe error-code lines from Runtime logs, not your environment variable values.

### Email delivery and test cleanup

Payment callbacks automatically verify with Paystack and redirect to the registration form. If verification fails, the browser retries up to three times using the checkout details stored in that browser tab. Users can also enter their payment email and reference to verify and open the form directly. Callback, webhook and public recovery do not send email. Admin and Super Admin can explicitly email links from the Incomplete payments dashboard.

SMTP is required to email registration links in both test and live mode. In Hostinger set SMTP_HOST=smtp.hostinger.com, SMTP_PORT=465, SMTP_USER to your full Hostinger mailbox address, SMTP_PASSWORD to that mailbox password, and SMTP_FROM to the same mailbox address. For another provider use its SMTP settings. Redeploy after changing environment variables. Never commit mailbox credentials.

Super Admin → Settings → Email delivery lists missing variable names and sends a test email to the signed-in Super Admin. Mail-server acceptance does not guarantee inbox delivery; check spam and the provider's mail logs. Public recovery validates the supplied email/reference pair and the Paystack transaction before returning a private registration token. Only unfinished registrations are eligible. Use Admin → Incomplete → Email registration link to retry after configuring email.

Super Admin → Settings → Clear test data permanently deletes all test-mode payments and their registrations. Type DELETE TEST DATA and accept the confirmation. The registration table also offers Delete test entry for individual test registrations and their associated payments. These actions invalidate test registration links, retain live records, settings, admin accounts and audit logs, and record deletion counts in the audit log. Deleted data cannot be restored without a backup. These actions remove local test records, not transactions in your Paystack dashboard.

Payment verification accepts a successful Paystack total equal to or greater than the registration fee stored when checkout started. This supports customer-borne processing charges without hard-coding Paystack fee schedules. Underpayments are rejected; reference, payer email, NGN currency and test/live mode must still match. The admin amount column continues to show the registration fee, excluding processing charges.

### Members who already paid

Admin and Super Admin → Already paid → Add one paid member. Enter name, email, phone, amount actually paid (whole naira), payment date and the original bank/Paystack reference. Confirm receipt against the association's records, then approve. Copy or explicitly email the generated private registration link. No charge is initiated. Amounts may differ from the current membership fee because an authorised admin is approving a historical payment. Only approved manual records bypass Paystack verification; ordinary Paystack payments keep all verification checks.

Super Admin can download the CSV template, upload or paste up to 100 records (60 KB), validate and preview them, then confirm receipt and approve the import. Columns: name,email,phone,amount,paid_date,reference. Dates use YYYY-MM-DD; phone/reference columns should be text in spreadsheets. References are required, normalized to uppercase and unique across manual approvals; existing Paystack references cannot be entered again as manual payments. Each batch is transactional and creates no records if validation or insertion fails. Preview does not create records or send emails.

Choose Live for genuine historical payments and Test only for practice. Each payment is labelled Manual payment and records its original reference, payment date and approving admin. Approval is audited. Links expire after 30 days, are single-use and can be copied or emailed again under Paid but incomplete (expired links are renewed). Completed links cannot be reused. Test cleanup also removes associated manual approval records; live approvals are retained. The added manual_payments table is created automatically on first database access after redeployment; existing records are preserved.

Admins and Super Admins can configure the membership fee and publish the registration form from Settings and Form builder. Required identity and consent fields remain enforced. Paystack credentials and checkout mode, user management, email diagnostics, CSV approvals and test-data deletion remain Super Admin-only. Setting changes record the acting admin in the audit log.
