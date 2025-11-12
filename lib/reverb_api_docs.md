# Reverb API Documentation – Compiled Reference

This Markdown document consolidates and summarizes the official Reverb API documentation across the `reverb-api.com` site.  It includes key sections from the “Guides & Tutorials” navigation such as Getting Started, HTTP Headers, Rate Limiting & Terms of Service, Error Handling, Authentication, Building E‑Commerce Sync Integrations, Creating and Managing Listings, Inventory and Image management, Drafts, Bumps, Sales, Direct Offers, Orders and Shipping.  Use this reference for general understanding and as a quick lookup when building integrations with the Reverb platform.

---

## 1 Getting Started

### Rules and Guidelines

- **Content Types** – set both `Accept` and `Content‑Type` HTTP headers to `application/hal+json`.  Reverb uses HAL to embed links and resources in JSON responses, allowing you to navigate the API as you would browse a website.
- **Use links** – never hard‑code URLs or assume patterns.  Each resource exposes a `_links` object indicating available actions (verbs like `add_to_wishlist`) and related resources (nouns like `listings`).
- **Follow verbs/nouns** – most endpoints support `GET`, `POST`, `PUT`, and `DELETE`.  If an action isn’t allowed, the API returns an error describing supported methods.
- **Pagination** – collection responses include `_links.next` and `_links.prev`.  If either key is missing, there is no page in that direction.
- **Security** – all requests must use TLS 1.2 or higher.

### Common pitfall

If you specify `Content‑Type: application/hal+json` then the request body **must** be JSON‑encoded.  If you use `application/x-www-form-urlencoded` (or omit the header), then the body must be URL‑encoded instead.  Many errors arise from mismatched content types.

---

## 2 HTTP Headers

Reverb’s API supports several headers that change how responses are returned:

| Header              | Required | Description                                                             | Default/Recommended |
|---------------------|---------:|-------------------------------------------------------------------------|---------------------|
| `Content‑Type`      |    Yes   | Format of the request body. Use `application/hal+json` for HAL‑based JSON responses. | `application/hal+json` |
| `Accept`            |    Yes   | Expected response format. Use `application/hal+json`.                     | `application/hal+json` |
| `Accept‑Version`    |    Yes   | API version you wish to call.                                            | `3.0` is current |
| `Accept‑Language`   |     No   | Locale for textual fields (`en` by default).                             | `en` |
| `X‑Display‑Currency`|     No   | Currency used for prices.                                                | `USD` (see `/api/currencies/display`) |
| `X‑Shipping‑Region` |     No   | Limits results to listings that ship to the given region.                | none |

---

## 3 Rate Limiting and Terms of Service

Reverb enforces rate limits.  If you exceed the limit, the API returns **HTTP 429 Too Many Requests**.  You may contact Reverb’s integrations team for higher limits.  When surfacing Reverb data publicly, always link back to the original content (e.g. provide a “View on Reverb” link) to comply with the API’s Terms of Service.  Violating the terms can result in revoked API access.

---

## 4 Error Handling

Reverb uses standard HTTP status codes:

- **2xx** – success.
- **3xx** – redirects.
- **4xx** – client‐side error such as missing parameters or invalid fields.
- **5xx** – server‑side error (temporary).

Validation errors return a 412 status with a top‑level `message` and a per‑field `errors` map.  Handle classes of status codes rather than hard‑coding specific numeric values.  A few common codes:

| Code | Meaning                                                      |
|------|--------------------------------------------------------------|
| 200  | Resource updated or fetched successfully.                   |
| 201  | Resource created.                                           |
| 202  | Update accepted; processing asynchronously.                 |
| 304  | Resource not modified; client should use cached version.    |
| 400  | Bad request – missing/invalid parameters.                   |
| 401  | Unauthorized – refresh or request a new access token.       |
| 404  | Resource not found.                                         |
| 406  | Request violates a constraint (e.g. cannot delete a live listing). |
| 429  | Rate limit exceeded.                                        |

---

## 5 Authentication

### Creating a Personal Token

Reverb supports personal access tokens for first‑party integrations.  Tokens never expire and can be restricted by **scopes**.  To create one:

1. Visit your Reverb profile ➜ **API & Integrations**.
2. Click **Generate New Token**.
3. Give it a name and select scopes (permissions).  For most ecommerce integrations use:
   - `public`
   - `read_listings` / `write_listings`
   - `read_orders` / `write_orders`
4. The token will be displayed once – copy it and store securely.

Include your token in the `Authorization` header as `Bearer <token>` for each API call.

### Personal Token Scopes

| Scope             | Description                                             |
|-------------------|---------------------------------------------------------|
| `public`          | Read public data.                                      |
| `read_feedback` / `write_feedback` | Read or post feedback.                           |
| `read_listings` / `write_listings` | Read or manage your listings.                    |
| `read_lists` / `write_lists`       | Read or modify wishlists/watchlists.            |
| `read_messages` / `write_messages` | Read or send messages.                         |
| `read_offers` / `write_offers`     | View or make offers.                           |
| `read_orders` / `write_orders`     | Read or update orders.                          |
| `read_profile` / `write_profile`   | Access or update account/shop details.          |
| `read_reviews` / `write_reviews`   | View or create listing reviews.                 |
| `read_payouts`                     | View payout information.                        |

---

## 6 Building an E‑Commerce Sync Integration

There are two primary patterns for synchronizing an ecommerce platform with Reverb:

1. **Standalone hosted app** – runs outside the customer’s hosting environment (e.g. Shopify or BigCommerce apps) and processes many shops concurrently.  Easier to maintain but more complex.
2. **Plugin‑based (self‑hosted)** – installed in the merchant’s server (e.g. Magento plugin).  Only syncs a single shop but requires self‑updating and error reporting.

Pre‑requisites:

- Seller must have a verified Reverb account with at least one live listing.
- Each item must have a **SKU** in both the ecommerce system and Reverb; otherwise duplicates may be created.

Key integration steps:

### Configuration

A sync plugin should allow configuration of:

- **Auto‑Sync** – whether to sync automatically on item changes.
- **Auto‑Publish** – if true, includes `publish=true` in listing creation calls (otherwise posts drafts).
- **Field‑level sync options** – optional; let users choose which fields to sync (title only, price only, stock only, etc.).

Authentication uses the personal token created above.

### Sync inventory changes to Reverb

1. When an item changes on the ecommerce platform, search Reverb by SKU using `/api/my/listings?sku=[sku]&state=all`.
2. If found, update the listing with `PUT` using the listing’s `_links.self.href` and the [Create/Update Listing](#7-creating-and-updating-listings) payload.
3. If not found, create a new listing (next section).

Trigger updates on manual edits, order events (inventory decrements), and refunds (inventory increments).

### Sync log

Implement a sync log to track success/failure per item.  Recommended fields: item ID, SKU, Reverb listing link, sync status, error message/details, and timestamp.

### Notes on inventory behavior

- Listings with inventory 0 are automatically ended.
- Conditions “Brand New”, “B‑Stock”, and “Mint” can have quantity > 1 and automatically relist when inventory increases above 0.  All other conditions are one‑of‑a‑kind; once sold they cannot be relisted.
- Published listings cannot be deleted; drafts can.

### Creating new listings via sync

When an item is added on the ecommerce platform:

1. Search Reverb by SKU.  If found → update existing listing; otherwise → create new draft listing with `publish=false`.
2. Provide `make` and `model` where possible; if omitted, Reverb guesses from the title but may default to “Unknown”.
3. Allow users to enable an “Auto‑Publish” setting to publish new listings automatically.

### Mass sync all listings

Implement a “Sync All Listings” operation to seed Reverb with existing inventory.  Process the queue gradually and respect rate limits (see section on rate limiting).

### Sync inventory changes from Reverb

Use the `/api/listings` endpoints to pull changes from Reverb back into your platform to keep quantities aligned.

### Sync orders from Reverb

Optionally poll the [Retrieve Orders](#13-retrieve-orders) endpoint to import orders.  Note: some actions such as purchasing shipping labels still require the seller to operate in the Reverb UI.

### Sync shipment/tracking info to Reverb

If you import orders, also implement a method to send tracking information back to Reverb when shipments occur.

---

## 7 Creating and Updating Listings

### Creating a listing

Send a `POST` request to `/api/listings` with headers `Content‑Type: application/hal+json`, `Accept: application/hal+json`, `Accept‑Version: 3.0`, and `Authorization`.  Required fields:

- `make` and `model` – required to save a draft; if omitted Reverb will guess from the title but may default to “Unknown”.
- `categories` – list of up to two subcategories (or one root plus two subcategories).  Retrieve valid `uuid`s via `/api/categories/flat`.
- `condition` – specify the condition’s `uuid` (see listing conditions below).
- `price` – amount and currency.
- `title` and `description` – listing details.
- `sku` – unique item SKU.
- `has_inventory` (boolean) and `inventory` (number) – for multi‑quantity items.  Set `inventory` to 0 to end a listing; values >0 publish or relist automatically for certain conditions.
- `offers_enabled` – optional; allows buyers to submit offers (useful for MAP‑restricted items).
- Shipping information via `shipping_profile_id` (preferred) or individual `shipping.rates` per region.
- `videos` – optional YouTube links.
- `photos` – URLs of photos to import.

Listings created via the API default to **drafts** unless you include `publish=true` in the query parameters or send the `publish` flag in the request body (depending on API version).  Use the sandbox (`https://sandbox.reverb.com/api`) for testing.

### Listing conditions

Retrieve valid condition UUIDs from `/api/listing_conditions`.  Examples:

| Condition                | UUID |
|--------------------------|------------------------------------|
| Non Functioning          | fbf35668-96a0-4baa-bcde-ab18d6b1b329 |
| Poor                     | 6a9dfcad-600b-46c8-9e08-ce6e5057921e |
| Fair                     | 98777886-76d0-44c8-865e-bb40e669e934 |
| Good                     | f7a3f48c-972a-44c6-b01a-0cd27488d3f6 |
| Very Good               | ae4d9114-1bd7-4ec5-a4ba-6653af5ac84d |
| Excellent                | df268ad1-c462-4ba6-b6db-e007e23922ea |
| Mint                     | ac5b9c1e-dc78-466d-b0b3-7cf712967a48 |
| Mint (with inventory)    | 6db7df88-293b-4017-a1c1-cdb5e599fa1a |
| B‑Stock                  | 9225283f-60c2-4413-ad18-1f5eba7a856f |
| Brand New                | 7c3f45de-2ae0-4c81-8400-fdb6b1d74890 |

Certain conditions (e.g. B‑Stock, Mint with inventory) require account approval.

### Setting location

Use the `location` object only on the first listing to set your shop’s address; after that, manage the shop address in your account settings.  Example:

```json
"location": {
  "city": "Seattle",
  "state": "WA",
  "country_code": "US",
  "postal_code": "98101"
}
```

### Managing inventory and pre‑orders

- For multi‑quantity items, set `has_inventory: true` and specify `inventory` with the quantity.  If `inventory` goes to 0 the listing ends automatically.
- For single or unique items set `has_inventory: false`; quantity will be ignored.
- To list pre‑orders, include a `preorder_info` object either with a future `ship_date` (YYYY‑MM‑DD) or with `lead_time` and `lead_time_unit` (e.g. 5 days).  Remove pre‑order status by sending `lead_time: 0`.

### Updating a listing

Use `PUT` on `/api/listings/[listing_id]` with the same payload fields you used to create the listing.  Only fields you send will change; unspecified fields remain the same.  Set `publish=true` to publish a draft or republish a listing after editing.

### Publishing a draft

To publish a draft listing: send `PUT` to `/api/listings/[listing_id]` with `publish=true` in the JSON body or as a query parameter (depending on the version).  A successful call returns the updated listing.

### Ending a listing

To end a listing (mark as sold or remove from search), send a `PUT` request to `/api/my/listings/[listing_id]/state/end` with a JSON body containing a `reason`.  Use `reverb_sale` if the item sold off‐platform but originated from Reverb (fees apply).  Use `not_sold` if the item is simply removed without sale.

---

## 8 Image Updating

### Finding listing images

Call `GET /api/listings/[listing_id]/images/` to retrieve the IDs and URLs of all images associated with a listing.

### Reorganizing images

To change the order of images or add new ones, send a `PUT` request to `/api/listings/[listing_id]` with a `photos` array listing the existing image URLs in the desired order and any new image URLs appended.  Include the flag `"photo_upload_method": "override_position"` to instruct the API to reorder instead of replacing images.

### Deleting an image

Send `DELETE /api/listings/[listing_id]/images/[image_id]` to remove an image.

---

## 9 Managing Drafts

- List all drafts with `GET /api/my/listings/drafts`.
- Delete a draft with `DELETE /api/listings/[listing_id]`.  Only drafts can be deleted; published listings must be ended rather than deleted.

---

## 10 Manage Bumps

Reverb’s “Bump” feature allows sellers to boost a listing’s visibility by agreeing to pay an additional percentage fee when the item sells.

### Fetch bump info

Retrieve bump statistics and available bid levels for a listing with `GET /api/listings/[listing_id]/bump`.  The response includes `bump_v2_stats` (impressions, number sold, cost and sales data) and an array of available `bids` (percentage options such as 0.5%, 1.0%, etc.).  If the listing has never been bumped, `bump_v2_stats` is omitted.

### Add or update a bump bid

To bump a listing, send a `PUT` request to `/api/bump/v2/bids` with a JSON body containing a `products` array of listing IDs and a `bid` (e.g. `0.035` for a 3.5 % fee).  Reverb only charges the fee when the item sells.

### Remove a bump

To remove bump status from a listing, send `DELETE /api/bump/v2/bids` with a `products` array of listing IDs.  The response body is empty on success.

---

## 11 Manage Sales

Reverb allows sellers to create and manage sales events that offer percentage discounts on selected listings.  Each sale can include up to 25 listings per request.

### Add listings to a sale

`POST /api/sales/[sale_id]/listings` with `{ "listing_ids": [ ... ] }` to add one or more listings.  The response includes a `results` array showing success or failure per listing.

### Remove listings from a sale

`DELETE /api/sales/[sale_id]/listings` with a JSON body listing the `listing_ids` to remove.

### View all sales for a listing

`GET /api/listings/[listing_id]/sales` returns an array of all sales (seller‑created or Reverb‑sponsored) that include the listing.  Unauthenticated users only see active sales; authenticated users see upcoming and ended sales as well.

### View all seller‑created sales

`GET /api/sales/seller` returns all sales created by the seller (active, ended, upcoming).  Each sale object includes fields like `id`, `slug`, `name`, `code`, `discount_percent`, `starts_at`, `ends_at`, and `_links` to the sale page and its listings.

### View Reverb‑sponsored sales

`GET /api/sales/reverb` lists Reverb‑sponsored site‑wide sales currently active.  If no sales are active the response includes an empty array.

---

## 12 Manage Direct Offers

Direct Offers allow sellers to send private discounted offers to watchers or interested buyers.  Sellers can automatically set an offer percentage on their listings.

### Retrieve direct offer configuration

`GET /api/listings/[listing_id]/auto_offer` returns the current `offer_percentage`, computed `offer_price`, and optional message.

### Assign or update a direct offer

`POST /api/listings/[listing_id]/auto_offer` with `{ "offer_percentage": <integer> }` sets or updates the direct offer percentage.  Only sellers with Direct Offers enabled may use this endpoint; otherwise the API returns an authorization error.

### Remove a direct offer

`DELETE /api/listings/[listing_id]/auto_offer` disables the direct offer settings for the listing.

---

## 13 Retrieve Orders

Retrieve your shop’s orders with `GET /api/my/orders/selling/all` or by specific status.  You can filter by date range using ISO‑8601 timestamps (`updated_start_date` / `updated_end_date`).  Orders are returned in reverse chronological order.

**Order statuses** – possible values include:  
`unpaid`, `payment_pending`, `pending_review`, `blocked`, `paid`, `shipped`, `picked_up`, `received`, `refunded`, and `cancelled`【448742000259252†L560-L584】.  

**Shipping methods** – orders may specify `shipped` (standard shipping), `local` (local pickup), or `expedited_shipping`【448742000259252†L587-L595】.

**Order links** – each order’s `_links` section exposes actions: view listing photos (`photo`), leave feedback for buyer or seller (`feedback_for_buyer`, `feedback_for_seller`), fetch listing details (`listing`), start a conversation (`conversation`, `start_conversation`), mark an order picked up (`mark_picked_up`), mark it as shipped (`ship`), view payment details (`payments`), contact the buyer (`contact_buyer`), purchase a shipping label (`purchase_shipping_label`), and download a packing slip (`packing_slip`)【448742000259252†L646-L672】.

The order object also includes `buyer` and `seller` contact details, items purchased, payment breakdowns, shipping address, and tax information.

---

## 14 Ship Orders

To record shipment of an order and provide tracking information:

1. Generate a shipping label on Reverb or your own system.
2. Use `POST /api/orders/[order_id]/shipments` with a JSON body containing the `tracking_number`, `carrier` (e.g. `USPS`, `UPS`, `FedEx`), `service` name, and optional `shipping_label_url`.
3. The order’s status will update to “shipped” and the buyer will be notified.

---

## 15 Tying Orders Together

Each order returned by the API includes an `order_bundle_id`.  When a buyer checks out multiple items at once, the resulting orders (one per listing) will share the same `order_bundle_id`.  You can group orders by this field to combine shipping or process them together.

---

## 16 Additional Resources

- **Rate limiting** and support: contact Reverb’s integrations team via `integrations@reverb.com` to request higher rate limits or assistance.
- **Terms of use**: ensure you read the full [Reverb API Terms of Service](https://reverb.com/page/reverb-api-terms-of-use) and comply with attribution and data usage requirements.
- **Integration directory**: see the [Reverb integrations directory](https://reverb.com/page/reverb-integrations) for examples and partner apps.
- **Test on sandbox**: use `https://sandbox.reverb.com/api` for testing calls before hitting the production API.

---

*Note: This guide is a high‑level summary derived from the official Reverb API documentation, consolidated for quick reference.*

---

## 17 Manage Refund Requests

Reverb allows buyers and sellers to request refunds through a structured workflow.  A refund request has a `state` such as `pending_seller_response`, `conditionally_approved`, `approved`, `denied`, `cancelled`, `auto_approved`, or `refund_sent`.  Buyers typically initiate a request, and sellers respond.

**Listing refund requests** – use `GET /api/my/refund_requests/selling` to fetch active refund requests.  You can filter by creation or update date range (`created_start_date` / `created_end_date`), by state(s), or by `order_number`.  Responses are paginated with `page` and `per_page` parameters.  Each refund request object includes the request ID, associated order, buyer comments, requested amount, state, and relevant links【359275218097880†L124-L170】【359275218097880†L200-L233】.

**Responding to a refund request** – send a `PUT` request to `/api/my/refund_requests/selling/[refund_request_id]` with a JSON body specifying the new `state` (`conditionally_approved`, `approved`, or `denied`).  For conditional approvals you may include a `note_to_buyer`.  The seller can adjust the `refund_amount` when approving【359275218097880†L339-L404】.

**Creating a refund request (seller‑initiated)** – to request a refund (e.g. partial refund or shipping adjustment), call `POST /api/my/orders/selling/[order_number]/refund_requests` with:

```json
{
      "state": "approved",
      "reason": "buyer_return",
      "refund_amount": {
        "amount": "50.00",
        "currency": "USD"
      }
}
```

Valid reasons include `buyer_return`, `lost_shipment`, `shipping_damage`, `sold_elsewhere`, `accidental_order`, `change_shipping_address`, or `shipping_adjustments`【359275218097880†L339-L404】.  The currency must match your shop’s currency.

Multiple refund requests per order are permitted.  Approved refunds automatically issue the appropriate refund or credit.

---

## 18 Manage Negotiations

The Negotiations API lets sellers handle offers from buyers.

**List active offers** – call `GET /api/my/listings/negotiations` to retrieve current negotiations across your listings【32813720788749†L106-L170】.

**Get details of an offer** – `GET /api/my/negotiations/[offer_id]` returns the offer’s price, buyer information, and status【32813720788749†L106-L170】.

**Decline an offer** – `POST /api/my/negotiations/[offer_id]/decline` marks the offer as declined【32813720788749†L106-L170】.

**Accept an offer** – `POST /api/my/negotiations/[offer_id]/accept` accepts the buyer’s offer and creates an order【32813720788749†L106-L170】.

**Counter an offer** – send `POST /api/my/negotiations/[offer_id]/counter` with a JSON body containing a new `amount` and `currency` to propose a counteroffer【32813720788749†L106-L170】.

Negotiations help sellers close sales by negotiating price directly with potential buyers through the Reverb messaging system.

---

## 19 Payments and PayPal Transactions

To view payment details for an order, call `GET /api/my/payments/selling?order_id=[order_id]`.  The response lists payments associated with the order, broken down by method (e.g. PayPal, credit card), including amounts, fees, and status.  To see which payment methods are available for your account, call `GET /api/payment_methods`【117756669564127†L104-L208】.

Use these endpoints to reconcile payments or to display payment info in your integration.

---

## 20 Read Payouts

Merchants can reconcile finances by reading payout data.  Use:

`GET /api/my/payouts?created_start_date=YYYY‑MM‑DD&created_end_date=YYYY‑MM‑DD&per_page=n`

The response lists payouts with fields `id`, `total`, `created_at`, `updated_at`, and `_links.line_items`.  Each payout may include multiple orders【492832497241085†L210-L256】.

To see order‑level details within a payout, follow the line items link:

`GET /api/my/payouts/{payout_id}/line_items?per_page=n`

Each line item represents an individual order within the payout and includes sale price, fees, discounts, subtotal, and total【492832497241085†L210-L256】.

---

## 21 Vacation Mode

Sellers can temporarily disable their shop using Vacation Mode.  To enable vacation mode:  
`POST /api/shop/vacation`.  
To disable vacation mode:  
`DELETE /api/shop/vacation`.  
To retrieve current vacation status:  
`GET /api/shop/vacation`【654216179274998†L102-L135】.

Use vacation mode to prevent new orders while you are away without losing your listings.

---

## 22 Account Details

To fetch your account details (account ID, username, email, shop ID, etc.), send:

`GET /api/my/account`

Include `Accept-Version: 3.0` and HAL headers.  The response contains the account object【234527963850408†L104-L114】.

---

## 23 Manage Messages

You can manage conversations with buyers via the messaging API.

**List conversations** – `GET /api/my/conversations` returns all conversations for your shop【62442652771020†L104-L118】.

**List unread conversations** – `GET /api/my/conversations?unread_only=true` lists only conversations that contain unread messages【62442652771020†L121-L132】.

**Get a conversation** – `GET /api/my/conversations/[conversation_id]` retrieves a single conversation and its messages【62442652771020†L136-L148】.

**Mark a conversation as read** – send `PUT /api/my/conversations/[conversation_id]` with `{ "read": true }` in the body to mark all messages as read【62442652771020†L152-L167】.

**Reply to a conversation** – `POST /api/my/conversations/[conversation_id]/messages` with `{ "body": "Your message" }` adds a new message to the conversation【62442652771020†L170-L184】.

---

## 24 Manage Feedback

Feedback enables buyers and sellers to rate transactions.

**List feedback you’ve received** – `GET /api/my/feedback/received`【823611724030322†L102-L114】.

**List feedback you’ve sent** – `GET /api/my/feedback/sent`【823611724030322†L115-L124】.

**Leave feedback on an order** – sellers can post feedback to a buyer with `POST /api/orders/{order_id}/feedback/buyer` and a JSON body containing a `message` and a numeric `rating` (1 to 5)【823611724030322†L126-L139】.

**View buyer feedback for an order** – `GET /api/orders/[order_id]/feedback/buyer` returns the feedback on a particular order【823611724030322†L141-L150】.

Ratings are on a five‑point scale【823611724030322†L152-L153】.

---

## 25 Testing on Sandbox

Reverb provides a sandbox environment at `https://sandbox.reverb.com` for testing API calls without affecting production data.

**Sandbox accounts** – you can create multiple sandbox accounts at `https://sandbox.reverb.com/signup` and configure shop settings.  Use this environment to create and delete listings freely【921462330831365†L104-L116】.

**API endpoints** – for sandbox testing, replace `api.reverb.com/api` with `sandbox.reverb.com/api` in all API calls【921462330831365†L123-L136】.

**Test payment setup** – to set up a test Reverb Payments account, use any account name, routing number `322271627`, and any account number.  If Plaid verification is requested, use code `ABC`【921462330831365†L147-L149】.

**Test purchases** – use the test credit card `4111 1111 1111 1111` with expiration `03/2030`, CVC `737`, and ZIP `60657` to place orders.  You cannot purchase your own listings; create a separate buyer sandbox account.  After purchasing, you can mark the order paid/shipped for testing【921462330831365†L151-L160】.

Testing on the sandbox ensures your integration works correctly before interacting with live data.

---

## 26 Debugging an API Request

If an API request fails unexpectedly:

1. Replicate the call using a REST client like Postman, ensuring headers `Content‑Type: application/hal+json` and appropriate authorization (`X‑Auth‑Token` or `Authorization`) are set【261884042976435†L104-L121】.
2. Use Postman’s “Generate Code” feature to produce a cURL command and test it from a terminal【261884042976435†L104-L121】.
3. If the issue persists, send the cURL output, request details, and any error messages to Reverb’s integrations team (`integrations@reverb.com`)【261884042976435†L104-L121】.

Providing precise request and response examples helps Reverb support diagnose issues quickly.

---

## 27 Debugging Integration Sync Issues

When troubleshooting integration sync problems (e.g. BigCommerce, Shopify, Magento):

Provide the following information to Reverb support:

- **SKUs affected** – list specific SKUs and describe the mismatch (e.g. stock or price discrepancies).  
- **Time of sync** – include dates and times (with time zone) when you attempted the sync【295688144979051†L103-L119】.  
- **Screenshots** – from both Reverb and your plugin showing current state【295688144979051†L103-L119】.  
- **Expected vs actual results** – clearly state what you expected and what actually happened【295688144979051†L103-L119】.  
- **Plugin logs** – attach any available logs from your integration; Reverb has built‑in logs for BigCommerce and Shopify that can be downloaded【295688144979051†L103-L119】.  
- **Listing link** – provide a direct link to the Reverb listing in question【295688144979051†L103-L119】.

This detailed information will allow Reverb’s integrations team to reproduce and resolve sync issues effectively.
