# Backend audit: final report

Branch `fix/shared-backend-foundation` · completed 25 November 2026 · not pushed

This report closes the phased backend audit planned in [backend-audit-plan.md](backend-audit-plan.md) (P00–P15). Each phase was fixed, tested against the previous code (the new tests had to fail before the fix), verified with the full suites and committed separately with an evidence file in this folder.

## Final state

| Check | Result |
|---|---|
| Unit tests | 1,547 passed in 122 files |
| Integration and E2E tests (PostgreSQL 15) | 173 passed in 51 files |
| Type-checks | root, tooling and 7/7 workspaces pass |
| Lint and formatting | 0 errors (74 warnings in existing code), Prettier clean |
| API contract | generated API client matches the registered routes |
| Migrations | full migration history applies to an empty database; schema drift check passes |
| Production build | `pnpm run build` passes (API, storefront, admin) |
| Live boot | API starts, `/health` and `/ready` return 200, unsigned or malformed tokens get 401, stops cleanly |
| Frontend calls | all 187 detected storefront and admin API calls match a registered route and method |
| Dependencies | critical advisories 6 → 4, high 68 → 57; the rest need major upgrades (see below) |

## What was fixed

The most serious problems, by area. Every item has a regression test; details and evidence are in the linked files.

**Money and stock**
- Orders could be completed and marked paid without any payment, and the browser chose the amount paid; payments are now confirmed with Stripe and totals computed on the server ([P06](p06-checkout-payment-verification.json)).
- Concurrent stock changes overwrote each other (the last unit sold five times); stock, loyalty points and gift cards now change atomically with database constraints ([P05](p05-inventory-verification.json), [P09](p09-loyalty-verification.json), [P08](p08-payment-ownership-verification.json)).
- Refunds never reached Stripe; stock was never returned on cancellation; paid orders could be left without stock movement ([P08](p08-payment-records-verification.json), [P07](p07-order-lifecycle-verification.json), [P06](p06-checkout-stock-verification.json)).

**Accounts and access**
- Account takeover paths through Google sign-in, 2FA and email change were closed ([P03](p03-authentication-verification.json), [P03](p03-account-management-verification.json)).
- Many routes trusted a user id from the request: customers could read or change other customers' carts, checkouts, orders, payments, loyalty points, wishlists, reviews, reminders and appointments. All now use the signed-in identity with one fail-closed rule per area ([P06](p06-cart-ownership-verification.json), [P08](p08-payment-records-verification.json), [P09](p09-loyalty-verification.json), [P10](p10-wishlists-reviews-verification.json), [P10](p10-engagement-privacy-verification.json)).
- Destructive admin routes were limited to safe real-world use, e.g. orders can only be deleted while unprocessed ([P07](p07-destructive-route-policy-verification.json)).

**Privacy**
- Guest tokens (which open a guest's cart and orders) were returned by public wishlists and stored in plain text in analytics; both stopped ([P10](p10-wishlists-reviews-verification.json), [P13](p13-analytics-verification.json)).
- Unreleased products and looks were visible to the public ([P04](p04-catalog-visibility-verification.json)).

**Modules not yet registered in the API** (fulfillment, customer care, analytics) were reviewed and fixed so they are safe to enable later ([P11](p11-fulfillment-verification.json), [P12](p12-customer-care-access-verification.json), [P12](p12-customer-care-returns-verification.json), [P13](p13-analytics-verification.json)).

**Dependencies**: fastify, fast-jwt, sanitize-html, nodemailer and zod were updated within their existing version ranges ([P15](p15-dependency-verification.json)).

## How much was reviewed

The audit was risk-driven: every module's routes, access rules, money, stock and concurrency paths were read and tested, and every confirmed defect was fixed. It was not a line-by-line sign-off of every file.

The [file register](backend-audit-register.csv) tracks 1,437 backend files:

| Status | Files |
|---|---|
| Reviewed with tests or explicitly verified | 402 |
| Not individually closed | 1,035 |

Most files in the second row were read while their module was reviewed (for example all 25 fulfillment files) but are not individually signed off in the register; they are mainly query handlers, value objects, mappers and lower-risk repository methods behind the reviewed entry points. Claiming "100% reviewed" would not be accurate.

## Decisions for you

These need an owner decision; nothing was changed for them.

1. **Old analytics data**: existing `analytics.analytics_events` rows still contain raw guest tokens. Clearing them (`UPDATE ... SET guest_token = NULL WHERE guest_token NOT LIKE 'gt_%'`) deletes production data.
2. **Unregistered modules**: whether to enable fulfillment (it duplicates order shipments), customer care (no customer self-service routes yet; refunds do not reach Stripe) and analytics tracking.
3. **Reviews**: whether only customers who bought a product may review it.
4. **Production setup**:
   - A shared token store (Redis) is needed before running more than one API instance.
   - Set dedicated `NEWSLETTER_UNSUBSCRIBE_SECRET` and `ANALYTICS_PSEUDONYM_SECRET` values.
   - Keep `API_DOCS_ENABLED` off in production until the Swagger packages are updated.
5. **Business rules**:
   - The 8% tax fallback when tax cannot be calculated.
   - Hard-deleting versus anonymising users.
   - Point expiry, which is not implemented safely and is not scheduled.
6. **Major upgrades**:
   - Next.js 15.5.21 or later in both frontends (several security advisories).
   - nodemailer 9 or 10.
   - Prisma 7.
   - firebase-admin and its dependencies.

## Known gaps

- A full HTTP purchase with a real successful Stripe payment is not tested, because the server cannot swap in a test payment provider. The paid path is tested at the persistence level.
- Gift cards cannot be used to pay at checkout.
- Stripe webhook event ids are not recorded; repeated webhooks are handled through the payment's state instead.
- Newsletters and restock reminders are never actually sent: the code to send them is missing.
- A few rules are checked before writing rather than enforced by the database: return quantities and fulfillment allocation in the unregistered modules, and a race when a new loyalty account is created for the first time. These need locks or constraints before the modules are enabled.

All phase notes, findings and follow-ups are in [backend-audit-plan.md](backend-audit-plan.md) and the `p*-verification.json` files.
