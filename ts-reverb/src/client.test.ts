// @ts-nocheck

import { beforeEach, describe, expect, mock, test } from "bun:test";

import { Reverb } from "./client";
import { ReverbApiError } from "./types";

// Mock fetch for testing
const createMockFetch = () => {
  return mock((url: string | URL | Request, init?: RequestInit) => {
    const urlStr = url.toString();
    const method = init?.method || "GET";
    const body = init?.body ? JSON.parse(init.body as string) : undefined;

    // Default success response
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/hal+json" }),
      json: async () => ({ success: true, url: urlStr, method, body }),
      text: async () => JSON.stringify({ success: true }),
    };

    return Promise.resolve(mockResponse as Response);
  });
};

describe("Reverb Client", () => {
  let client: Reverb;
  let mockFetch: ReturnType<typeof createMockFetch>;

  beforeEach(() => {
    mockFetch = createMockFetch();
    client = new Reverb({
      token: "test-token-123",
      baseUrl: "https://api.reverb.com/api",
      fetchImpl: mockFetch as any,
    });
  });

  describe("Authentication and Headers", () => {
    test("should include Authorization header with Bearer token", async () => {
      await client.getMyAccount();
      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers.Authorization).toBe("Bearer test-token-123");
    });

    test("should set correct HAL+JSON headers", async () => {
      await client.getMyAccount();
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers.Accept).toBe("application/hal+json");
      expect(headers["Content-Type"]).toBe("application/hal+json");
      expect(headers["Accept-Version"]).toBe("3.0");
    });

    test("should include custom headers when configured", async () => {
      const customClient = new Reverb({
        token: "test-token",
        displayCurrency: "EUR",
        shippingRegion: "EU",
        acceptLanguage: "de",
        fetchImpl: mockFetch as any,
      });
      await customClient.getMyAccount();
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;
      expect(headers["X-Display-Currency"]).toBe("EUR");
      expect(headers["X-Shipping-Region"]).toBe("EU");
      expect(headers["Accept-Language"]).toBe("de");
    });
  });

  describe("Account Operations", () => {
    test("getMyAccount should call correct endpoint", async () => {
      await client.getMyAccount();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("/api/my/account");
    });
  });

  describe("Listing Operations", () => {
    test("createListing should POST to /api/listings", async () => {
      const payload = {
        make: "Fender",
        model: "Stratocaster",
        title: "Test Guitar",
        price: { amount: "999", currency: "USD" },
      };
      await client.createListing(payload);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url.toString()).toContain("/api/listings");
      expect(init?.method).toBe("POST");
    });

    test("createListing with publish flag should add query param", async () => {
      const payload = { title: "Test" };
      await client.createListing(payload, { publish: true });
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("publish=true");
    });

    test("updateListing should PUT to correct endpoint", async () => {
      await client.updateListing(123, { title: "Updated Title" });
      const [url, init] = mockFetch.mock.calls[0];
      expect(url.toString()).toContain("/api/listings/123");
      expect(init?.method).toBe("PUT");
    });

    test("endListing should send reason in payload", async () => {
      await client.endListing(456, { reason: "not_sold" });
      const [url, init] = mockFetch.mock.calls[0];
      expect(url.toString()).toContain("/api/my/listings/456/state/end");
      expect(init?.method).toBe("PUT");
      const body = JSON.parse(init?.body as string);
      expect(body.reason).toBe("not_sold");
    });

    test("listDrafts should support pagination params", async () => {
      await client.listDrafts({ page: 2, per_page: 50 });
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("page=2");
      expect(url).toContain("per_page=50");
    });
  });

  describe("Image Operations", () => {
    test("getListingImages should GET images endpoint", async () => {
      await client.getListingImages(789);
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("/api/listings/789/images/");
    });

    test("reorderImages should include photo_upload_method flag", async () => {
      await client.reorderImages(123, ["url1.jpg", "url2.jpg"]);
      const [url, init] = mockFetch.mock.calls[0];
      const body = JSON.parse(init?.body as string);
      expect(body.photos).toEqual(["url1.jpg", "url2.jpg"]);
      expect(body.photo_upload_method).toBe("override_position");
    });

    test("deleteImage should DELETE specific image", async () => {
      await client.deleteImage(123, 456);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url.toString()).toContain("/api/listings/123/images/456");
      expect(init?.method).toBe("DELETE");
    });
  });

  describe("Bump Operations", () => {
    test("getBumpInfo should GET bump endpoint", async () => {
      await client.getBumpInfo(123);
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("/api/listings/123/bump");
    });

    test("setBumpBid should PUT with products and bid", async () => {
      await client.setBumpBid([123, 456], 0.035);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url.toString()).toContain("/api/bump/v2/bids");
      expect(init?.method).toBe("PUT");
      const body = JSON.parse(init?.body as string);
      expect(body.products).toEqual([123, 456]);
      expect(body.bid).toBe(0.035);
    });

    test("removeBump should DELETE with products", async () => {
      await client.removeBump([789]);
      const [url, init] = mockFetch.mock.calls[0];
      expect(init?.method).toBe("DELETE");
      const body = JSON.parse(init?.body as string);
      expect(body.products).toEqual([789]);
    });
  });

  describe("Sales Operations", () => {
    test("addListingsToSale should POST listing_ids", async () => {
      await client.addListingsToSale(1, [10, 20, 30]);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url.toString()).toContain("/api/sales/1/listings");
      const body = JSON.parse(init?.body as string);
      expect(body.listing_ids).toEqual([10, 20, 30]);
    });

    test("removeListingsFromSale should DELETE listing_ids", async () => {
      await client.removeListingsFromSale(2, [40, 50]);
      const [url, init] = mockFetch.mock.calls[0];
      expect(init?.method).toBe("DELETE");
      const body = JSON.parse(init?.body as string);
      expect(body.listing_ids).toEqual([40, 50]);
    });

    test("getListingSales should GET sales for listing", async () => {
      await client.getListingSales(123);
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("/api/listings/123/sales");
    });

    test("listSellerSales should GET seller sales", async () => {
      await client.listSellerSales();
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("/api/sales/seller");
    });

    test("listReverbSales should GET reverb sales", async () => {
      await client.listReverbSales();
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("/api/sales/reverb");
    });
  });

  describe("Direct Offers Operations", () => {
    test("getAutoOffer should GET auto_offer endpoint", async () => {
      await client.getAutoOffer(123);
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("/api/listings/123/auto_offer");
    });

    test("setAutoOffer should POST with offer_percentage", async () => {
      await client.setAutoOffer(123, 15);
      const [url, init] = mockFetch.mock.calls[0];
      expect(init?.method).toBe("POST");
      const body = JSON.parse(init?.body as string);
      expect(body.offer_percentage).toBe(15);
    });

    test("removeAutoOffer should DELETE auto_offer", async () => {
      await client.removeAutoOffer(123);
      const [url, init] = mockFetch.mock.calls[0];
      expect(init?.method).toBe("DELETE");
    });
  });

  describe("Order Operations", () => {
    test("listOrders should support query params", async () => {
      await client.listOrders({ 
        updated_start_date: "2025-01-01",
        page: 1,
        per_page: 25 
      });
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("updated_start_date=2025-01-01");
      expect(url).toContain("page=1");
    });

    test("createShipment should POST tracking info", async () => {
      const shipment = {
        tracking_number: "1Z999",
        carrier: "UPS",
        service: "Ground",
      };
      await client.createShipment(123, shipment);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url.toString()).toContain("/api/orders/123/shipments");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(init?.body as string);
      expect(body.tracking_number).toBe("1Z999");
    });
  });

  describe("Payment Operations", () => {
    test("listPayments should support order_id filter", async () => {
      await client.listPayments({ order_id: 456 });
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("order_id=456");
    });

    test("listPaymentMethods should GET payment methods", async () => {
      await client.listPaymentMethods();
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("/api/payment_methods");
    });
  });

  describe("Payout Operations", () => {
    test("listPayouts should support date range params", async () => {
      await client.listPayouts({
        created_start_date: "2025-01-01",
        created_end_date: "2025-12-31",
        per_page: 100,
      });
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("created_start_date=2025-01-01");
      expect(url).toContain("created_end_date=2025-12-31");
      expect(url).toContain("per_page=100");
    });

    test("listPayoutLineItems should GET line items for payout", async () => {
      await client.listPayoutLineItems(789, { per_page: 50 });
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("/api/my/payouts/789/line_items");
      expect(url).toContain("per_page=50");
    });
  });

  describe("Vacation Mode Operations", () => {
    test("enableVacation should POST to vacation endpoint", async () => {
      await client.enableVacation();
      const [url, init] = mockFetch.mock.calls[0];
      expect(url.toString()).toContain("/api/shop/vacation");
      expect(init?.method).toBe("POST");
    });

    test("disableVacation should DELETE vacation endpoint", async () => {
      await client.disableVacation();
      const [url, init] = mockFetch.mock.calls[0];
      expect(init?.method).toBe("DELETE");
    });

    test("getVacationStatus should GET vacation status", async () => {
      await client.getVacationStatus();
      const [url, init] = mockFetch.mock.calls[0];
      expect(init?.method).toBe("GET");
    });
  });

  describe("Message Operations", () => {
    test("listConversations should GET conversations", async () => {
      await client.listConversations({ page: 1 });
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("/api/my/conversations");
    });

    test("listUnreadConversations should add unread_only filter", async () => {
      await client.listUnreadConversations();
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("unread_only=true");
    });

    test("getConversation should GET specific conversation", async () => {
      await client.getConversation(123);
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("/api/my/conversations/123");
    });

    test("markConversationRead should PUT read status", async () => {
      await client.markConversationRead(456);
      const [url, init] = mockFetch.mock.calls[0];
      expect(init?.method).toBe("PUT");
      const body = JSON.parse(init?.body as string);
      expect(body.read).toBe(true);
    });

    test("replyToConversation should POST message body", async () => {
      await client.replyToConversation(789, "Hello there!");
      const [url, init] = mockFetch.mock.calls[0];
      expect(url.toString()).toContain("/api/my/conversations/789/messages");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(init?.body as string);
      expect(body.body).toBe("Hello there!");
    });
  });

  describe("Feedback Operations", () => {
    test("listFeedbackReceived should GET received feedback", async () => {
      await client.listFeedbackReceived();
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("/api/my/feedback/received");
    });

    test("listFeedbackSent should GET sent feedback", async () => {
      await client.listFeedbackSent();
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("/api/my/feedback/sent");
    });

    test("leaveBuyerFeedback should POST message and rating", async () => {
      await client.leaveBuyerFeedback(123, "Great buyer!", 5);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url.toString()).toContain("/api/orders/123/feedback/buyer");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(init?.body as string);
      expect(body.message).toBe("Great buyer!");
      expect(body.rating).toBe(5);
    });

    test("getBuyerFeedback should GET buyer feedback", async () => {
      await client.getBuyerFeedback(456);
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("/api/orders/456/feedback/buyer");
    });
  });

  describe("Refund Request Operations", () => {
    test("listRefundRequests should support filters", async () => {
      await client.listRefundRequests({ 
        state: "pending_seller_response",
        page: 2 
      });
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("state=pending_seller_response");
      expect(url).toContain("page=2");
    });

    test("updateRefundRequest should PUT new state", async () => {
      await client.updateRefundRequest(123, {
        state: "approved",
        refund_amount: { amount: "50.00", currency: "USD" },
      });
      const [url, init] = mockFetch.mock.calls[0];
      expect(url.toString()).toContain("/api/my/refund_requests/selling/123");
      expect(init?.method).toBe("PUT");
      const body = JSON.parse(init?.body as string);
      expect(body.state).toBe("approved");
    });

    test("createRefundRequestForOrder should POST refund request", async () => {
      await client.createRefundRequestForOrder("ORD-123", {
        state: "approved",
        reason: "buyer_return",
        refund_amount: { amount: "100", currency: "USD" },
      });
      const [url, init] = mockFetch.mock.calls[0];
      expect(url.toString()).toContain("/api/my/orders/selling/ORD-123/refund_requests");
      expect(init?.method).toBe("POST");
    });
  });

  describe("Negotiation Operations", () => {
    test("listNegotiations should GET negotiations", async () => {
      await client.listNegotiations();
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("/api/my/listings/negotiations");
    });

    test("getNegotiation should GET specific offer", async () => {
      await client.getNegotiation(123);
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("/api/my/negotiations/123");
    });

    test("declineOffer should POST decline", async () => {
      await client.declineOffer(456);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url.toString()).toContain("/api/my/negotiations/456/decline");
      expect(init?.method).toBe("POST");
    });

    test("acceptOffer should POST accept", async () => {
      await client.acceptOffer(789);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url.toString()).toContain("/api/my/negotiations/789/accept");
      expect(init?.method).toBe("POST");
    });

    test("counterOffer should POST with amount", async () => {
      await client.counterOffer(111, "850.00", "USD");
      const [url, init] = mockFetch.mock.calls[0];
      expect(url.toString()).toContain("/api/my/negotiations/111/counter");
      expect(init?.method).toBe("POST");
      const body = JSON.parse(init?.body as string);
      expect(body.amount.amount).toBe("850.00");
      expect(body.amount.currency).toBe("USD");
    });
  });

  describe("Error Handling", () => {
    test("should throw ReverbApiError on non-2xx response", async () => {
      const errorFetch = mock(() => {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: "Not Found",
          headers: new Headers({ "content-type": "application/hal+json" }),
          json: async () => ({ message: "Listing not found", errors: {} }),
        } as Response);
      });

      const errorClient = new Reverb({
        token: "test",
        fetchImpl: errorFetch as any,
      });

      try {
        await errorClient.getMyAccount();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(ReverbApiError);
        expect((error as ReverbApiError).status).toBe(404);
        expect((error as ReverbApiError).data?.message).toBe("Listing not found");
      }
    });

    test("should handle 429 rate limit error", async () => {
      const rateLimitFetch = mock(() => {
        return Promise.resolve({
          ok: false,
          status: 429,
          statusText: "Too Many Requests",
          headers: new Headers({ "content-type": "application/hal+json" }),
          json: async () => ({ message: "Rate limit exceeded" }),
        } as Response);
      });

      const limitClient = new Reverb({
        token: "test",
        fetchImpl: rateLimitFetch as any,
      });

      try {
        await limitClient.listOrders();
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ReverbApiError);
        expect((error as ReverbApiError).status).toBe(429);
      }
    });

    test("should handle 412 validation error", async () => {
      const validationFetch = mock(() => {
        return Promise.resolve({
          ok: false,
          status: 412,
          statusText: "Precondition Failed",
          headers: new Headers({ "content-type": "application/hal+json" }),
          json: async () => ({ 
            message: "Validation failed",
            errors: { price: "is required", make: "cannot be blank" }
          }),
        } as Response);
      });

      const validationClient = new Reverb({
        token: "test",
        fetchImpl: validationFetch as any,
      });

      try {
        await validationClient.createListing({});
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ReverbApiError);
        expect((error as ReverbApiError).status).toBe(412);
        expect((error as ReverbApiError).data?.errors).toBeDefined();
      }
    });
  });

  describe("Base URL Configuration", () => {
    test("should use sandbox URL when configured", async () => {
      const sandboxClient = new Reverb({
        token: "test",
        baseUrl: "https://sandbox.reverb.com/api",
        fetchImpl: mockFetch as any,
      });
      await sandboxClient.getMyAccount();
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("sandbox.reverb.com");
    });

    test("should default to production URL", async () => {
      await client.getMyAccount();
      const url = mockFetch.mock.calls[0][0].toString();
      expect(url).toContain("api.reverb.com");
    });
  });
});
