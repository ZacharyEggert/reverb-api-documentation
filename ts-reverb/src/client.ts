import type {
  CounterOfferPayload,
  EndListingPayload,
  ListingCreateUpdatePayload,
  RefundRequestPayload,
  ReverbClientOptions,
  ShipmentPayload,
} from "./types";

import { HttpClient } from "./http";

export class Reverb {
  private http: HttpClient;

  constructor(opts: ReverbClientOptions) {
    this.http = new HttpClient(opts);
  }

  // 22 Account Details
  getMyAccount() {
    return this.http.request("GET", "/my/account");
  }

  // Get a single listing
  getListing(listingId: string | number) {
    return this.http.request("GET", `/listings/${listingId}`);
  }

  // 7 Creating and Updating Listings
  createListing(payload: ListingCreateUpdatePayload, opts?: { publish?: boolean }) {
    return this.http.request("POST", "/listings", payload, {
      query: opts?.publish ? { publish: true } : undefined,
    });
  }

  updateListing(listingId: string | number, payload: ListingCreateUpdatePayload, opts?: { publish?: boolean }) {
    return this.http.request("PUT", `/listings/${listingId}`, payload, {
      query: opts?.publish ? { publish: true } : undefined,
    });
  }

  endListing(listingId: string | number, payload: EndListingPayload) {
    return this.http.request("PUT", `/my/listings/${listingId}/state/end`, payload);
  }

  deleteListing(listingId: string | number) {
    return this.http.request("DELETE", `/listings/${listingId}`);
  }

  // 8 Image Updating
  getListingImages(listingId: string | number) {
    return this.http.request("GET", `/listings/${listingId}/images/`);
  }

  // Reorder/override positions by sending photos array on listing update
  reorderImages(listingId: string | number, photos: string[]) {
    return this.updateListing(listingId, { photos, photo_upload_method: "override_position" } as any);
  }

  deleteImage(listingId: string | number, imageId: string | number) {
    return this.http.request("DELETE", `/api/listings/${listingId}/images/${imageId}`);
  }

  // 9 Managing Drafts
  listDrafts(params?: { page?: number; per_page?: number }) {
    return this.http.request("GET", "/my/listings/drafts", undefined, { query: params });
  }

  // 10 Manage Bumps
  getBumpInfo(listingId: string | number) {
    return this.http.request("GET", `/listings/${listingId}/bump`);
  }

  setBumpBid(listingIds: Array<string | number>, bid: number) {
    return this.http.request("PUT", "/bump/v2/bids", { products: listingIds, bid });
  }

  removeBump(listingIds: Array<string | number>) {
    return this.http.request("DELETE", "/bump/v2/bids", { products: listingIds });
  }

  // 11 Manage Sales
  addListingsToSale(saleId: string | number, listingIds: Array<string | number>) {
    return this.http.request("POST", `/sales/${saleId}/listings`, { listing_ids: listingIds });
  }

  removeListingsFromSale(saleId: string | number, listingIds: Array<string | number>) {
    return this.http.request("DELETE", `/api/sales/${saleId}/listings`, { listing_ids: listingIds });
  }

  getListingSales(listingId: string | number) {
    return this.http.request("GET", `/api/listings/${listingId}/sales`);
  }

  listSellerSales() {
    return this.http.request("GET", "/sales/seller");
  }

  listReverbSales() {
    return this.http.request("GET", "/sales/reverb");
  }

  // 12 Manage Direct Offers
  getAutoOffer(listingId: string | number) {
    return this.http.request("GET", `/api/listings/${listingId}/auto_offer`);
  }

  setAutoOffer(listingId: string | number, offer_percentage: number) {
    return this.http.request("POST", `/api/listings/${listingId}/auto_offer`, { offer_percentage });
  }

  removeAutoOffer(listingId: string | number) {
    return this.http.request("DELETE", `/api/listings/${listingId}/auto_offer`);
  }

  // 13 Retrieve Orders
  listOrders(params?: Record<string, string | number | boolean | undefined>) {
    return this.http.request("GET", "/my/orders/selling/all", undefined, { query: params });
  }

  // 14 Ship Orders
  createShipment(orderId: string | number, payload: ShipmentPayload) {
    return this.http.request("POST", `/api/orders/${orderId}/shipments`, payload);
  }

  // 15 Tying Orders Together - handled via data (order_bundle_id)

  // 19 Payments and PayPal Transactions
  listPayments(params?: { order_id?: string | number }) {
    return this.http.request("GET", "/my/payments/selling", undefined, { query: params });
  }

  listPaymentMethods() {
    return this.http.request("GET", "/payment_methods");
  }

  // 20 Read Payouts
  listPayouts(params?: { created_start_date?: string; created_end_date?: string; per_page?: number }) {
    return this.http.request("GET", "/my/payouts", undefined, { query: params });
  }

  listPayoutLineItems(payoutId: string | number, params?: { per_page?: number }) {
    return this.http.request("GET", `/api/my/payouts/${payoutId}/line_items`, undefined, { query: params });
  }

  // 21 Vacation Mode
  enableVacation() {
    return this.http.request("POST", "/shop/vacation");
  }

  disableVacation() {
    return this.http.request("DELETE", "/shop/vacation");
  }

  getVacationStatus() {
    return this.http.request("GET", "/shop/vacation");
  }

  // 23 Manage Messages
  listConversations(params?: Record<string, string | number | boolean | undefined>) {
    return this.http.request("GET", "/my/conversations", undefined, { query: params });
  }

  listUnreadConversations() {
    return this.listConversations({ unread_only: true });
  }

  getConversation(conversationId: string | number) {
    return this.http.request("GET", `/api/my/conversations/${conversationId}`);
  }

  markConversationRead(conversationId: string | number) {
    return this.http.request("PUT", `/api/my/conversations/${conversationId}`, { read: true });
  }

  replyToConversation(conversationId: string | number, body: string) {
    return this.http.request("POST", `/api/my/conversations/${conversationId}/messages`, { body });
  }

  // 24 Manage Feedback
  listFeedbackReceived() {
    return this.http.request("GET", "/my/feedback/received");
  }

  listFeedbackSent() {
    return this.http.request("GET", "/my/feedback/sent");
  }

  leaveBuyerFeedback(orderId: string | number, message: string, rating: number) {
    return this.http.request("POST", `/api/orders/${orderId}/feedback/buyer`, { message, rating });
  }

  getBuyerFeedback(orderId: string | number) {
    return this.http.request("GET", `/api/orders/${orderId}/feedback/buyer`);
  }

  // 17 Manage Refund Requests
  listRefundRequests(params?: Record<string, string | number | boolean | undefined>) {
    return this.http.request("GET", "/my/refund_requests/selling", undefined, { query: params });
  }

  updateRefundRequest(refundRequestId: string | number, payload: RefundRequestPayload) {
    return this.http.request("PUT", `/api/my/refund_requests/selling/${refundRequestId}`, payload);
  }

  createRefundRequestForOrder(orderNumber: string | number, payload: RefundRequestPayload) {
    return this.http.request("POST", `/api/my/orders/selling/${orderNumber}/refund_requests`, payload);
  }

  // 18 Manage Negotiations
  listNegotiations() {
    return this.http.request("GET", "/my/listings/negotiations");
  }

  getNegotiation(offerId: string | number) {
    return this.http.request("GET", `/api/my/negotiations/${offerId}`);
  }

  declineOffer(offerId: string | number) {
    return this.http.request("POST", `/api/my/negotiations/${offerId}/decline`);
  }

  acceptOffer(offerId: string | number) {
    return this.http.request("POST", `/api/my/negotiations/${offerId}/accept`);
  }

  counterOffer(offerId: string | number, amount: number | string, currency: string) {
    const payload: CounterOfferPayload = { amount: { amount, currency } } as any;
    return this.http.request("POST", `/api/my/negotiations/${offerId}/counter`, payload);
  }
}

export type { ReverbClientOptions } from "./types";
