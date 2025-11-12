ts-reverb
=========

TypeScript client for the Reverb API, friendly with Bun runtime. It implements the key endpoints summarized in `lib/reverb_api_docs.md` and sets the correct HAL/Accept headers out of the box.

Install
-------

Using Bun:

```sh
bun add ts-reverb
```

Or in this repo, build locally:

```sh
cd ts-reverb
bun install
bun run build
```

Quick start
-----------

```ts
import { Reverb } from "ts-reverb";

const client = new Reverb({
  token: process.env.REVERB_TOKEN!,
  // baseUrl: "https://sandbox.reverb.com/api", // optional for sandbox
  acceptVersion: "3.0", // default
});

// Fetch account
const me = await client.getMyAccount();
console.log(me);

// Create a draft listing
const draft = await client.createListing({
  make: "Fender",
  model: "Stratocaster",
  title: "Fender Stratocaster",
  description: "Great condition",
  price: { amount: "999.00", currency: "USD" },
  condition: { uuid: "df268ad1-c462-4ba6-b6db-e007e23922ea" }, // Excellent (example)
  sku: "SKU-123",
  has_inventory: true,
  inventory: 1,
});

// Publish it later
await client.updateListing(draft.id, { title: "Fender Stratocaster (Excellent)" }, { publish: true });
```

Configuration
-------------

- `token`: Personal access token. Sent as `Authorization: Bearer <token>`.
- `baseUrl`: Defaults to `https://api.reverb.com/api`. Use `https://sandbox.reverb.com/api` for sandbox.
- `acceptVersion`: Defaults to `3.0`.
- `acceptLanguage`: Defaults to `en`.
- `displayCurrency`: Optional `X-Display-Currency` header.
- `shippingRegion`: Optional `X-Shipping-Region` header.

Supported endpoints
-------------------

- Account: `getMyAccount()`
- Listings: `createListing`, `updateListing`, `endListing`, `getListingImages`, `reorderImages`, `deleteImage`, `listDrafts`
- Bumps: `getBumpInfo`, `setBumpBid`, `removeBump`
- Sales: `addListingsToSale`, `removeListingsFromSale`, `getListingSales`, `listSellerSales`, `listReverbSales`
- Direct Offers: `getAutoOffer`, `setAutoOffer`, `removeAutoOffer`
- Orders: `listOrders`
- Shipments: `createShipment`
- Payments: `listPayments`, `listPaymentMethods`
- Payouts: `listPayouts`, `listPayoutLineItems`
- Vacation: `enableVacation`, `disableVacation`, `getVacationStatus`
- Messages: `listConversations`, `listUnreadConversations`, `getConversation`, `markConversationRead`, `replyToConversation`
- Feedback: `listFeedbackReceived`, `listFeedbackSent`, `leaveBuyerFeedback`, `getBuyerFeedback`
- Refunds: `listRefundRequests`, `updateRefundRequest`, `createRefundRequestForOrder`
- Negotiations: `listNegotiations`, `getNegotiation`, `declineOffer`, `acceptOffer`, `counterOffer`

Notes
-----

- The client sets `Accept: application/hal+json` and `Content-Type: application/hal+json` by default according to the docs.
- On non-2xx responses, a `ReverbApiError` is thrown with `.status` and parsed `.data` when available.
- For listing conditions/categories UUIDs, fetch them via Reverb endpoints (not included here).

Development
-----------

```sh
# build
bun run build

# run tests
bun test

# clean
bun run clean
```

Tests
-----

The library includes a comprehensive test suite covering:

- Authentication and headers (Bearer token, HAL+JSON, custom headers)
- All API endpoint methods (account, listings, images, bumps, sales, offers, orders, payments, payouts, vacation, messages, feedback, refunds, negotiations)
- Error handling (404, 429 rate limits, 412 validation errors)
- Base URL configuration (production vs sandbox)

**Unit tests** - Run with `bun test` to execute 54+ test cases with mocked fetch validating correct HTTP methods, URLs, query parameters, and request payloads.

**Integration tests** - Test against the real Reverb API (sandbox or production):

1. Get a token from your account:
   - Sandbox: <https://sandbox.reverb.com/my/account/api>
   - Production: <https://reverb.com/my/account/api>
2. Create `.env` file: `cp .env.example .env` and add your token
3. Ensure your account has a shop configured (required for most endpoints)
4. Run: `bun test:integration`

**Important**: Tokens are environment-specific. Sandbox tokens only work with `sandbox.reverb.com`, production tokens only work with `api.reverb.com`. The tests default to sandbox; set `REVERB_BASE_URL=https://api.reverb.com/api` in `.env` for production.

**Results**: 17/21 tests pass on production with an active shop. Tests verify: account details, drafts, orders, sales, payments, payouts, vacation mode, conversations, feedback, refunds, negotiations, and error handling.
