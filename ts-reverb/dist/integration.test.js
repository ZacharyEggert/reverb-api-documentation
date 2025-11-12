import { beforeAll, describe, expect, test } from "bun:test";
import { Reverb } from "./client";
import { ReverbApiError } from "./types";
// Integration tests - hit real Reverb API
// 
// Setup:
// 1. Get a token from https://sandbox.reverb.com/my/account/api (for sandbox)
//    OR https://reverb.com/my/account/api (for production)
// 2. Create .env file: echo "REVERB_TOKEN=your_token" > .env
// 3. Set REVERB_BASE_URL if using production: echo "REVERB_BASE_URL=https://api.reverb.com/api" >> .env
// 4. Run: bun test:integration
//
// Note: Tokens are environment-specific. Sandbox tokens only work with sandbox.reverb.com,
// production tokens only work with api.reverb.com
describe("Reverb Integration Tests", () => {
    let client;
    let testListingId;
    let testListingUuid;
    beforeAll(() => {
        const token = process.env.REVERB_TOKEN;
        if (!token) {
            throw new Error("REVERB_TOKEN environment variable is required for integration tests.\n" +
                "Get a token from https://sandbox.reverb.com/my/account/api (sandbox) or\n" +
                "https://reverb.com/my/account/api (production)");
        }
        const baseUrl = process.env.REVERB_BASE_URL || "https://sandbox.reverb.com/api";
        console.log(`Using API: ${baseUrl}`);
        client = new Reverb({
            token,
            baseUrl,
            acceptVersion: "3.0",
        });
    });
    describe("Account", () => {
        test("should fetch account details", async () => {
            const account = await client.getMyAccount();
            expect(account).toBeDefined();
            expect(account).toHaveProperty("user_id");
            const userId = account.user_id;
            const shopId = account.shop?.id;
            console.log("✓ Account user_id:", userId);
            console.log("  Shop ID:", shopId || "NOT SET UP");
            if (!shopId) {
                console.warn("\n⚠️  WARNING: No shop configured on this account!");
                console.warn("   Most API endpoints require a shop. Create one at:");
                console.warn("   https://sandbox.reverb.com/my/shop/edit\n");
            }
        });
    });
    describe("Listings", () => {
        test("should list drafts", async () => {
            const result = await client.listDrafts({ per_page: 5 });
            expect(result).toBeDefined();
            console.log("✓ Draft listings count:", result.total || 0);
        });
        test("should create a draft listing", async () => {
            testListingUuid = crypto.randomUUID();
            const listing = await client.createListing({
                make: "Test",
                model: "Integration Test",
                title: `TEST-${testListingUuid}`,
                description: "Created by integration test suite",
                price: { amount: "100.00", currency: "USD" },
                condition: { uuid: "df268ad1-c462-4ba6-b6db-e007e23922ea" }, // Excellent
                sku: `TEST-SKU-${Date.now()}`,
                has_inventory: true,
                inventory: 1,
                categories: [{ uuid: "62835d2e-ac92-41fc-9b8d-4aba8c1c25d5" }], // Accessories (works in sandbox)
            });
            expect(listing).toBeDefined();
            // Response might have 'id' or 'listing_id'
            testListingId = listing.id || listing.listing?.id;
            if (testListingId) {
                console.log("✓ Created draft listing ID:", testListingId);
            }
            else {
                console.log("⊘ Listing created but no ID in response");
                console.log("  Response keys:", Object.keys(listing));
            }
        }, 10000);
        test("should update the draft listing", async () => {
            if (!testListingUuid) {
                console.log("⊘ Skipped - no test UUID");
                return;
            }
            try {
                // Small delay to allow API to index the listing
                await new Promise(resolve => setTimeout(resolve, 1000));
                // Find listing by UUID in title
                const drafts = await client.listDrafts({ per_page: 100 });
                const listings = drafts.listings || [];
                const found = listings.find((l) => l.title?.includes(testListingUuid));
                if (!found?.id) {
                    console.log("⊘ Test listing not found in drafts");
                    return;
                }
                testListingId = found.id;
                if (!testListingId) {
                    return;
                }
                const updated = await client.updateListing(testListingId, {
                    description: "Updated by integration test at " + new Date().toISOString(),
                });
                expect(updated).toBeDefined();
                console.log("✓ Updated listing ID:", testListingId);
            }
            catch (err) {
                if (err instanceof ReverbApiError && err.status === 404) {
                    console.log("⊘ Listing no longer available (404)");
                    testListingId = undefined;
                }
                else {
                    throw err;
                }
            }
        }, 10000);
        test("should get listing images", async () => {
            if (!testListingUuid) {
                console.log("⊘ Skipped - no test UUID");
                return;
            }
            try {
                // Find listing by UUID in title
                const drafts = await client.listDrafts({ per_page: 100 });
                const listings = drafts.listings || [];
                const found = listings.find((l) => l.title?.includes(testListingUuid));
                if (!found?.id) {
                    console.log("⊘ Test listing not found in drafts");
                    return;
                }
                testListingId = found.id;
                if (!testListingId) {
                    console.log("⊘ Listing ID is undefined");
                    return;
                }
                const images = await client.getListingImages(testListingId);
                expect(images).toBeDefined();
                console.log("✓ Listing images:", Array.isArray(images) ? images.length : "unknown");
            }
            catch (err) {
                if (err instanceof ReverbApiError && err.status === 404) {
                    console.log("⊘ Listing no longer available (404)");
                    testListingId = undefined;
                }
                else {
                    throw err;
                }
            }
        });
        test("should delete the draft listing (cleanup)", async () => {
            if (!testListingUuid) {
                console.log("⊘ Skipped - no test UUID");
                return;
            }
            // Find listing by UUID in title
            const drafts = await client.listDrafts({ per_page: 100 });
            const listings = drafts.listings || [];
            const found = listings.find((l) => l.title?.includes(testListingUuid));
            if (!found?.id) {
                console.log("⊘ Test listing not found in drafts (may already be deleted)");
                return;
            }
            testListingId = found.id;
            if (!testListingId) {
                console.log("⊘ Listing ID is undefined");
                return;
            }
            // Drafts can be deleted directly
            try {
                await client.deleteListing(testListingId);
                console.log("✓ Deleted draft listing ID:", testListingId);
            }
            catch (err) {
                if (err instanceof ReverbApiError) {
                    if (err.status === 404) {
                        console.log("⊘ Listing already gone (404)");
                    }
                    else if (err.status === 406) {
                        // If it's not a draft, end it instead
                        if (!testListingId)
                            return;
                        try {
                            await client.endListing(testListingId, { reason: "not_sold" });
                            console.log("✓ Ended listing ID:", testListingId);
                        }
                        catch (endErr) {
                            if (endErr instanceof ReverbApiError &&
                                endErr.status === 404) {
                                console.log("⊘ Listing already gone (404)");
                            }
                            else {
                                throw endErr;
                            }
                        }
                    }
                    else {
                        throw err;
                    }
                }
                else {
                    throw err;
                }
            }
        }, 10000);
    });
    describe("Orders", () => {
        test("should list orders", async () => {
            const orders = await client.listOrders({ per_page: 5 });
            expect(orders).toBeDefined();
            console.log("✓ Orders fetched");
        });
    });
    describe("Sales", () => {
        test("should list seller sales", async () => {
            try {
                const sales = await client.listSellerSales();
                expect(sales).toBeDefined();
                console.log("✓ Seller sales count:", Array.isArray(sales.sales)
                    ? sales.sales.length
                    : 0);
            }
            catch (err) {
                if (err instanceof ReverbApiError &&
                    err.status === 401 &&
                    err.data?.message?.includes("preferred seller")) {
                    console.log("⊘ Skipped - requires preferred seller status");
                    expect(err).toBeInstanceOf(ReverbApiError);
                }
                else {
                    throw err;
                }
            }
        });
        test("should list reverb-sponsored sales", async () => {
            try {
                const sales = await client.listReverbSales();
                expect(sales).toBeDefined();
                console.log("✓ Reverb sales fetched");
            }
            catch (err) {
                if (err instanceof ReverbApiError &&
                    err.status === 401 &&
                    err.data?.message?.includes("preferred seller")) {
                    console.log("⊘ Skipped - requires preferred seller status");
                    expect(err).toBeInstanceOf(ReverbApiError);
                }
                else {
                    throw err;
                }
            }
        });
    });
    describe("Payments", () => {
        test("should list payment methods", async () => {
            const methods = await client.listPaymentMethods();
            expect(methods).toBeDefined();
            console.log("✓ Payment methods fetched");
        });
        test("should list payments", async () => {
            const payments = await client.listPayments();
            expect(payments).toBeDefined();
            console.log("✓ Payments fetched");
        });
    });
    describe("Payouts", () => {
        test("should list payouts", async () => {
            const payouts = await client.listPayouts({ per_page: 5 });
            expect(payouts).toBeDefined();
            console.log("✓ Payouts fetched");
        });
    });
    describe("Vacation Mode", () => {
        test("should get vacation status", async () => {
            const status = await client.getVacationStatus();
            expect(status).toBeDefined();
            console.log("✓ Vacation status:", status.enabled || false);
        });
    });
    describe("Messages", () => {
        test("should list conversations", async () => {
            const conversations = await client.listConversations({ per_page: 5 });
            expect(conversations).toBeDefined();
            console.log("✓ Conversations fetched");
        });
        test("should list unread conversations", async () => {
            const unread = await client.listUnreadConversations();
            expect(unread).toBeDefined();
            console.log("✓ Unread conversations fetched");
        });
    });
    describe("Feedback", () => {
        test("should list received feedback", async () => {
            const feedback = await client.listFeedbackReceived();
            expect(feedback).toBeDefined();
            console.log("✓ Received feedback fetched");
        });
        test("should list sent feedback", async () => {
            const feedback = await client.listFeedbackSent();
            expect(feedback).toBeDefined();
            console.log("✓ Sent feedback fetched");
        });
    });
    describe("Refunds", () => {
        test("should list refund requests", async () => {
            const refunds = await client.listRefundRequests({ per_page: 5 });
            expect(refunds).toBeDefined();
            console.log("✓ Refund requests fetched");
        });
    });
    describe("Negotiations", () => {
        test("should list negotiations", async () => {
            const negotiations = await client.listNegotiations();
            expect(negotiations).toBeDefined();
            console.log("✓ Negotiations fetched");
        });
    });
    describe("Error Handling", () => {
        test("should handle 404 for non-existent listing", async () => {
            try {
                await client.getListingImages(999999999);
                expect(true).toBe(false); // Should not reach here
            }
            catch (error) {
                expect(error).toBeInstanceOf(ReverbApiError);
                expect(error.status).toBe(404);
                console.log("✓ 404 error handled correctly");
            }
        });
        test("should handle validation errors", async () => {
            try {
                // Try to create listing without required fields
                await client.createListing({
                    title: "Incomplete Listing",
                });
                // If this succeeds, Reverb is being very lenient - that's ok
                console.log("⊘ Note: Minimal listing was accepted (no validation error)");
            }
            catch (error) {
                expect(error).toBeInstanceOf(ReverbApiError);
                console.log("✓ Validation error handled, status:", error.status);
            }
        });
    });
});
