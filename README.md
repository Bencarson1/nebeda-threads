# Nebeda Threads

Nebeda Threads is a full-stack ecommerce platform for a UK-based luxury African
fashion brand serving customers worldwide.

## Screenshots

Project screenshots will be added after the staging deployment and final visual
content review.

## Features

- Luxury responsive storefront and editorial homepage
- Backend-powered products, filtering, cart, and authenticated checkout orders
- Customer accounts with order and custom-order tracking
- Bespoke custom-order requests with inspiration image uploads
- Contact enquiries and newsletter subscriptions
- Admin dashboards for products, users, orders, enquiries, and subscribers
- Cloudinary image storage and Resend transactional notifications

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion, React Router
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs
- Media and email: Cloudinary and Resend

## Structure

```text
Backend/          Express API, models, authentication, uploads, and notifications
Frontend/nebeda/ React storefront, customer account, and admin interface
```

## Backend Setup

Backend:

```bash
cd Backend
npm install
npm run dev
```

## Frontend Setup

```bash
cd Frontend/nebeda
npm install
npm run dev
```

The production storefront is `https://nebedathreads.co.uk`. Development URLs
must be configured through the ignored frontend and backend `.env` files and
must not be hardcoded in application source.

## Running Locally

Run `npm run dev` inside `Backend`, then run `npm run dev` inside
`Frontend/nebeda`. Keep both processes running while developing locally.

## Environment Variables

Create `Backend/.env` containing:

```text
NODE_ENV
PORT
MONGO_URI
JWT_SECRET
JWT_EXPIRES_IN
FRONTEND_URL
CLIENT_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_UNSIGNED_UPLOAD_PRESET
RESEND_API_KEY
EMAIL_FROM_NAME
EMAIL_FROM_ADDRESS
EMAIL_REPLY_TO
BRAND_NOTIFICATION_EMAIL
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ENABLE_MAINTENANCE_ROUTES
```

Create `Frontend/nebeda/.env` containing:

```text
VITE_API_URL
VITE_APP_NAME
VITE_STRIPE_PUBLISHABLE_KEY
```

All `.env` variants are ignored by Git. Never commit credentials, tokens,
database connection strings, or provider secrets.

Stripe uses test mode until launch. Configure the Render webhook endpoint as
`/api/payments/webhook` for `checkout.session.completed`,
`checkout.session.expired`, and `payment_intent.payment_failed`. The frontend
redirects to Stripe's hosted Checkout URL, so the publishable key is reserved
for future Stripe.js features and the secret key remains backend-only.

## Local Checks

```bash
cd Frontend/nebeda
npm.cmd run lint
npm.cmd run build
```

```bash
cd Backend
npm run dev
```

Useful API checks:

```text
GET /api/health
GET /api/health/email
```

## Maintenance Route

`DELETE /api/maintenance/test-records` permanently removes only records whose
names, emails, product names, messages, or order items clearly contain `test`.
It requires an admin Bearer token and works only when
`ENABLE_MAINTENANCE_ROUTES=true`. Keep it `false` normally, review the response
counts carefully, and never run it automatically.

## Current Status

- Ready for GitHub push and staging deployment
- Stripe Checkout and fulfilment tracking are implemented; production payment reconciliation remains operational work
- Production Resend domain verification is not complete
- Legal pages are staging placeholders and require professional review

## AI Fashion Consultant

The public help assistant uses a lightweight conversation engine with editable admin knowledge, sanitized analytics, guided shopping, measurement guidance, product recommendations from live products, and WhatsApp escalation. Future improvement: connect an AI provider such as OpenAI, Azure OpenAI, Claude, or Gemini behind the existing assistant provider layer without changing the customer UI.

## Future Roadmap

- Stripe production activation, webhook monitoring, and payment reconciliation
- Verified production email domain and sender
- Production hosting, DNS, monitoring, and backups
- Final product photography and content review
- Automated integration and end-to-end tests

## GitHub Push Checklist

- [ ] Review `git status` and staged files
- [ ] Confirm no `.env` file is staged
- [ ] Run frontend lint and build
- [ ] Start the backend and verify health routes
- [ ] Confirm staging environment variables are configured
- [ ] Keep maintenance routes disabled
- [ ] Review legal copy, real product content, and test records

See `Backend/README.md` for the API route inventory and email setup details.

## License

This project is licensed under the MIT License. See `LICENSE`.

## Production account and email flows

Customer accounts use hashed passwords, JWT-protected account routes, verified-email checkout gating, expiring hashed email-verification tokens, and one-hour hashed password-reset tokens. Transactional mail is delivered by Resend from the verified `nebedathreads.co.uk` domain, with delivery outcomes available to administrators under Email Logs.

Required production email variables include `RESEND_API_KEY`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`, `EMAIL_REPLY_TO`, and `BRAND_NOTIFICATION_EMAIL`. Keep every value in the ignored `Backend/.env` file locally and in Render environment settings in production.
### Launch state

The application supports verified customer accounts, password recovery, backend-priced shop checkout, webhook-confirmed Stripe payments, approved bespoke quote payments, order fulfilment tracking, and Resend delivery logs. Production launch requires replacing the Render Stripe test secret/webhook secret with live values, registering the live webhook endpoint, redeploying, and completing a final live transaction smoke test.
